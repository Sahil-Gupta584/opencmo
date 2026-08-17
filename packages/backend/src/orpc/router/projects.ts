import { authed } from '../middleware.js'
import { prisma } from '@repo/database'
import { scrapeWebsite } from '../../scraper.js'
import { fetchSubredditDetails } from '../../reddit.js'
import { callAI } from '../../ai.js'
import { decrypt } from '../../crypto.js'
import { fetchInboundsForProject } from '../../inbounds-service.js'
import { generateDailyContentForProject } from '../../daily-content.js'
import { AnalyzeProductSchema, CreateProjectSchema, UpdateProjectSchema, RefreshSubredditsSchema, AddSubredditSchema, RemoveSubredditSchema } from '../schema.js'
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
        rulesJson: details.rulesJson ?? null,
        relevance: 95,
      },
    })
  }

  // Immediately trigger the inbound fetch pipeline (sets project.isFetching=true).
  // Fire-and-forget: don't block the createProject response / redirect.
  fetchInboundsForProject(project.id).catch((err) => {
    console.error(`🔴 createProject: background inbound fetch failed for project ${project.id}:`, err)
  })

  // Immediately generate the first daily content batch (3 social + 1 article).
  // Fire-and-forget: sets project.isGeneratingContent=true so the UI can show
  // "generating your first batch..." while it runs.
  generateDailyContentForProject(project.id).catch((err) => {
    console.error(`🔴 createProject: background content generation failed for project ${project.id}:`, err)
  })

  return project
})

export const updateProject = authed.input(UpdateProjectSchema).handler(async ({ input, context }) => {
  const userId = context.user.id

  const existing = await prisma.project.findFirst({
    where: { id: input.projectId, userId },
  })
  if (!existing) throw new ORPCError('NOT_FOUND', { message: 'Project not found' })

  return prisma.project.update({
    where: { id: existing.id },
    data: {
      name: input.name,
      url: input.url,
      description: input.description,
      targetAudience: input.targetAudience,
      keywords: input.keywords,
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

  const subredditDetails: { projectId: string; name: string; description: string; rulesJson: string | null; relevance: number }[] = []
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
      rulesJson: details.rulesJson ?? null,
      relevance: 95,
    })
  }

  await prisma.projectSubreddit.createMany({
    data: subredditDetails,
  })

  return prisma.projectSubreddit.findMany({ where: { projectId: project.id } })
})

export const addSubreddit = authed.input(AddSubredditSchema).handler(async ({ input, context }) => {
  const userId = context.user.id

  const project = await prisma.project.findFirst({
    where: { id: input.projectId, userId },
  })
  if (!project) throw new ORPCError('NOT_FOUND', { message: 'Project not found' })

  const apiConfig = await prisma.userApiConfig.findUnique({ where: { userId } })
  if (!apiConfig) throw new ORPCError('BAD_REQUEST', { message: 'API Key missing' })

  const { provider, apiKey } = getAiCredentials(apiConfig)

  const name = input.name.replace(/^r\//, '').trim()
  if (!name) throw new ORPCError('BAD_REQUEST', { message: 'Subreddit name is required' })

  const details = await fetchSubredditDetails(name, { provider, apiKey })
  if (!details) {
    throw new ORPCError('BAD_REQUEST', { message: `r/${name} does not exist on Reddit` })
  }

  const existing = await prisma.projectSubreddit.findUnique({
    where: { projectId_name: { projectId: project.id, name: details.name } },
  })
  if (existing) {
    throw new ORPCError('BAD_REQUEST', { message: `${details.name} is already being monitored` })
  }

  return prisma.projectSubreddit.create({
    data: {
      projectId: project.id,
      name: details.name,
      description: details.description,
      rulesJson: details.rulesJson ?? null,
      relevance: 95,
    },
  })
})

export const removeSubreddit = authed.input(RemoveSubredditSchema).handler(async ({ input, context }) => {
  const userId = context.user.id

  const project = await prisma.project.findFirst({
    where: { id: input.projectId, userId },
  })
  if (!project) throw new ORPCError('NOT_FOUND', { message: 'Project not found' })

  const name = input.name.replace(/^r\//, '').trim()
  const deleted = await prisma.projectSubreddit.deleteMany({
    where: { projectId: project.id, name: `r/${name}` },
  })

  return { removed: deleted.count > 0 }
})
