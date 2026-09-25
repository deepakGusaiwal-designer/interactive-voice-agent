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
  SendHorizontal,
  RotateCcw,
  ChevronDown,
  Check,
} from 'lucide-react'
import { VoiceStrands } from './VoiceStrands'
import { VoiceTranscript } from './VoiceTranscript'
import { VoiceStateIndicator } from './VoiceState'
import { ChaosTalkLogo } from './ChaosTalkLogo'
import MoltenMetal from './react-bits/MoltenMetal'
import { useVoiceAgent } from '../hooks/useVoiceAgent'
import { getLanguageLabel } from '../ai/personality'

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
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false)
  const langDropdownRef = useRef<HTMLDivElement>(null)

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

  // Dynamic Molten Metal atmospheric colors reactive to Voice Chaos state (Deep Cinematic Liquid Chrome Palette)
  const moltenConfig = useMemo(() => {
    switch (state) {
      case 'listening':
        return {
          color1: '#020b12',
          color2: '#064e3b', // Deep emerald metallic
          color3: '#06b6d4', // Electric cyan glint
          speed: 0.28,
        }
      case 'thinking':
        return {
          color1: '#0a0314',
          color2: '#3b0764', // Deep purple obsidian
          color3: '#a855f7', // Electric violet luster
          speed: 0.35,
        }
      case 'speaking':
        return {
          color1: '#0d0312',
          color2: '#701a75', // Midnight magenta chrome
          color3: '#ec4899', // Radiant pink highlight
          speed: 0.30,
        }
      case 'error':
        return {
          color1: '#120303',
          color2: '#7f1d1d', // Blood metal
          color3: '#ef4444', // Fiery crimson
          speed: 0.20,
        }
      case 'idle':
      default:
        return {
          color1: '#040711', // Deep space obsidian
          color2: '#1e1b4b', // Midnight metallic indigo
          color3: '#2563eb', // Electric royal azure chrome
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
          scale={3.5}
          detail={3}
          glow={1.4}
          coreSize={0.09}
          swirl={1.2}
          fold={-0.2}
          blackPoint={0.06}
          brightness={1.2}
          opacity={0.85}
          backgroundColor="#000000"
          mouseInteraction={true}
          mouseStrength={0.25}
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

      {/* Floating Bottom Input Dock: Ultra-Blurry Shiny Liquid Glass */}
      <footer className="voice-chaos-bottom-bar">
        <form
          className={`voice-input-dock ${
            isInputFocused ? 'is-focused' : ''
          } ${state === 'listening' ? 'is-listening' : ''} ${state === 'thinking' ? 'is-thinking' : ''}`}
          onSubmit={handleTextSubmit}
        >

          {/* Layer 2: Brilliant Travelling Laser Shimmer Flare */}
          <div className="voice-dock-shimmer-sweep" />

          {/* Layer 3: Top Edge Razor-Sharp Prismatic Light Reflection */}
          <div className="voice-dock-top-flare" />

          {/* Shiny Star Sparkle Indicator on Left */}
          <div className="voice-sparkle-pill" title="Chaos Talk AI">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="voice-sparkle-svg"
            >
              <defs>
                <linearGradient id="chaos-sparkle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="50%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>
              <path
                d="M12 2C12 7.52 7.52 12 2 12C7.52 12 12 16.48 12 22C12 16.48 16.48 12 22 12C16.48 12 12 7.52 12 2Z"
                fill="url(#chaos-sparkle-gradient)"
              />
              <path
                d="M19 2.5C19 4.43 17.43 6 15.5 6C17.43 6 19 7.57 19 9.5C19 7.57 20.57 6 22.5 6C20.57 6 19 4.43 19 2.5Z"
                fill="url(#chaos-sparkle-gradient)"
                opacity="0.9"
              />
            </svg>
          </div>

          {/* Clean Prompt Text Input */}
          <div className="voice-text-input-wrap">
            <input
              type="text"
              className="voice-text-input"
              placeholder={
                state === 'listening'
                  ? (userTranscript ? `Hearing: "${userTranscript}"` : 'Listening... speak now')
                  : state === 'thinking'
                  ? 'Chaos Talk is thinking...'
                  : 'Ask Chaos Talk or type here...'
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              disabled={state === 'thinking'}
            />
          </div>

          {/* Action Cluster: Mic / Live Button + Send Button */}
          <div className="voice-action-group">
            <button
              type="button"
              className={`voice-mic-pill-btn ${state === 'listening' ? 'is-listening' : ''}`}
              onClick={toggleInteraction}
              title={state === 'listening' ? 'Listening... click to send voice' : 'Use microphone / Talk'}
            >
              {state === 'listening' ? (
                <>
                  <div className="voice-live-equalizer" aria-hidden="true">
                    <span
                      className="equalizer-bar bar-1"
                      style={{ transform: `scaleY(${Math.max(0.4, 0.4 + audioLevel * 1.8)})` }}
                    />
                    <span
                      className="equalizer-bar bar-2"
                      style={{ transform: `scaleY(${Math.max(0.7, 0.6 + audioLevel * 2.2)})` }}
                    />
                    <span
                      className="equalizer-bar bar-3"
                      style={{ transform: `scaleY(${Math.max(0.9, 0.7 + audioLevel * 2.5)})` }}
                    />
                    <span
                      className="equalizer-bar bar-4"
                      style={{ transform: `scaleY(${Math.max(0.5, 0.5 + audioLevel * 1.8)})` }}
                    />
                  </div>
                  <span className="voice-live-tag">LIVE</span>
                </>
              ) : (
                <Mic size={18} />
              )}
            </button>

            <button
              type="submit"
              className={`voice-send-btn ${inputText.trim() ? 'is-active' : ''}`}
              disabled={!inputText.trim() || state === 'thinking'}
              title="Send message (Enter)"
            >
              <SendHorizontal size={17} />
            </button>
          </div>
        </form>
      </footer>
    </div>
  )
}
