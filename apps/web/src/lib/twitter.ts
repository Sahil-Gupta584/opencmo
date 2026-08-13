import type { RawPostCandidate } from '#/lib/inbounds-evaluator'

/**
 * Fetches recent tweets matching a search keyword from X (Twitter).
 * Uses X v2 API search if bearerToken is provided.
 */
export async function fetchXTweets(keyword: string, bearerToken?: string): Promise<RawPostCandidate[]> {
  if (!keyword) return []

  if (bearerToken) {
    try {
      const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(keyword + ' lang:en -is:retweet')}&max_results=10&tweet.fields=created_at,public_metrics,author_id`
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        if (data.data && Array.isArray(data.data)) {
          return data.data.map((tweet: any) => ({
            id: `x_${tweet.id}`,
            title: tweet.text.slice(0, 100),
            body: tweet.text,
            author: tweet.author_id ? `@user_${tweet.author_id}` : '@x_user',
            url: `https://x.com/i/status/${tweet.id}`,
            subreddit: 'x/search',
            score: tweet.public_metrics?.like_count || 5,
            commentCount: tweet.public_metrics?.reply_count || 1,
            createdUtc: tweet.created_at
              ? Math.floor(new Date(tweet.created_at).getTime() / 1000)
              : Math.floor(Date.now() / 1000),
            channel: 'twitter' as const,
          }))
        }
      } else {
        const errText = await res.text()
        console.error(`🔴 X v2 API returned HTTP ${res.status}:`, errText)
      }
    } catch (err) {
      console.error('🔴 Direct X API fetch failed:', err)
    }
  }

  return []
}
