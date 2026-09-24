/**
 * VOICE CHAOS - Minimal Atmospheric State Label
 * 
 * Displays the subtle "TAP TO TALK" prompt initially, fading out into
 * ethereal status hints (LISTENING, THINKING, SPEAKING) as needed.
 */

import React from 'react'
import { AlertCircle, Mic, AudioWaveform, Sparkles, Volume2 } from 'lucide-react'
export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'

interface VoiceStateProps {
  state: VoiceState
  hasInteracted: boolean
  errorMessage?: string
}

export const VoiceStateIndicator: React.FC<VoiceStateProps> = ({
  state,
  hasInteracted,
  errorMessage,
}) => {
  if (errorMessage) {
    return (
      <div className="voice-state-container is-error">
        <AlertCircle size={12} className="voice-state-icon" />
        <span className="voice-state-text">{errorMessage}</span>
      </div>
    )
  }

  if (!hasInteracted) {
    return (
      <div className="voice-state-container is-prompt">
        <Mic size={11} className="voice-state-icon pulse-text" />
        <span className="voice-state-text pulse-text">TAP TO TALK</span>
      </div>
    )
  }

  // Active state feedback
  let icon = null
  let label = ''
  switch (state) {
    case 'listening':
      icon = <AudioWaveform size={12} className="voice-state-icon is-listening" />
      label = 'LISTENING'
      break
    case 'thinking':
      icon = <Sparkles size={12} className="voice-state-icon is-thinking" />
      label = 'SYNTHESIZING CHAOS'
      break
    case 'speaking':
      icon = <Volume2 size={12} className="voice-state-icon is-speaking" />
      label = 'SPEAKING'
      break
    case 'error':
      icon = <AlertCircle size={12} className="voice-state-icon is-error" />
      label = 'ERROR'
      break
    default:
      label = ''
  }

  if (!label) return null

  return (
    <div className={`voice-state-container is-${state}`}>
      {icon}
      <span className="voice-state-text">{label}</span>
    </div>
  )
}
