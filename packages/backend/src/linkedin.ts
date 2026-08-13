import type { RawPostCandidate } from './inbounds-evaluator.js'

interface LinkedinPost {
  title?: { text?: { text?: string } }
  summary?: { text?: string }
  author?: { '*.actor'?: { name?: string; url?: string } }
  navigationUrl?: string
  timestamp?: number
  socialDetail?: unknown
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : {}
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function extractJsonObject(text: string, start: number): string | null {
  if (text[start] !== '{') return null
  let depth = 0
  let inString = false
  let escape = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (escape) escape = false
      else if (ch === '\\') escape = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      inString = true
    } else if (ch === '{') {
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return null
}

function extractPostJson(html: string): unknown {
  const markers = ['window.__nextData', '"__nextData"', '"searchResults"']
  for (const marker of markers) {
    const idx = html.indexOf(marker)
    if (idx === -1) continue
    const start = html.indexOf('{', idx)
    if (start === -1) continue
    const objectText = extractJsonObject(html, start)
    if (!objectText) continue
    try {
      return JSON.parse(objectText)
    } catch {
      // fall through to the next marker
    }
  }
  return null
}

function extractElements(parsed: unknown): LinkedinPost[] {
  const pageProps = asRecord(asRecord(parsed).props).pageProps
  const data = asRecord(pageProps).data
  const searchResults = asRecord(data).searchResults
  const elements = asRecord(searchResults).elements
  if (!Array.isArray(elements)) return []

  const posts: LinkedinPost[] = []
  for (const el of elements) {
    const content = asRecord(asRecord(el).content)
    const raw = content['*.post']
    const post = asRecord(raw)
    if (Object.keys(post).length === 0) continue
    posts.push({
      title: post.title as LinkedinPost['title'],
      summary: post.summary as LinkedinPost['summary'],
      author: post.author as LinkedinPost['author'],
      navigationUrl: asString(post.navigationUrl),
      timestamp: asNumber(post.timestamp),
      socialDetail: post.socialDetail,
    })
  }
  return posts
}

/**
 * Best-effort LinkedIn inbound fetch via LinkedIn's public search results page.
 * Parses the embedded `__nextData` JSON. LinkedIn has no open search API, so this
 * relies on the public web endpoint and may be rate-limited / bot-gated - callers
 * should treat an empty result as "no candidates".
 */
export async function fetchLinkedInPosts(keyword: string): Promise<RawPostCandidate[]> {
  if (!keyword) return []

  try {
    const url = `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(keyword)}&origin=GLOBAL_SEARCH_HEADER`
    const res = await fetch(url, {
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      console.error(`🔴 LinkedIn search returned HTTP ${res.status} for "${keyword}"`)
      return []
    }

    const html = await res.text()
    const parsed = extractPostJson(html)
    const posts = extractElements(parsed)

    return posts
      .map((post): RawPostCandidate | null => {
        const navUrl = post.navigationUrl ?? ''
        const urnMatch = navUrl.match(/urn:li:activity:(\d+)/)
        const id =
          urnMatch?.[1] ??
          navUrl.replace(/[^a-zA-Z0-9]/g, '').slice(0, 60) ??
          ''
        if (!id) return null

        const title = post.title?.text?.text ?? post.summary?.text ?? keyword
        const body = post.summary?.text ?? post.title?.text?.text ?? ''

        return {
          id: `li_${id}`,
          title: title.slice(0, 100),
          body,
          author: post.author?.['*.actor']?.name ?? 'LinkedIn User',
          url: navUrl.startsWith('/') ? `https://www.linkedin.com${navUrl}` : navUrl,
          subreddit: 'linkedin/search',
          score: 0,
          commentCount: 0,
          createdUtc: post.timestamp
            ? Math.floor(post.timestamp / 1000)
            : Math.floor(Date.now() / 1000),
          channel: 'linkedin',
        }
      })
      .filter((post): post is RawPostCandidate => post !== null)
  } catch (err) {
    console.error(`🔴 LinkedIn fetch failed for "${keyword}":`, err)
    return []
  }
}