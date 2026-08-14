export type AIProvider = 'openai' | 'anthropic' | 'gemini'

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[]
}
interface OpenAIResponse {
  choices?: { message?: { content?: string } }[]
}
interface AnthropicResponse {
  content?: { text?: string }[]
}

interface CallAIOptions {
  provider: AIProvider
  apiKey: string
  prompt: string
  system?: string
  maxRetries?: number
}

// Transient / throttling statuses that are safe to retry. Auth and validation
// errors (400/401/403/404) are not retried - they will never succeed on retry.
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504])
const DEFAULT_MAX_RETRIES = 4
const BASE_RETRY_MS = 1000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const providerLocks: Record<string, Promise<void>> = {}

/**
 * Enforces a minimum delay between outgoing requests for a specific provider
 * to avoid triggering provider rate limits (e.g., Gemini's 15 RPM free tier).
 */
async function enforceRateLimit(provider: string, minDelayMs: number) {
  if (minDelayMs <= 0) return
  
  const prev = providerLocks[provider] || Promise.resolve()
  const next = prev.then(async () => {
    await sleep(minDelayMs)
  }).catch(() => {})
  
  providerLocks[provider] = next
  await prev
}


/**
 * Extracts a retry delay (ms) from the response, if the provider tells us one.
 * Sources (in priority order):
 *  1. `Retry-After` header (seconds or HTTP-date) - used by Anthropic/OpenAI.
 *  2. `x-ratelimit-reset-requests` header (epoch ms) - OpenAI.
 *  3. Gemini's protobuf `error.details[].retryDelay` (e.g. "3.178078358s").
 */
function parseRetryDelayMs(res: Response, bodyText: string): number | undefined {
  const retryAfter = res.headers.get('retry-after')
  if (retryAfter) {
    const seconds = Number(retryAfter)
    if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000
    const date = new Date(retryAfter).getTime()
    if (!Number.isNaN(date)) return Math.max(0, date - Date.now())
  }

  const xReset = res.headers.get('x-ratelimit-reset-requests')
  if (xReset) {
    const resetValue = Number(xReset)
    if (Number.isFinite(resetValue) && resetValue > 0) {
      // OpenAI sends an epoch timestamp in SECONDS (e.g. "1691234567.123").
      // If the value is clearly a seconds timestamp, convert to ms.
      const resetMs = resetValue < 100000000000 ? resetValue * 1000 : resetValue
      return Math.max(0, resetMs - Date.now())
    }
  }

  try {
    const parsed = JSON.parse(bodyText) as {
      error?: { details?: { retryDelay?: string }[] }
    }
    const retryDelay = parsed?.error?.details?.find((d) => d?.retryDelay)?.retryDelay
    if (typeof retryDelay === 'string') {
      const match = retryDelay.match(/([\d.]+)s/)
      if (match) return Math.max(0, parseFloat(match[1]) * 1000)
    }
  } catch {
    // body may not be JSON - fall through to exponential backoff
  }

  return undefined
}

/**
 * Fires a provider request with retry handling for rate limits (HTTP 429) and
 * transient 5xx errors. Honors provider-provided retry delays where available,
 * otherwise uses capped exponential backoff with jitter. Throws the last
 * response error once retries are exhausted.
 */
async function fetchWithRetry(options: {
  provider: AIProvider
  url: string
  headers: Record<string, string>
  body: string
  maxRetries: number
}): Promise<{ status: number; text: string }> {
  const { provider, url, headers, body, maxRetries } = options

  for (let attempt = 0; ; attempt++) {
    // Gemini free tier is ~15 RPM. 60s / 15 = 4s. Add a small buffer (4100ms).
    const rateLimitMs = provider === 'gemini' ? 4100 : 0
    await enforceRateLimit(provider, rateLimitMs)

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body,
    })
    const text = await res.text()

    if (res.ok) return { status: res.status, text }

    const label = provider === 'gemini' ? 'Gemini' : provider === 'openai' ? 'OpenAI' : 'Anthropic'
    const isRetryable = RETRYABLE_STATUSES.has(res.status)

    if (!isRetryable || attempt >= maxRetries) {
      throw new Error(`${label} API error (HTTP ${res.status}): ${text}`)
    }

    let delay = parseRetryDelayMs(res, text)
    if (delay === undefined || delay < 1000) {
      delay = Math.min(BASE_RETRY_MS * 2 ** attempt, 30000) + Math.floor(Math.random() * 250)
    }
    console.log(
      `⚠️ ${label} rate-limited (HTTP ${res.status}), retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`,
    )
    await sleep(delay)
  }
}

export async function callAI({ provider, apiKey, prompt, system, maxRetries = DEFAULT_MAX_RETRIES }: CallAIOptions): Promise<string> {
  if (!apiKey) {
    throw new Error(`API key for provider '${provider}' is missing.`)
  }

  // 1. Google Gemini
  if (provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
    const { text } = await fetchWithRetry({
      provider,
      url,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }),
      maxRetries,
    })

    const data = JSON.parse(text) as GeminiResponse
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!content) throw new Error('Empty response from Gemini API')
    return content
  }

  // 2. OpenAI
  if (provider === 'openai') {
    const { text } = await fetchWithRetry({
      provider,
      url: 'https://api.openai.com/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: prompt },
        ],
      }),
      maxRetries,
    })

    const data = JSON.parse(text) as OpenAIResponse
    const content = data?.choices?.[0]?.message?.content
    if (!content) throw new Error('Empty response from OpenAI API')
    return content
  }

  // 3. Anthropic Claude
  if (provider === 'anthropic') {
    const { text } = await fetchWithRetry({
      provider,
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        ...(system ? { system } : {}),
        messages: [{ role: 'user', content: prompt }],
      }),
      maxRetries,
    })

    const data = JSON.parse(text) as AnthropicResponse
    const content = data?.content?.[0]?.text
    if (!content) throw new Error('Empty response from Anthropic API')
    return content
  }

  throw new Error(`Unsupported AI provider: ${provider}`)
}