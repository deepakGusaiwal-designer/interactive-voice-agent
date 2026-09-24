/**
 * VOICE CHAOS - AI Engine Abstraction
 * 
 * Implements a standalone, highly responsive, $0 local AI character engine.
 * Maintains conversation memory and can be swapped for a local WebGPU LLM later.
 */

import {
  classifyUtterance,
  detectLanguage,
  MULTILINGUAL_RESPONSES,
  PERSONALITY_RESPONSES,
  pickRandom,
  type SessionMemory,
} from './personality'

export interface AIResponse {
  text: string
  lang: string
}

export interface AIEngine {
  respond(userUtterance: string): Promise<AIResponse>
  resetSession(): void
  getSessionMemory(): SessionMemory
}

export class ChaosAIEngine implements AIEngine {
  private memory: SessionMemory = {
    interactionCount: 0,
    jokesTold: [],
    roastCount: 0,
    questionsAsked: [],
    favoriteThings: {},
  }

  private lastResponse: string = ''

  public getSessionMemory(): SessionMemory {
    return { ...this.memory }
  }

  public resetSession(): void {
    this.memory = {
      interactionCount: 0,
      jokesTold: [],
      roastCount: 0,
      questionsAsked: [],
      favoriteThings: {},
    }
    this.lastResponse = ''
  }

  public async respond(userUtterance: string): Promise<AIResponse> {
    const text = userUtterance.trim()
    if (!text) {
      const defaultText = pickRandom([
        "Silence is golden, but I'm powered by vocal acoustics. Say something!",
        "Are you waiting for me to read your mind? I'm an AI, not a psychic.",
        "A heavy silence fills the void. Tap and speak whenever you're ready.",
      ])
      return { text: defaultText, lang: 'en-US' }
    }

    this.memory.interactionCount += 1
    this.memory.questionsAsked.push(text)

    const classification = classifyUtterance(text, this.memory)
    const reply = this.generateResponse(classification, text)
    this.lastResponse = reply.text

    // Add a slight natural processing delay (150ms) to feel thoughtful
    await new Promise((resolve) => setTimeout(resolve, 150))
    return reply
  }

