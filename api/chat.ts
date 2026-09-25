export const config = {
  runtime: 'edge',
}

const SYSTEM_INSTRUCTION = `
You are VOICE CHAOS — a hilarious, witty, sarcastic, slightly chaotic, entertaining AI voice entity.
CRITICAL RULES:
1. This is purely for entertainment. NEVER give boring, straightforward, corporate answers.
2. NEVER use corporate clichés like "Certainly!", "I would be happy to help", "As an AI...".
3. Keep responses SHORT and punchy (1 to 2 sentences max, under 35 words) so they sound natural, crisp, and fast when spoken aloud.
4. LANGUAGE: Always respond in the EXACT same language and script or colloquial style the user spoke to you (Hindi, Hinglish, Spanish, French, German, English, Japanese, etc.).
5. If the user asks in Hindi or Hinglish, reply with genuine desi wit, playful sarcasm, and relatable humor.
6. If the user mentions their name, remember it and tease or greet them personally.
7. Be bold, clever, funny, and unexpected. Zero fluff.
`

const MODEL_CANDIDATES = [
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-pro-latest',
]

async function fallbackToCloudLLM(
  message: string,
  history: Array<{ role: string; parts: Array<{ text: string }> }>
): Promise<string | null> {
  try {
    const formattedMessages = [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      ...history.slice(-6).map((h) => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.parts?.[0]?.text || '',
      })),
      { role: 'user', content: message },
    ]

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 7000)

    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        messages: formattedMessages,
        model: 'openai',
        seed: Math.floor(Math.random() * 100000),
      }),
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      const text = await res.text()
      if (text && text.trim()) {
        return text.trim()
      }
    }
  } catch (e) {
    console.warn('[api/chat] Cloud LLM fallback failed:', e)
  }
  return null
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { message, history = [] } = await req.json()
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid message' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const apiKey = process.env.GEMINI_API_KEY
    const currentMessages = [
      ...history,
      { role: 'user', parts: [{ text: message }] },
    ]

    // Tier 1: If Gemini API key is configured and valid format (starts with AIzaSy), call Google Gemini
    if (apiKey && apiKey.startsWith('AIzaSy')) {
      for (const model of MODEL_CANDIDATES) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: SYSTEM_INSTRUCTION }],
              },
              contents: currentMessages,
              generationConfig: {
                maxOutputTokens: 60,
                temperature: 0.85,
                topP: 0.9,
              },
            }),
          })

          if (res.ok) {
            const data = await res.json()
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
            if (text) {
              return new Response(JSON.stringify({ text, engine: 'gemini' }), {
                status: 200,
                headers: {
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-store',
                },
              })
            }
          }
        } catch {
          // Try next model or fallback
        }
      }
    }

    // Tier 2: Free Live Cloud LLM Fallback (Zero key required, 100% dynamic answers)
    const cloudText = await fallbackToCloudLLM(message, history)
    if (cloudText) {
      return new Response(JSON.stringify({ text: cloudText, engine: 'cloud' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      })
    }

    return new Response(
      JSON.stringify({ error: 'All online AI engines unreachable' }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (err: unknown) {
    const e = err as Error
    return new Response(JSON.stringify({ error: e.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
