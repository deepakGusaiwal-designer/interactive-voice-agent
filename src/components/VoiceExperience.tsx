/**
 * VOICE CHAOS - Core Experience Component
 * 
 * Minimalist, full-screen, atmospheric viewport with cleanly separated
 * upper visualizer zone (Waves/Orb) and lower chat transcript zone,
 * ensuring text messages and the visualizer NEVER overlap.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  Sparkles,
  Globe,
  Zap,
  Headphones,
  Square,
  Mic,
  AudioWaveform,
  SendHorizontal,
  RotateCcw,
  Keyboard,
  ChevronDown,
  Check,
  Key,
  X,
  ExternalLink,
} from 'lucide-react'
import { VoiceStrands } from './VoiceStrands'
import { VoiceTranscript } from './VoiceTranscript'
import { VoiceStateIndicator } from './VoiceState'
import { ChaosTalkLogo } from './ChaosTalkLogo'
import MoltenMetal from './react-bits/MoltenMetal'
import { useVoiceAgent } from '../hooks/useVoiceAgent'
import { getLanguageLabel } from '../ai/personality'
import { globalGeminiAIEngine } from '../ai/geminiEngine'

export const VoiceExperience: React.FC = () => {
  const {
    state,
    audioLevel,
    hasInteracted,
    userTranscript,
    aiTranscript,
    errorMessage,
    toggleInteraction,
    stopAgent,
    resetAgent,
    voiceMode,
    setVoiceMode,
    sendTextMessage,
    selectedLanguage,
    setLanguage,
    isAutoMode,
    setIsAutoMode,
    chatHistory,
  } = useVoiceAgent()

  const [inputText, setInputText] = useState('')
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false)
  const langDropdownRef = useRef<HTMLDivElement>(null)
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false)
  const [customKeyInput, setCustomKeyInput] = useState(() => globalGeminiAIEngine.getApiKey())
  const hasCustomKey = Boolean(customKeyInput && customKeyInput.length > 5)

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setIsLangDropdownOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLangDropdownOpen(false)
      }
    }
    if (isLangDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isLangDropdownOpen])

  const hasChat = Boolean(chatHistory.length > 0 || userTranscript || aiTranscript || state === 'thinking' || state === 'speaking')

  // Dynamic Molten Metal atmospheric colors reactive to Voice Chaos state (Deep Dark Obsidian Palette)
  const moltenConfig = useMemo(() => {
    switch (state) {
      case 'listening':
        return {
          color1: '#000000',
          color2: '#021818', // Deep shadowy teal
          color3: '#083838', // Dark stealth cyan
          speed: 0.24,
        }
      case 'thinking':
        return {
          color1: '#000000',
          color2: '#120422', // Dark obsidian purple
          color3: '#24083d', // Stealth deep violet
          speed: 0.32,
        }
      case 'speaking':
        return {
          color1: '#000000',
          color2: '#0d041c', // Dark midnight indigo
          color3: '#1c0836', // Stealth amethyst
          speed: 0.26,
        }
      case 'error':
        return {
          color1: '#000000',
          color2: '#1a0303', // Shadow wine
          color3: '#300808', // Deep dark crimson
          speed: 0.18,
        }
      case 'idle':
      default:
        return {
          color1: '#000000', // Pure OLED black
          color2: '#07080d', // Midnight graphite
          color3: '#131520', // Stealth dark carbon
          speed: 0.18,
        }
    }
  }, [state])

  const handleTextSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputText.trim()) return
    sendTextMessage(inputText)
    setInputText('')
  }

  return (
    <div className="voice-chaos-viewport">
      {/* Dynamic Molten Metal Atmospheric Background - Subtle Stealth Liquid Chrome */}
      <div className="voice-chaos-molten-bg" aria-hidden="true">
        <MoltenMetal
          color1={moltenConfig.color1}
          color2={moltenConfig.color2}
          color3={moltenConfig.color3}
          speed={moltenConfig.speed}
          scale={3.8}
          detail={3}
          glow={0.35}
          coreSize={0.06}
          swirl={1.0}
          fold={-0.2}
          blackPoint={0.24}
          brightness={0.38}
          opacity={0.22}
          backgroundColor="#000000"
          mouseInteraction={true}
          mouseStrength={0.2}
        />
      </div>

      {/* Subtle ambient deep glow */}
      <div className={`voice-chaos-ambient is-${state} ${hasChat ? 'has-chat' : 'is-empty'}`} />

      {/* Main Screen: Cleanly separated Visualizer Zone & Chat Zone (No Overlap) */}
      <main className={`voice-chaos-stage ${hasChat ? 'has-chat' : 'is-empty'}`}>
        {/* UPPER/CENTER ZONE: Dedicated Strands Visualizer Canvas */}
        <section className={`voice-visualizer-zone ${hasChat ? 'has-chat' : 'is-empty'}`}>
          <div className="voice-visualizer-canvas-container">
            <VoiceStrands
              state={state}
              audioLevel={audioLevel}
              onClick={toggleInteraction}
            />
          </div>

          {/* Atmospheric status indicator ("TAP TO TALK" or status dot) positioned neatly under the visualizer */}
          <VoiceStateIndicator
            state={state}
            hasInteracted={hasInteracted}
            errorMessage={errorMessage}
          />
        </section>

        {/* LOWER ZONE: Dedicated Chat / Conversation Stream (Strictly below the visualizer) */}
        <section className={`voice-conversation-zone ${hasChat ? 'has-chat' : 'is-empty'}`}>
          {/* Prominent Floating Stop Option */}
          {state !== 'idle' && (
            <div className="voice-stop-pill-container">
              <button
                type="button"
                className="voice-chaos-stop-btn"
                onClick={stopAgent}
                title="Stop audio & reset (or press Esc)"
              >
                <Square size={9} fill="currentColor" className="stop-square" />
                <span>STOP</span>
              </button>
            </div>
          )}

          {/* Live Spoken Transcripts & Chat History */}
          <VoiceTranscript
            state={state}
            userTranscript={userTranscript}
            aiTranscript={aiTranscript}
            chatHistory={chatHistory}
          />
        </section>
      </main>

      {/* Minimal Header Controls: AI Engine Indicator & Controls */}
      <header className="voice-chaos-topbar">
        <div className="topbar-left-group">
          <div className="chaos-talk-header-badge" title="CHAOS TALK Interactive AI">
            <ChaosTalkLogo size="sm" />
          </div>

          <div className="ai-engine-badge" title="Pure Gemini AI Active">
            <Sparkles size={11} className="ai-badge-icon" />
            {/* <span className="ai-badge-text">PURE GEMINI AI</span> */}
          </div>
        </div>

        <div className="topbar-right-controls">
          {/* Quick Reset / New Chat Button when active conversation */}
          {hasChat && (
            <button
              type="button"
              className="voice-reset-topbar-btn"
              onClick={resetAgent}
              title="Reset conversation & return to center"
            >
              <RotateCcw size={11} />
              <span>Reset</span>
            </button>
          )}

          {/* Mobile-Optimized Language & Settings Dropdown */}
          <div className="voice-lang-dropdown-wrapper" ref={langDropdownRef}>
            <button
              type="button"
              className={`voice-lang-dropdown-btn ${isLangDropdownOpen ? 'is-active' : ''}`}
              onClick={() => setIsLangDropdownOpen((prev) => !prev)}
              aria-expanded={isLangDropdownOpen}
              aria-haspopup="true"
              title={`Speech Language (Active: ${getLanguageLabel(selectedLanguage)})`}
            >
              <Globe size={11} className="lang-pill-icon" />
              <span className="lang-pill-text">
                {isAutoMode
                  ? 'AUTO'
                  : selectedLanguage === 'hi-IN'
                  ? 'हिन्दी'
                  : 'EN'}
              </span>
              {isAutoMode && (
                <span className="lang-pill-sub">
                  {selectedLanguage.startsWith('hi') ? '• HI' : '• EN'}
                </span>
              )}
              <ChevronDown size={11} className={`lang-dropdown-chevron ${isLangDropdownOpen ? 'is-open' : ''}`} />
            </button>

            {isLangDropdownOpen && (
              <div className="voice-lang-dropdown-menu" role="menu">
                <div className="lang-dropdown-section-title">SPEECH RECOGNITION</div>

                <button
                  type="button"
                  className={`lang-dropdown-item ${isAutoMode ? 'is-selected' : ''}`}
                  onClick={() => {
                    setIsAutoMode(true)
                    setIsLangDropdownOpen(false)
                  }}
                  role="menuitem"
                >
                  <div className="lang-item-left">
                    <Globe size={13} className="lang-item-icon auto-icon" />
                    <div className="lang-item-text-group">
                      <span className="lang-item-name">Auto Detect</span>
                      <span className="lang-item-desc">Auto-switches Hindi & English</span>
                    </div>
                  </div>
                  {isAutoMode && <Check size={13} className="lang-item-check" />}
                </button>

                <button
                  type="button"
                  className={`lang-dropdown-item ${!isAutoMode && selectedLanguage === 'hi-IN' ? 'is-selected' : ''}`}
                  onClick={() => {
                    setIsAutoMode(false)
                    setLanguage('hi-IN')
                    setIsLangDropdownOpen(false)
                  }}
                  role="menuitem"
                >
                  <div className="lang-item-left">
                    <span className="lang-item-flag">🇮🇳</span>
                    <div className="lang-item-text-group">
                      <span className="lang-item-name">हिन्दी (Hindi)</span>
                      <span className="lang-item-desc">Force Hindi voice recognition</span>
                    </div>
                  </div>
                  {!isAutoMode && selectedLanguage === 'hi-IN' && (
                    <Check size={13} className="lang-item-check" />
                  )}
                </button>

                <button
                  type="button"
                  className={`lang-dropdown-item ${!isAutoMode && selectedLanguage.startsWith('en') ? 'is-selected' : ''}`}
                  onClick={() => {
                    setIsAutoMode(false)
                    setLanguage('en-US')
                    setIsLangDropdownOpen(false)
                  }}
                  role="menuitem"
                >
                  <div className="lang-item-left">
                    <span className="lang-item-flag">🇺🇸</span>
                    <div className="lang-item-text-group">
                      <span className="lang-item-name">English (US)</span>
                      <span className="lang-item-desc">Force English voice recognition</span>
                    </div>
                  </div>
                  {!isAutoMode && selectedLanguage.startsWith('en') && (
                    <Check size={13} className="lang-item-check" />
                  )}
                </button>

                <div className="lang-dropdown-divider" />

                <div className="lang-dropdown-section-title">AUDIO QUALITY</div>

                <button
                  type="button"
                  className={`lang-dropdown-item ${voiceMode === 'fast' ? 'is-selected' : ''}`}
                  onClick={() => {
                    setVoiceMode('fast')
                    setIsLangDropdownOpen(false)
                  }}
                  role="menuitem"
                >
                  <div className="lang-item-left">
                    <Zap size={13} className="lang-item-icon fast-icon" />
                    <div className="lang-item-text-group">
                      <span className="lang-item-name">Fast Voice (&lt;0.5s)</span>
                      <span className="lang-item-desc">Instant conversational audio</span>
                    </div>
                  </div>
                  {voiceMode === 'fast' && <Check size={13} className="lang-item-check" />}
                </button>

                <button
                  type="button"
                  className={`lang-dropdown-item ${voiceMode === 'studio' ? 'is-selected' : ''}`}
                  onClick={() => {
                    setVoiceMode('studio')
                    setIsLangDropdownOpen(false)
                  }}
                  role="menuitem"
                >
                  <div className="lang-item-left">
                    <Headphones size={13} className="lang-item-icon studio-icon" />
                    <div className="lang-item-text-group">
                      <span className="lang-item-name">Studio HD Voice</span>
                      <span className="lang-item-desc">Google 24kHz studio clarity</span>
                    </div>
                  </div>
                  {voiceMode === 'studio' && <Check size={13} className="lang-item-check" />}
                </button>

                <div className="lang-dropdown-divider" />

                <div className="lang-dropdown-section-title">AI ENGINE</div>

                <button
                  type="button"
                  className="lang-dropdown-item"
                  onClick={() => {
                    setIsLangDropdownOpen(false)
                    setIsKeyModalOpen(true)
                  }}
                  role="menuitem"
                >
                  <div className="lang-item-left">
                    <Key size={13} className="lang-item-icon key-icon" />
                    <div className="lang-item-text-group">
                      <span className="lang-item-name">Custom Gemini Key</span>
                      <span className="lang-item-desc">
                        {hasCustomKey ? 'Active (Saved in browser)' : 'Optional (Free Tier AI Active)'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown size={11} className="lang-dropdown-chevron" style={{ transform: 'rotate(-90deg)' }} />
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className={`voice-mode-toggle-btn ${voiceMode === 'fast' ? 'is-fast' : 'is-studio'}`}
            onClick={() => setVoiceMode(voiceMode === 'fast' ? 'studio' : 'fast')}
            title={
              voiceMode === 'fast'
                ? '⚡ Fast Voice (Instant <0.5s playback) — Click for Studio HD'
                : '🎙️ Studio HD Voice (Google 24kHz HD PCM) — Click for Fast'
            }
          >
            {voiceMode === 'fast' ? (
              <>
                <Zap size={11} fill="currentColor" />
                <span>Fast</span>
              </>
            ) : (
              <>
                <Headphones size={11} />
                <span>HD</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Optional Custom Gemini Key Modal (Apple Liquid Glass) */}
      {isKeyModalOpen && (
        <div className="apple-modal-overlay" onClick={() => setIsKeyModalOpen(false)}>
          <div className="apple-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="apple-modal-header">
              <div className="apple-modal-title-group">
                <Key size={15} className="key-icon" />
                <span className="apple-modal-title">Custom Gemini API Key</span>
              </div>
              <button
                type="button"
                className="apple-modal-close-btn"
                onClick={() => setIsKeyModalOpen(false)}
                title="Close"
              >
                <X size={14} />
              </button>
            </div>

            <p className="apple-modal-desc">
              Get an instant personal key from{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="apple-modal-link"
              >
                Google AI Studio <ExternalLink size={10} />
              </a>
              . Your key is stored securely in your browser's private local storage.
            </p>

            <div className="apple-modal-input-wrap">
              <input
                type="password"
                className="apple-modal-input"
                placeholder="Paste AIzaSy... key here"
                value={customKeyInput}
                onChange={(e) => setCustomKeyInput(e.target.value)}
              />
            </div>

            <div className="apple-modal-actions">
              {hasCustomKey && (
                <button
                  type="button"
                  className="apple-modal-btn is-clear"
                  onClick={() => {
                    setCustomKeyInput('')
                    globalGeminiAIEngine.setApiKey('')
                    setIsKeyModalOpen(false)
                  }}
                >
                  Remove Key
                </button>
              )}
              <button
                type="button"
                className="apple-modal-btn is-primary"
                onClick={() => {
                  globalGeminiAIEngine.setApiKey(customKeyInput)
                  setIsKeyModalOpen(false)
                }}
              >
                Save &amp; Use
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Input Dock: Dual Voice/Text input */}
      <footer className="voice-chaos-bottom-bar">
        <form className="voice-input-dock" onSubmit={handleTextSubmit}>
          <button
            type="button"
            className={`voice-mic-pill-btn ${state === 'listening' ? 'is-listening' : ''}`}
            onClick={toggleInteraction}
            title={state === 'listening' ? 'Click to submit voice' : 'Click to start speaking'}
          >
            {state === 'listening' ? (
              <>
                <AudioWaveform size={14} className="mic-wave-icon" />
                <span>LISTENING</span>
              </>
            ) : (
              <>
                <Mic size={13} />
                <span>TALK</span>
              </>
            )}
          </button>

          <div className="voice-text-input-wrap">
            <Keyboard size={13} className="voice-text-input-icon" />
            <input
              type="text"
              className="voice-text-input"
              placeholder={
                state === 'listening'
                  ? (userTranscript ? `Hearing: "${userTranscript}"` : 'Listening... speak now (or type here)')
                  : 'Type a message or tap TALK...'
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={state === 'thinking'}
            />
          </div>

          <button
            type="submit"
            className="voice-send-btn"
            disabled={!inputText.trim() || state === 'thinking'}
            title="Send text message (Enter)"
          >
            <SendHorizontal size={14} />
          </button>
        </form>
      </footer>
    </div>
  )
}
