/**
 * VOICE CHAOS - Audio Analyser & Spectrum Processor
 */

export interface AudioMetrics {
  rawLevel: number      // 0 to 1
  smoothLevel: number   // 0 to 1 smoothed
  frequency: number     // normalized centroid or dominant freq
  bass: number          // 0 to 1
  mid: number           // 0 to 1
  treble: number        // 0 to 1
}

export class AudioAnalyser {
  private context: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private sourceNode: MediaStreamAudioSourceNode | null = null
  private timeData: Uint8Array<ArrayBuffer> | null = null
  private freqData: Uint8Array<ArrayBuffer> | null = null

  private smoothLevel: number = 0
  private proceduralLevel: number = 0
  private isProceduralActive: boolean = false

  public async getAudioContext(): Promise<AudioContext> {
    if (!this.context) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.context = new AudioCtx()
    }
    if (this.context.state === 'suspended') {
      await this.context.resume()
    }
    return this.context
  }

  public async attachStream(stream: MediaStream): Promise<void> {
    const ctx = await this.getAudioContext()

    if (!this.analyser) {
      this.analyser = ctx.createAnalyser()
      this.analyser.fftSize = 256
      this.analyser.smoothingTimeConstant = 0.8
      this.timeData = new Uint8Array(this.analyser.fftSize)
      this.freqData = new Uint8Array(this.analyser.frequencyBinCount)
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect()
    }

    this.sourceNode = ctx.createMediaStreamSource(stream)
    this.sourceNode.connect(this.analyser)
    this.isProceduralActive = false
  }

  public async getAnalyserNode(): Promise<{ ctx: AudioContext; analyser: AnalyserNode }> {
    const ctx = await this.getAudioContext()
    if (!this.analyser) {
      this.analyser = ctx.createAnalyser()
      this.analyser.fftSize = 256
      this.analyser.smoothingTimeConstant = 0.8
      this.timeData = new Uint8Array(this.analyser.fftSize)
      this.freqData = new Uint8Array(this.analyser.frequencyBinCount)
    }
    return { ctx, analyser: this.analyser }
  }

  public detachStream(): void {
    if (this.sourceNode) {
      this.sourceNode.disconnect()
      this.sourceNode = null
    }
  }

  /**
   * Start procedural speaking simulation
   * Simulates realistic voice cadence, vowel pulses, and syllables
   */
  public setProceduralSpeaking(active: boolean): void {
    this.isProceduralActive = active
    if (!active) {
      this.proceduralLevel = 0
    }
  }

  public updateProceduralSpeaking(targetEnergy: number): void {
    if (this.isProceduralActive) {
      // Natural organic wave modulation
      this.proceduralLevel += (targetEnergy - this.proceduralLevel) * 0.25
    }
  }

  /**
   * Sample current metrics (called in requestAnimationFrame loop)
   */
  public getMetrics(timeSeconds: number = 0): AudioMetrics {
    // If procedural speaking is active (during SpeechSynthesis TTS playback)
    if (this.isProceduralActive) {
      // Create organic multi-frequency rhythmic modulation simulating natural speech bursts
      const speechRhythm =
        Math.sin(timeSeconds * 12.0) * 0.25 +
        Math.cos(timeSeconds * 7.5) * 0.35 +
        Math.sin(timeSeconds * 19.0) * 0.15 +
        0.55
      const currentProcedural = Math.max(0, Math.min(1, speechRhythm * this.proceduralLevel))
      this.smoothLevel += (currentProcedural - this.smoothLevel) * 0.3

      return {
        rawLevel: currentProcedural,
        smoothLevel: this.smoothLevel,
        frequency: 0.5 + Math.sin(timeSeconds * 5.0) * 0.3,
        bass: currentProcedural * 0.8,
        mid: currentProcedural * 1.1,
        treble: currentProcedural * 0.6,
      }
    }

    // If analyser is initialized, sample frequency & time-domain data
    if (this.analyser && this.timeData && this.freqData) {
      this.analyser.getByteTimeDomainData(this.timeData)
      this.analyser.getByteFrequencyData(this.freqData)

      // Calculate RMS amplitude
      let sum = 0
      for (let i = 0; i < this.timeData.length; i += 1) {
        const val = (this.timeData[i] - 128) / 128
        sum += val * val
      }
      const rms = Math.sqrt(sum / this.timeData.length)
      // Gentle scaling: ignore background noise below 0.015, smoothly scale voice
      const targetLevel = Math.min(1.0, Math.max(0, (rms - 0.015) * 3.0))
      // Smooth attack & decay to prevent bouncy jitter
      const factor = targetLevel > this.smoothLevel ? 0.20 : 0.10
      this.smoothLevel += (targetLevel - this.smoothLevel) * factor

      // Calculate frequency bands
      const binCount = this.freqData.length
      let bassSum = 0
      let midSum = 0
      let trebleSum = 0

      const bassEnd = Math.floor(binCount * 0.15)
      const midEnd = Math.floor(binCount * 0.55)

      for (let i = 0; i < bassEnd; i += 1) bassSum += this.freqData[i]
      for (let i = bassEnd; i < midEnd; i += 1) midSum += this.freqData[i]
      for (let i = midEnd; i < binCount; i += 1) trebleSum += this.freqData[i]

      const bass = bassSum / (bassEnd * 255 || 1)
      const mid = midSum / ((midEnd - bassEnd) * 255 || 1)
      const treble = trebleSum / ((binCount - midEnd) * 255 || 1)

      return {
        rawLevel: targetLevel,
        smoothLevel: this.smoothLevel,
        frequency: (bass * 0.3 + mid * 0.5 + treble * 0.2),
        bass,
        mid,
        treble,
      }
    }

    // Default gentle idle breathing level
    const idleBreath = Math.sin(timeSeconds * 1.8) * 0.04 + 0.05
    this.smoothLevel += (idleBreath - this.smoothLevel) * 0.1

    return {
      rawLevel: idleBreath,
      smoothLevel: this.smoothLevel,
      frequency: 0.2,
      bass: 0.1,
      mid: 0.1,
      treble: 0.05,
    }
  }
}

export const globalAudioAnalyser = new AudioAnalyser()
