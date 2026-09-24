import { Analytics } from '@vercel/analytics/react'
import { VoiceExperience } from './components/VoiceExperience'
import './App.css'

export default function App() {
  return (
    <>
      <VoiceExperience />
      <Analytics />
    </>
  )
}