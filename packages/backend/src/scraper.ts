import { env } from './env.js'

export interface ScrapedSite {
  url: string
  title: string
  description: string
  bodyText: string
}

export async function scrapeWebsite(targetUrl: string): Promise<ScrapedSite> {
  let formattedUrl = targetUrl.trim()
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = `https://${formattedUrl}`
  }

  // 1. Try Firecrawl API if configured
  if (env.FIRECRAWL_API_KEY) {
    try {
      const fcRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.FIRECRAWL_API_KEY}`,
        },
        body: JSON.stringify({
          url: formattedUrl,
          formats: ['markdown'],
          onlyMainContent: true,
        }),
      })

      if (fcRes.ok) {
        const fcData = (await fcRes.json()) as {
          data?: { metadata?: { title?: string; description?: string }; markdown?: string; content?: string }
        }
        const data = fcData?.data
        if (data) {
          const title = data.metadata?.title || formattedUrl
          const description = data.metadata?.description || ''
          const bodyText = (data.markdown || data.content || '').slice(0, 3000)

          return {
            url: formattedUrl,
            title,
            description,
            bodyText,
          }
        }
      } else {
        console.warn(`⚠️ Firecrawl API error HTTP ${fcRes.status}, falling back to native fetch scraper.`)
      }
    } catch (err) {
      console.error('🔴 Firecrawl scraping error, falling back to native scraper:', err)
    }
  }

  // 2. Fallback: Native fetch scraper
  try {
    const res = await fetch(formattedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    if (!res.ok) {
      throw new Error(`Failed to fetch page status: ${res.status}`)
    }

    const html = await res.text()

    // Parse Title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : ''

    // Parse Meta Description
    const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
    const description = metaMatch ? metaMatch[1].trim() : ''

    // Strip HTML tags for basic text extraction
    const cleanText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000)

    return {
      url: formattedUrl,
      title: title || formattedUrl,
      description: description || cleanText.slice(0, 200),
      bodyText: cleanText,
    }
  } catch (error) {
    return {
      url: formattedUrl,
      title: formattedUrl,
      description: 'Could not automatically scrape website content.',
      bodyText: '',
    }
  }
}
