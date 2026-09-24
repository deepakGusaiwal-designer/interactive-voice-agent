import { useCallback, useEffect, useRef, useState } from 'react'

export function useAudioLevel() {
  const contextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const [level, setLevel] = useState(0)

  const ensureContext = useCallback(async () => {
    if (!contextRef.current) {
      contextRef.current = new AudioContext()
      analyserRef.current = contextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      analyserRef.current.smoothingTimeConstant = 0.82
    }

    if (contextRef.current.state === 'suspended') {
      await contextRef.current.resume()
    }

    return contextRef.current
  }, [])

  const startMeter = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return

    const data = new Uint8Array(analyser.fftSize)

    const tick = () => {
      analyser.getByteTimeDomainData(data)

      let sum = 0

      for (let i = 0; i < data.length; i += 1) {
        const normalized = (data[i] - 128) / 128
        sum += normalized * normalized
      }

      const rms = Math.sqrt(sum / data.length)
      setLevel(Math.min(1, rms * 4))

      rafRef.current = requestAnimationFrame(tick)
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    tick()
  }, [])

  const connectMicrophone = useCallback(async () => {
    const context = await ensureContext()

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })

    streamRef.current = stream

    const source = context.createMediaStreamSource(stream)
    source.connect(analyserRef.current!)

    sourceRef.current = source
    startMeter()
  }, [ensureContext, startMeter])

  const disconnectMicrophone = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null

    if (sourceRef.current instanceof MediaStreamAudioSourceNode) {
      sourceRef.current.disconnect()
      sourceRef.current = null
    }

    setLevel(0)
  }, [])

  const connectElement = useCallback(
    (element: HTMLMediaElement) => {
      let source: MediaElementAudioSourceNode | null = null
      let active = true

      void ensureContext().then((context) => {
        if (!active || sourceRef.current) return

        try {
          source = context.createMediaElementSource(element)
          source.connect(analyserRef.current!)
          analyserRef.current!.connect(context.destination)
          sourceRef.current = source
          startMeter()
        } catch {
          // A media element can only be connected once.
        }
      })

      return () => {
        active = false

        if (source) {
          source.disconnect()
          if (sourceRef.current === source) sourceRef.current = null
        }

        setLevel(0)
      }
    },
    [ensureContext, startMeter],
  )

  const disconnectElement = useCallback(() => {
    if (sourceRef.current instanceof MediaElementAudioSourceNode) {
      sourceRef.current.disconnect()
      sourceRef.current = null
    }

    setLevel(0)
  }, [])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((track) => track.stop())
      contextRef.current?.close()
    }
  }, [])

  return {
    level,
    connectMicrophone,
    disconnectMicrophone,
    connectElement,
    disconnectElement,
  }
}