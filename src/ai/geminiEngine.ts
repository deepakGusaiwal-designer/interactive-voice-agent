/**
 * VOICE CHAOS - Gemini Engine Export
 * 
 * Re-exports GeminiAIEngine and globalGeminiAIEngine from aiEngine.ts
 * to prevent circular dependency cycles.
 */

export {
  GeminiAIEngine,
  globalGeminiAIEngine,
} from './aiEngine'
