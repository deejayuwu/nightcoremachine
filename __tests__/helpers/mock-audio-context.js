/**
 * Mock Web Audio API for testing
 * Simulates AudioContext, OfflineAudioContext, and related nodes
 */

import { vi } from 'vitest'

/**
 * Mock AudioBuffer
 */
export class MockAudioBuffer {
  constructor(options = {}) {
    this.sampleRate = options.sampleRate || 44100
    this.length = options.length || 44100
    this.duration = this.length / this.sampleRate
    this.numberOfChannels = options.numberOfChannels || 2
    this._channelData = []

    // Create channel data arrays
    for (let i = 0; i < this.numberOfChannels; i++) {
      this._channelData[i] = new Float32Array(this.length)
      // Fill with test data (simple sine wave)
      for (let j = 0; j < this.length; j++) {
        this._channelData[i][j] = Math.sin((2 * Math.PI * j * 440) / this.sampleRate)
      }
    }
  }

  getChannelData(channel) {
    if (channel >= this.numberOfChannels) {
      throw new Error(`Channel ${channel} out of range`)
    }
    return this._channelData[channel]
  }

  copyFromChannel(destination, channelNumber, startInChannel = 0) {
    const source = this.getChannelData(channelNumber)
    destination.set(source.subarray(startInChannel))
  }

  copyToChannel(source, channelNumber, startInChannel = 0) {
    const dest = this.getChannelData(channelNumber)
    dest.set(source, startInChannel)
  }
}

/**
 * Mock AudioBufferSourceNode
 */
export class MockAudioBufferSourceNode {
  constructor(context) {
    this.context = context
    this.buffer = null
    this.playbackRate = { value: 1.0 }
    this.loop = false
    this.loopStart = 0
    this.loopEnd = 0
    this.onended = null
    this._connected = []
    this._started = false
    this._stopped = false
    this._startTime = 0
    this._offset = 0
  }

  connect(destination) {
    this._connected.push(destination)
    return destination
  }

  disconnect() {
    this._connected = []
  }

  start(when = 0, offset = 0) {
    this._started = true
    this._startTime = when
    this._offset = offset

    // Simulate onended callback
    if (this.buffer && this.onended) {
      const duration = (this.buffer.duration - offset) / this.playbackRate.value
      setTimeout(() => {
        if (this.onended && this._started && !this._stopped) {
          this.onended()
        }
      }, duration * 1000)
    }
  }

  stop(when = 0) {
    this._stopped = true
    this._started = false
  }
}

/**
 * Mock GainNode
 */
export class MockGainNode {
  constructor(context) {
    this.context = context
    this.gain = { value: 1.0 }
    this._connected = []
  }

  connect(destination) {
    this._connected.push(destination)
    return destination
  }

  disconnect() {
    this._connected = []
  }
}

/**
 * Mock AudioDestinationNode
 */
export class MockAudioDestinationNode {
  constructor(context) {
    this.context = context
    this.maxChannelCount = 2
    this.channelCount = 2
  }
}

/**
 * Mock AudioContext
 */
export class MockAudioContext {
  constructor() {
    this.state = 'running'
    this.sampleRate = 44100
    this.currentTime = 0
    this.destination = new MockAudioDestinationNode(this)
    this._timeInterval = null

    // Simulate time progression
    this._startTime = Date.now()
  }

  createBufferSource() {
    return new MockAudioBufferSourceNode(this)
  }

  createGain() {
    return new MockGainNode(this)
  }

  createBuffer(numberOfChannels, length, sampleRate) {
    return new MockAudioBuffer({ numberOfChannels, length, sampleRate })
  }

  async decodeAudioData(arrayBuffer) {
    // Simulate decoding delay
    await new Promise(resolve => setTimeout(resolve, 10))

    // Validate input
    if (!(arrayBuffer instanceof ArrayBuffer)) {
      throw new Error('decodeAudioData requires an ArrayBuffer')
    }

    // Return a mock audio buffer (1 second of audio)
    return new MockAudioBuffer({
      numberOfChannels: 2,
      length: 44100,
      sampleRate: 44100
    })
  }

  async close() {
    this.state = 'closed'
  }

  async suspend() {
    this.state = 'suspended'
  }

  async resume() {
    this.state = 'running'
  }
}

/**
 * Mock OfflineAudioContext
 */
export class MockOfflineAudioContext extends MockAudioContext {
  constructor(options) {
    super()

    if (typeof options === 'object') {
      this.numberOfChannels = options.numberOfChannels || 2
      this.length = options.length || 44100
      this.sampleRate = options.sampleRate || 44100
    } else {
      // Old constructor: (numberOfChannels, length, sampleRate)
      this.numberOfChannels = arguments[0] || 2
      this.length = arguments[1] || 44100
      this.sampleRate = arguments[2] || 44100
    }

    this.state = 'running'
  }

  async startRendering() {
    // Simulate rendering delay
    await new Promise(resolve => setTimeout(resolve, 50))

    // Return a rendered audio buffer
    return new MockAudioBuffer({
      numberOfChannels: this.numberOfChannels,
      length: this.length,
      sampleRate: this.sampleRate
    })
  }
}

/**
 * Setup Web Audio API mocks in global scope
 */
export function setupWebAudioMocks() {
  global.AudioContext = MockAudioContext
  global.webkitAudioContext = MockAudioContext
  global.OfflineAudioContext = MockOfflineAudioContext
  global.AudioBuffer = MockAudioBuffer

  return {
    AudioContext: MockAudioContext,
    OfflineAudioContext: MockOfflineAudioContext,
    AudioBuffer: MockAudioBuffer
  }
}

/**
 * Create a test audio buffer with specific properties
 */
export function createTestAudioBuffer(options = {}) {
  const {
    duration = 1,
    sampleRate = 44100,
    numberOfChannels = 2,
    frequency = 440
  } = options

  const length = Math.floor(duration * sampleRate)
  const buffer = new MockAudioBuffer({ numberOfChannels, length, sampleRate })

  // Fill with sine wave at specified frequency
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < length; i++) {
      data[i] = Math.sin((2 * Math.PI * i * frequency) / sampleRate)
    }
  }

  return buffer
}

/**
 * Create a test ArrayBuffer with valid audio data
 */
export function createTestArrayBuffer(size = 1024) {
  const buffer = new ArrayBuffer(size)
  const view = new Uint8Array(buffer)

  // Fill with some test data
  for (let i = 0; i < size; i++) {
    view[i] = i % 256
  }

  return buffer
}
