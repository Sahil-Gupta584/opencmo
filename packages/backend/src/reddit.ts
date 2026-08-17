import { callAI, type AIProvider } from './ai.js'
import { prisma } from '@repo/database'
import { env } from './env.js'

export interface RedditSubredditInfo {
  name: string
  description: string
  rulesJson?: string
}

export interface RedditRule {
  shortName: string
  description: string
}

export interface RedditThreadInfo {
  title: string
  url: string
  subreddit: string
  snippet: string
}

export interface SubredditFetchOptions {
  provider: AIProvider
  apiKey: string
}

const REDDIT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// ---------------------------------------------------------------------------
// Subreddit details (3-tier: DB cache → Reddit about.json → LLM fallback)
// ---------------------------------------------------------------------------
export async function fetchSubredditDetails(
  subName: string,
  aiOptions: SubredditFetchOptions,
): Promise<RedditSubredditInfo | null> {
  const cleanName = subName.replace(/^r\//, '').trim()
  const fullName = `r/${cleanName}`
  const now = new Date()

  // Tier 1: DB cache via ProjectSubreddit
  try {
    const existing = await prisma.projectSubreddit.findFirst({
      where: { name: fullName },
      orderBy: { updatedAt: 'desc' },
    })
    if (existing) {
      const ageMs = now.getTime() - existing.updatedAt.getTime()
      if (ageMs < CACHE_TTL_MS) {
        console.log(`[SubredditCache] 🟢 HIT for ${fullName} (age: ${Math.round(ageMs / 3600000)}h)`)
        return {
          name: existing.name,
          description: existing.description || '',
          rulesJson: existing.rulesJson || undefined,
        }
      }
      console.log(`[SubredditCache] 🟡 STALE for ${fullName} - refreshing`)
    } else {
      console.log(`[SubredditCache] 🔵 MISS for ${fullName} - fetching`)
    }
  } catch (dbErr) {
    console.error(`[SubredditCache] 🔴 DB error for ${fullName}:`, dbErr)
  }

  // Tier 2: Reddit about.json (validates existence - sends loid cookie to bypass 403)
  const about = await fetchSubredditAboutJSON(cleanName)

  // 404 = subreddit does not exist → signal caller to skip it
  if (about?.kind === 'not_found') {
    console.log(`[SubredditAbout] 🔴 ${fullName} does not exist on Reddit - skipping`)
    return null
  }

  if (about?.kind === 'ok') {
    console.log(`[SubredditAbout] 🟢 ${fullName}: fetched details from Reddit`)
    const rules = await fetchSubredditRules(cleanName)
    return {
      name: fullName,
      description: about.description,
      rulesJson: serializeRules(rules),
    }
  }

  // Tier 3: LLM fallback when Reddit is blocked (403/429/error), but sub may still exist
  try {
    console.log(`[SubredditLLM] 🤖 Asking AI for ${fullName} details...`)
    const prompt = `Give me accurate information about the Reddit community ${fullName}.
Return a JSON object with exactly these keys:
- "description": 1–2 sentence description of what this subreddit is about
- "selfPromotionAllowed": boolean - whether product promotion/launches are permitted
- "rules": array of up to 3 short strings summarising the most important posting rules

Respond ONLY with valid raw JSON. No markdown, no explanation.`

    const aiOutput = await callAI({ provider: aiOptions.provider, apiKey: aiOptions.apiKey, prompt })
    const parsed = JSON.parse(aiOutput.replace(/```json/g, '').replace(/```/g, '').trim())
    console.log(`[SubredditLLM] 🟢 ${fullName}: LLM returned details`)
    return {
      name: fullName,
      description: parsed.description || '',
      rulesJson: JSON.stringify({ selfPromotionAllowed: parsed.selfPromotionAllowed, rules: parsed.rules }),
    }
  } catch (aiErr) {
    console.error(`[SubredditLLM] 🔴 LLM failed for ${fullName}:`, aiErr)
    return { name: fullName, description: 'Community for founders and makers.' }
  }
}

/**
 * Fetches a subreddit's about.json using the loid cookie.
 * Returns a discriminated result so callers can tell "doesn't exist" (404)
 * from "temporarily blocked" (403/429) - only the latter should fall back to LLM.
 */
async function fetchSubredditAboutJSON(
  cleanName: string,
): Promise<{ kind: 'ok'; description: string } | { kind: 'not_found' } | { kind: 'blocked' } | { kind: 'error' }> {
  const url = `https://www.reddit.com/r/${cleanName}/about.json`

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': REDDIT_USER_AGENT,
        Accept: 'application/json',
       Cookie: env.REDDIT_COOKIE ,
      },
    })

    if (res.status === 404) return { kind: 'not_found' }
    if (!res.ok) {
      console.error(`[SubredditAbout] 🔴 HTTP ${res.status} for r/${cleanName}`)
      return { kind: 'blocked' }
    }

    const json = (await res.json()) as { data?: { public_description?: string; description?: string } }
    const description = json?.data?.public_description || json?.data?.description || ''
    return { kind: 'ok', description }
  } catch (err) {
    console.error(`[SubredditAbout] 🔴 Error fetching r/${cleanName}:`, err)
    return { kind: 'error' }
  }
}

