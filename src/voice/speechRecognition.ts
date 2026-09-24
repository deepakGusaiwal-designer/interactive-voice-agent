/**
 * VOICE CHAOS - Robust Continuous Speech Recognition Engine
 * 
 * Implements continuous Web Speech recognition with real-time interim results,
 * automatic silence/pause detection for natural conversational turn-taking,
 * multi-language support, and resilient auto-reconnect on browser interruptions.
 */

export interface SpeechRecognitionCallbacks {
  onStart?: () => void
  onEnd?: () => void
  onResult?: (transcript: string, isFinal: boolean) => void
  onSpeechFinal?: (finalText: string) => void
  onError?: (errorMessage: string) => void
  onInterruptionDetected?: () => void
}

type SpeechRecognitionEventLike = Event & {
  resultIndex: number
  results: {
    length: number
    [index: number]: {
      isFinal: boolean
      [index: number]: { transcript: string }
    }
  }
}

export type Recognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
}

export type RecognitionConstructor = new () => Recognition

declare global {
  interface Window {
    SpeechRecognition?: RecognitionConstructor
    webkitSpeechRecognition?: RecognitionConstructor
  }
}

export function getDefaultRecognitionLanguage(): string {
  if (typeof window === 'undefined') return 'hi-IN'

  try {
    const saved = localStorage.getItem('VOICE_CHAOS_LANGUAGE')
    if (saved && saved !== 'auto') return saved
  } catch {
    // Ignore
  }

  // Detect Indian timezone (IST / Asia/Kolkata / Asia/Calcutta / +05:30)
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (tz && /Kolkata|Calcutta|India|Colombo/i.test(tz)) {
      return 'hi-IN'
    }
  } catch {
    // Ignore
  }

  try {
    const offset = new Date().getTimezoneOffset()
    if (offset === -330) {
      return 'hi-IN'
    }
  } catch {
    // Ignore
  }

  const navLangs = typeof navigator !== 'undefined' ? (navigator.languages || [navigator.language]) : []
  for (const l of navLangs) {
    if (/^hi/i.test(l) || /IN$/i.test(l)) {
      return 'hi-IN'
    }
  }

  return (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'hi-IN'
}

export class SpeechRecognitionService {
  private recognition: Recognition | null = null
  private isListening: boolean = false
  private callbacks: SpeechRecognitionCallbacks = {}
  private accumulatedFinalText: string = ''
  private currentInterimText: string = ''
  private isUserSpeaking: boolean = false
  private silenceTimer: ReturnType<typeof setTimeout> | null = null
  private maxListeningTimer: ReturnType<typeof setTimeout> | null = null
  private targetLanguage: string = getDefaultRecognitionLanguage()
  private autoRestartAllowed: boolean = false

  constructor() {
    this.initRecognition()
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  }

  public setLanguage(lang: string): void {
    const changed = this.targetLanguage !== lang
    this.targetLanguage = lang
    if (this.recognition) {
      this.recognition.lang = lang
      // In Chrome, dynamically changing language requires aborting and restarting the recognition session
      if (changed && this.isListening) {
        try {
          this.autoRestartAllowed = true
          this.recognition.abort()
        } catch {
          // Handled safely
        }
      }
    }
  }

  public getLanguage(): string {
    return this.targetLanguage
  }

  private initRecognition(): void {
    if (!this.isSupported()) return

    const RecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!RecognitionClass) return

    const rec = new RecognitionClass()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = this.targetLanguage

    rec.onstart = () => {
      this.isListening = true
      this.isUserSpeaking = false
      this.callbacks.onStart?.()
    }

    rec.onresult = (event) => {
      let finalChunk = ''
      let interimChunk = ''

      for (let i = 0; i < event.results.length; i += 1) {
        const item = event.results[i]
        const text = item[0]?.transcript ?? ''
        if (item.isFinal) {
          finalChunk += (finalChunk ? ' ' : '') + text.trim()
        } else {
          interimChunk += (interimChunk ? ' ' : '') + text.trim()
        }
      }

      this.accumulatedFinalText = finalChunk
      this.currentInterimText = interimChunk

      const combined = this.getFullTranscript()

      if (combined.length > 0) {
        if (!this.isUserSpeaking) {
          this.isUserSpeaking = true
          this.callbacks.onInterruptionDetected?.()
        }

        // Smart conversational pause detection: 1.4s of silence after uttering words submits automatically
        this.clearSilenceTimer()
        this.silenceTimer = setTimeout(() => {
          if (this.isListening && (this.accumulatedFinalText || this.currentInterimText)) {
            this.finishAndSubmit()
          }
        }, 1400)
      }

      this.callbacks.onResult?.(combined, Boolean(finalChunk))
    }

