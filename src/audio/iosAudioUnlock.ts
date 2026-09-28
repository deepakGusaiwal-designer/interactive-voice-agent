/**
 * VOICE CHAOS - iOS Audio & Speech Session Unlocker
 *
 * iOS Safari & WebKit impose strict audio and speech restrictions:
 * 1. Web Audio (AudioContext) starts in 'suspended' state and can ONLY be resumed
 *    synchronously during a direct user touch/gesture.
 * 2. Web Speech Synthesis (SpeechSynthesisUtterance) is silenced/blocked if triggered
 *    after an asynchronous delay (like a network fetch to AI), unless "primed" during
 *    a direct user interaction.
 * 3. Physical Silent/Mute Switch: On iPhone, the hardware silent switch mutes Web Audio
 *    and SpeechSynthesis in Safari unless the audio session is unlocked.
 * 4. Third-party browsers on iOS (Chrome, Edge, Instagram, FB) use WKWebView which
 *    blocks webkitSpeechRecognition. Safari is required for microphone speech-to-text.
 */

import { globalAudioAnalyser } from './analyser'

// Check if device is iOS (iPhone, iPad, iPod, or iPadOS desktop mode)
export function isIOS(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  const isAppleTouch = /iPad|iPhone|iPod/.test(ua)
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return isAppleTouch || isIPadOS
}

// Check if user is on iOS in a third-party in-app browser or Chrome/Edge/Firefox on iOS
export function isIOSNonSafari(): boolean {
  if (!isIOS()) return false
  const ua = navigator.userAgent || ''
  // Chrome iOS (CriOS), Firefox iOS (FxiOS), Edge iOS (EdgiOS), Instagram, FB, etc.
  return /CriOS|FxiOS|EdgiOS|Instagram|FBAN|FBAV|Line/i.test(ua)
}

// Check if user is on genuine iOS Safari
export function isIOSSafari(): boolean {
  return isIOS() && !isIOSNonSafari()
}

let isAudioUnlocked = false

/**
 * 0.05-second silent base64 WAV sound file to configure iOS Audio Session to Playback mode
 */
const SILENT_WAV_BASE64 =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'

let silentAudioElement: HTMLAudioElement | null = null

/**
 * Synchronously unlock AudioContext, HTML5 Audio, and SpeechSynthesis on user interaction.
 * MUST be called during a user touch/click event handler.
 */
export async function unlockIOSAudio(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  try {
    // 1. Play silent HTML5 audio clip - tells iOS WebKit to activate the audio output session
    if (!silentAudioElement) {
      silentAudioElement = new Audio(SILENT_WAV_BASE64)
      silentAudioElement.volume = 0.01
    }
    silentAudioElement.play().catch(() => {
      // Ignored if blocked
    })

    // 2. Unlock Web Audio AudioContext
    await globalAudioAnalyser.unlockAudio()

    // 3. Unlock / Prime Web Speech Synthesis on iOS Safari
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }
      // Speak a 0-volume, single whitespace utterance synchronously
      // This grants permission to window.speechSynthesis to speak later after async network calls
      const primeUtterance = new SpeechSynthesisUtterance(' ')
      primeUtterance.volume = 0.01
      primeUtterance.rate = 10 // Ends in 1ms
      window.speechSynthesis.speak(primeUtterance)
    }

    isAudioUnlocked = true
    return true
  } catch (err) {
    console.warn('[iOSAudioUnlock] Failed to unlock audio session:', err)
    return false
  }
}

/**
 * Automatically hook user gestures on page load so the first tap anywhere unlocks audio
 */
export function setupAutoAudioUnlock(): void {
  if (typeof window === 'undefined' || isAudioUnlocked) return

  const handleFirstInteraction = () => {
    unlockIOSAudio()
    // Remove listeners once unlocked
    window.removeEventListener('touchstart', handleFirstInteraction)
    window.removeEventListener('touchend', handleFirstInteraction)
    window.removeEventListener('click', handleFirstInteraction)
    window.removeEventListener('keydown', handleFirstInteraction)
  }

  window.addEventListener('touchstart', handleFirstInteraction, { passive: true })
  window.addEventListener('touchend', handleFirstInteraction, { passive: true })
  window.addEventListener('click', handleFirstInteraction, { passive: true })
  window.addEventListener('keydown', handleFirstInteraction, { passive: true })
}