// ---------------------------------------------------------------------------
// Subreddit rules (authoritative, via public about/rules.json)
// ---------------------------------------------------------------------------

/**
 * Fetches a subreddit's real automod rules from the public JSON endpoint
 * (same auth path as search.json - uses the loid cookie only).
 *
 * Rules have a 24h cache enforced by ProjectSubreddit.rulesJson + updatedAt,
 * so this network call only happens when the cache is cold.
 */
export async function fetchSubredditRules(cleanName: string): Promise<RedditRule[] | null> {
  const cleanSub = cleanName.replace(/^r\//, '').trim()
  const url = `https://www.reddit.com/r/${cleanSub}/about/rules.json`

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': REDDIT_USER_AGENT,
        Accept: 'application/json',
        Cookie: env.REDDIT_COOKIE,
      },
    })

    if (res.status === 404) return null
    if (!res.ok) {
      console.error(`[SubredditRules] 🔴 HTTP ${res.status} for r/${cleanSub}`)
      return null
    }

    const json = (await res.json()) as {
      rules?: { short_name?: string; description?: string; kind?: string }[]
    }
    const rules = (json?.rules ?? [])
      .filter((r) => r.short_name || r.description)
      .map((r) => ({
        shortName: r.short_name || '',
        description: r.description || '',
      }))

    if (rules.length > 0) {
      console.log(`[SubredditRules] 🟢 ${rules.length} rules fetched for r/${cleanSub}`)
    } else {
      console.log(`[SubredditRules] 🔵 No rules returned for r/${cleanSub}`)
    }
    return rules
  } catch (err) {
    console.error(`[SubredditRules] 🔴 Error fetching rules for r/${cleanSub}:`, err)
    return null
  }
}

export function serializeRules(rules: RedditRule[] | null | undefined): string | undefined {
  if (!rules || rules.length === 0) return undefined
  return JSON.stringify(rules)
}

