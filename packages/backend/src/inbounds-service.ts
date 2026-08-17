import { prisma } from '@repo/database'
import { env } from './env.js'
import { fetchRedditThreadsJSON } from './reddit.js'
import { decrypt } from './crypto.js'
import { evaluatePostsBatchWithAI, type RawPostCandidate } from './inbounds-evaluator.js'
import { fetchXTweets } from './twitter.js'
import { fetchLinkedInPosts } from './linkedin.js'

export interface NewLead {
  id: string
  title: string
  url: string
  subreddit: string
  priority: string
  intentReason: string | null
  redditCreatedAt: Date
  channel: string
}

export interface FetchInboundsResult {
  success: boolean
  count: number
  newLeads: NewLead[]
}

function getAiCredentials(apiConfig: any) {
  const provider = (apiConfig.defaultProvider || 'openai') as 'openai' | 'anthropic' | 'gemini'
  let apiKey = ''
  if (provider === 'gemini') apiKey = decrypt(apiConfig.geminiKey || '')
  else if (provider === 'anthropic') apiKey = decrypt(apiConfig.anthropicKey || '')
  else apiKey = decrypt(apiConfig.openaiKey || '')
  return { provider, apiKey }
}

/**
 * Shared inbound fetch pipeline - used by the oRPC `fetchInbounds` handler (manual
 * "Fetch Now") AND the scheduled cron job. Fetches fresh candidates across Reddit,
 * X, and LinkedIn, AI-evaluates them, and persists only valid leads.
 *
 * Returns the newly created leads so the caller can decide on notifications.
 */
