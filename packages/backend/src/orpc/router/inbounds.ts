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

async function getSubredditRulesPrompt(projectId: string, subredditName: string): Promise<string> {
  try {
    const existing = await prisma.projectSubreddit.findFirst({
      where: { projectId, name: subredditName },
      select: { id: true, rulesJson: true, description: true },
    })

    let rules = parseRules(existing?.rulesJson)

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
      ...(input.isDismissed !== undefined ? { isDismissed: input.isDismissed } : {}),
      ...(input.channel && input.channel !== 'all' ? { channel: input.channel } : {}),
    },
    orderBy: input.isDismissed ? { dismissedAt: 'desc' } : { redditCreatedAt: 'desc' },
  })

  const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 }
  return threads.sort(
    (a, b) =>
      (priorityRank[a.priority ?? 'medium'] ?? 1) - (priorityRank[b.priority ?? 'medium'] ?? 1) ||
      (input.isDismissed
        ? (b.dismissedAt?.getTime() ?? 0) - (a.dismissedAt?.getTime() ?? 0)
        : b.redditCreatedAt.getTime() - a.redditCreatedAt.getTime()),
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

  const activeGrouped = await prisma.redditThread.groupBy({
    by: ['channel'],
    where: { projectId: input.projectId, isDone: false, isDismissed: false },
    _count: { _all: true },
  })

  const completedGrouped = await prisma.redditThread.groupBy({
    by: ['channel'],
    where: { projectId: input.projectId, isDone: true, isDismissed: false },
    _count: { _all: true },
  })

  const dismissedGrouped = await prisma.redditThread.groupBy({
    by: ['channel'],
    where: { projectId: input.projectId, isDismissed: true },
    _count: { _all: true },
  })

  const active: Record<string, number> = {}
  for (const g of activeGrouped) active[g.channel] = g._count._all

  const completed: Record<string, number> = {}
  for (const g of completedGrouped) completed[g.channel] = g._count._all

  const dismissed: Record<string, number> = {}
  for (const g of dismissedGrouped) dismissed[g.channel] = g._count._all

  return {
    active: {
      reddit: active.reddit ?? 0,
      twitter: active.twitter ?? 0,
      linkedin: active.linkedin ?? 0,
    },
    completed: {
      reddit: completed.reddit ?? 0,
      twitter: completed.twitter ?? 0,
      linkedin: completed.linkedin ?? 0,
    },
    dismissed: {
      reddit: dismissed.reddit ?? 0,
      twitter: dismissed.twitter ?? 0,
      linkedin: dismissed.linkedin ?? 0,
    },
    reddit: active.reddit ?? 0,
    twitter: active.twitter ?? 0,
    linkedin: active.linkedin ?? 0,
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

  const data: any = {}
  if (input.isDone !== undefined) data.isDone = input.isDone
  if (input.isDismissed !== undefined) {
    data.isDismissed = input.isDismissed
    data.dismissedAt = input.isDismissed ? new Date() : null
  }

  return prisma.redditThread.update({
    where: { id: input.threadId },
    data,
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
      isDismissed: false,
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

  const system = `You are a helpful, empathetic founder who builds software. Write a genuine, value-first reply for ${channelName} that directly answers the post author's question. Mention the product naturally only if relevant. Avoid generic AI filler ("Here is a draft...", pleasantries). Keep it natural, conversational, and helpful.${rulesPrompt}`

  const prompt = `Product/Company: ${thread.project.name}
Description: ${thread.project.description}
URL: ${thread.project.url ?? ''}

Target Post:
Title: ${thread.title}
Body: ${thread.body ?? '(No body)'}
Subreddit/Channel: ${thread.subreddit}

Write a direct, helpful reply.`

  const generatedReply = await callAI({ provider, apiKey, system, prompt })

  return prisma.redditThread.update({
    where: { id: input.threadId },
    data: { generatedReply },
  })
})