export function parseRules(rulesJson: string | null | undefined): RedditRule[] {
  if (!rulesJson) return []
  try {
    const parsed = JSON.parse(rulesJson)
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.rules)
        ? parsed.rules
        : []
    return list
      .filter((r: unknown) => r && typeof r === 'object')
      .map((r: Record<string, unknown>) => ({
        shortName: String(r.shortName ?? r.short_name ?? ''),
        description: String(r.description ?? ''),
      }))
      .filter((r: RedditRule) => r.shortName || r.description)
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Raw Reddit thread from public JSON API
// ---------------------------------------------------------------------------
export interface RawRedditPost {
  id: string          // e.g. "1g2abc3"
  name: string        // e.g. "t3_1g2abc3"
  title: string
  selftext: string
  author: string
  subreddit_name_prefixed: string   // e.g. "r/SaaS"
  permalink: string
  url: string
  score: number
  num_comments: number
  created_utc: number  // Unix timestamp
}

/**
 * Fetches threads from Reddit, routing between two channels:
 * - json: search.json with the `loid` cookie (full score/num_comments) - big ~100 req/10min bucket
 * - rss:  search.rss (score/num_comments = 0) - tiny ~1 req/30s bucket
 *
 * A module-level rate-limit router tracks each channel's x-ratelimit state so that
 * a rate-limited channel is remembered (with its reset time) and the other channel is
 * used until it recovers. When both are limited, we wait for the earlier reset.
 *
 * @param subreddit - e.g. "r/SaaS" or "SaaS"
 * @param keyword - search query
 * @param afterUtc - only return threads created after this Unix timestamp (cursor)
 * @returns array of raw Reddit post data
 */
export async function fetchRedditThreadsJSON(
  subreddit: string,
  keyword: string,
  afterUtc?: number,
): Promise<RawRedditPost[]> {
  const cleanSub = subreddit.replace(/^r\//, '').trim()
  const timeParam = afterUtc ? 'all' : 'week' // first fetch = last 7 days, subsequent = all (filtered by cursor)

  const posts = await fetchWithChannelFallback(cleanSub, keyword, timeParam)
  return filterPostsByCursor(posts, afterUtc, cleanSub, keyword, lastSource)
}

type SearchChannel = 'json' | 'rss'

interface ChannelState {
  blockedUntil: number // epoch ms - 0 = not blocked
  remaining: number    // last known x-ratelimit-remaining (0 = exhausted)
  resetAt: number      // epoch ms when bucket refills (0 = unknown)
}

const channels: Record<SearchChannel, ChannelState> = {
  json: { blockedUntil: 0, remaining: 1, resetAt: 0 },
  rss: { blockedUntil: 0, remaining: 1, resetAt: 0 },
}

let lastSource: SearchChannel = 'json'

const MAX_WAIT_MS = 35_000
const DEFAULT_RESET_MS = 60_000

type ChannelResult =
  | { kind: 'ok'; posts: RawRedditPost[] }
  | { kind: 'not_found' }
  | { kind: 'blocked' }
  | { kind: 'error' }

function updateChannelState(channel: SearchChannel, res: Response): void {
  const state = channels[channel]
  const remainingHeader = res.headers.get('x-ratelimit-remaining')
  const resetHeader = res.headers.get('x-ratelimit-reset')

  if (remainingHeader !== null) state.remaining = Number(remainingHeader)
  if (resetHeader !== null) state.resetAt = Date.now() + Number(resetHeader) * 1000

  if (state.remaining > 0 && res.ok) {
    state.blockedUntil = 0 // recovered
  } else if (state.remaining <= 0 && state.resetAt > Date.now()) {
    state.blockedUntil = state.resetAt // exhausted until bucket refills
  } else if (res.status === 429 && state.blockedUntil <= Date.now()) {
    state.blockedUntil = Date.now() + DEFAULT_RESET_MS // no reset header - assume default
  }
}

function pickAvailableChannel(): SearchChannel | null {
  const now = Date.now()
  const jsonOk = channels.json.blockedUntil <= now && channels.json.remaining > 0
  const rssOk = channels.rss.blockedUntil <= now && channels.rss.remaining > 0
  if (jsonOk) return 'json' // prefer json: full score/comments
  if (rssOk) return 'rss'
  return null
}

function earliestRecoveryMs(): number | null {
  const now = Date.now()
  const candidates: number[] = []
  if (channels.json.blockedUntil > now) candidates.push(channels.json.blockedUntil)
  if (channels.rss.blockedUntil > now) candidates.push(channels.rss.blockedUntil)
  if (candidates.length === 0) return null
  return Math.min(...candidates) - now
}

async function fetchWithChannelFallback(
  cleanSub: string,
  keyword: string,
  timeParam: string,
): Promise<RawRedditPost[]> {
  for (let round = 0; round < 4; round++) {
    const channel = pickAvailableChannel()

    if (!channel) {
      const waitMs = earliestRecoveryMs()
      if (waitMs === null) return []
      if (waitMs > 0) {
        const capped = Math.min(waitMs, MAX_WAIT_MS)
        console.log(`[RedditFetch] 🟠 Both channels rate-limited - waiting ${Math.round(capped / 1000)}s`)
        await new Promise((resolve) => setTimeout(resolve, capped))
        continue
      }
      return []
    }

    lastSource = channel
    const result =
      channel === 'json'
        ? await fetchRedditSearchJSON(cleanSub, keyword, timeParam)
        : await fetchRedditSearchRSS(cleanSub, keyword, timeParam)

    if (result.kind === 'ok') return result.posts
    if (result.kind === 'not_found') return [] // sub doesn't exist - RSS won't help

    // blocked / error → try the other channel next iteration
  }
  return []
}

function filterPostsByCursor(
  posts: RawRedditPost[],
  afterUtc: number | undefined,
  cleanSub: string,
  keyword: string,
  source: string,
): RawRedditPost[] {
  if (afterUtc) {
    const filtered = posts.filter((p: RawRedditPost) => p.created_utc > afterUtc)
    console.log(`[RedditFetch] 🟢 ${filtered.length}/${posts.length} posts after cursor (${source}, r/${cleanSub}, "${keyword}")`)
    return filtered
  }

  console.log(`[RedditFetch] 🟢 ${posts.length} posts fetched (${source}, r/${cleanSub}, "${keyword}")`)
  return posts
}

async function fetchRedditSearchJSON(
  cleanSub: string,
  keyword: string,
  timeParam: string,
): Promise<ChannelResult> {
  const searchUrl = `https://www.reddit.com/r/${cleanSub}/search.json?q=${encodeURIComponent(keyword)}&sort=new&t=${timeParam}&restrict_sr=on&limit=100`

  console.log(`[RedditFetch] 🔍 Fetching: ${searchUrl}`)

  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': REDDIT_USER_AGENT,
        Accept: 'application/json',
        Cookie: env.REDDIT_COOKIE,
      },
    })
    updateChannelState('json', res)

    if (res.status === 404) return { kind: 'not_found' }
    if (!res.ok) {
      console.error(`[RedditFetch] 🔴 HTTP ${res.status} (json) for r/${cleanSub} q="${keyword}"`)
      return { kind: 'blocked' }
    }

    const json = (await res.json()) as {
      data?: { children?: { kind: string; data: RawRedditPost }[] }
    }
    return {
      kind: 'ok',
      posts: (json?.data?.children ?? [])
        .filter((child) => child.kind === 't3')
        .map((child) => child.data),
    }
  } catch (err) {
    console.error(`[RedditFetch] 🔴 Error fetching json r/${cleanSub} q="${keyword}":`, err)
    return { kind: 'error' }
  }
}

