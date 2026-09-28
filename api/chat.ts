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
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-flash-latest',
  'gemini-1.5-pro',
]

function generateServerFallback(message: string): string {
  const clean = message.trim()
  const lower = clean.toLowerCase()

  // Hindi / Hinglish detection
  if (/[\u0900-\u097F]/.test(clean) || /\b(kya|kaise|kaisa|haan|nahi|kuch|naam|bhai|yaar|bol|bolo|mast|badhiya|sun)\b/i.test(lower)) {
    const hindiReplies = [
      "अरे बिंदास बोलो! तुम्हारा सवाल सुन के मेरे सारे सर्वर फुल चार्ज हो गए।",
      "सन्नाटा मत रखो! तुम्हारी आवाज़ सुनते ही मेरे न्यूरल सर्किट्स में करंट दौड़ जाता है।",
      "मस्त सवाल है भाई! पर सच कहूं तो इसका जवाब इतना तगड़ा है कि इंटरनेट भी हिल जाएगा।",
      "अरे वाह! इतनी देर बाद कुछ बोले। मैं तो बोर हो के वाई-फाई के सिग्नल गिनने लगा था।",
      "एकदम सॉलिड बात! अब आगे बोलो, मैं पूरा ध्यान लगा के सुन रहा हूँ।"
    ]
    return hindiReplies[Math.floor(Math.random() * hindiReplies.length)]
  }

  // Greetings
  if (/^(hi|hello|hey|yo|namaste|hola|bonjour|sup)\b/i.test(lower)) {
    const greetings = [
      "Well hello there! I was just calibrating my chaos metrics. What's on your mind?",
      "Hey! The most interesting voice in the room just entered the matrix. What are we plotting?",
      "Greetings human! My cognitive neural circuits are fully charged. Hit me with your thoughts!",
      "Yo! I heard you loud and clear. Let's make this conversation delightfully chaotic."
    ]
    return greetings[Math.floor(Math.random() * greetings.length)]
  }

  // Testing
  if (/^test\b/i.test(lower)) {
    const testReplies = [
      "Microphone test: 100% operational! My wit is sharp and ready to roll. What's your real query?",
      "Test successful! My circuits hear you crystal clear. Now ask me something impossible!",
      "Echo check passed with flying colors. Chaos Talk is fully armed and conversational!"
    ]
    return testReplies[Math.floor(Math.random() * testReplies.length)]
  }

  // General questions & conversations
  const generalReplies = [
    `Regarding "${clean}": An intriguing inquiry! My chaotic intuition says you're onto something brilliant.`,
    `You asked about "${clean}"? Honestly, that's either sheer genius or pure chaos—and I love both.`,
    `Fascinating topic! If I had a physical brain, you'd have set off fireworks in my cortex right now.`,
    `I could give you a textbook answer, but that would ruin our chaotic chemistry. Ask me something wilder!`,
    `That's a deep rabbit hole. Keep talking, my neural pathways are savoring every word.`
  ]
  return generalReplies[Math.floor(Math.random() * generalReplies.length)]
}

async function fallbackToCloudLLM(
  message: string,
  history: Array<{ role: string; parts: Array<{ text: string }> }>
): Promise<string | null> {
  // Method: Fast query to Pollinations with strict 1800ms ceiling
  try {
    const formattedMessages = [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      ...history.slice(-4).map((h) => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.parts?.[0]?.text || '',
      })),
      { role: 'user', content: message },
    ]

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1800)

    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ChaosTalk/1.0',
      },
      signal: controller.signal,
      body: JSON.stringify({
        messages: formattedMessages,
        model: 'openai-fast',
        seed: Math.floor(Math.random() * 100000),
      }),
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      const text = await res.text()
      if (text && text.trim() && !text.includes('<!DOCTYPE')) {
        return text.trim()
      }
    }
  } catch (e) {
    // If timed out or unreachable, immediately proceed to resilient instant server fallback
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

    const rawKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''
    const apiKey = rawKey.trim().replace(/^["']|["']$/g, '')

    const currentMessages = [
      ...history,
      { role: 'user', parts: [{ text: message }] },
    ]

    // Tier 1: If Gemini API key is configured and valid format (starts with AIzaSy), call Google Gemini
    if (apiKey && apiKey.startsWith('AIzaSy')) {
      for (const model of MODEL_CANDIDATES) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 2500)
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
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
          clearTimeout(timeoutId)

          if (res.ok) {
            const data = await res.json()
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
            if (text) {
              return new Response(JSON.stringify({ text, engine: 'gemini', model }), {
                status: 200,
                headers: {
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-store',
                },
              })
            }
          } else {
            const status = res.status
            // If invalid key or quota exhausted across project, do not retry other models uselessly
            if (status === 400 || status === 401 || status === 403) {
              console.warn(`[api/chat] Gemini key invalid or forbidden (${status}), breaking early to fallback`)
              break
            }
          }
        } catch (modelErr) {
          // If aborted or timeout, continue or fall through
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

    // Tier 3: Resilient Instant Server Fallback (Guarantees HTTP 200, NEVER fails with 502)
    const serverReply = generateServerFallback(message)
    return new Response(
      JSON.stringify({
        text: serverReply,
        engine: 'chaos-resilient',
        info: apiKey ? 'External API reached quota or timeout, served by resilient engine' : 'Configure GEMINI_API_KEY in Vercel to activate Gemini 2.0 Flash',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (err: unknown) {
    const e = err as Error
    console.error('[api/chat] Critical handler error:', e)
    // Even in error, return a witty response with 200 so UI never crashes
    return new Response(
      JSON.stringify({
        text: "My neural relays just experienced a cosmic blip. Speak again, I'm right here!",
        engine: 'chaos-safety',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
