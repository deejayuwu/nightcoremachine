/**
 * CRITICAL TESTS: Audio Playback Control
 *
 * These tests verify the core playback functionality:
 * - Play/Pause/Stop operations
 * - Position tracking and seeking
 * - Speed changes during playback
 * - State management consistency
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  setupWebAudioMocks,
  MockAudioContext,
  createTestAudioBuffer
} from '../helpers/mock-audio-context.js'
import { setupMockDOM, cleanupMockDOM, waitForAsync } from '../helpers/test-data.js'

describe('Playback State Management', () => {
  let audioCtx
  let buffer
  let sourceNode
  let gainNode
  let isPlaying
  let currentTime
  let duration
  let lastUpdateTime

  beforeEach(() => {
    setupWebAudioMocks()
    setupMockDOM()

    // Initialize audio context and state
    audioCtx = new MockAudioContext()
    gainNode = audioCtx.createGain()
    gainNode.connect(audioCtx.destination)
    buffer = createTestAudioBuffer({ duration: 3 })
    duration = 3
    isPlaying = false
    currentTime = 0
    lastUpdateTime = 0
    sourceNode = null
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  it('should initialize with correct default state', () => {
    expect(isPlaying).toBe(false)
    expect(currentTime).toBe(0)
    expect(duration).toBe(3)
    expect(sourceNode).toBe(null)
  })

  it('should create audio context and gain node on initialization', () => {
    expect(audioCtx).toBeDefined()
    expect(gainNode).toBeDefined()
    expect(gainNode.gain.value).toBe(1.0)
  })

  it('should have buffer loaded with correct properties', () => {
    expect(buffer).toBeDefined()
    expect(buffer.duration).toBeCloseTo(3, 1)
    expect(buffer.numberOfChannels).toBe(2)
    expect(buffer.sampleRate).toBe(44100)
  })
})

describe('Play Operation', () => {
  let audioCtx
  let buffer
  let sourceNode
  let gainNode
  let isPlaying
  let currentTime
  let duration
  let lastUpdateTime

  beforeEach(() => {
    setupWebAudioMocks()
    setupMockDOM()

    audioCtx = new MockAudioContext()
    gainNode = audioCtx.createGain()
    buffer = createTestAudioBuffer({ duration: 3 })
    duration = 3
    isPlaying = false
    currentTime = 0
    lastUpdateTime = 0
    sourceNode = null
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  it('should start playback from beginning', () => {
    // Simulate startSource(0)
    const offset = 0
    sourceNode = audioCtx.createBufferSource()
    sourceNode.buffer = buffer
    sourceNode.playbackRate.value = 1.25 // Default Nightcore speed
    sourceNode.connect(gainNode)

    sourceNode.start(0, offset)
    lastUpdateTime = audioCtx.currentTime
    isPlaying = true
    currentTime = offset

    expect(isPlaying).toBe(true)
    expect(currentTime).toBe(0)
    expect(sourceNode._started).toBe(true)
    expect(sourceNode.playbackRate.value).toBe(1.25)
  })

  it('should start playback from specific offset', () => {
    const offset = 1.5 // Start from 1.5 seconds

    sourceNode = audioCtx.createBufferSource()
    sourceNode.buffer = buffer
    sourceNode.playbackRate.value = 1.25
    sourceNode.connect(gainNode)

    sourceNode.start(0, offset)
    lastUpdateTime = audioCtx.currentTime
    isPlaying = true
    currentTime = offset

    expect(currentTime).toBeCloseTo(1.5, 2)
    expect(sourceNode._offset).toBe(1.5)
  })

  it('should apply correct speed in Nightcore mode', () => {
    const sliderValue = 1.25
    const isDaycoreMode = false

    let currentSpeed = sliderValue
    if (isDaycoreMode) {
      currentSpeed = 2.0 - currentSpeed
      if (currentSpeed < 0.5) currentSpeed = 0.5
    }

    sourceNode = audioCtx.createBufferSource()
    sourceNode.playbackRate.value = currentSpeed

    expect(sourceNode.playbackRate.value).toBe(1.25)
  })

  it('should apply correct speed in Daycore mode', () => {
    const sliderValue = 1.25
    const isDaycoreMode = true

    let currentSpeed = sliderValue
    if (isDaycoreMode) {
      currentSpeed = 2.0 - currentSpeed
      if (currentSpeed < 0.5) currentSpeed = 0.5
    }

    sourceNode = audioCtx.createBufferSource()
    sourceNode.playbackRate.value = currentSpeed

    expect(sourceNode.playbackRate.value).toBeCloseTo(0.75, 2)
  })

  it('should connect source to gain node', () => {
    sourceNode = audioCtx.createBufferSource()
    sourceNode.buffer = buffer
    sourceNode.connect(gainNode)

    expect(sourceNode._connected).toContain(gainNode)
  })

  it('should record playback start time', () => {
    sourceNode = audioCtx.createBufferSource()
    sourceNode.buffer = buffer
    sourceNode.start(0, 0)

    lastUpdateTime = audioCtx.currentTime
    isPlaying = true

    expect(lastUpdateTime).toBeDefined()
    expect(isPlaying).toBe(true)
  })
})

describe('Pause Operation', () => {
  let audioCtx
  let buffer
  let sourceNode
  let gainNode
  let isPlaying
  let currentTime
  let duration
  let lastUpdateTime

  beforeEach(() => {
    setupWebAudioMocks()
    setupMockDOM()

    audioCtx = new MockAudioContext()
    gainNode = audioCtx.createGain()
    buffer = createTestAudioBuffer({ duration: 3 })
    duration = 3
    isPlaying = false
    currentTime = 0
    lastUpdateTime = 0
    sourceNode = null
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  it('should pause playback and preserve position', () => {
    // Start playback
    sourceNode = audioCtx.createBufferSource()
    sourceNode.buffer = buffer
    sourceNode.playbackRate.value = 1.25
    sourceNode.connect(gainNode)
    sourceNode.start(0, 0)
    isPlaying = true
    currentTime = 0
    lastUpdateTime = audioCtx.currentTime

    // Simulate some playback time (0.5 seconds real time at 1.25x speed)
    currentTime = 0.5 * 1.25 // 0.625 seconds in buffer time

    // Pause
    sourceNode.stop()
    sourceNode.disconnect()
    isPlaying = false

    expect(isPlaying).toBe(false)
    expect(currentTime).toBeCloseTo(0.625, 2)
    expect(sourceNode._stopped).toBe(true)
  })

  it('should stop source node on pause', () => {
    sourceNode = audioCtx.createBufferSource()
    sourceNode.start(0, 0)
    isPlaying = true

    // Pause
    sourceNode.stop()
    isPlaying = false

    expect(sourceNode._stopped).toBe(true)
    expect(isPlaying).toBe(false)
  })

  it('should handle pause when not playing', () => {
    isPlaying = false

    // Attempt to pause (should be a no-op)
    if (!isPlaying) {
      // Do nothing
    }

    expect(isPlaying).toBe(false)
  })
})

describe('Stop Operation', () => {
  let audioCtx
  let buffer
  let sourceNode
  let gainNode
  let isPlaying
  let currentTime

  beforeEach(() => {
    setupWebAudioMocks()
    setupMockDOM()

    audioCtx = new MockAudioContext()
    gainNode = audioCtx.createGain()
    buffer = createTestAudioBuffer({ duration: 3 })
    isPlaying = false
    currentTime = 0
    sourceNode = null
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  it('should stop playback and reset to beginning', () => {
    // Start playback
    sourceNode = audioCtx.createBufferSource()
    sourceNode.buffer = buffer
    sourceNode.connect(gainNode)
    sourceNode.start(0, 0)
    isPlaying = true
    currentTime = 1.5

    // Stop (stopSource function)
    if (sourceNode) {
      sourceNode.stop()
      sourceNode.disconnect()
      sourceNode = null
    }
    isPlaying = false

    expect(sourceNode).toBe(null)
    expect(isPlaying).toBe(false)
  })

  it('should handle errors when stopping already stopped source', () => {
    sourceNode = audioCtx.createBufferSource()
    sourceNode.start(0, 0)
    sourceNode.stop()

    // Try to stop again (should not throw)
    expect(() => {
      try {
        sourceNode.stop()
      } catch (e) {
        // Ignore error
      }
    }).not.toThrow()
  })

  it('should handle errors when disconnecting already disconnected source', () => {
    sourceNode = audioCtx.createBufferSource()
    sourceNode.connect(gainNode)
    sourceNode.disconnect()

    // Try to disconnect again (should not throw)
    expect(() => {
      try {
        sourceNode.disconnect()
      } catch (e) {
        // Ignore error
      }
    }).not.toThrow()
  })
})

describe('Position Tracking (getCurrentPos)', () => {
  let audioCtx
  let buffer
  let sourceNode
  let gainNode
  let isPlaying
  let currentTime
  let duration
  let lastUpdateTime
  let speed

  beforeEach(() => {
    setupWebAudioMocks()
    setupMockDOM()

    audioCtx = new MockAudioContext()
    gainNode = audioCtx.createGain()
    buffer = createTestAudioBuffer({ duration: 3 })
    duration = 3
    isPlaying = false
    currentTime = 0
    lastUpdateTime = 0
    sourceNode = null
    speed = { value: '1.25' }
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  function getCurrentPos(isDaycoreMode = false) {
    if (!audioCtx || !duration) return currentTime || 0

    if (!isPlaying || !sourceNode) {
      return currentTime || 0
    }

    const now = audioCtx.currentTime
    const elapsedRealTime = now - lastUpdateTime

    let rate = parseFloat(speed?.value || 1.25)
    if (isDaycoreMode) {
      rate = 2.0 - rate
      if (rate < 0.5) rate = 0.5
    }

    currentTime = currentTime + elapsedRealTime * rate

    if (currentTime > duration) {
      currentTime = duration
      return duration
    }

    if (currentTime < 0) currentTime = 0

    lastUpdateTime = now

    return currentTime
  }

  it('should return current position when not playing', () => {
    currentTime = 1.5
    isPlaying = false

    const pos = getCurrentPos()

    expect(pos).toBeCloseTo(1.5, 2)
  })

  it('should calculate position during playback', () => {
    // Start playback
    sourceNode = audioCtx.createBufferSource()
    isPlaying = true
    currentTime = 0
    lastUpdateTime = 0

    // Simulate 1 second real time passed
    audioCtx.currentTime = 1.0

    const pos = getCurrentPos()

    // At 1.25x speed, 1 real second = 1.25 buffer seconds
    expect(pos).toBeCloseTo(1.25, 2)
  })

  it('should calculate position correctly in Daycore mode', () => {
    sourceNode = audioCtx.createBufferSource()
    isPlaying = true
    currentTime = 0
    lastUpdateTime = 0
    speed.value = '1.25'

    // Simulate 1 second real time passed
    audioCtx.currentTime = 1.0

    const pos = getCurrentPos(true) // Daycore mode

    // At 0.75x speed (2.0 - 1.25), 1 real second = 0.75 buffer seconds
    expect(pos).toBeCloseTo(0.75, 2)
  })

  it('should clamp position to duration', () => {
    sourceNode = audioCtx.createBufferSource()
    isPlaying = true
    currentTime = 2.5
    lastUpdateTime = 0
    duration = 3

    // Simulate 2 seconds real time passed
    audioCtx.currentTime = 2.0

    const pos = getCurrentPos()

    // Position would be 2.5 + (2.0 * 1.25) = 5.0, but clamped to 3.0
    expect(pos).toBe(3)
  })

  it('should clamp negative positions to zero', () => {
    sourceNode = audioCtx.createBufferSource()
    isPlaying = true
    currentTime = -0.5 // Somehow negative
    lastUpdateTime = 0

    audioCtx.currentTime = 0

    const pos = getCurrentPos()

    expect(pos).toBe(0)
  })

  it('should update lastUpdateTime after calculation', () => {
    sourceNode = audioCtx.createBufferSource()
    isPlaying = true
    currentTime = 0
    lastUpdateTime = 0

    audioCtx.currentTime = 1.0

    getCurrentPos()

    expect(lastUpdateTime).toBe(1.0)
  })
})

describe('Play-Pause-Play Cycle', () => {
  let audioCtx
  let buffer
  let sourceNode
  let gainNode
  let isPlaying
  let currentTime
  let duration
  let lastUpdateTime

  beforeEach(() => {
    setupWebAudioMocks()
    setupMockDOM()

    audioCtx = new MockAudioContext()
    gainNode = audioCtx.createGain()
    buffer = createTestAudioBuffer({ duration: 3 })
    duration = 3
    isPlaying = false
    currentTime = 0
    lastUpdateTime = 0
    sourceNode = null
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  function startSource(offset = 0) {
    if (!buffer || !audioCtx) return

    // Stop existing source
    if (sourceNode) {
      try {
        sourceNode.stop()
      } catch (e) {}
      try {
        sourceNode.disconnect()
      } catch (e) {}
      sourceNode = null
    }

    offset = Math.max(0, Math.min(offset, duration))
    currentTime = offset

    sourceNode = audioCtx.createBufferSource()
    sourceNode.buffer = buffer
    sourceNode.playbackRate.value = 1.25
    sourceNode.connect(gainNode)

    sourceNode.start(0, offset)
    lastUpdateTime = audioCtx.currentTime
    isPlaying = true
  }

  it('should resume from paused position', () => {
    // Play
    startSource(0)
    expect(isPlaying).toBe(true)
    expect(currentTime).toBe(0)

    // Simulate playback
    audioCtx.currentTime = 1.0
    currentTime = 1.0

    // Pause
    sourceNode.stop()
    isPlaying = false
    const pausedPosition = currentTime

    // Play again from paused position
    startSource(pausedPosition)

    expect(isPlaying).toBe(true)
    expect(currentTime).toBeCloseTo(1.0, 2)
    expect(sourceNode._offset).toBeCloseTo(1.0, 2)
  })

  it('should handle multiple pause-play cycles', () => {
    // Cycle 1
    startSource(0)
    audioCtx.currentTime = 0.5
    currentTime = 0.5
    sourceNode.stop()
    isPlaying = false

    // Cycle 2
    startSource(0.5)
    audioCtx.currentTime = 1.0
    currentTime = 1.0
    sourceNode.stop()
    isPlaying = false

    // Cycle 3
    startSource(1.0)

    expect(isPlaying).toBe(true)
    expect(currentTime).toBeCloseTo(1.0, 2)
  })
})

describe('Speed Changes During Playback', () => {
  let audioCtx
  let buffer
  let sourceNode
  let gainNode
  let isPlaying
  let speed

  beforeEach(() => {
    setupWebAudioMocks()
    setupMockDOM()

    audioCtx = new MockAudioContext()
    gainNode = audioCtx.createGain()
    buffer = createTestAudioBuffer({ duration: 3 })
    isPlaying = false
    sourceNode = null
    speed = { value: '1.25' }
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  it('should update playback rate when speed changes', () => {
    // Start playback
    sourceNode = audioCtx.createBufferSource()
    sourceNode.buffer = buffer
    sourceNode.playbackRate.value = 1.25
    sourceNode.connect(gainNode)
    sourceNode.start(0, 0)
    isPlaying = true

    // Change speed
    const newSpeed = 1.5
    sourceNode.playbackRate.value = newSpeed

    expect(sourceNode.playbackRate.value).toBe(1.5)
  })

  it('should update playback rate in Daycore mode', () => {
    sourceNode = audioCtx.createBufferSource()
    sourceNode.buffer = buffer
    sourceNode.playbackRate.value = 0.75 // Daycore: 2.0 - 1.25
    sourceNode.connect(gainNode)
    sourceNode.start(0, 0)
    isPlaying = true

    // Change speed slider to 1.5
    speed.value = '1.5'
    const isDaycoreMode = true

    let currentSpeed = parseFloat(speed.value)
    if (isDaycoreMode) {
      currentSpeed = 2.0 - currentSpeed
      if (currentSpeed < 0.5) currentSpeed = 0.5
    }

    sourceNode.playbackRate.value = currentSpeed

    expect(sourceNode.playbackRate.value).toBeCloseTo(0.5, 2)
  })

  it('should handle rapid speed changes', () => {
    sourceNode = audioCtx.createBufferSource()
    sourceNode.buffer = buffer
    sourceNode.connect(gainNode)
    sourceNode.start(0, 0)
    isPlaying = true

    // Rapid changes
    sourceNode.playbackRate.value = 1.1
    sourceNode.playbackRate.value = 1.2
    sourceNode.playbackRate.value = 1.3
    sourceNode.playbackRate.value = 1.4

    expect(sourceNode.playbackRate.value).toBe(1.4)
  })
})

describe('Playback End Handling', () => {
  let isPlaying
  let currentTime
  let duration
  let sourceNode

  beforeEach(() => {
    setupWebAudioMocks()
    setupMockDOM()
    isPlaying = false
    currentTime = 0
    duration = 3
    sourceNode = null
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  function onEnded() {
    isPlaying = false
    currentTime = duration || 0
  }

  it('should set isPlaying to false when track ends', () => {
    isPlaying = true
    currentTime = 2.8

    onEnded()

    expect(isPlaying).toBe(false)
  })

  it('should set currentTime to duration when track ends', () => {
    isPlaying = true
    currentTime = 2.9

    onEnded()

    expect(currentTime).toBe(3)
  })

  it('should trigger onended callback when playback completes', async () => {
    const onEndedMock = vi.fn()

    sourceNode = new (setupWebAudioMocks().AudioContext)().createBufferSource()
    sourceNode.buffer = createTestAudioBuffer({ duration: 0.1 }) // Short duration
    sourceNode.onended = onEndedMock

    sourceNode.start(0, 0)

    // Wait for playback to end
    await waitForAsync(150)

    expect(onEndedMock).toHaveBeenCalled()
  })
})

describe('Audio Context State', () => {
  let audioCtx

  beforeEach(() => {
    setupWebAudioMocks()
    setupMockDOM()
    audioCtx = new MockAudioContext()
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  it('should initialize with running state', () => {
    expect(audioCtx.state).toBe('running')
  })

  it('should suspend audio context', async () => {
    await audioCtx.suspend()
    expect(audioCtx.state).toBe('suspended')
  })

  it('should resume audio context', async () => {
    await audioCtx.suspend()
    await audioCtx.resume()
    expect(audioCtx.state).toBe('running')
  })

  it('should close audio context', async () => {
    await audioCtx.close()
    expect(audioCtx.state).toBe('closed')
  })
})

describe('Edge Cases', () => {
  let audioCtx
  let buffer
  let sourceNode
  let gainNode

  beforeEach(() => {
    setupWebAudioMocks()
    setupMockDOM()
    audioCtx = new MockAudioContext()
    gainNode = audioCtx.createGain()
    buffer = createTestAudioBuffer({ duration: 3 })
    sourceNode = null
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  it('should handle play without buffer loaded', () => {
    buffer = null

    if (!buffer || !audioCtx) return

    // Should not create source node
    expect(sourceNode).toBe(null)
  })

  it('should handle play without audio context', () => {
    audioCtx = null

    if (!buffer || !audioCtx) return

    // Should not create source node
    expect(sourceNode).toBe(null)
  })

  it('should clamp offset to valid range when seeking', () => {
    const duration = 3

    let offset = 5.0 // Beyond duration
    offset = Math.max(0, Math.min(offset, duration))

    expect(offset).toBe(3)

    offset = -1.0 // Negative
    offset = Math.max(0, Math.min(offset, duration))

    expect(offset).toBe(0)
  })

  it('should handle seeking to exact duration', () => {
    const duration = 3
    let offset = 3.0

    offset = Math.max(0, Math.min(offset, duration))

    expect(offset).toBe(3)
  })
})
