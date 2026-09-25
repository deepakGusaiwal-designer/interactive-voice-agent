/**
 * CHAOS TALK - React Bits Particles Flow (ChatGPT Astra Style)
 * 
 * Powered by React Bits Particles WebGL OGL engine, providing an ethereal,
 * bioluminescent, audio-reactive particle field streaming across the bottom dock
 * and viewport (Project Astra / ChatGPT Advanced Voice aesthetic).
 */

import React, { useMemo } from 'react'
import type { VoiceState } from './VoiceState'
import { Particles } from './react-bits/Particles'

export interface AstraParticleFlowProps {
  state: VoiceState
  audioLevel?: number // 0 to 1
  className?: string
}

// React Bits hex palettes tailored for Chaos Talk voice agent states
const REACT_BITS_PALETTES: Record<VoiceState, string[]> = {
  idle: [
    '#38bdf8', // Neon Sky Blue
    '#818cf8', // Indigo Glow
    '#c084fc', // Soft Violet
    '#ffffff', // Starlight White
  ],
  listening: [
    '#22d3ee', // Electric Cyan
    '#34d399', // Mint Emerald
    '#10b981', // Neon Jade
    '#ffffff', // Pure White
  ],
  thinking: [
    '#c084fc', // Futuristic Purple
    '#f472b6', // Electric Fuchsia
    '#a855f7', // Vivid Violet
    '#818cf8', // Cosmic Indigo
  ],
  speaking: [
    '#38bdf8', // Cyan Stream
    '#c084fc', // Violet Aura
    '#ec4899', // Radiant Magenta
    '#ffffff', // Pure White Glint
  ],
  error: [
    '#f87171', // Red warning
    '#ef4444', // Crimson
    '#fb923c', // Amber
  ],
}

export const AstraParticleFlow: React.FC<AstraParticleFlowProps> = ({
  state,
  audioLevel = 0,
  className = '',
}) => {
  const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  const particleCount = useMemo(() => (isMobile ? 90 : 180), [isMobile])

  const colors = useMemo(() => {
    return REACT_BITS_PALETTES[state] || REACT_BITS_PALETTES.idle
  }, [state])

  // Modulate speed dynamically based on voice agent state and live mic volume
  const speed = useMemo(() => {
    switch (state) {
      case 'listening':
        return 0.14 + audioLevel * 0.22
      case 'thinking':
        return 0.22
      case 'speaking':
        return 0.18 + audioLevel * 0.3
      case 'error':
        return 0.25
      case 'idle':
      default:
        return 0.09
    }
  }, [state, audioLevel])

  return (
    <div
      className={`astra-bottom-particle-flow ${className || ''}`.trim()}
      aria-hidden="true"
    >
      <Particles
        particleCount={particleCount}
        particleColors={colors}
        particleSpread={11}
        speed={speed}
        particleBaseSize={85 + audioLevel * 30}
        sizeRandomness={1.35}
        cameraDistance={18}
        alphaParticles={true}
        moveParticlesOnHover={true}
        particleHoverFactor={1.6}
        className="astra-react-bits-particles"
      />
    </div>
  )
}

export default AstraParticleFlow
