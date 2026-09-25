import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || ''

  return {
    plugins: [
      react(),
      {
        name: 'local-api-dev-server',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/chat' && req.method === 'POST') {
              let body = ''
              req.on('data', (chunk) => {
                body += chunk
              })
              req.on('end', async () => {
                try {
                  const { message, history = [] } = JSON.parse(body || '{}')
                  let text = ''
                  const SYSTEM_INSTRUCTION = `You are VOICE CHAOS — a hilarious, witty, sarcastic, slightly chaotic, entertaining AI voice entity. Keep responses SHORT and punchy (1-2 sentences max, under 35 words). Always respond in the EXACT same language (Hindi, Hinglish, English, etc.) as the user.`
                  const currentMessages = [...history, { role: 'user', parts: [{ text: message }] }]

                  const key = apiKey || process.env.GEMINI_API_KEY || ''

                  // Try Google Gemini if key is provided and looks valid (Google AI Studio keys start with AIzaSy)
                  if (key && key.startsWith('AIzaSy')) {
                    try {
                      const model = 'gemini-flash-lite-latest'
                      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`
                      const googleRes = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
                          contents: currentMessages,
                          generationConfig: { maxOutputTokens: 60, temperature: 0.85, topP: 0.9 },
                        }),
                      })
                      if (googleRes.ok) {
                        const data = await googleRes.json()
                        text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
                      }
                    } catch {
                      // fallback below
                    }
                  }

                  // If Gemini was unavailable or returned error, use Live Cloud LLM fallback
                  if (!text) {
                    try {
                      const formattedMessages = [
                        { role: 'system', content: SYSTEM_INSTRUCTION },
                        ...history.slice(-6).map((h: { role: string; parts: Array<{ text: string }> }) => ({
                          role: h.role === 'model' ? 'assistant' : 'user',
                          content: h.parts?.[0]?.text || '',
                        })),
                        { role: 'user', content: message },
                      ]
                      const pollRes = await fetch('https://text.pollinations.ai/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          messages: formattedMessages,
                          model: 'openai',
                          seed: Math.floor(Math.random() * 100000),
                        }),
                      })
                      if (pollRes.ok) {
                        const pollText = await pollRes.text()
                        if (pollText && pollText.trim()) {
                          text = pollText.trim()
                        }
                      }
                    } catch {
                      // ignore
                    }
                  }

                  if (text) {
                    res.statusCode = 200
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({ text }))
                  } else {
                    res.statusCode = 502
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({ error: 'All online AI engines failed' }))
                  }
                } catch (e: unknown) {
                  const err = e as Error
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: err.message }))
                }
              })
              return
            }

            if (req.url === '/api/tts' && req.method === 'POST') {
              let body = ''
              req.on('data', (chunk) => {
                body += chunk
              })
              req.on('end', async () => {
                try {
                  const { text, voiceName = 'Puck' } = JSON.parse(body || '{}')
                  const key = apiKey || process.env.GEMINI_API_KEY
                  if (!key) {
                    res.statusCode = 500
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({ error: 'GEMINI_API_KEY_NOT_CONFIGURED' }))
                    return
                  }
                  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${key}`
                  const googleRes = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      contents: [{ parts: [{ text: `Read the following text aloud exactly as written:\n"${text}"` }] }],
                      generationConfig: {
                        responseModalities: ['AUDIO'],
                        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
                      },
                    }),
                  })
                  const data = await googleRes.json()
                  const audio = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
                  res.statusCode = googleRes.status
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ audio }))
                } catch (e: unknown) {
                  const err = e as Error
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: err.message }))
                }
              })
              return
            }

            next()
          })
        },
      },
    ],
  }
})
