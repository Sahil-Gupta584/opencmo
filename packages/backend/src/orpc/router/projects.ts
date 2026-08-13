import { authed } from '../middleware.js'
import { prisma } from '@repo/database'
import { scrapeWebsite } from '../../scraper.js'
import { fetchSubredditDetails } from '../../reddit.js'
import { callAI } from '../../ai.js'
import { decrypt } from '../../crypto.js'
import { fetchInboundsForProject } from '../../inbounds-service.js'
import { AnalyzeProductSchema, CreateProjectSchema, GenerateDraftSchema, RefreshSubredditsSchema } from '../schema.js'
import { ORPCError } from '@orpc/client'

function getAiCredentials(apiConfig: any) {
  const provider = (apiConfig.defaultProvider || 'openai') as 'openai' | 'anthropic' | 'gemini'
  let apiKey = ''
  if (provider === 'gemini') apiKey = decrypt(apiConfig.geminiKey || '')
  else if (provider === 'anthropic') apiKey = decrypt(apiConfig.anthropicKey || '')
  else apiKey = decrypt(apiConfig.openaiKey || '')
  return { provider, apiKey }
}

export const listProjects = authed.handler(async ({ context }) => {
  return prisma.project.findMany({
    where: { userId: context.user.id },
    include: {
      subreddits: true,
      dailyTasks: true,
      drafts: true,
      threads: true,
    },
    orderBy: { createdAt: 'desc' },
  })
})

export const analyzeProduct = authed.input(AnalyzeProductSchema).handler(async ({ input, context }) => {
  const userId = context.user.id

  const apiConfig = await prisma.userApiConfig.findUnique({ where: { userId } })
  if (!apiConfig || (!apiConfig.openaiKey && !apiConfig.anthropicKey && !apiConfig.geminiKey)) {
    throw new ORPCError('BAD_REQUEST', { message: 'Please configure your AI API key in Settings first.' })
  }

  const { provider, apiKey } = getAiCredentials(apiConfig)

  const scraped = await scrapeWebsite(input.url)

  const prompt = `Analyze this product website content and return a JSON object with keys:
"name": product name,
"description": 2-sentence summary of what it does,
"targetAudience": target customer profile,
"keywords": array of 5 marketing keywords (e.g. ["saas", "cold email", "solopreneur"]),
"targetSubreddits": array of 4 relevant subreddit names matching this product (e.g. ["r/SaaS", "r/SideProject", "r/webdev", "r/marketing"]),
"socialPostTypes": array of 3 effective social media post types/angles for this SaaS (e.g. ["Launch Story & Lessons Learned", "Step-by-step Tutorial", "Problem-Solution Breakdown"]).

Title: ${scraped.title}
Description: ${scraped.description}
Text: ${scraped.bodyText.slice(0, 1500)}

Respond ONLY with valid raw JSON.`

  const aiOutput = await callAI({ provider, apiKey, prompt })
  let parsed: { name?: string; description?: string; targetAudience?: string; keywords?: string[]; targetSubreddits?: string[]; socialPostTypes?: string[] } = {}
  try {
    parsed = JSON.parse(aiOutput.replace(/```json/g, '').replace(/```/g, '').trim())
  } catch (err) {
    console.error('🔴 Failed to parse AI product analysis JSON:', err, 'Raw output:', aiOutput)
    parsed = {
      name: scraped.title || 'Our Product',
      description: scraped.description || 'Your product details go here',
      targetAudience: 'Founders & Marketers',
      keywords: ['saas', 'marketing', 'startups'],
      targetSubreddits: ['r/SaaS', 'r/SideProject', 'r/IndieHackers'],
      socialPostTypes: ['Launch Story & Lessons', 'Step-by-Step Tutorial', 'Problem-Solution Breakdown'],
    }
  }

  return {
    url: scraped.url,
    name: parsed.name || scraped.title || 'Our Product',
    description: parsed.description || scraped.description || '',
    targetAudience: parsed.targetAudience || 'Founders & Marketers',
    keywords: parsed.keywords || ['saas'],
    targetSubreddits: parsed.targetSubreddits || ['r/SaaS', 'r/SideProject', 'r/IndieHackers'],
    socialPostTypes: parsed.socialPostTypes || ['Launch Story & Lessons', 'Step-by-Step Tutorial', 'Problem-Solution Breakdown'],
  }
})

