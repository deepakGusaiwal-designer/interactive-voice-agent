# Voice Agent — $0 Browser Prototype

A minimal React + Three.js voice interface designed as a browser-first prototype.

## Stack

- React + TypeScript + Vite
- Three.js / React Three Fiber dependencies
- GSAP
- Web Speech API
- Web Audio API
- GLSL shader

## Run

```bash
npm install
npm run dev
```

Open the HTTPS deployment or localhost and allow microphone access.

## Current behavior

The prototype supports:

1. Microphone permission.
2. Browser speech recognition.
3. Browser speech synthesis.
4. Audio-level visualization.
5. Central WebGL voice orb.
6. Listening / thinking / speaking states.

The response engine is intentionally isolated in `buildResponse()` in `src/App.tsx`.

## Next step

Replace `buildResponse()` with a local WebGPU LLM or an optional cloud model. Keep the voice UI and audio visualization unchanged.

## Browser note

Web Speech Recognition and available TTS voices vary by browser and operating system. Chrome/Edge are recommended for the initial prototype.
# interactive-voice-agent