export async function fetchInboundsForProject(projectId: string): Promise<FetchInboundsResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { subreddits: true },
  })

  if (!project) {
    console.error(`🔴 fetchInboundsForProject: project not found: ${projectId}`)
    return { success: false, count: 0, newLeads: [] }
  }

  const apiConfig = await prisma.userApiConfig.findUnique({ where: { userId: project.userId } })
  if (!apiConfig) {
    console.log(`🔵 fetchInboundsForProject: no AI key for user ${project.userId}, skipping ${projectId}`)
    return { success: false, count: 0, newLeads: [] }
  }

  const { provider, apiKey } = getAiCredentials(apiConfig)

  // Atomically claim the fetch. If another run (cron or immediate fetch-on-create)
  // is already in progress for this project, skip - don't double-evaluate.
  const claimed = await prisma.project.updateMany({
    where: { id: project.id, isFetching: false },
    data: { isFetching: true },
  })

  if (claimed.count === 0) {
    console.log(`🔵 fetchInboundsForProject: already fetching for ${project.id}, skipping`)
    return { success: false, count: 0, newLeads: [] }
  }

  try {
    const subreddits = project.subreddits.map((s: { name: string }) => s.name)
    const keywords = project.keywords.length > 0 ? project.keywords : [project.name]

    const rawCandidates: RawPostCandidate[] = []

    // 1. Gather raw Reddit candidates (cursor-based)
    for (const sub of subreddits) {
      for (const kw of keywords) {
        const cursor = await prisma.inboundCursor.findUnique({
          where: {
            projectId_subreddit_keyword: {
              projectId: project.id,
              subreddit: sub,
              keyword: kw,
            },
          },
        })

        const afterUtc = cursor ? Math.floor(cursor.lastSeenAt.getTime() / 1000) : undefined
        const rawPosts = await fetchRedditThreadsJSON(sub, kw, afterUtc)

        let maxCreatedAt: Date | null = null

        for (const post of rawPosts) {
          const postDate = new Date(post.created_utc * 1000)
          if (!maxCreatedAt || postDate > maxCreatedAt) {
            maxCreatedAt = postDate
          }

          rawCandidates.push({
            id: post.id,
            title: post.title,
            body: post.selftext || '',
            author: post.author,
            url: `https://reddit.com${post.permalink}`,
            subreddit: post.subreddit_name_prefixed || sub,
            score: post.score,
            commentCount: post.num_comments,
            createdUtc: post.created_utc,
            channel: 'reddit',
          })
        }

        // Update cursor
        if (maxCreatedAt) {
          await prisma.inboundCursor.upsert({
            where: {
              projectId_subreddit_keyword: {
                projectId: project.id,
                subreddit: sub,
                keyword: kw,
              },
            },
            create: {
              projectId: project.id,
              subreddit: sub,
              keyword: kw,
              lastSeenAt: maxCreatedAt,
            },
            update: {
              lastSeenAt: maxCreatedAt,
            },
          })
        }
      }
    }

    // 1b. Fetch live tweets from X (Twitter) if X_HOST + X_KEY are set (RapidAPI scraper)
    if (env.X_HOST && env.X_KEY) {
      for (const kw of keywords) {
        const tweets = await fetchXTweets(kw, { host: env.X_HOST, apiKey: env.X_KEY, minFollowers: 150 })
        rawCandidates.push(...tweets)
      }
    }

    // 1c. Fetch live posts from LinkedIn (best-effort public search)
    for (const kw of keywords) {
      const posts = await fetchLinkedInPosts(kw)
      rawCandidates.push(...posts)
    }

    // 2. Evaluate candidate posts with AI in character-budgeted batches
    console.log(`[Fetch] 🤖 Evaluating ${rawCandidates.length} candidates with AI...`)
    const evaluatedMap = await evaluatePostsBatchWithAI(rawCandidates, project, { provider, apiKey })

    // 3. Persist ONLY AI-approved valid leads; track which are genuinely new
    const approved = rawCandidates.filter((post) => {
      const evalResult = evaluatedMap.get(post.id)
      return evalResult && evalResult.isValid
    })
    console.log(`[Fetch] 📝 ${approved.length} leads approved, persisting to DB...`)

    const newLeads: NewLead[] = []

    if (approved.length > 0) {
      const existing = await prisma.redditThread.findMany({
        where: { projectId: project.id, redditId: { in: approved.map((p) => p.id) } },
        select: { redditId: true },
      })
      const existingIds = new Set(existing.map((e) => e.redditId))
      console.log(`[Fetch] 🔎 ${existingIds.size} already in DB, ${approved.length - existingIds.size} genuinely new`)

      let savedCount = 0
      for (const post of approved) {
        const evalResult = evaluatedMap.get(post.id)!
        const postDate = new Date(post.createdUtc * 1000)
        const combinedReason = evalResult.indirectPitchStrategy
          ? `${evalResult.intentReason} - Pitch Strategy: ${evalResult.indirectPitchStrategy}`
          : evalResult.intentReason

        const isNew = !existingIds.has(post.id)

        await prisma.redditThread.upsert({
          where: {
            projectId_redditId: {
              projectId: project.id,
              redditId: post.id,
            },
          },
          create: {
            projectId: project.id,
            redditId: post.id,
            channel: post.channel || 'reddit',
            title: post.title,
            url: post.url,
            subreddit: post.subreddit,
            body: post.body,
            author: post.author,
            score: post.score,
            commentCount: post.commentCount,
            priority: evalResult.priority ?? 'medium',
            intentReason: combinedReason,
            redditCreatedAt: postDate,
            isDone: false,
          },
          update: {
            score: post.score,
            commentCount: post.commentCount,
            priority: evalResult.priority ?? 'medium',
            intentReason: combinedReason,
          },
        })

        savedCount++
        if (isNew) {
          newLeads.push({
            id: post.id,
            title: post.title,
            url: post.url,
            subreddit: post.subreddit,
            priority: evalResult.priority ?? 'medium',
            intentReason: combinedReason,
            redditCreatedAt: postDate,
            channel: post.channel || 'reddit',
          })
        }
      }
      console.log(`[Fetch] 💾 ${savedCount} upserted, ${newLeads.length} genuinely new`)
    }

    return { success: true, count: newLeads.length, newLeads }
  } finally {
    await prisma.project.update({
      where: { id: project.id },
      data: { isFetching: false },
    })
  }
}