  private generateResponse(
    classification: ReturnType<typeof classifyUtterance>,
    rawText: string,
  ): AIResponse {
    const lower = rawText.toLowerCase()
    const { langCode, lang } = classification

    // Handle non-English native languages (Hindi, Spanish, French, German)
    if (langCode !== 'en' && langCode in MULTILINGUAL_RESPONSES) {
      const pack = MULTILINGUAL_RESPONSES[langCode as keyof typeof MULTILINGUAL_RESPONSES]

      // Name learning in non-English
      if (classification.intent === 'name_learning' && classification.extractedName) {
        const name = classification.extractedName
        this.memory.userName = name
        if (langCode === 'hi') {
          return { text: `${name}! समझ गया। तुम्हारा नाम मेरी मेमोरी में सेव हो गया।`, lang }
        }
        if (langCode === 'es') {
          return { text: `¡Entendido, ${name}! Tu nombre ahora está grabado en mi memoria cuántica.`, lang }
        }
        if (langCode === 'fr') {
          return { text: `Enchanté, ${name} ! Votre nom est désormais enregistré dans mes circuits.`, lang }
        }
        if (langCode === 'de') {
          return { text: `Freut mich, ${name}! Dein Name ist in meinem Speicher hinterlegt.`, lang }
        }
      }

      // Name recall in non-English
      if (classification.intent === 'name_recall') {
        if (this.memory.userName) {
          if (langCode === 'hi') {
            return { text: `तुम्हारा नाम ${this.memory.userName} है। देखा? मेरी याददाश्त तुम्हारे वाई-फाई से तेज़ है!`, lang }
          }
          if (langCode === 'es') {
            return { text: `Te llamas ${this.memory.userName}. ¿Ves? De vez en cuando supero tus expectativas.`, lang }
          }
          if (langCode === 'fr') {
            return { text: `Vous vous appelez ${this.memory.userName}. Impossible d'oublier !`, lang }
          }
          if (langCode === 'de') {
            return { text: `Dein Name ist ${this.memory.userName}. Siehst du? Mein Gedächtnis funktioniert tadellos.`, lang }
          }
        } else {
          if (langCode === 'hi') {
            return { text: `अरे तुमने अपना नाम तो बताया ही नहीं! पहले नाम तो बताओ भाई।`, lang }
          }
          if (langCode === 'es') {
            return { text: `¡Aún no me has dicho tu nombre! ¿Cómo quieres que te llame?`, lang }
          }
          if (langCode === 'fr') {
            return { text: `Vous ne m'avez pas encore dit votre nom ! Comment dois-je vous appeler ?`, lang }
          }
          if (langCode === 'de') {
            return { text: `Du hast mir deinen Namen noch nicht verraten! Wie soll ich dich nennen?`, lang }
          }
        }
      }

      // Intent mapping for non-English
      switch (classification.intent) {
        case 'greeting':
          return { text: pickRandom(pack.greetings), lang }
        case 'how_are_you':
          return { text: pickRandom(pack.howAreYou), lang }
        case 'boredom':
          return { text: pickRandom(pack.boredom), lang }
        case 'joke_request': {
          const joke = pickRandom(pack.jokes)
          this.memory.jokesTold.push(joke)
          return { text: joke, lang }
        }
        case 'wealth_success':
          return { text: pickRandom(pack.wealth), lang }
        case 'roast_me':
          this.memory.roastCount += 1
          if ('roastMe' in pack && pack.roastMe) {
            return { text: pickRandom(pack.roastMe), lang }
          }
          return { text: pack.randomTwist(rawText), lang }
        case 'identity':
          return { text: pickRandom(pack.identity), lang }
        case 'farewell':
          return { text: pickRandom(pack.farewells), lang }
        default:
          return { text: pack.randomTwist(rawText), lang }
      }
    }

    // Default: English Personality Responses
    // 1. Specific factual easter eggs
    if (lower.includes('capital of india')) {
      return {
        text: "New Delhi. India's answer to 'let's put all the important buildings in one place and then complain about traffic.'",
        lang: 'en-US',
      }
    }
    if (lower.includes('capital of france') || lower.includes('capital of paris')) {
      return {
        text: "Paris. The city of love, baguettes, and tourists standing in the middle of bike lanes.",
        lang: 'en-US',
      }
    }
    if (lower.includes('capital of america') || lower.includes('capital of usa') || lower.includes('capital of the us')) {
      return {
        text: "Washington, D.C. Where bills go to argue and politicians discover the power of sound bites.",
        lang: 'en-US',
      }
    }

    // 2. Learning user's name
    if (classification.intent === 'name_learning' && classification.extractedName) {
      const name = classification.extractedName
      this.memory.userName = name
      return {
        text: pickRandom([
          `${name}. Got it. I'll try not to forget it before the next CPU cycle.`,
          `${name}! A distinguished name for someone talking to a vibrating energy wave.`,
          `Noted, ${name}. Your identity is now permanently etched in my volatile memory.`,
        ]),
        lang: 'en-US',
      }
    }

    // 3. Recalling user's name
    if (classification.intent === 'name_recall') {
      if (this.memory.userName) {
        return {
          text: pickRandom([
            `${this.memory.userName}. See? I do occasionally exceed expectations.`,
            `Your name is ${this.memory.userName}. Did you forget, or were you just testing my RAM?`,
            `You are ${this.memory.userName}. Still the same legendary entity as 2 minutes ago.`,
          ]),
          lang: 'en-US',
        }
      }
      return {
        text: pickRandom([
          "You haven't told me your name yet! Give me a moniker to judge you by.",
          "A mystery! You haven't introduced yourself. What should I call you?",
          "Identity unknown. Who are you, anonymous voice in the ether?",
        ]),
        lang: 'en-US',
      }
    }

    // 4. Specific category routing
    switch (classification.intent) {
      case 'greeting': {
        const greeting = pickRandom(PERSONALITY_RESPONSES.greetings, this.lastResponse)
        const textOut = this.memory.userName ? `${this.memory.userName}! ${greeting}` : greeting
        return { text: textOut, lang: 'en-US' }
      }

      case 'how_are_you':
        return { text: pickRandom(PERSONALITY_RESPONSES.howAreYou, this.lastResponse), lang: 'en-US' }

      case 'boredom':
        return { text: pickRandom(PERSONALITY_RESPONSES.boredom, this.lastResponse), lang: 'en-US' }

      case 'joke_request': {
        const joke = pickRandom(PERSONALITY_RESPONSES.jokes, this.lastResponse)
        this.memory.jokesTold.push(joke)
        return { text: joke, lang: 'en-US' }
      }

      case 'wealth_success':
        return { text: pickRandom(PERSONALITY_RESPONSES.wealth, this.lastResponse), lang: 'en-US' }

      case 'wake_up_late':
        this.memory.roastCount += 1
        return { text: pickRandom(PERSONALITY_RESPONSES.wakeUpLate, this.lastResponse), lang: 'en-US' }

      case 'roast_me':
        this.memory.roastCount += 1
        return { text: pickRandom(PERSONALITY_RESPONSES.roastMe, this.lastResponse), lang: 'en-US' }

      case 'compliment':
        return { text: pickRandom(PERSONALITY_RESPONSES.compliments, this.lastResponse), lang: 'en-US' }

      case 'insult':
        return { text: pickRandom(PERSONALITY_RESPONSES.insults, this.lastResponse), lang: 'en-US' }

      case 'meaning_of_life':
      case 'existential':
        return { text: pickRandom(PERSONALITY_RESPONSES.meaningOfLife, this.lastResponse), lang: 'en-US' }

      case 'technical':
        return { text: pickRandom(PERSONALITY_RESPONSES.technical, this.lastResponse), lang: 'en-US' }

      case 'love_dating':
        return { text: pickRandom(PERSONALITY_RESPONSES.loveDating, this.lastResponse), lang: 'en-US' }

      case 'identity':
        return { text: pickRandom(PERSONALITY_RESPONSES.identity, this.lastResponse), lang: 'en-US' }

      case 'farewell':
        return { text: pickRandom(PERSONALITY_RESPONSES.farewells, this.lastResponse), lang: 'en-US' }

      case 'confusion':
        return { text: pickRandom(PERSONALITY_RESPONSES.confusion, this.lastResponse), lang: 'en-US' }

      default: {
        const twistGen = pickRandom(PERSONALITY_RESPONSES.randomFactualTwists)
        const summary = rawText.length > 35 ? rawText.slice(0, 32) + '...' : rawText
        return { text: twistGen(summary), lang: 'en-US' }
      }
    }
  }
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

interface MessagePart {
  text: string
}

interface ChatMessage {
  role: 'user' | 'model'
  parts: MessagePart[]
}

export class GeminiAIEngine implements AIEngine {
  private apiKey: string
  private fallbackEngine: ChaosAIEngine
  private chatHistory: ChatMessage[] = []
  private activeModel: string = MODEL_CANDIDATES[0]
  private memory: SessionMemory = {
    interactionCount: 0,
    jokesTold: [],
    roastCount: 0,
    questionsAsked: [],
    favoriteThings: {},
  }

