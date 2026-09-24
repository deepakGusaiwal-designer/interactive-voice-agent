/**
 * CHAOS TALK - Apple Liquid Glass Chat History & Live Transcript
 * 
 * Multi-turn scrollable conversation block featuring Apple's liquid glassmorphic
 * specular cards, fluid light refractions, and real-time interim speech.
 */

import React, { useEffect, useRef, useState } from 'react'
import { User, Sparkles, ArrowDown } from 'lucide-react'
import type { VoiceState } from './VoiceState'
import type { ChatMessage } from '../hooks/useVoiceAgent'
import LatticeLoader from './react-bits/LatticeLoader'

const CHAOS_WORDS = [
  'Synthesizing Chaos',
  'Channeling Chaos',
  'Brewing Chaos',
  'Weaving Chaos',
  'Igniting Chaos',
  'Entropy Influx',
  'Distorting Reality',
]

interface VoiceTranscriptProps {
  state: VoiceState
  userTranscript: string
  aiTranscript: string
  chatHistory: ChatMessage[]
}

function formatTime(date: Date): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date)
  } catch {
    return ''
  }
}

export const VoiceTranscript: React.FC<VoiceTranscriptProps> = ({
  state,
  userTranscript,
  aiTranscript,
  chatHistory,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const bottomAnchorRef = useRef<HTMLDivElement>(null)
  const [chaosWord, setChaosWord] = useState('Synthesizing Chaos')
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)

  // Pick a fresh chaos word whenever the agent starts formulating a response
  useEffect(() => {
    if (state === 'thinking') {
      const chosen = CHAOS_WORDS[Math.floor(Math.random() * CHAOS_WORDS.length)]
      setChaosWord(chosen)
    }
  }, [state])

  // Track scroll position to show/hide "Scroll to bottom" button
  const handleScroll = () => {
    const el = scrollContainerRef.current
    if (!el) return
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    setAutoScroll(isAtBottom)
    setShowScrollBottomBtn(!isAtBottom && (chatHistory.length > 2 || el.scrollHeight > el.clientHeight + 80))
  }

  const scrollToBottom = () => {
    bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth' })
    setAutoScroll(true)
    setShowScrollBottomBtn(false)
  }

  // Auto-scroll when new messages arrive or state updates if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && bottomAnchorRef.current) {
      bottomAnchorRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatHistory, userTranscript, aiTranscript, state, autoScroll])

  // If nothing has been said yet and state is idle, render nothing
  const hasContent = chatHistory.length > 0 || Boolean(userTranscript) || state === 'thinking' || Boolean(aiTranscript)
  if (!hasContent && state === 'idle') {
    return null
  }

  return (
    <div className="voice-chat-history-block">
      <div
        ref={scrollContainerRef}
        className="voice-transcript-wrapper"
        onScroll={handleScroll}
        tabIndex={0}
        role="log"
        aria-label="Chat History"
      >
        {/* Render all past committed conversation messages in Apple Liquid Glass */}
        {chatHistory.map((msg, index) => {
          const isLatest = index === chatHistory.length - 1
          const isAiSpeaking = isLatest && msg.role === 'assistant' && state === 'speaking'
          const timeStr = formatTime(msg.timestamp)

          if (msg.role === 'user') {
            return (
              <div
                key={msg.id}
                className="voice-transcript-line is-user apple-liquid-glass"
              >
                <div className="transcript-header-row">
                  <span className="transcript-speaker">
                    <User size={11} className="transcript-speaker-icon" />
                    <span>YOU</span>
                  </span>
                  {timeStr && <span className="transcript-timestamp">{timeStr}</span>}
                </div>
                <p className="transcript-content">"{msg.text}"</p>
              </div>
            )
          }

          return (
            <div
              key={msg.id}
              className={`voice-transcript-line is-ai apple-liquid-glass ${isAiSpeaking ? 'is-speaking is-active' : ''}`}
            >
              <div className="transcript-header-row">
                <span className="transcript-speaker">
                  <Sparkles size={11} className="transcript-speaker-icon" />
                  <span>CHAOS TALK</span>
                </span>
                {timeStr && <span className="transcript-timestamp">{timeStr}</span>}
              </div>
              <p className="transcript-content">{msg.text}</p>
            </div>
          )
        })}

        {/* Live Active User Speech (Uncommitted Interim Stream) */}
        {userTranscript && state === 'listening' && (
          <div className="voice-transcript-line is-user apple-liquid-glass is-live-stream is-active">
            <div className="transcript-header-row">
              <span className="transcript-speaker is-live">
                <span className="live-stream-pulse" />
                <span>HEARING YOU...</span>
              </span>
            </div>
            <p className="transcript-content">"{userTranscript}"</p>
          </div>
        )}

        {/* Live Active Thinking Card */}
        {state === 'thinking' && (
          <div className="voice-transcript-line is-ai apple-liquid-glass is-thinking">
            <div className="transcript-header-row">
              <span className="transcript-speaker">
                <Sparkles size={11} className="transcript-speaker-icon" />
                <span>CHAOS TALK</span>
              </span>
            </div>
            <div className="transcript-thinking-container">
              <LatticeLoader
                label={chaosWord}
                status="working"
                pattern="orbit"
                grid={3}
                shape="round"
                color="#c084fc"
                glow
                glowColor="#a855f7"
                cellSize={6}
                gap={2.5}
                fontSize={13.5}
                step={90}
                showTimer={true}
              />
            </div>
          </div>
        )}

        {/* Invisible anchor for smooth scrolling */}
        <div ref={bottomAnchorRef} className="transcript-bottom-anchor" />
      </div>

      {/* Floating Jump-to-Bottom Apple Glass Pill */}
      {showScrollBottomBtn && (
        <button
          type="button"
          className="scroll-to-bottom-pill"
          onClick={scrollToBottom}
          title="Scroll to latest messages"
        >
          <ArrowDown size={11} />
          <span>New messages</span>
        </button>
      )}
    </div>
  )
}

export default VoiceTranscript
