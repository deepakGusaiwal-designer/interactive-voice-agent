import React from 'react'

export interface ChaosTalkLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showSubtitle?: boolean
  className?: string
}

export const ChaosTalkLogo: React.FC<ChaosTalkLogoProps> = ({
  size = 'sm',
  showSubtitle = false,
  className = '',
}) => {
  const iconHeight = size === 'sm' ? 20 : size === 'md' ? 28 : 42

  return (
    <div className={`chaos-talk-logo-wrap size-${size} ${className}`} title="CHAOS TALK">
      <svg
        className="chaos-talk-logo-icon"
        height={iconHeight}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Shiny white-to-cyan metallic gradient */}
          <linearGradient id="logoWhiteChrome" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#E0F2FE" />
            <stop offset="70%" stopColor="#7DD3FC" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>

          {/* Electric luminous blue neon glow */}
          <linearGradient id="logoElectricBlue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0EA5E9" />
            <stop offset="50%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>

          <radialGradient id="logoObsidianBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#081426" />
            <stop offset="80%" stopColor="#020611" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>

          {/* Glow Filter */}
          <filter id="logoGlowFilter" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Ring with Chrome White / Icy Blue Sheen */}
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="url(#logoObsidianBg)"
          stroke="url(#logoWhiteChrome)"
          strokeWidth="3.2"
        />
        <circle
          cx="60"
          cy="60"
          r="47"
          fill="none"
          stroke="#0284c7"
          strokeWidth="1.2"
          strokeOpacity="0.4"
        />

        {/* Soundwave Base (Electric Neon Blue Glow) */}
        <path
          d="M18 60 L32 60 L39 40 L47 78 L56 30 L64 88 L72 36 L81 74 L88 48 L96 60 L102 60"
          stroke="url(#logoElectricBlue)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#logoGlowFilter)"
        />

        {/* Soundwave Sharp Center Line (Shiny White Chrome) */}
        <path
          d="M18 60 L32 60 L39 40 L47 78 L56 30 L64 88 L72 36 L81 74 L88 48 L96 60 L102 60"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Star glints on spikes */}
        <circle cx="56" cy="30" r="2.8" fill="#FFFFFF" filter="url(#logoGlowFilter)" />
        <circle cx="64" cy="88" r="2.8" fill="#FFFFFF" filter="url(#logoGlowFilter)" />
      </svg>

      <div className="chaos-talk-typography">
        <div className="chaos-talk-brand-text">
          <span className="brand-chaos-word">CHAOS</span>
          <span className="brand-talk-word">TALK</span>
        </div>
        {showSubtitle && <span className="chaos-talk-subtitle">INTERACTIVE AI</span>}
      </div>
    </div>
  )
}

export default ChaosTalkLogo
