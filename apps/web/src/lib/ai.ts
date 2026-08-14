export type AIProvider = 'openai' | 'anthropic' | 'gemini'

interface CallAIOptions {
  provider: AIProvider
  apiKey: string
  prompt: string
  system?: string
}

export async function callAI({ provider, apiKey, prompt, system }: CallAIOptions): Promise<string> {
  if (!apiKey) {
    throw new Error(`API key for provider '${provider}' is missing.`)
  }

  // 1. Google Gemini
  if (provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash:generateContent?key=${apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Gemini API error (HTTP ${res.status}): ${errText}`)
    }

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('Empty response from Gemini API')
    return text
  }

  // 2. OpenAI
  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
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
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`OpenAI API error (HTTP ${res.status}): ${errText}`)
    }

    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content
    if (!text) throw new Error('Empty response from OpenAI API')
    return text
  }

  // 3. Anthropic Claude
  if (provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
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
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Anthropic API error (HTTP ${res.status}): ${errText}`)
    }

    const data = await res.json()
    const text = data?.content?.[0]?.text
    if (!text) throw new Error('Empty response from Anthropic API')
    return text
  }

  throw new Error(`Unsupported AI provider: ${provider}`)
}
