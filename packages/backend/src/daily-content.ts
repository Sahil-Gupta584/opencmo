import { prisma } from '@repo/database'
import { callAI } from './ai.js'
import { decrypt } from './crypto.js'

const ARTICLE_TONES = ['Professional', 'Conversational', 'Story-driven', 'Data-driven', 'Educational', 'Thought-leadership']
const SOCIAL_TONES = ['Witty', 'Bold', 'Casual', 'Professional', 'Inspirational', 'Curious']

// Rotating angle pool so consecutive days produce fresh, non-repetitive content.
const ANGLES = [
  'The story behind how we built {product} and the biggest lesson we learned',
  'How {product} solves {topic} - a practical walkthrough',
  'The mistake most {audience} make with {topic}, and how to avoid it',
  'A data-driven look at what actually moves the needle for {audience}',
  'How {product} helps {audience} get from problem to result faster',
  'A behind-the-scenes look at how we think about {topic}',
]

export interface DailyContentResult {
  projectId: string
  generated: number
  skipped: boolean
}

function getAiCredentials(apiConfig: any) {
  const provider = (apiConfig.defaultProvider || 'openai') as 'openai' | 'anthropic' | 'gemini'
  let apiKey = ''
  if (provider === 'gemini') apiKey = decrypt(apiConfig.geminiKey || '')
  else if (provider === 'anthropic') apiKey = decrypt(apiConfig.anthropicKey || '')
  else apiKey = decrypt(apiConfig.openaiKey || '')
  return { provider, apiKey }
}



function buildPrompt(opts: {
  project: { name: string; description: string; targetAudience: string | null; keywords: string[] }
  authorName: string | null
  contentType: 'article' | 'social'
  tone: string
  angle: string
}) {
  const { contentType, tone, angle } = opts
  const isArticle = contentType === 'article'

  const system = isArticle
    ? `You are an expert content marketer and community strategist. Write long-form, value-first content that reads authentic and human - never corporate, never promotional fluff. Structure the piece with a strong opening hook and clear flow. Avoid heavy link dropping and overt self-promotion.`
    : `You are an expert social media copywriter. Write short, punchy, native-sounding social posts (X/Twitter, LinkedIn, Reddit). Hook in the first line, value first, product mention only if it fits naturally. No hashtag spam, no emoji soup, no corporate jargon.`

  const contextBlock = `Product: ${opts.project.name}
Description: ${opts.project.description}
Audience: ${opts.project.targetAudience || 'a broad audience'}
Keywords: ${opts.project.keywords.join(', ')}
Author (founder): ${opts.authorName || 'the founder'}`

  const prompt = isArticle
    ? `Write a long-form post (400-700 words) for a general audience about this product and its audience.
${contextBlock}

Angle / topic to focus on: ${angle}
Write in a "${tone}" tone throughout.

Return ONLY valid raw JSON with exactly these keys:
- "title": a compelling, click-worthy title line
- "body": the full post body (paragraphs, no markdown headers)`
    : `Write a social media post (under 200 words) for social media about this product and its audience.
${contextBlock}

Angle / topic to focus on: ${angle}
Write in a "${tone}" tone throughout.

Return ONLY valid raw JSON with exactly these keys:
- "title": a short hook line / headline
- "body": the post text`

  return { system, prompt }
}

