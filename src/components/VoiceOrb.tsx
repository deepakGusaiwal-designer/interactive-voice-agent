/**
 * VOICE CHAOS - Official React Bits Orb Audio-Reactive 3D Design
 * 
 * Powered by React Bits (OGL WebGL Orb component with Simplex 3D noise)
 * with real-time vocal amplitude, turbulence, and hue modulation across all voice states.
 */

import React, { useMemo } from 'react'
import Orb from './react-bits/Orb'

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'

export interface VoiceOrbProps {
  state: VoiceState
  audioLevel: number // 0 to 1
  onClick: () => void
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({ state, audioLevel, onClick }) => {
  // Map voice agent state and real-time audioLevel to React Bits Orb shader uniforms
  const { hue, hoverIntensity, forceHoverState, rotateOnHover } = useMemo(() => {
    switch (state) {
      case 'listening':
        return {
          hue: 165, // Emerald / Cyan active wave
          hoverIntensity: 0.28 + audioLevel * 0.45, // Gentle organic ripple
          forceHoverState: true,
          rotateOnHover: true,
        }

      case 'thinking':
        return {
          hue: 275, // Deep Violet / Indigo
          hoverIntensity: 0.50, // Subtle cognitive rotation
          forceHoverState: true,
          rotateOnHover: true,
        }

      case 'speaking':
        return {
          hue: 45, // Radiant Gold / Amber / Violet
          hoverIntensity: 0.32 + audioLevel * 0.45, // Smooth pulse synced to speech
          forceHoverState: true,
          rotateOnHover: true,
        }

      case 'error':
        return {
          hue: 345, // Crimson Red
          hoverIntensity: 0.3,
          forceHoverState: false,
          rotateOnHover: false,
        }

      case 'idle':
      default:
        return {
          hue: 0, // Electric Violet / Cyan (React Bits standard)
          hoverIntensity: 0.18,
          forceHoverState: false,
          rotateOnHover: true,
        }
    }
  }, [state, audioLevel])

  return (
    <div
      className={`voice-orb-stage is-${state}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label="Interactive React Bits Orb Voice Waveform - Tap to talk or interrupt"
      title="Tap to talk or interrupt"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <Orb
        hue={hue}
        hoverIntensity={hoverIntensity}
        forceHoverState={forceHoverState}
        rotateOnHover={rotateOnHover}
        backgroundColor="#030206"
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  )
}