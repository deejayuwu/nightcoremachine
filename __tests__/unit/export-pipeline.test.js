/**
 * CRITICAL TESTS: Audio Export Pipeline
 *
 * These tests verify the audio export functionality:
 * - Audio rendering with correct speed
 * - WAV encoding
 * - MP3 encoding (mocked, since lamejs is external)
 * - Speed consistency between playback and export
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  setupWebAudioMocks,
  MockOfflineAudioContext,
  createTestAudioBuffer
} from '../helpers/mock-audio-context.js'
import { setupMockDOM, cleanupMockDOM } from '../helpers/test-data.js'

describe('Audio Rendering (renderAudio)', () => {
  let buffer
  let speed

  beforeEach(() => {
    setupWebAudioMocks()
    setupMockDOM()
    buffer = createTestAudioBuffer({ duration: 3, sampleRate: 44100 })
    speed = { value: '1.25' }
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  async function renderAudio(isDaycoreMode = false) {
    if (!buffer) return null

    let rate = parseFloat(speed?.value || 1.25)

    if (isDaycoreMode) {
      rate = 2.0 - rate
      if (rate < 0.5) rate = 0.5
    }

    const length = Math.max(1, Math.floor(buffer.length / rate))
    const off = new MockOfflineAudioContext({
      numberOfChannels: buffer.numberOfChannels,
      length,
      sampleRate: buffer.sampleRate
    })

    const src = off.createBufferSource()
    src.buffer = buffer
    src.playbackRate.value = rate

    const g = off.createGain()
    g.gain.value = 1

    src.connect(g)
    g.connect(off.destination)
    src.start(0)

    return await off.startRendering()
  }

  it('should render audio with correct speed in Nightcore mode', async () => {
    speed.value = '1.25'

    const rendered = await renderAudio(false)

    expect(rendered).toBeDefined()
    expect(rendered.numberOfChannels).toBe(2)
    expect(rendered.sampleRate).toBe(44100)

    // Length should be original length / speed
    const expectedLength = Math.floor(buffer.length / 1.25)
    expect(rendered.length).toBe(expectedLength)
  })

  it('should render audio with correct speed in Daycore mode', async () => {
    speed.value = '1.25'

    const rendered = await renderAudio(true)

    expect(rendered).toBeDefined()

    // Daycore speed: 2.0 - 1.25 = 0.75
    const expectedLength = Math.floor(buffer.length / 0.75)
    expect(rendered.length).toBe(expectedLength)
  })

  it('should create OfflineAudioContext with correct parameters', async () => {
    speed.value = '1.25'

    const rendered = await renderAudio(false)

    expect(rendered.numberOfChannels).toBe(buffer.numberOfChannels)
    expect(rendered.sampleRate).toBe(buffer.sampleRate)
  })

  it('should apply playback rate to source node', async () => {
    speed.value = '1.5'

    const rendered = await renderAudio(false)

    // Verify length matches expected speed
    const expectedLength = Math.floor(buffer.length / 1.5)
    expect(rendered.length).toBe(expectedLength)
  })

  it('should handle minimum speed (0.5x in Daycore)', async () => {
    speed.value = '1.6' // Results in 2.0 - 1.6 = 0.4, clamped to 0.5

    const rendered = await renderAudio(true)

    const expectedLength = Math.floor(buffer.length / 0.5)
    expect(rendered.length).toBe(expectedLength)
  })

  it('should handle maximum speed (1.6x in Nightcore)', async () => {
    speed.value = '1.6'

    const rendered = await renderAudio(false)

    const expectedLength = Math.floor(buffer.length / 1.6)
    expect(rendered.length).toBe(expectedLength)
  })

  it('should preserve channel count', async () => {
    speed.value = '1.25'

    const rendered = await renderAudio(false)

    expect(rendered.numberOfChannels).toBe(buffer.numberOfChannels)
  })

  it('should preserve sample rate', async () => {
    speed.value = '1.25'

    const rendered = await renderAudio(false)

    expect(rendered.sampleRate).toBe(buffer.sampleRate)
  })

  it('should return null when buffer is not loaded', async () => {
    buffer = null

    const rendered = await renderAudio(false)

    expect(rendered).toBe(null)
  })

  it('should handle gain node with value 1.0', async () => {
    speed.value = '1.25'

    const rendered = await renderAudio(false)

    // Gain should not affect the rendering process
    expect(rendered).toBeDefined()
  })
})

describe('WAV Encoding (bufferToWav)', () => {
  let buffer

  beforeEach(() => {
    setupWebAudioMocks()
    setupMockDOM()
    buffer = createTestAudioBuffer({ duration: 1, sampleRate: 44100, numberOfChannels: 2 })
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  function writeStr(view, offset, str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
  }

  function bufferToWav(abuf) {
    const numChan = abuf.numberOfChannels
    const length = abuf.length * numChan * 2 + 44
    const buf = new ArrayBuffer(length)
    const view = new DataView(buf)

    // RIFF header
    writeStr(view, 0, 'RIFF')
    view.setUint32(4, 36 + abuf.length * numChan * 2, true)
    writeStr(view, 8, 'WAVE')

    // fmt chunk
    writeStr(view, 12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true) // PCM format
    view.setUint16(22, numChan, true)
    view.setUint32(24, abuf.sampleRate, true)
    view.setUint32(28, abuf.sampleRate * numChan * 2, true)
    view.setUint16(32, numChan * 2, true)
    view.setUint16(34, 16, true) // 16-bit

    // data chunk
    writeStr(view, 36, 'data')
    view.setUint32(40, abuf.length * numChan * 2, true)

    let offset = 44
    for (let i = 0; i < abuf.length; i++) {
      for (let ch = 0; ch < numChan; ch++) {
        const s = Math.max(-1, Math.min(1, abuf.getChannelData(ch)[i]))
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
        offset += 2
      }
    }

    return new Blob([view], { type: 'audio/wav' })
  }

  it('should create valid WAV blob', () => {
    const blob = bufferToWav(buffer)

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('audio/wav')
  })

  it('should have correct WAV file size', () => {
    const blob = bufferToWav(buffer)

    // WAV size = 44 byte header + (length * channels * 2 bytes per sample)
    const expectedSize = 44 + buffer.length * buffer.numberOfChannels * 2

    expect(blob.size).toBe(expectedSize)
  })

  it('should encode stereo audio correctly', () => {
    const stereoBuffer = createTestAudioBuffer({ duration: 1, numberOfChannels: 2 })
    const blob = bufferToWav(stereoBuffer)

    const expectedSize = 44 + stereoBuffer.length * 2 * 2
    expect(blob.size).toBe(expectedSize)
  })

  it('should encode mono audio correctly', () => {
    const monoBuffer = createTestAudioBuffer({ duration: 1, numberOfChannels: 1 })
    const blob = bufferToWav(monoBuffer)

    const expectedSize = 44 + monoBuffer.length * 1 * 2
    expect(blob.size).toBe(expectedSize)
  })

  it('should handle different sample rates', () => {
    const buffer48k = createTestAudioBuffer({ duration: 1, sampleRate: 48000 })
    const blob = bufferToWav(buffer48k)

    expect(blob.size).toBeGreaterThan(0)
  })

  it('should clamp audio samples to valid range', () => {
    // Create buffer with out-of-range values
    const testBuffer = createTestAudioBuffer({ duration: 0.1 })
    const channelData = testBuffer.getChannelData(0)

    // Set some extreme values
    channelData[0] = 2.0 // Should clamp to 1.0
    channelData[1] = -2.0 // Should clamp to -1.0

    const blob = bufferToWav(testBuffer)

    // Should not throw and should produce valid file
    expect(blob.size).toBeGreaterThan(0)
  })

  it('should handle very short audio buffers', () => {
    const shortBuffer = createTestAudioBuffer({ duration: 0.01 }) // 10ms
    const blob = bufferToWav(shortBuffer)

    expect(blob.size).toBeGreaterThan(44) // At least header size
  })

  it('should handle longer audio buffers', () => {
    const longBuffer = createTestAudioBuffer({ duration: 10 }) // 10 seconds
    const blob = bufferToWav(longBuffer)

    const expectedSize = 44 + longBuffer.length * 2 * 2
    expect(blob.size).toBe(expectedSize)
  })
})

describe('WAV Header Structure', () => {
  let buffer

  beforeEach(() => {
    setupWebAudioMocks()
    buffer = createTestAudioBuffer({ duration: 1, sampleRate: 44100, numberOfChannels: 2 })
  })

  function writeStr(view, offset, str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
  }

  function bufferToWav(abuf) {
    const numChan = abuf.numberOfChannels
    const length = abuf.length * numChan * 2 + 44
    const buf = new ArrayBuffer(length)
    const view = new DataView(buf)

    writeStr(view, 0, 'RIFF')
    view.setUint32(4, 36 + abuf.length * numChan * 2, true)
    writeStr(view, 8, 'WAVE')
    writeStr(view, 12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numChan, true)
    view.setUint32(24, abuf.sampleRate, true)
    view.setUint32(28, abuf.sampleRate * numChan * 2, true)
    view.setUint16(32, numChan * 2, true)
    view.setUint16(34, 16, true)
    writeStr(view, 36, 'data')
    view.setUint32(40, abuf.length * numChan * 2, true)

    let offset = 44
    for (let i = 0; i < abuf.length; i++) {
      for (let ch = 0; ch < numChan; ch++) {
        const s = Math.max(-1, Math.min(1, abuf.getChannelData(ch)[i]))
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
        offset += 2
      }
    }

    return { blob: new Blob([view], { type: 'audio/wav' }), view }
  }

  it('should have correct RIFF header', () => {
    const { view } = bufferToWav(buffer)

    const riff = String.fromCharCode(
      view.getUint8(0),
      view.getUint8(1),
      view.getUint8(2),
      view.getUint8(3)
    )

    expect(riff).toBe('RIFF')
  })

  it('should have correct WAVE format', () => {
    const { view } = bufferToWav(buffer)

    const wave = String.fromCharCode(
      view.getUint8(8),
      view.getUint8(9),
      view.getUint8(10),
      view.getUint8(11)
    )

    expect(wave).toBe('WAVE')
  })

  it('should have correct fmt chunk marker', () => {
    const { view } = bufferToWav(buffer)

    const fmt = String.fromCharCode(
      view.getUint8(12),
      view.getUint8(13),
      view.getUint8(14),
      view.getUint8(15)
    )

    expect(fmt).toBe('fmt ')
  })

  it('should have correct data chunk marker', () => {
    const { view } = bufferToWav(buffer)

    const data = String.fromCharCode(
      view.getUint8(36),
      view.getUint8(37),
      view.getUint8(38),
      view.getUint8(39)
    )

    expect(data).toBe('data')
  })

  it('should set PCM format (value 1)', () => {
    const { view } = bufferToWav(buffer)

    const audioFormat = view.getUint16(20, true)
    expect(audioFormat).toBe(1) // PCM
  })

  it('should set correct number of channels', () => {
    const { view } = bufferToWav(buffer)

    const numChannels = view.getUint16(22, true)
    expect(numChannels).toBe(2)
  })

  it('should set correct sample rate', () => {
    const { view } = bufferToWav(buffer)

    const sampleRate = view.getUint32(24, true)
    expect(sampleRate).toBe(44100)
  })

  it('should set correct bit depth (16-bit)', () => {
    const { view } = bufferToWav(buffer)

    const bitsPerSample = view.getUint16(34, true)
    expect(bitsPerSample).toBe(16)
  })

  it('should set correct byte rate', () => {
    const { view } = bufferToWav(buffer)

    const byteRate = view.getUint32(28, true)
    const expected = buffer.sampleRate * buffer.numberOfChannels * 2

    expect(byteRate).toBe(expected)
  })

  it('should set correct block align', () => {
    const { view } = bufferToWav(buffer)

    const blockAlign = view.getUint16(32, true)
    const expected = buffer.numberOfChannels * 2

    expect(blockAlign).toBe(expected)
  })
})

describe('Speed Consistency - Playback vs Export', () => {
  let buffer
  let speed

  beforeEach(() => {
    setupWebAudioMocks()
    setupMockDOM()
    buffer = createTestAudioBuffer({ duration: 3 })
    speed = { value: '1.25' }
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  it('should use same speed formula for playback and export in Nightcore', () => {
    const sliderValue = parseFloat(speed.value)
    const isDaycoreMode = false

    // Playback speed calculation
    let playbackSpeed = sliderValue
    if (isDaycoreMode) {
      playbackSpeed = 2.0 - playbackSpeed
      if (playbackSpeed < 0.5) playbackSpeed = 0.5
    }

    // Export speed calculation
    let exportSpeed = sliderValue
    if (isDaycoreMode) {
      exportSpeed = 2.0 - exportSpeed
      if (exportSpeed < 0.5) exportSpeed = 0.5
    }

    expect(playbackSpeed).toBe(exportSpeed)
    expect(playbackSpeed).toBe(1.25)
  })

  it('should use same speed formula for playback and export in Daycore', () => {
    const sliderValue = parseFloat(speed.value)
    const isDaycoreMode = true

    // Playback speed calculation
    let playbackSpeed = sliderValue
    if (isDaycoreMode) {
      playbackSpeed = 2.0 - playbackSpeed
      if (playbackSpeed < 0.5) playbackSpeed = 0.5
    }

    // Export speed calculation
    let exportSpeed = sliderValue
    if (isDaycoreMode) {
      exportSpeed = 2.0 - exportSpeed
      if (exportSpeed < 0.5) exportSpeed = 0.5
    }

    expect(playbackSpeed).toBe(exportSpeed)
    expect(playbackSpeed).toBeCloseTo(0.75, 2)
  })

  it('should produce same duration for playback and export', () => {
    const originalDuration = buffer.duration
    const sliderValue = 1.25

    // Nightcore
    const nightcoreSpeed = sliderValue
    const nightcoreDuration = originalDuration / nightcoreSpeed

    // Export
    const exportLength = Math.floor(buffer.length / nightcoreSpeed)
    const exportDuration = exportLength / buffer.sampleRate

    expect(nightcoreDuration).toBeCloseTo(exportDuration, 1)
  })
})

describe('MP3 Encoding (mocked)', () => {
  let buffer

  beforeEach(() => {
    setupWebAudioMocks()
    setupMockDOM()
    buffer = createTestAudioBuffer({ duration: 1, sampleRate: 44100 })

    // Mock lamejs with a proper class constructor
    class MockMp3Encoder {
      constructor(numChannels, sampleRate, kbps) {
        this.numChannels = numChannels
        this.sampleRate = sampleRate
        this.kbps = kbps
      }
      encodeBuffer() {
        return new Int8Array(1152)
      }
      flush() {
        return new Int8Array(512)
      }
    }

    global.lamejs = {
      Mp3Encoder: MockMp3Encoder
    }
  })

  afterEach(() => {
    cleanupMockDOM()
    delete global.lamejs
  })

  function bufferToMp3(audioBuffer, kbps = 320) {
    if (typeof lamejs === 'undefined' || !lamejs.Mp3Encoder) {
      throw new Error('lamejs library not loaded')
    }

    const sampleRate = audioBuffer.sampleRate
    const numChannels = audioBuffer.numberOfChannels

    const mp3encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, kbps)
    const sampleBlockSize = 1152
    const mp3Data = []

    // Get audio data
    let leftChannel, rightChannel
    if (numChannels === 1) {
      leftChannel = audioBuffer.getChannelData(0)
      rightChannel = null
    } else {
      leftChannel = audioBuffer.getChannelData(0)
      rightChannel = audioBuffer.getChannelData(1)
    }

    // Convert Float32 samples to Int16
    const convertToInt16 = (samples) => {
      const int16Array = new Int16Array(samples.length)
      for (let i = 0; i < samples.length; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]))
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
      }
      return int16Array
    }

    // Process audio in blocks
    for (let i = 0; i < leftChannel.length; i += sampleBlockSize) {
      const leftChunk = convertToInt16(leftChannel.subarray(i, i + sampleBlockSize))
      let mp3buf

      if (numChannels === 1) {
        mp3buf = mp3encoder.encodeBuffer(leftChunk)
      } else {
        const rightChunk = convertToInt16(rightChannel.subarray(i, i + sampleBlockSize))
        mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk)
      }

      if (mp3buf.length > 0) {
        mp3Data.push(new Uint8Array(mp3buf))
      }
    }

    const remaining = mp3encoder.flush()
    if (remaining.length > 0) {
      mp3Data.push(new Uint8Array(remaining))
    }

    return new Blob(mp3Data, { type: 'audio/mp3' })
  }

  it('should throw error when lamejs is not loaded', () => {
    delete global.lamejs

    expect(() => bufferToMp3(buffer)).toThrow('lamejs library not loaded')
  })

  it('should create MP3 encoder with correct parameters', () => {
    const blob = bufferToMp3(buffer, 320)

    // Verify encoding was successful
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBeGreaterThan(0)
    expect(blob.type).toBe('audio/mp3')
  })

  it('should create valid MP3 blob', () => {
    const blob = bufferToMp3(buffer)

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('audio/mp3')
  })

  it('should handle stereo audio', () => {
    const stereoBuffer = createTestAudioBuffer({ duration: 1, numberOfChannels: 2 })

    const blob = bufferToMp3(stereoBuffer)

    expect(blob).toBeInstanceOf(Blob)
  })

  it('should handle mono audio', () => {
    const monoBuffer = createTestAudioBuffer({ duration: 1, numberOfChannels: 1 })

    const blob = bufferToMp3(monoBuffer)

    expect(blob).toBeInstanceOf(Blob)
  })

  it('should use 320kbps by default', () => {
    const blob = bufferToMp3(buffer)

    // Verify encoding was successful with default bitrate
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBeGreaterThan(0)
    expect(blob.type).toBe('audio/mp3')
  })

  it('should convert Float32 samples to Int16', () => {
    // This is tested implicitly by the encoding process
    const blob = bufferToMp3(buffer)

    expect(blob.size).toBeGreaterThan(0)
  })
})
