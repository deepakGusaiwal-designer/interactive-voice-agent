/**
 * VOICE CHAOS - Microphone Access & Permissions
 */

export interface MicrophoneStatus {
  hasPermission: boolean
  stream: MediaStream | null
  error?: string
}

export class MicrophoneService {
  private stream: MediaStream | null = null

  public async requestMicrophone(): Promise<MediaStream> {
    if (this.stream && this.stream.active) {
      return this.stream
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Your browser does not support audio recording. Try Chrome or Edge.')
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      })
      this.stream = stream
      return stream
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string }
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error('Your microphone is shy. Give it permission.')
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        throw new Error('No microphone was detected on this device.')
      } else {
        throw new Error('Well... your microphone and I are currently not on speaking terms.')
      }
    }
  }

  public stopMicrophone(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }
  }

  public getStream(): MediaStream | null {
    return this.stream && this.stream.active ? this.stream : null
  }
}

export const globalMicrophoneService = new MicrophoneService()
