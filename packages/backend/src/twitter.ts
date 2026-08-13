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
  }
}

/**
 * Fetches recent tweets matching a search keyword from X (Twitter).
 * Uses the RapidAPI X scraper endpoint (twitter-api45) via search.php.
 * Returns [] if X_HOST / X_KEY are not configured or the request fails.
 */
export async function fetchXTweets(
  keyword: string,
  options?: { host: string; apiKey: string },
): Promise<RawPostCandidate[]> {
  if (!keyword) return []
  if (!options?.host || !options?.apiKey) return []

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

    return tweets
      .filter((tweet) => tweet?.tweet_id && tweet?.text)
      .map((tweet) => {
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