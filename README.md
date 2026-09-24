# ⚡ CHAOS TALK — Interactive Voice AI Agent

An interactive, high-energy conversational AI voice experience with real-time speech recognition, audio-reactive liquid wave visuals, multilingual support (Hindi, English, Spanish, French), and an Apple Liquid Glass chat interface.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com)

---

## ✨ Features

- 🎙️ **Real-Time Vocal Dialogue**: Low-latency voice interaction powered by browser Web Speech API & Web Audio API.
- 🌊 **Audio-Reactive Strands**: 3D GLSL audio-reactive visualizer designed with OGL that flexes and glows with vocal frequencies.
- 🍏 **Apple Liquid Glass Interface**: Frosted multi-turn chat bubbles with specular edge highlights, volumetric glass depth, and auto-scrolling conversation history.
- 🇮🇳 **Bilingual & Multilingual Engine**: Seamless auto-detection between Hindi (हिन्दी) and English (US), plus full native conversational understanding.
- ⚡ **Dual Engine (Gemini + Local Offline Character)**:
  - Connects to Google Gemini AI via `VITE_GEMINI_API_KEY`.
  - Seamless zero-config fallback to a built-in character engine with witty roasts, jokes, and memory.
- 🔑 **Bring Your Own Key (BYOK)**: Users visiting the public link can optionally paste their personal Gemini API key stored privately in their browser's local storage.
- 📱 **Mobile & Desktop Optimized**: Adaptive single-row mobile header with settings dropdown popover, touch-friendly controls, and full HTTPS support.

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install
```bash
git clone https://github.com/<YOUR_USERNAME>/chaos-talk.git
cd chaos-talk
npm install
```

### 2. Configure Environment (Optional)
Create a `.env` file in the root directory:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```
*(If omitted, the agent will operate on its built-in offline personality engine.)*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in Google Chrome, Microsoft Edge, or Safari.

---

## 🌐 Deploy to Vercel (Public Multi-User Access)

### Option A: Via GitHub (Recommended)
1. Push this project to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "Deploy CHAOS TALK"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/chaos-talk.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) and click **"Add New..."** → **"Project"**.
3. Select your `chaos-talk` repository.
4. *(Optional)* Add Environment Variable:
   - Name: `VITE_GEMINI_API_KEY`
   - Value: `<Your Google Gemini API Key>`
5. Click **Deploy**.

### Option B: Via Vercel CLI
```bash
npx vercel
npx vercel --prod
```

---

## 🔒 Security & Privacy
- **Microphone**: Audio is processed client-side via the browser's Web Speech API and is never recorded to any external database.
- **API Keys**: Custom API keys entered in the browser UI remain strictly inside the user's private `localStorage` on their device.

---

## 🛠️ Tech Stack
- **Frontend**: React 19, TypeScript, Vite
- **Visuals**: OGL (WebGL), React Bits Strands & Molten Metal Shaders
- **Icons**: Lucide Icons
- **Fonts**: Google Sans
- **Deployment**: Vercel SPA
