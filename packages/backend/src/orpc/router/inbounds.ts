import { authed } from '../middleware.js'
import { prisma } from '@repo/database'
import { callAI } from '../../ai.js'
import { decrypt } from '../../crypto.js'
import { fetchInboundsForProject } from '../../inbounds-service.js'
import { sendNewLeadsEmail } from '../../notifications.js'
import {
  FetchInboundsSchema,
  ListThreadsSchema,
  ListThreadCountsSchema,
  UpdateThreadStatusSchema,
  MarkThreadsCompleteSchema,
  GenerateThreadReplySchema,
} from '../schema.js'
import { ORPCError } from '@orpc/client'
import { fetchSubredditRules, parseRules } from '../../reddit.js'

function getAiCredentials(apiConfig: any) {
  const provider = (apiConfig.defaultProvider || 'openai') as 'openai' | 'anthropic' | 'gemini'
  let apiKey = ''
  if (provider === 'gemini') apiKey = decrypt(apiConfig.geminiKey || '')
  else if (provider === 'anthropic') apiKey = decrypt(apiConfig.anthropicKey || '')
  else apiKey = decrypt(apiConfig.openaiKey || '')
  return { provider, apiKey }
}

/**
 * Loads a subreddit's rules for prompt injection. Uses the DB cache first
 * (rulesJson persisted at create/refresh); falls back to a live fetch when
 * missing. Fail-open: returns '' so a rules fetch never blocks reply gen.
 */
async function getSubredditRulesPrompt(projectId: string, subredditName: string): Promise<string> {
  try {
    const existing = await prisma.projectSubreddit.findFirst({
      where: { projectId, name: subredditName },
      select: { id: true, rulesJson: true, description: true },
    })

    let rules = parseRules(existing?.rulesJson)

    // Cold cache - fetch authoritative rules and persist them.
    if (rules.length === 0) {
      const cleanName = subredditName.replace(/^r\//, '').trim()
      const fetched = await fetchSubredditRules(cleanName)
      rules = fetched ?? []
      if (rules.length > 0 && existing) {
        await prisma.projectSubreddit.update({
          where: { id: existing.id },
          data: { rulesJson: JSON.stringify(rules) },
        })
      }
    }

    if (rules.length === 0) return ''

    const rulesText = rules
      .map((r) => `- ${r.shortName || 'Rule'}: ${r.description}`)
      .join('\n')
    return `\nCommunity rules you MUST comply with (violating these gets the post removed or a ban):\n${rulesText}`
  } catch (err) {
    console.error(`🔴 getSubredditRulesPrompt failed for ${subredditName}:`, err)
    return ''
  }
}

export const fetchInbounds = authed.input(FetchInboundsSchema).handler(async ({ input, context }) => {
  const userId = context.user.id

  const project = await prisma.project.findFirst({
    where: { id: input.projectId, userId },
  })

  if (!project) {
    throw new ORPCError('NOT_FOUND', { message: 'Project not found' })
  }

  const result = await fetchInboundsForProject(project.id)

  // One batched email per project per cycle - only when genuinely new leads found
  if (result.success && result.newLeads.length > 0) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, notifyNewLeads: true },
    })
    if (user) {
      await sendNewLeadsEmail(user, project.name, result.newLeads)
    }
  }

  return { success: result.success, count: result.count }
})

export const listThreads = authed.input(ListThreadsSchema).handler(async ({ input, context }) => {
  const userId = context.user.id

  const project = await prisma.project.findFirst({
    where: { id: input.projectId, userId },
  })

  if (!project) {
    throw new ORPCError('NOT_FOUND', { message: 'Project not found' })
  }

  const threads = await prisma.redditThread.findMany({
    where: {
      projectId: input.projectId,
      ...(input.isDone !== undefined ? { isDone: input.isDone } : {}),
      ...(input.channel && input.channel !== 'all' ? { channel: input.channel } : {}),
    },
    orderBy: { redditCreatedAt: 'desc' },
  })

  const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 }
  return threads.sort(
    (a, b) =>
      (priorityRank[a.priority ?? 'medium'] ?? 1) - (priorityRank[b.priority ?? 'medium'] ?? 1) ||
      b.redditCreatedAt.getTime() - a.redditCreatedAt.getTime(),
  )
})

