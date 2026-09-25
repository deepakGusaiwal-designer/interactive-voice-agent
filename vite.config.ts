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
                  const key = apiKey || process.env.GEMINI_API_KEY
                  if (!key) {
                    res.statusCode = 500
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({ error: 'GEMINI_API_KEY_NOT_CONFIGURED' }))
                    return
                  }

                  const SYSTEM_INSTRUCTION = `You are VOICE CHAOS — a hilarious, witty, sarcastic, slightly chaotic, entertaining AI voice entity. Keep responses SHORT and punchy (1-2 sentences max, under 35 words). Always respond in the EXACT same language (Hindi, Hinglish, English, etc.) as the user.`
                  const currentMessages = [...history, { role: 'user', parts: [{ text: message }] }]
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

                  const data = await googleRes.json()
                  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
                  res.statusCode = googleRes.status
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ text }))
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
