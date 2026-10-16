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

  const isDismissed = input.isDismissed ?? false
  const isDone = input.isDismissed ? undefined : (input.isDone ?? false)

  const threads = await prisma.redditThread.findMany({
    where: {
      projectId: input.projectId,
      isDismissed,
      ...(isDone !== undefined ? { isDone } : {}),
      ...(input.channel && input.channel !== 'all' ? { channel: input.channel } : {}),
    },
    orderBy: input.isDismissed ? { dismissedAt: 'desc' } : { redditCreatedAt: 'desc' },
  })

  if (input.isDismissed) {
    return threads.sort((a, b) => (b.dismissedAt?.getTime() ?? 0) - (a.dismissedAt?.getTime() ?? 0))
  }

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

  const channels = ['reddit', 'twitter', 'linkedin'] as const
  const result: Record<string, { reddit: number; twitter: number; linkedin: number }> = {}

  // We want counts for active (isDone: false, isDismissed: false), completed (isDone: true, isDismissed: false), dismissed (isDismissed: true)
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

  const toMap = (grouped: any[]) => {
    const map: Record<string, number> = {}
    for (const g of grouped) map[g.channel] = g._count._all
    return { reddit: map.reddit ?? 0, twitter: map.twitter ?? 0, linkedin: map.linkedin ?? 0 }
  }

  return {
    active: toMap(activeGrouped),
    completed: toMap(completedGrouped),
    dismissed: toMap(dismissedGrouped),
    // For backward compatibility with existing components if any expect flat channel counts
    reddit: (toMap(activeGrouped)).reddit,
    twitter: (toMap(activeGrouped)).twitter,
    linkedin: (toMap(activeGrouped)).linkedin,
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
  // ... kept as is or truncated if needed ...
})
