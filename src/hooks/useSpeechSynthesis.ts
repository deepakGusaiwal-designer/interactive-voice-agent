import { useCallback, useEffect, useRef, useState } from 'react'

type Options = {
  lang?: string
  onStart?: () => void
  onEnd?: () => void
  onError?: () => void
}

export function useSpeechSynthesis() {
  const [speaking, setSpeaking] = useState(false)
  const optionsRef = useRef<Options>({})

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [])

  const speak = useCallback((text: string, options: Options = {}) => {
    if (!('speechSynthesis' in window)) {
      options.onError?.()
      return null
    }

    window.speechSynthesis.cancel()
    optionsRef.current = options

    const utterance = new SpeechSynthesisUtterance(text)
    const targetLang = options.lang || navigator.language || 'en-US'
    utterance.lang = targetLang
    utterance.rate = 0.98
    utterance.pitch = 1.0
    utterance.volume = 1.0

    const voices = window.speechSynthesis.getVoices()
    const langPrefix = targetLang.split('-')[0].toLowerCase()

    // Find voice matching the target language
    const langVoices = voices.filter((v) =>
      v.lang.toLowerCase().startsWith(langPrefix),
    )

    let selectedVoice: SpeechSynthesisVoice | undefined =
      langVoices.find((v) =>
        /Google|Microsoft|Natural|Enhanced|Samantha|Daniel/i.test(v.name),
      ) || langVoices[0]

    // Fallback to preferred English voice if no language-specific voice was found
    if (!selectedVoice) {
      selectedVoice = voices.find((v) =>
        /Google|Microsoft|Samantha|Daniel|Karen/i.test(v.name),
      )
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice
    }

    utterance.onstart = () => {
      setSpeaking(true)
      optionsRef.current.onStart?.()
    }

    utterance.onend = () => {
      setSpeaking(false)
      optionsRef.current.onEnd?.()
    }

    utterance.onerror = () => {
      setSpeaking(false)
      optionsRef.current.onError?.()
    }

    window.speechSynthesis.speak(utterance)

    return utterance
  }, [])

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel()
    setSpeaking(false)
  }, [])

  return { speak, cancel, speaking }
}