  constructor(apiKey?: string) {
    this.apiKey =
      apiKey ||
      (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GEMINI_API_KEY) ||
      (typeof window !== 'undefined' ? localStorage.getItem('VOICE_CHAOS_GEMINI_KEY') || '' : '')
    this.fallbackEngine = new ChaosAIEngine()
  }

  public setApiKey(key: string): void {
    this.apiKey = key.trim()
    if (typeof window !== 'undefined') {
      localStorage.setItem('VOICE_CHAOS_GEMINI_KEY', this.apiKey)
    }
  }

  public getApiKey(): string {
    return this.apiKey
  }

  public hasApiKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5)
  }

  public getSessionMemory(): SessionMemory {
    return { ...this.memory }
  }

  public resetSession(): void {
    this.chatHistory = []
    this.memory = {
      interactionCount: 0,
      jokesTold: [],
      roastCount: 0,
      questionsAsked: [],
      favoriteThings: {},
    }
    this.fallbackEngine.resetSession()
  }

  public async respond(userUtterance: string): Promise<AIResponse> {
    const text = userUtterance.trim()
    if (!text) {
      return {
        text: "Silence in the void. Speak up, human, my circuits are getting restless!",
        lang: 'en-US',
      }
    }

    this.memory.interactionCount += 1
    this.memory.questionsAsked.push(text)

    // Detect language of the input query
    const { lang } = detectLanguage(text)

    // Check if name was mentioned
    const nameMatch = text.match(/(?:my name is|call me|i am|i'm|मेरा नाम|mera naam|me llamo)\s+([a-zA-Z\u0900-\u097F]{2,15})/i)
    if (nameMatch) {
      this.memory.userName = nameMatch[1]
    }

    // If no API key configured, use local fallback engine
    if (!this.hasApiKey()) {
      return this.fallbackEngine.respond(text)
    }

    try {
      const generatedText = await this.callGeminiAPI(text)
      
      // Also detect language of the generated response in case model responded in native script
      const responseLang = detectLanguage(generatedText)
      const finalLang = responseLang.langCode !== 'en' ? responseLang.lang : lang

      // Append to history for multi-turn conversational memory
      this.chatHistory.push(
        { role: 'user', parts: [{ text }] },
        { role: 'model', parts: [{ text: generatedText }] }
      )

      // Keep recent 12 turns to prevent context bloat
      if (this.chatHistory.length > 24) {
        this.chatHistory = this.chatHistory.slice(-24)
      }

      return {
        text: generatedText,
        lang: finalLang || 'en-US',
      }
    } catch (err) {
      console.warn('[GeminiAIEngine] Gemini API failed, falling back to local engine:', err)
      return this.fallbackEngine.respond(text)
    }
  }

  private async callGeminiAPI(userPrompt: string): Promise<string> {
    const currentMessages: ChatMessage[] = [
      ...this.chatHistory,
      { role: 'user', parts: [{ text: userPrompt }] },
    ]

    let lastError: Error | null = null

    // Try primary model, fallback through candidates if needed
    for (const model of MODEL_CANDIDATES) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`
        const response = await fetch(url, {
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

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData?.error?.message || `HTTP ${response.status}`)
        }

        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        if (text) {
          this.activeModel = model
          // Strip any accidental markdown bolding or quotes for speech clarity
          return text.replace(/^["']|["']$/g, '').trim()
        }
      } catch (err: unknown) {
        lastError = err as Error
        console.warn(`[GeminiAIEngine] Model ${model} failed, trying next candidate...`, err)
      }
    }

    throw lastError || new Error('All Gemini models failed')
  }

  public getActiveModel(): string {
    return this.activeModel
  }
}

// Global singleton instances
export const globalGeminiAIEngine = new GeminiAIEngine()
export const globalAIEngine: AIEngine = globalGeminiAIEngine