async function fetchRedditSearchRSS(
  cleanSub: string,
  keyword: string,
  timeParam: string,
): Promise<ChannelResult> {
  const searchUrl = `https://www.reddit.com/r/${cleanSub}/search.rss?q=${encodeURIComponent(keyword)}&sort=new&t=${timeParam}&restrict_sr=on&limit=100`

  console.log(`[RedditFetch] 🔍 Fetching (rss): ${searchUrl}`)

  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': REDDIT_USER_AGENT,
        Accept: 'application/atom+xml, application/xml, text/xml',
      },
    })
    updateChannelState('rss', res)

    if (res.status === 404) return { kind: 'not_found' }
    if (!res.ok) {
      console.error(`[RedditFetch] 🔴 HTTP ${res.status} (rss) for r/${cleanSub} q="${keyword}"`)
      return { kind: 'blocked' }
    }

    return { kind: 'ok', posts: parseRedditPostRss(await res.text(), cleanSub) }
  } catch (err) {
    console.error(`[RedditFetch] 🔴 Error fetching rss r/${cleanSub} q="${keyword}":`, err)
    return { kind: 'error' }
  }
}

function decodeXmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function stripHtml(input: string): string {
  return input
    .replace(/<!--[\s\S]*?-->/g, '') // comments (e.g. SC_OFF/SC_ON)
    .replace(/<[^>]+>/g, ' ')       // tags
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Parses an Atom search feed into RawRedditPost objects.
 * RSS lacks score/num_comments, so those are set to 0.
 */
function parseRedditPostRss(xmlText: string, cleanSub: string): RawRedditPost[] {
  const posts: RawRedditPost[] = []
  const entryMatches = xmlText.match(/<entry[\s\S]*?<\/entry>/gi) || []

  for (const entry of entryMatches) {
    const idMatch = entry.match(/<id[^>]*>t3_([^<]+)<\/id>/i)
    const titleMatch = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const contentMatch = entry.match(/<content[^>]*>([\s\S]*?)<\/content>/i)
    const authorMatch = entry.match(/<author[^>]*>\s*<name[^>]*>([\s\S]*?)<\/name>/i)
    const categoryMatch = entry.match(/<category[^>]*term=["']([^"']+)["']/i)
    const linkMatch = entry.match(/<link[^>]*href=["']([^"']+)["']/i)
    const publishedMatch = entry.match(/<(?:published|updated)[^>]*>([^<]+)<\/(?:published|updated)>/i)

    const id = idMatch ? idMatch[1] : ''
    const title = titleMatch ? decodeXmlEntities(stripHtml(titleMatch[1])) : ''
    const selftext = contentMatch ? decodeXmlEntities(stripHtml(contentMatch[1])) : ''
    const author = authorMatch ? decodeXmlEntities(authorMatch[1].trim()).replace(/^\/u\//, '') : ''
    const subreddit = categoryMatch ? `r/${categoryMatch[1]}` : `r/${cleanSub}`
    const permalink = linkMatch ? new URL(linkMatch[1]).pathname : ''
    const createdUtc = publishedMatch
      ? Math.floor(new Date(publishedMatch[1]).getTime() / 1000)
      : 0

    if (id && title && permalink) {
      posts.push({
        id,
        name: `t3_${id}`,
        title,
        selftext,
        author,
        subreddit_name_prefixed: subreddit,
        permalink,
        url: `https://reddit.com${permalink}`,
        score: 0,
        num_comments: 0,
        created_utc: createdUtc,
      })
    }
  }

  return posts
}

/**
 * Parses Reddit RSS XML content into structured thread opportunities
 */
function parseRedditRss(xmlText: string): RedditThreadInfo[] {
  const threads: RedditThreadInfo[] = []
  const entryMatches = xmlText.match(/<entry[\s\S]*?<\/entry>/gi) || []

  for (const entry of entryMatches.slice(0, 6)) {
    const titleMatch = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const linkMatch = entry.match(/<link[^>]*href=["']([^"']+)["']/i)
    const categoryMatch = entry.match(/<category[^>]*term=["']([^"']+)["']/i)

    const title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim() : ''
    const url = linkMatch ? linkMatch[1] : ''
    const subreddit = categoryMatch ? `r/${categoryMatch[1]}` : 'r/SaaS'

    if (title && url) {
      threads.push({
        title,
        url,
        subreddit,
        snippet: title,
      })
    }
  }

  return threads
}

/**
 * Fetch buying-intent threads using Reddit RSS search feeds
 */
export async function findBuyingIntentThreads(keywords: string[]): Promise<RedditThreadInfo[]> {
  const keyword = keywords[0] || 'saas'
  const rssUrl = `https://www.reddit.com/search.rss?q=${encodeURIComponent(keyword + ' alternative')}&sort=new`

  try {
    const res = await fetch(rssUrl, {
      headers: {
        'User-Agent': REDDIT_USER_AGENT,
        Accept: 'application/atom+xml, application/xml, text/xml',
      },
    })

    if (!res.ok) {
      console.error(`🔴 Reddit RSS fetch failed for query "${keyword}": HTTP ${res.status}`)
      return []
    }
    const xmlText = await res.text()
    return parseRedditRss(xmlText)
  } catch (err) {
    console.error(`🔴 Error fetching buying intent threads for keywords "${keywords.join(', ')}":`, err)
    return []
  }
}