    rec.onend = () => {
      // If we are supposed to be listening (e.g. Chrome fired an idle timeout without speech),
      // auto-restart unless explicitly stopped or user submitted
      if (this.isListening && this.autoRestartAllowed) {
        const combined = this.getFullTranscript()
        if (combined) {
          this.finishAndSubmit()
          return
        }

        try {
          rec.lang = this.targetLanguage
          rec.start()
          return
        } catch {
          // Restart failed, proceed with clean end
        }
      }

      this.isListening = false
      this.isUserSpeaking = false
      this.clearSilenceTimer()
      this.clearMaxListeningTimer()

      const textToSend = this.getFullTranscript()
      this.accumulatedFinalText = ''
      this.currentInterimText = ''

      if (textToSend) {
        this.callbacks.onSpeechFinal?.(textToSend)
      } else {
        this.callbacks.onEnd?.()
      }
    }

    rec.onerror = (e) => {
      const err = e.error || 'unknown'
      console.warn('SpeechRecognition error:', err)

      if (err === 'not-allowed') {
        this.isListening = false
        this.autoRestartAllowed = false
        this.callbacks.onError?.('Microphone access blocked. Please allow microphone permissions in your browser.')
      } else if (err === 'no-speech') {
        // Normal inactivity timeout from Chrome; onend will automatically keep session alive if active
      } else if (err === 'aborted') {
        // Explicitly aborted by app or user
      } else if (err === 'network') {
        this.callbacks.onError?.('Network error contacting speech recognition server.')
      } else {
        this.callbacks.onError?.(`Speech recognition error: ${err}`)
      }
    }

    this.recognition = rec
  }

  public getFullTranscript(): string {
    const final = this.accumulatedFinalText.trim()
    const interim = this.currentInterimText.trim()
    if (final && interim) {
      return `${final} ${interim}`
    }
    return final || interim
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer)
      this.silenceTimer = null
    }
  }

  private clearMaxListeningTimer(): void {
    if (this.maxListeningTimer) {
      clearTimeout(this.maxListeningTimer)
      this.maxListeningTimer = null
    }
  }

  public finishAndSubmit(): void {
    this.clearSilenceTimer()
    this.clearMaxListeningTimer()
    this.autoRestartAllowed = false
    const textToSend = this.getFullTranscript()
    this.accumulatedFinalText = ''
    this.currentInterimText = ''

    this.stopListening()

    if (textToSend) {
      this.callbacks.onSpeechFinal?.(textToSend)
    } else {
      this.callbacks.onEnd?.()
    }
  }

  public startListening(callbacks: SpeechRecognitionCallbacks): void {
    this.callbacks = callbacks
    this.accumulatedFinalText = ''
    this.currentInterimText = ''
    this.autoRestartAllowed = true
    this.isListening = true

    this.clearSilenceTimer()
    this.clearMaxListeningTimer()

    // 25 second safety timeout for idle listening
    this.maxListeningTimer = setTimeout(() => {
      if (this.isListening) {
        const text = this.getFullTranscript()
        if (text) {
          this.finishAndSubmit()
        } else {
          this.stopListening()
          this.callbacks.onEnd?.()
        }
      }
    }, 25000)

    if (!this.recognition) {
      this.initRecognition()
    }

    if (!this.recognition) {
      callbacks.onError?.('Speech recognition is not available in this browser. Try Chrome or Edge.')
      return
    }

    try {
      this.recognition.lang = this.targetLanguage
      this.recognition.start()
    } catch {
      // Already running or starting; safely handled
    }
  }

  public stopListening(): void {
    this.autoRestartAllowed = false
    this.isListening = false
    this.clearSilenceTimer()
    this.clearMaxListeningTimer()
    try {
      this.recognition?.stop()
    } catch {
      // Ignored
    }
  }

  public abort(): void {
    this.autoRestartAllowed = false
    this.isListening = false
    this.clearSilenceTimer()
    this.clearMaxListeningTimer()
    this.accumulatedFinalText = ''
    this.currentInterimText = ''
    try {
      this.recognition?.abort()
    } catch {
      // Ignored
    }
  }

  public getListeningState(): boolean {
    return this.isListening
  }
}

export const globalSpeechRecognition = new SpeechRecognitionService()
