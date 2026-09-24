/**
 * VOICE CHAOS - Studio-Grade Neural & Natural Voice Synthesis Service
 * 
 * Powered by Google Gemini 2.5 Flash Preview Neural Human TTS (24kHz HD PCM)
 * with graceful fallback to browser natural neural voices.
 */

import { globalAudioAnalyser } from '../audio/analyser'

export interface SpeechSynthesisCallbacks {
  onStart?: () => void
  onEnd?: () => void
  onError?: () => void
  onBoundary?: (charIndex: number) => void
}

export type NeuralVoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede'

export type VoiceSpeedMode = 'fast' | 'studio'

export interface SpeakOptions extends SpeechSynthesisCallbacks {
  lang?: string
  rate?: number
  pitch?: number
  volume?: number
  voiceName?: NeuralVoiceName
  mode?: VoiceSpeedMode
}

export class SpeechSynthesisService {
  private isSpeaking: boolean = false
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private currentSourceNode: AudioBufferSourceNode | null = null
  private abortController: AbortController | null = null
  private cachedVoices: SpeechSynthesisVoice[] = []

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.cachedVoices = window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => {
        this.cachedVoices = window.speechSynthesis.getVoices()
      }
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && ('speechSynthesis' in window || 'AudioContext' in window)
  }

  private getApiKey(): string {
    return (
      (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GEMINI_API_KEY) ||
      (typeof window !== 'undefined' ? localStorage.getItem('VOICE_CHAOS_GEMINI_KEY') || '' : '')
    )
  }

  public async speak(text: string, options: SpeakOptions = {}): Promise<void> {
    this.cancel()

    // If Studio HD mode is explicitly requested, generate 24kHz HD PCM
    if (options.mode === 'studio') {
      const apiKey = this.getApiKey()
      if (apiKey) {
        try {
          const played = await this.speakNeural(text, apiKey, options)
          if (played) return
        } catch (err: unknown) {
          const errObj = err as Error
          if (errObj.name !== 'AbortError') {
            console.warn('[SpeechSynthesis] Studio Neural TTS failed, falling back to fast natural voice:', err)
          } else {
            return
          }
        }
      }
    }

    // Default: Blazing Fast Natural Voice (Instant playback in 20ms, zero network lag!)
    this.speakBrowser(text, options)
  }

  /**
   * Speak using Google's Neural Human TTS (24kHz HD PCM)
   * Plays through Web Audio AudioContext directly connected to our AnalyserNode
   */
  private async speakNeural(
    text: string,
    apiKey: string,
    options: SpeakOptions,
  ): Promise<boolean> {
    const voiceName: NeuralVoiceName = options.voiceName || 'Puck'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`

    this.abortController = new AbortController()

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: this.abortController.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Read the following text aloud exactly as written:\n"${text}"`,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName,
              },
            },
          },
        },
      }),
    })

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    const base64Data = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
    if (!base64Data) {
      return false
    }

    // Decode 24kHz 16-bit linear PCM little-endian
    const binaryString = atob(base64Data)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i += 1) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const int16Array = new Int16Array(bytes.buffer)
    const float32Array = new Float32Array(int16Array.length)
    for (let i = 0; i < int16Array.length; i += 1) {
      float32Array[i] = int16Array[i] / 32768.0
    }

    // Play through Web Audio AudioContext
    const { ctx, analyser } = await globalAudioAnalyser.getAnalyserNode()
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000)
    audioBuffer.getChannelData(0).set(float32Array)

    const source = ctx.createBufferSource()
    source.buffer = audioBuffer

    // Route: source -> analyser -> destination
    source.connect(analyser)
    analyser.connect(ctx.destination)

    this.currentSourceNode = source
    this.isSpeaking = true

    options.onStart?.()

    source.onended = () => {
      if (this.currentSourceNode === source) {
        this.currentSourceNode = null
        this.isSpeaking = false
        options.onEnd?.()
      }
    }

    source.start()
    return true
  }

  /**
   * Browser SpeechSynthesis Fallback with strict anti-robot filtering
   */
  private speakBrowser(text: string, options: SpeakOptions = {}): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      options.onError?.()
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = options.rate ?? 1.05
    utterance.pitch = options.pitch ?? 1.0
    utterance.volume = options.volume ?? 1.0

    const targetLang = options.lang || 'en-US'
    utterance.lang = targetLang

    const voices = this.cachedVoices.length > 0 ? this.cachedVoices : window.speechSynthesis.getVoices()
    const langPrefix = targetLang.split('-')[0].toLowerCase()

    const matchingVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix))

    // Anti-robot filter: exclude legacy monotone desktop voices
    const naturalVoices = matchingVoices.filter((v) => !/Desktop|David|Hazel|Zira|Mark|George/i.test(v.name))
    const pool = naturalVoices.length > 0 ? naturalVoices : matchingVoices

    const preferredVoice =
      pool.find((v) => /^Google\s/i.test(v.name)) ||
      pool.find((v) => /Online \(Natural\)/i.test(v.name)) ||
      pool.find((v) => /Natural|Enhanced/i.test(v.name)) ||
      pool.find((v) =>
        /Samantha|Daniel|Karen|Paulina|Helena|Jorge|Thomas|Amelie|Katja|Kalpana|Hemant/i.test(v.name),
      ) ||
      pool[0] ||
      voices[0]

    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => {
      this.isSpeaking = true
      options.onStart?.()
    }

    utterance.onend = () => {
      this.isSpeaking = false
      this.currentUtterance = null
      options.onEnd?.()
    }

    utterance.onerror = (e) => {
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        options.onError?.()
      }
      this.isSpeaking = false
      this.currentUtterance = null
    }

    utterance.onboundary = (e) => {
      options.onBoundary?.(e.charIndex)
    }

    this.currentUtterance = utterance
    window.speechSynthesis.speak(utterance)
  }

  public cancel(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }

    if (this.currentSourceNode) {
      try {
        this.currentSourceNode.stop()
      } catch {
        // Already stopped
      }
      this.currentSourceNode = null
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

    this.isSpeaking = false
    this.currentUtterance = null
  }

  public getSpeakingState(): boolean {
    return (
      this.isSpeaking ||
      Boolean(this.currentSourceNode) ||
      Boolean(this.currentUtterance) ||
      (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking)
    )
  }
}

export const globalSpeechSynthesis = new SpeechSynthesisService()
