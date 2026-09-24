/**
 * VOICE CHAOS - Official React Bits Strands Audio-Reactive Wave Design
 * 
 * Powered by React Bits (OGL WebGL Strands component) with calm,
 * elegant ribbons, controlled height, and smooth organic vocal reactivity.
 */

import React, { useMemo } from 'react'
import Strands from './react-bits/Strands'
import type { VoiceState } from './VoiceState'

export interface VoiceStrandsProps {
  state: VoiceState
  audioLevel: number // 0 to 1
  onClick: () => void
  glass?: boolean
}

export const VoiceStrands: React.FC<VoiceStrandsProps> = ({
  state,
  audioLevel,
  onClick,
  glass = false,
}) => {
  // Dynamically map voice agent state and real-time audioLevel into refined, elegant parameters
  const { colors, count, speed, amplitude, waviness, thickness, glow, intensity, saturation, scale, taper } =
    useMemo(() => {
      switch (state) {
        case 'listening':
          return {
            colors: ['#06B6D4', '#10B981', '#3B82F6', '#67E8F9'],
            count: 5,
            speed: 0.28 + audioLevel * 0.16,
            amplitude: 0.13 + audioLevel * 0.13,
            waviness: 0.85 + audioLevel * 0.25,
            thickness: 0.28 + audioLevel * 0.08,
            glow: 1.55 + audioLevel * 0.25,
            intensity: 0.5 + audioLevel * 0.18,
            saturation: 1.6,
            scale: 1.05,
            taper: 4.2,
          }

        case 'thinking':
          return {
            colors: ['#A855F7', '#6366F1', '#EC4899', '#C084FC'],
            count: 4,
            speed: 0.40,
            amplitude: 0.15,
            waviness: 1.1,
            thickness: 0.30,
            glow: 1.65,
            intensity: 0.58,
            saturation: 1.6,
            scale: 1.05,
            taper: 4.0,
          }

        case 'speaking':
          return {
            colors: ['#EC4899', '#8B5CF6', '#06B6D4', '#F43F5E'],
            count: 5,
            speed: 0.30 + audioLevel * 0.16,
            amplitude: 0.14 + audioLevel * 0.14,
            waviness: 0.9 + audioLevel * 0.25,
            thickness: 0.28 + audioLevel * 0.08,
            glow: 1.60 + audioLevel * 0.25,
            intensity: 0.55 + audioLevel * 0.18,
            saturation: 1.6,
            scale: 1.05,
            taper: 4.2,
          }

        case 'error':
          return {
            colors: ['#EF4444', '#DC2626', '#991B1B', '#F87171'],
            count: 3,
            speed: 0.2,
            amplitude: 0.11,
            waviness: 0.7,
            thickness: 0.24,
            glow: 1.5,
            intensity: 0.45,
            saturation: 1.5,
            scale: 0.95,
            taper: 4.0,
          }

        case 'idle':
        default:
          return {
            colors: ['#8B5CF6', '#EC4899', '#06B6D4', '#3B82F6'],
            count: 4,
            speed: 0.22,
            amplitude: 0.11,
            waviness: 0.8,
            thickness: 0.25,
            glow: 1.5,
            intensity: 0.48,
            saturation: 1.5,
            scale: 1.05,
            taper: 4.2,
          }
      }
    }, [state, audioLevel])

  return (
    <div
      className={`voice-strands-stage is-${state}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label="Interactive React Bits Strands Voice Wave"
      title="Tap to talk / interrupt"
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
      <Strands
        colors={colors}
        count={count}
        speed={speed}
        amplitude={amplitude}
        waviness={waviness}
        thickness={thickness}
        glow={glow}
        intensity={intensity}
        saturation={saturation}
        scale={scale}
        taper={taper}
        glass={glass}
        opacity={1}
      />
    </div>
  )
}
