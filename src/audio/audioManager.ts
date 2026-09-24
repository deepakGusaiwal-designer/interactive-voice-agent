/**
 * VOICE CHAOS - AudioManager Coordinator
 */

import { globalMicrophoneService, MicrophoneService } from './microphone'
import { globalAudioAnalyser, AudioAnalyser, type AudioMetrics } from './analyser'

export class AudioManager {
  constructor(
    private mic: MicrophoneService = globalMicrophoneService,
    private analyser: AudioAnalyser = globalAudioAnalyser,
  ) {}

  public async startListening(): Promise<void> {
    const stream = await this.mic.requestMicrophone()
    await this.analyser.attachStream(stream)
  }

  public stopListening(): void {
    this.analyser.detachStream()
    this.mic.stopMicrophone()
  }

  public setSpeaking(active: boolean, procedural: boolean = false): void {
    this.analyser.setProceduralSpeaking(active && procedural)
    if (active && procedural) {
      this.analyser.updateProceduralSpeaking(0.85)
    }
  }

  public getAudioMetrics(timeSeconds: number = 0): AudioMetrics {
    return this.analyser.getMetrics(timeSeconds)
  }
}

export const globalAudioManager = new AudioManager()
