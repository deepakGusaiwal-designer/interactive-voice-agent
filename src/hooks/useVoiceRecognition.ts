import { useCallback, useEffect, useRef, useState } from 'react'
import type { Recognition } from '../voice/speechRecognition'

export type VoiceRecognitionOptions = {
  onSpeechEnd?: (finalTranscript: string) => void
}

export function useVoiceRecognition(options: VoiceRecognitionOptions = {}) {
  const recognitionRef = useRef<Recognition | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const latestTranscriptRef = useRef('')
  const optionsRef = useRef(options)

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const RecognitionClass =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : undefined

  const isSupported = Boolean(RecognitionClass)

  useEffect(() => {
    if (!RecognitionClass) return

    const recognition = new RecognitionClass()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = navigator.language || 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event) => {
      let finalText = ''
      let interimText = ''

      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i]
        const text = result[0]?.transcript ?? ''

        if (result.isFinal) finalText += text
        else interimText += text
      }

      const combined = (finalText || interimText).trim()
      latestTranscriptRef.current = combined
      setTranscript(combined)
    }

    recognition.onend = () => {
      setIsListening(false)
      const spokenText = latestTranscriptRef.current.trim()
      if (spokenText) {
        latestTranscriptRef.current = ''
        optionsRef.current.onSpeechEnd?.(spokenText)
      }
    }

    recognition.onerror = (e) => {
      setIsListening(false)
      console.warn('SpeechRecognition error:', e.error)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
      recognitionRef.current = null
    }
  }, [RecognitionClass])

  const start = useCallback(() => {
    latestTranscriptRef.current = ''
    setTranscript('')

    try {
      recognitionRef.current?.start()
    } catch {
      // Browser throws if start() is called while already active.
    }
  }, [])

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop()
    } catch {
      // ignore if already stopped
    }
  }, [])

  return {
    isSupported,
    isListening,
    transcript,
    start,
    stop,
  }
}