async function generateOneDraft(opts: {
  projectId: string
  project: { name: string; description: string; targetAudience: string | null; keywords: string[] }
  authorName: string | null
  provider: 'openai' | 'anthropic' | 'gemini'
  apiKey: string
  contentType: 'article' | 'social'
  tone: string
  angle: string
}): Promise<void> {
  const { system, prompt } = buildPrompt(opts)

  const rawOutput = await callAI({ provider: opts.provider, apiKey: opts.apiKey, prompt, system })

  let title: string | null = null
  let body = rawOutput
  try {
    const parsed = JSON.parse(rawOutput.replace(/```json/g, '').replace(/```/g, '').trim())
    if (parsed && typeof parsed === 'object') {
      if (typeof parsed.title === 'string') title = parsed.title.trim()
      if (typeof parsed.body === 'string' && parsed.body.trim()) body = parsed.body.trim()
    }
  } catch (err) {
    const firstLine = rawOutput.split('\n').find((line) => line.trim())
    title = firstLine && firstLine.length <= 100 ? firstLine.trim() : null
    console.error('🔴 daily-content: AI did not return JSON, using raw output:', err)
  }

  const linkCount = (body.match(/https?:\/\//g) || []).length
  const riskScore = linkCount > 1 ? 65 : 15

  await prisma.contentDraft.create({
    data: {
      projectId: opts.projectId,
      subreddit: 'general',
      type: opts.contentType === 'article' ? 'ARTICLE' : 'SOCIAL',
      title,
      content: body,
      riskScore,
      riskReport: riskScore > 50 ? 'High link density detected. Reduce external links to prevent spam flags.' : 'Low risk',
    },
  })
}

/**
 * Generates the daily content batch (3 social posts + 1 article) for a project.
 *
 * Used by BOTH the scheduled cron (`runDailyContentCycle`) and the immediate
 * fire-and-forget call when a project is created. Guarded by:
 *  - an atomic `isGeneratingContent` claim (like `isFetching` for inbounds), and
 *  - a `lastContentGeneratedAt` 24-hour cooldown so the immediate create batch
 *    isn't re-generated by the daily cron.
 */
export async function generateDailyContentForProject(projectId: string): Promise<DailyContentResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      description: true,
      targetAudience: true,
      keywords: true,
      userId: true,
      lastContentGeneratedAt: true,
      isGeneratingContent: true,
    },
  })

  if (!project) {
    console.error(`🔴 generateDailyContentForProject: project not found: ${projectId}`)
    return { projectId, generated: 0, skipped: true }
  }

  const apiConfig = await prisma.userApiConfig.findUnique({ where: { userId: project.userId } })
  if (!apiConfig) {
    console.log(`🔵 generateDailyContentForProject: no AI config for user ${project.userId}, skipping ${projectId}`)
    return { projectId, generated: 0, skipped: true }
  }

  // Already generated within the last 24 hours - skip so the daily cron
  // doesn't re-generate content that was just created (immediate batch on create).
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000
  if (project.lastContentGeneratedAt && Date.now() - project.lastContentGeneratedAt.getTime() < TWENTY_FOUR_HOURS) {
    console.log(`🔵 generateDailyContentForProject: generated within 24h for ${project.id}, skipping`)
    return { projectId, generated: 0, skipped: true }
  }

  // Atomically claim generation. If another run is in progress, skip.
  const claimed = await prisma.project.updateMany({
    where: { id: project.id, isGeneratingContent: false },
    data: { isGeneratingContent: true },
  })

  if (claimed.count === 0) {
    console.log(`🔵 generateDailyContentForProject: already generating for ${project.id}, skipping`)
    return { projectId, generated: 0, skipped: true }
  }

  try {
    const { provider, apiKey } = getAiCredentials(apiConfig)

    const author = await prisma.user.findUnique({
      where: { id: project.userId },
      select: { name: true },
    })

    const dayIndex = Math.floor(Date.now() / 86400000)
    const batch: { contentType: 'article' | 'social'; tone: string; angle: string }[] = []

    // 3 social posts with rotating tones + angles
    for (let i = 0; i < 3; i++) {
      batch.push({
        contentType: 'social',
        tone: SOCIAL_TONES[(dayIndex + i) % SOCIAL_TONES.length],
        angle: ANGLES[(dayIndex + i) % ANGLES.length],
      })
    }

    // 1 article with a rotating tone + angle
    batch.push({
      contentType: 'article',
      tone: ARTICLE_TONES[dayIndex % ARTICLE_TONES.length],
      angle: ANGLES[(dayIndex + 3) % ANGLES.length],
    })

    const angleParams = (angle: string) =>
      angle
        .replaceAll('{product}', project.name)
        .replaceAll('{topic}', project.keywords[0] || project.name)
        .replaceAll('{audience}', project.targetAudience || 'your audience')

    for (const item of batch) {
      await generateOneDraft({
        projectId: project.id,
        project,
        authorName: author?.name ?? null,
        provider,
        apiKey,
        contentType: item.contentType,
        tone: item.tone,
        angle: angleParams(item.angle),
      })
    }

    await prisma.project.update({
      where: { id: project.id },
      data: { lastContentGeneratedAt: new Date() },
    })

    console.log(`🟢 generateDailyContentForProject: generated ${batch.length} items for ${project.id} (${project.name})`)
    return { projectId, generated: batch.length, skipped: false }
  } finally {
    await prisma.project.update({
      where: { id: project.id },
      data: { isGeneratingContent: false },
    })
  }
}