export const createProject = authed.input(CreateProjectSchema).handler(async ({ input, context }) => {
  const userId = context.user.id

  const apiConfig = await prisma.userApiConfig.findUnique({ where: { userId } })
  if (!apiConfig || (!apiConfig.openaiKey && !apiConfig.anthropicKey && !apiConfig.geminiKey)) {
    throw new ORPCError('BAD_REQUEST', { message: 'Please configure your AI API key in Settings first.' })
  }

  const { provider, apiKey } = getAiCredentials(apiConfig)

  // Save Project to DB with user's approved/edited analysis
  const project = await prisma.project.create({
    data: {
      userId,
      url: input.url,
      name: input.name,
      description: input.description,
      targetAudience: input.targetAudience || 'Founders & Marketers',
      keywords: input.keywords,
    },
  })

  // Fetch subreddit details & save to DB (skip subreddits that don't exist on Reddit)
  const subList = input.targetSubreddits.length ? input.targetSubreddits : ['r/SaaS', 'r/SideProject', 'r/IndieHackers']
  for (const subName of subList) {
    const details = await fetchSubredditDetails(subName, { provider, apiKey })
    if (!details) {
      console.log(`[SubredditCreate] ⏭️ Skipping ${subName} - does not exist on Reddit`)
      continue
    }
    await prisma.projectSubreddit.create({
      data: {
        projectId: project.id,
        name: details.name,
        description: details.description,
        relevance: 95,
      },
    })
  }

  // Immediately trigger the inbound fetch pipeline (sets project.isFetching=true).
  // Fire-and-forget: don't block the createProject response / redirect.
  fetchInboundsForProject(project.id).catch((err) => {
    console.error(`🔴 createProject: background inbound fetch failed for project ${project.id}:`, err)
  })

  return project
})

export const generateDraft = authed.input(GenerateDraftSchema).handler(async ({ input, context }) => {
  const userId = context.user.id

  const project = await prisma.project.findFirst({
    where: { id: input.projectId, userId },
  })
  if (!project) throw new ORPCError('NOT_FOUND', { message: 'Project not found' })

  const apiConfig = await prisma.userApiConfig.findUnique({ where: { userId } })
  if (!apiConfig) throw new ORPCError('BAD_REQUEST', { message: 'API Key missing' })

  const { provider, apiKey } = getAiCredentials(apiConfig)

  const system = `You are an expert Reddit community strategist. Draft natural, human-sounding posts for subreddits. Avoid corporate jargon, heavy link dropping, or promotional fluff. Write first-person, authentic narratives.`

  const prompt = `Write a post for ${input.subreddit} about my SaaS product:
Product: ${project.name}
Description: ${project.description}
Audience: ${project.targetAudience}

Include a title line and body.`

  const content = await callAI({ provider, apiKey, prompt, system })

  // Sentinel Risk Score calculation (Simple heuristic)
  const linkCount = (content.match(/https?:\/\//g) || []).length
  const riskScore = linkCount > 1 ? 65 : 15

  return prisma.contentDraft.create({
    data: {
      projectId: project.id,
      subreddit: input.subreddit,
      content,
      riskScore,
      riskReport: riskScore > 50 ? 'High link density detected. Reduce external links to prevent spam flags.' : 'Low risk',
    },
  })
})

export const refreshSubreddits = authed.input(RefreshSubredditsSchema).handler(async ({ input, context }) => {
  const userId = context.user.id

  const project = await prisma.project.findFirst({
    where: { id: input.projectId, userId },
  })
  if (!project) throw new ORPCError('NOT_FOUND', { message: 'Project not found' })

  const apiConfig = await prisma.userApiConfig.findUnique({ where: { userId } })
  if (!apiConfig) throw new ORPCError('BAD_REQUEST', { message: 'API Key missing' })

  const { provider, apiKey } = getAiCredentials(apiConfig)

  const prompt = `Analyze this SaaS product and find 5 high-converting, relevant subreddits where its target audience hangs out:
Product Name: ${project.name}
Description: ${project.description}
Audience: ${project.targetAudience}

Return a JSON array of strings containing exact subreddit names with r/ prefix (e.g. ["r/SaaS", "r/SideProject", "r/webdev"]). Respond ONLY with valid raw JSON array.`

  const aiOutput = await callAI({ provider, apiKey, prompt })
  let subList: string[] = []
  try {
    subList = JSON.parse(aiOutput.replace(/```json/g, '').replace(/```/g, '').trim())
  } catch (err) {
    console.error('🔴 Failed to parse AI subreddits JSON:', err, 'Raw output:', aiOutput)
    subList = ['r/SaaS', 'r/SideProject', 'r/IndieHackers']
  }

  // Clear existing and replace with real discovered subreddits
  await prisma.projectSubreddit.deleteMany({ where: { projectId: project.id } })

  const subredditDetails: { projectId: string; name: string; description: string; relevance: number }[] = []
  for (const subName of subList) {
    const details = await fetchSubredditDetails(subName, { provider, apiKey })
    if (!details) {
      console.log(`[SubredditRefresh] ⏭️ Skipping ${subName} - does not exist on Reddit`)
      continue
    }
    subredditDetails.push({
      projectId: project.id,
      name: details.name,
      description: details.description,
      relevance: 95,
    })
  }

  await prisma.projectSubreddit.createMany({
    data: subredditDetails,
  })

  return prisma.projectSubreddit.findMany({ where: { projectId: project.id } })
})