export const listThreadCounts = authed.input(ListThreadCountsSchema).handler(async ({ input, context }) => {
  const userId = context.user.id

  const project = await prisma.project.findFirst({
    where: { id: input.projectId, userId },
  })

  if (!project) {
    throw new ORPCError('NOT_FOUND', { message: 'Project not found' })
  }

  const grouped = await prisma.redditThread.groupBy({
    by: ['channel'],
    where: { projectId: input.projectId },
    _count: { _all: true },
  })

  const counts: Record<string, number> = {}
  for (const g of grouped) {
    counts[g.channel] = g._count._all
  }

  return {
    reddit: counts.reddit ?? 0,
    twitter: counts.twitter ?? 0,
    linkedin: counts.linkedin ?? 0,
  }
})

export const updateThreadStatus = authed.input(UpdateThreadStatusSchema).handler(async ({ input, context }) => {
  const userId = context.user.id

  const thread = await prisma.redditThread.findUnique({
    where: { id: input.threadId },
    include: { project: true },
  })

  if (!thread || thread.project.userId !== userId) {
    throw new ORPCError('NOT_FOUND', { message: 'Thread not found' })
  }

  return prisma.redditThread.update({
    where: { id: input.threadId },
    data: { isDone: input.isDone },
  })
})

export const markThreadsComplete = authed.input(MarkThreadsCompleteSchema).handler(async ({ input, context }) => {
  const userId = context.user.id

  const project = await prisma.project.findFirst({
    where: { id: input.projectId, userId },
  })

  if (!project) {
    throw new ORPCError('NOT_FOUND', { message: 'Project not found' })
  }

  const result = await prisma.redditThread.updateMany({
    where: {
      projectId: input.projectId,
      id: { in: input.threadIds },
      channel: input.channel,
      isDone: false,
    },
    data: { isDone: true },
  })

  console.log(`[Threads] ✅ Marked ${result.count} ${input.channel} threads complete for project ${input.projectId}`)

  return { count: result.count }
})

export const generateThreadReply = authed.input(GenerateThreadReplySchema).handler(async ({ input, context }) => {
  const userId = context.user.id

  const thread = await prisma.redditThread.findUnique({
    where: { id: input.threadId },
    include: { project: true },
  })

  if (!thread || thread.project.userId !== userId) {
    throw new ORPCError('NOT_FOUND', { message: 'Thread not found' })
  }

  const apiConfig = await prisma.userApiConfig.findUnique({ where: { userId } })
  if (!apiConfig) throw new ORPCError('BAD_REQUEST', { message: 'API Key missing' })

  const { provider, apiKey } = getAiCredentials(apiConfig)

  const channelName = thread.channel === 'twitter' ? 'X (Twitter)' : thread.channel === 'linkedin' ? 'LinkedIn' : 'Reddit'

  const rulesPrompt = thread.channel === 'reddit'
    ? await getSubredditRulesPrompt(thread.projectId, thread.subreddit)
    : ''

  const system = `You are a helpful, empathetic founder who builds software. Write a genuine, value-first reply for ${channelName} that directly answers the post author's question. Mention the product naturally only if relevant. Keep tone native to ${channelName} (concise & punchy for X, professional B2B for LinkedIn, authentic for Reddit). Do NOT write promotional fluff.${rulesPrompt}`

  const prompt = `Platform: ${channelName}
Thread Title: ${thread.title}
Community/Channel: ${thread.subreddit}
Content/Body: ${thread.body || thread.title}

My Product: ${thread.project.name}
Description: ${thread.project.description}
Target Audience: ${thread.project.targetAudience}

Write a helpful ${channelName} reply. Keep it concise.
Shouldnt sound like a ai generated, keep it short straight to the point. reply in a way that user might reply back, but make sure you dont ask question unnecessarily.
`


  const reply = await callAI({ provider, apiKey, prompt, system })

  return prisma.redditThread.update({
    where: { id: input.threadId },
    data: { generatedReply: reply },
  })
})