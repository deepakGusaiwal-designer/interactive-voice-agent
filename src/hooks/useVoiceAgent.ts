/**
 * VOICE CHAOS - Master Agent Hook
 * 
 * Orchestrates Speech Recognition, AI Personality Engine, Speech Synthesis,
 * AudioManager, live transcript tracking, seamless Interruption handling,
 * and text input fallback.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { globalAIEngine, AIEngine } from '../ai/aiEngine'
import { globalAudioManager, AudioManager } from '../audio/audioManager'
import {
  globalSpeechRecognition,
  SpeechRecognitionService,
  getDefaultRecognitionLanguage,
} from '../voice/speechRecognition'
import { globalSpeechSynthesis, SpeechSynthesisService } from '../voice/speechSynthesis'
import { detectLanguage } from '../ai/personality'
import type { VoiceState } from '../components/VoiceState'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: Date
}

export interface VoiceAgentHook {
  state: VoiceState
  audioLevel: number
  hasInteracted: boolean
  userTranscript: string
  aiTranscript: string
  chatHistory: ChatMessage[]
  clearChatHistory: () => void
  errorMessage?: string
  toggleInteraction: () => void
  resetAgent: () => void
  stopAgent: () => void
  voiceMode: 'fast' | 'studio'
  setVoiceMode: (mode: 'fast' | 'studio') => void
  sendTextMessage: (text: string) => void
  selectedLanguage: string
  setLanguage: (lang: string) => void
  isAutoMode: boolean
  setIsAutoMode: (auto: boolean) => void
}

export function useVoiceAgent(
  aiEngine: AIEngine = globalAIEngine,
  audioManager: AudioManager = globalAudioManager,
  recognition: SpeechRecognitionService = globalSpeechRecognition,
  synthesis: SpeechSynthesisService = globalSpeechSynthesis,
): VoiceAgentHook {
  const [state, setState] = useState<VoiceState>('idle')
  const [hasInteracted, setHasInteracted] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [userTranscript, setUserTranscript] = useState('')
  const [aiTranscript, setAiTranscript] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [voiceMode, setVoiceMode] = useState<'fast' | 'studio'>('fast')
  const [selectedLanguage, setSelectedLanguageState] = useState<string>(() => {
    return getDefaultRecognitionLanguage()
  })
  const [isAutoMode, setIsAutoModeState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('VOICE_CHAOS_AUTO_MODE')
      if (saved !== null) return saved === 'true'
    }
    return true
  })

  const stateRef = useRef<VoiceState>('idle')
  stateRef.current = state

  const voiceModeRef = useRef<'fast' | 'studio'>('fast')
  voiceModeRef.current = voiceMode

  const isAutoModeRef = useRef<boolean>(isAutoMode)
  isAutoModeRef.current = isAutoMode

  const selectedLanguageRef = useRef<string>(selectedLanguage)
  selectedLanguageRef.current = selectedLanguage

  const setLanguage = useCallback((lang: string) => {
    setSelectedLanguageState(lang)
    recognition.setLanguage(lang)
    try {
      localStorage.setItem('VOICE_CHAOS_LANGUAGE', lang)
    } catch {
      // Ignore
    }
  }, [recognition])

  const setIsAutoMode = useCallback((auto: boolean) => {
    setIsAutoModeState(auto)
    try {
      localStorage.setItem('VOICE_CHAOS_AUTO_MODE', String(auto))
    } catch {
      // Ignore
    }
  }, [])

  // Process user speech/text through the AI Personality Engine and speak out
  const handleUserUtterance = useCallback(
    async (spokenText: string) => {
      const clean = spokenText.trim()
      if (!clean) {
        setState('idle')
        audioManager.stopListening()
        return
      }

      let activeLang = selectedLanguageRef.current

      // In auto mode, detect language of utterance dynamically
      if (isAutoModeRef.current) {
        const detected = detectLanguage(clean)
        activeLang = detected.lang
        setSelectedLanguageState(detected.lang)
        recognition.setLanguage(detected.lang)
      }

      // Commit user utterance to chat history
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: 'user',
        text: clean,
        timestamp: new Date(),
      }
      setChatHistory((prev) => [...prev, userMsg])
      setUserTranscript('')
      setAiTranscript('')
      setState('thinking')
      audioManager.stopListening()

      try {
        const response = await aiEngine.respond(clean)
        const replyText = typeof response === 'string' ? response : response.text
        let replyLang = typeof response === 'object' && response.lang ? response.lang : activeLang

        // If in auto mode, check generated AI response too
        if (isAutoModeRef.current) {
          const respDetected = detectLanguage(replyText)
          if (respDetected.langCode !== 'en') {
            replyLang = respDetected.lang
          }
          setSelectedLanguageState(replyLang)
          recognition.setLanguage(replyLang)
        }

        // Commit AI response to chat history
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          role: 'assistant',
          text: replyText,
          timestamp: new Date(),
        }
        setChatHistory((prev) => [...prev, aiMsg])

        // Switch to speaking state
        setAiTranscript(replyText)
        setState('speaking')
        audioManager.setSpeaking(true, voiceModeRef.current === 'fast')

        synthesis.speak(replyText, {
          lang: replyLang,
          mode: voiceModeRef.current,
          onStart: () => {
            setState('speaking')
            audioManager.setSpeaking(true, voiceModeRef.current === 'fast')
          },
          onEnd: () => {
            audioManager.setSpeaking(false)
            setState('idle')
          },
          onError: () => {
            audioManager.setSpeaking(false)
            setState('idle')
          },
        })
      } catch (err: unknown) {
        audioManager.setSpeaking(false)
        setState('error')
        setErrorMessage('My cognitive pathways suffered a minor glitch. Tap to try again.')
      }
    },
    [aiEngine, audioManager, recognition, synthesis],
  )

  // Start listening to the microphone
  const startListeningSession = useCallback(async () => {
    setErrorMessage(undefined)
    setHasInteracted(true)

    // If currently speaking, interrupt it immediately!
    if (synthesis.getSpeakingState()) {
      synthesis.cancel()
      audioManager.setSpeaking(false)
    }

    try {
      await audioManager.startListening()
      setState('listening')

      recognition.startListening({
        onStart: () => {
          setState('listening')
        },
        onResult: (currentText) => {
          setUserTranscript(currentText)
          // Live auto-detection while speaking: update indicator & recognizer if language pattern recognized
          if (isAutoModeRef.current && currentText.trim().length >= 3) {
            const liveDetected = detectLanguage(currentText)
            if (liveDetected.langCode !== 'en' && liveDetected.lang !== selectedLanguageRef.current) {
              setSelectedLanguageState(liveDetected.lang)
              recognition.setLanguage(liveDetected.lang)
            }
          }
        },
        onSpeechFinal: (finalText) => {
          handleUserUtterance(finalText)
        },
        onInterruptionDetected: () => {
          // If user starts speaking while AI is speaking, interrupt immediately
          if (stateRef.current === 'speaking' || synthesis.getSpeakingState()) {
            synthesis.cancel()
            audioManager.setSpeaking(false)
            setState('listening')
          }
        },
        onError: (errMessage) => {
          audioManager.stopListening()
          setState('error')
          setErrorMessage(errMessage)
        },
        onEnd: () => {
          if (stateRef.current === 'listening') {
            audioManager.stopListening()
            setState('idle')
          }
        },
      })
    } catch (err: unknown) {
      const errObj = err as Error
      setState('error')
      setErrorMessage(errObj.message || 'Your microphone is shy. Give it permission.')
    }
  }, [audioManager, handleUserUtterance, recognition, synthesis])

  // Tap-to-Talk / Waveform Click handler
  const toggleInteraction = useCallback(() => {
    // 1. If speaking: Interrupt and listen immediately
    if (state === 'speaking') {
      synthesis.cancel()
      audioManager.setSpeaking(false)
      startListeningSession()
      return
    }

    // 2. If listening: Stop listening and process what was heard
    if (state === 'listening') {
      recognition.finishAndSubmit()
      return
    }

    // 3. If thinking: Ignore clicks to avoid race conditions
    if (state === 'thinking') {
      return
    }

    // 4. If idle or error: Start listening
    startListeningSession()
  }, [audioManager, recognition, startListeningSession, state, synthesis])

  // Direct text input fallback
  const sendTextMessage = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    setHasInteracted(true)
    synthesis.cancel()
    audioManager.setSpeaking(false)
    recognition.stopListening()

    handleUserUtterance(trimmed)
  }, [audioManager, handleUserUtterance, recognition, synthesis])

  const resetAgent = useCallback(() => {
    synthesis.cancel()
    recognition.abort()
    audioManager.stopListening()
    audioManager.setSpeaking(false)
    aiEngine.resetSession()
    setState('idle')
    setUserTranscript('')
    setAiTranscript('')
    setChatHistory([])
    setErrorMessage(undefined)
  }, [aiEngine, audioManager, recognition, synthesis])

  const clearChatHistory = useCallback(() => {
    setChatHistory([])
    setUserTranscript('')
    setAiTranscript('')
  }, [])

  const stopAgent = useCallback(() => {
    synthesis.cancel()
    recognition.abort()
    audioManager.stopListening()
    audioManager.setSpeaking(false)
    setState('idle')
  }, [audioManager, recognition, synthesis])

  // Global keyboard shortcut: Escape stops agent immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopAgent()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [stopAgent])

  // Real-time audio meter animation loop
  useEffect(() => {
    let animId: number
    let startTime = performance.now()

    const updateMeter = () => {
      animId = requestAnimationFrame(updateMeter)
      const elapsed = (performance.now() - startTime) / 1000
      const metrics = audioManager.getAudioMetrics(elapsed)
      setAudioLevel(metrics.smoothLevel)
    }

    animId = requestAnimationFrame(updateMeter)

    return () => {
      cancelAnimationFrame(animId)
    }
  }, [audioManager])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      synthesis.cancel()
      recognition.abort()
      audioManager.stopListening()
      audioManager.setSpeaking(false)
    }
  }, [audioManager, recognition, synthesis])

  return {
    state,
    audioLevel,
    hasInteracted,
    userTranscript,
    aiTranscript,
    chatHistory,
    clearChatHistory,
    errorMessage,
    toggleInteraction,
    resetAgent,
    stopAgent,
    voiceMode,
    setVoiceMode,
    sendTextMessage,
    selectedLanguage,
    setLanguage,
    isAutoMode,
    setIsAutoMode,
  }
}
