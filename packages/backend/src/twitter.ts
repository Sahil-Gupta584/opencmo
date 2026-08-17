import type { RawPostCandidate } from './inbounds-evaluator.js'

interface RapidTweet {
  type: string
  tweet_id: string
  screen_name: string
  favorites?: number
  replies?: number
  retweets?: number
  created_at?: string
  text?: string
  user_info?: {
    name?: string
    screen_name?: string
    followers_count?: number | string
  }
}

interface RapidUserProfile {
  status?: string
  user_info?: {
    id?: string
    name?: string
    screen_name?: string
    followers_count?: number | string
    friends_count?: number | string
    statuses_count?: number | string
  }
}

interface FetchXTweetOptions {
  host: string
  apiKey: string
  minFollowers?: number
}

const FOLLOWER_CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour
const followerCache = new Map<string, { count: number; fetchedAt: number }>()

function cachedFollowerCount(screenName: string): number | undefined {
  const hit = followerCache.get(screenName)
  if (hit && Date.now() - hit.fetchedAt < FOLLOWER_CACHE_TTL_MS) return hit.count
  return undefined
}

/**
 * Fetches an author's follower count from the twitter-api45 user.php endpoint.
 * Returns undefined if the lookup fails (caller treats that as "cannot verify").
 */
async function fetchFollowerCount(
  screenName: string,
  options: { host: string; apiKey: string },
): Promise<number | undefined> {
  const cached = cachedFollowerCount(screenName)
  if (cached !== undefined) return cached

  try {
    const url = new URL(`https://${options.host}/user.php`)
    url.searchParams.append('screen_name', screenName)

    const res = await fetch(url.toString(), {
      headers: {
        'x-rapidapi-host': options.host,
        'x-rapidapi-key': options.apiKey,
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error(`🔴 X RapidAPI user.php returned HTTP ${res.status} for @${screenName}:`, errText)
      return undefined
    }

    const json = (await res.json()) as RapidUserProfile
    const count = Number(json?.user_info?.followers_count)
    if (Number.isFinite(count) && count >= 0) {
      followerCache.set(screenName, { count, fetchedAt: Date.now() })
      return count
    }

    console.error(`🔴 X RapidAPI user.php: no followers_count for @${screenName}`, json)
    return undefined
  } catch (err) {
    console.error(`🔴 X RapidAPI user.php failed for @${screenName}:`, err)
    return undefined
  }
}

/**
 * Fetches recent tweets matching a search keyword from X (Twitter).
 * Uses the RapidAPI X scraper endpoint (twitter-api45) via search.php.
 * Filters out tweets whose author has <= minFollowers followers (default 150).
 * Returns [] if X_HOST / X_KEY are not configured or the request fails.
 */
export async function fetchXTweets(
  keyword: string,
  options?: FetchXTweetOptions,
): Promise<RawPostCandidate[]> {
  if (!keyword) return []
  if (!options?.host || !options?.apiKey) return []

  const minFollowers = options?.minFollowers ?? 150

  try {
    const url = new URL(`https://${options.host}/search.php`)
    url.searchParams.append('query', keyword)
    url.searchParams.append('search_type', 'Latest')

    const res = await fetch(url.toString(), {
      headers: {
        'x-rapidapi-host': options.host,
        'x-rapidapi-key': options.apiKey,
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error(`🔴 X RapidAPI returned HTTP ${res.status}:`, errText)
      return []
    }

    const json = (await res.json()) as { status?: string; timeline?: RapidTweet[] }
    const tweets = json?.timeline
    if (!Array.isArray(tweets)) {
      console.error(`🔴 X RapidAPI: unexpected response shape`, { status: json?.status, url: url.toString() })
      return []
    }

    // Resolve follower count for every unique author (prefer search user_info, else fetch)
    const authors = [...new Set(tweets.map((t) => t.screen_name).filter(Boolean))]
    const followerByAuthor = new Map<string, number | undefined>()
    for (const author of authors) {
      const fromSearch = Number(tweets.find((t) => t.screen_name === author)?.user_info?.followers_count)
      if (Number.isFinite(fromSearch) && fromSearch >= 0) {
        followerByAuthor.set(author, fromSearch)
      } else {
        followerByAuthor.set(author, await fetchFollowerCount(author, options))
      }
    }

    const kept = tweets.filter((tweet) => {
      if (!tweet?.tweet_id || !tweet?.text) return false
      const followers = followerByAuthor.get(tweet.screen_name)
      if (followers === undefined) {
        console.warn(`⚠️ X filter: could not verify followers for @${tweet.screen_name}, keeping tweet`)
        return true
      }
      return followers > minFollowers
    })

    const filtered = tweets.filter((t) => t?.tweet_id && t?.text).length - kept.length
    if (filtered > 0) {
      console.log(`🗞️ X filter: dropped ${filtered} tweet(s) with <= ${minFollowers} followers (keyword "${keyword}")`)
    }

    return kept.map((tweet) => {
      const fullText = tweet.text || ''
      const createdUtc = tweet.created_at
        ? Math.floor(new Date(tweet.created_at).getTime() / 1000)
        : Math.floor(Date.now() / 1000)
      return {
        id: `x_${tweet.tweet_id}`,
        title: fullText.slice(0, 100),
        body: fullText,
        author: tweet.screen_name ? `@${tweet.screen_name}` : '@x_user',
        url: `https://x.com/${tweet.screen_name}/status/${tweet.tweet_id}`,
        subreddit: 'x/search',
        score: tweet.favorites || 0,
        commentCount: tweet.replies || 0,
        createdUtc,
        channel: 'twitter' as const,
      }
    })
  } catch (err) {
    console.error('🔴 X RapidAPI fetch failed:', err)
    return []
  }
}