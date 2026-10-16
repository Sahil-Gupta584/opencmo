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
  DismissThreadSchema,
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
      ...(input.isDismissed !== undefined ? { isDismissed: input.isDismissed } : {}),
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
    by: ['channel', 'isDone', 'isDismissed'],
    where: { projectId: input.projectId },
    _count: { _all: true },
  })

  const counts: Record<string, { open: number; completed: number; dismissed: number }> = {
    reddit: { open: 0, completed: 0, dismissed: 0 },
    twitter: { open: 0, completed: 0, dismissed: 0 },
    linkedin: { open: 0, completed: 0, dismissed: 0 },
  }

  for (const g of grouped) {
    const channel = g.channel as 'reddit' | 'twitter' | 'linkedin'
    if (!counts[channel]) continue
    if (g.isDismissed) counts[channel].dismissed += g._count._all
    else if (g.isDone) counts[channel].completed += g._count._all
    else counts[channel].open += g._count._all
  }

  return counts
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

export const dismissThread = authed.input(DismissThreadSchema).handler(async ({ input, context }) => {
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
    data: { 
      isDismissed: input.isDismissed,
      dismissedAt: input.isDismissed ? new Date() : null,
      isDone: input.isDismissed ? false : thread.isDone // Restore to open if undismissed
    },
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

  const system = `You are a helpful, empathetic founder who builds software. Write a genuine, value-first reply for ${channelName} that directly answers the post author's question. Mention the product naturally only if relevant. ${rulesPrompt}`
  
  const response = await callAI({
    provider,
    apiKey,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: `Post title: ${thread.title}\n\nPost body: ${thread.body ?? ''}` },
    ],
  })

  return prisma.redditThread.update({
    where: { id: input.threadId },
    data: { generatedReply: response },
  })
})
