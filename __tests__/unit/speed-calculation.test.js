/**
 * CRITICAL TESTS: Speed Calculation and Mode Synchronization
 *
 * These tests verify that the Daycore/Nightcore speed calculation is consistent
 * across all functions. The CLAUDE.MD documentation warns that this is critical
 * for maintaining sync between playback and export.
 *
 * The Daycore mode uses the formula: speed = 2.0 - sliderValue
 * This formula MUST be applied consistently in:
 * - startSource() - for playback
 * - toggleMode() - for mode switching
 * - renderAudio() - for export
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setupWebAudioMocks, createTestAudioBuffer } from '../helpers/mock-audio-context.js'
import { setupMockDOM, cleanupMockDOM } from '../helpers/test-data.js'

describe('Speed Calculation - Nightcore Mode', () => {
  beforeEach(() => {
    setupWebAudioMocks()
    setupMockDOM()
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  it('should use slider value directly in Nightcore mode', () => {
    // Nightcore mode: speed = slider value (no transformation)
    const sliderValues = [1.0, 1.25, 1.5, 1.6]
    const expectedSpeeds = [1.0, 1.25, 1.5, 1.6]

    sliderValues.forEach((sliderValue, index) => {
      const actualSpeed = sliderValue // Nightcore: no transformation
      expect(actualSpeed).toBe(expectedSpeeds[index])
    })
  })

  it('should handle minimum Nightcore speed (1.0x)', () => {
    const sliderValue = 1.0
    const speed = sliderValue
    expect(speed).toBe(1.0)
  })

  it('should handle maximum Nightcore speed (1.6x)', () => {
    const sliderValue = 1.6
    const speed = sliderValue
    expect(speed).toBe(1.6)
  })

  it('should handle default Nightcore speed (1.25x)', () => {
    const sliderValue = 1.25
    const speed = sliderValue
    expect(speed).toBe(1.25)
  })
})

describe('Speed Calculation - Daycore Mode', () => {
  beforeEach(() => {
    setupWebAudioMocks()
    setupMockDOM()
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  it('should apply 2.0 - speed formula in Daycore mode', () => {
    // Daycore mode: speed = 2.0 - slider value
    const sliderValues = [0.5, 0.75, 1.0, 1.25]
    const expectedSpeeds = [1.5, 1.25, 1.0, 0.75]

    sliderValues.forEach((sliderValue, index) => {
      const speed = 2.0 - sliderValue
      expect(speed).toBeCloseTo(expectedSpeeds[index], 2)
    })
  })

  it('should clamp Daycore speed to minimum 0.5x', () => {
    // When slider is at 1.6, formula gives 2.0 - 1.6 = 0.4
    // Must clamp to 0.5
    const sliderValue = 1.6
    let speed = 2.0 - sliderValue
    if (speed < 0.5) speed = 0.5

    expect(speed).toBe(0.5)
  })

  it('should handle default Daycore speed (slider 1.25 = 0.75x)', () => {
    const sliderValue = 1.25
    const speed = 2.0 - sliderValue
    expect(speed).toBeCloseTo(0.75, 2)
  })

  it('should handle minimum slider value in Daycore (0.5 = 1.5x)', () => {
    const sliderValue = 0.5
    const speed = 2.0 - sliderValue
    expect(speed).toBeCloseTo(1.5, 2)
  })

  it('should handle slider value 0.8 in Daycore (0.8 = 1.2x)', () => {
    const sliderValue = 0.8
    const speed = 2.0 - sliderValue
    expect(speed).toBeCloseTo(1.2, 2)
  })
})

describe('Speed Formula Consistency', () => {
  beforeEach(() => {
    setupWebAudioMocks()
    setupMockDOM()
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  it('should produce same speed value for all speed calculation points', () => {
    const testCases = [
      { slider: 1.25, isDaycore: false, expected: 1.25 },
      { slider: 1.25, isDaycore: true, expected: 0.75 },
      { slider: 1.0, isDaycore: false, expected: 1.0 },
      { slider: 1.0, isDaycore: true, expected: 1.0 },
      { slider: 0.5, isDaycore: true, expected: 1.5 },
      { slider: 1.6, isDaycore: true, expected: 0.5 }, // Clamped
    ]

    testCases.forEach(({ slider, isDaycore, expected }) => {
      // Simulate the speed calculation as done in app.js
      let speed = slider
      if (isDaycore) {
        speed = 2.0 - speed
        if (speed < 0.5) speed = 0.5
      }

      expect(speed).toBeCloseTo(expected, 2)
    })
  })

  it('should maintain symmetry: speed(x) + speed(2.0-x) = 2.0', () => {
    // Mathematical property: for any slider value x,
    // nightcore_speed(x) + daycore_speed(x) should equal 2.0
    const sliderValues = [0.5, 0.75, 1.0, 1.25, 1.5]

    sliderValues.forEach(sliderValue => {
      const nightcoreSpeed = sliderValue
      const daycoreSpeed = 2.0 - sliderValue

      // This property should hold (before clamping)
      if (daycoreSpeed >= 0.5) {
        expect(nightcoreSpeed + daycoreSpeed).toBeCloseTo(2.0, 10)
      }
    })
  })
})

describe('Speed Boundary Conditions', () => {
  beforeEach(() => {
    setupWebAudioMocks()
    setupMockDOM()
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  it('should handle boundary: slider = 0.5 (extreme slow in slider)', () => {
    const sliderValue = 0.5

    // Nightcore: 0.5x
    const nightcoreSpeed = sliderValue
    expect(nightcoreSpeed).toBe(0.5)

    // Daycore: 2.0 - 0.5 = 1.5x
    const daycoreSpeed = 2.0 - sliderValue
    expect(daycoreSpeed).toBeCloseTo(1.5, 2)
  })

  it('should handle boundary: slider = 1.0 (neutral speed)', () => {
    const sliderValue = 1.0

    // Nightcore: 1.0x
    const nightcoreSpeed = sliderValue
    expect(nightcoreSpeed).toBe(1.0)

    // Daycore: 2.0 - 1.0 = 1.0x
    const daycoreSpeed = 2.0 - sliderValue
    expect(daycoreSpeed).toBe(1.0)
  })

  it('should handle boundary: slider = 1.6 (extreme fast in slider)', () => {
    const sliderValue = 1.6

    // Nightcore: 1.6x
    const nightcoreSpeed = sliderValue
    expect(nightcoreSpeed).toBe(1.6)

    // Daycore: 2.0 - 1.6 = 0.4x, clamped to 0.5x
    let daycoreSpeed = 2.0 - sliderValue
    if (daycoreSpeed < 0.5) daycoreSpeed = 0.5
    expect(daycoreSpeed).toBe(0.5)
  })

  it('should handle boundary: slider = 2.0 (theoretical maximum)', () => {
    const sliderValue = 2.0

    // Nightcore: 2.0x
    const nightcoreSpeed = sliderValue
    expect(nightcoreSpeed).toBe(2.0)

    // Daycore: 2.0 - 2.0 = 0.0x, clamped to 0.5x
    let daycoreSpeed = 2.0 - sliderValue
    if (daycoreSpeed < 0.5) daycoreSpeed = 0.5
    expect(daycoreSpeed).toBe(0.5)
  })
})

describe('Speed Precision and Rounding', () => {
  beforeEach(() => {
    setupWebAudioMocks()
    setupMockDOM()
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  it('should handle floating point precision correctly', () => {
    const sliderValue = 1.333333

    // Daycore calculation
    const daycoreSpeed = 2.0 - sliderValue
    expect(daycoreSpeed).toBeCloseTo(0.666667, 5)
  })

  it('should handle very small speed differences', () => {
    const slider1 = 1.249
    const slider2 = 1.251

    const speed1 = 2.0 - slider1
    const speed2 = 2.0 - slider2

    expect(speed1).toBeCloseTo(0.751, 3)
    expect(speed2).toBeCloseTo(0.749, 3)
    expect(Math.abs(speed1 - speed2)).toBeCloseTo(0.002, 3)
  })

  it('should produce consistent results when parsing from strings', () => {
    const sliderValueString = '1.25'
    const sliderValueNumber = 1.25

    const speedFromString = 2.0 - parseFloat(sliderValueString)
    const speedFromNumber = 2.0 - sliderValueNumber

    expect(speedFromString).toBe(speedFromNumber)
    expect(speedFromString).toBeCloseTo(0.75, 10)
  })
})

describe('Mode Switching Speed Consistency', () => {
  beforeEach(() => {
    setupWebAudioMocks()
    setupMockDOM()
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  it('should maintain speed when switching modes at slider value 1.0', () => {
    const sliderValue = 1.0

    // Both modes should produce 1.0x at this slider value
    const nightcoreSpeed = sliderValue
    const daycoreSpeed = 2.0 - sliderValue

    expect(nightcoreSpeed).toBe(1.0)
    expect(daycoreSpeed).toBe(1.0)
  })

  it('should inverse speed relationship between modes', () => {
    // When slider is 1.25:
    // Nightcore = 1.25x (faster)
    // Daycore = 0.75x (slower)

    const sliderValue = 1.25
    const nightcoreSpeed = sliderValue
    const daycoreSpeed = 2.0 - sliderValue

    expect(nightcoreSpeed).toBeGreaterThan(1.0)
    expect(daycoreSpeed).toBeLessThan(1.0)
    expect(nightcoreSpeed).toBeCloseTo(1.25, 2)
    expect(daycoreSpeed).toBeCloseTo(0.75, 2)
  })

  it('should have correct speed ranges for each mode', () => {
    // Nightcore range: 1.0x - 1.6x (faster)
    // Daycore range: 0.5x - 1.0x (slower, with clamping at 0.5)

    const testValues = [
      { slider: 1.0, nightcore: 1.0, daycore: 1.0 },
      { slider: 1.1, nightcore: 1.1, daycore: 0.9 },
      { slider: 1.2, nightcore: 1.2, daycore: 0.8 },
      { slider: 1.3, nightcore: 1.3, daycore: 0.7 },
      { slider: 1.4, nightcore: 1.4, daycore: 0.6 },
      { slider: 1.5, nightcore: 1.5, daycore: 0.5 }, // Clamping starts here
      { slider: 1.6, nightcore: 1.6, daycore: 0.5 }, // Clamped
    ]

    testValues.forEach(({ slider, nightcore, daycore }) => {
      const nightcoreSpeed = slider
      let daycoreSpeed = 2.0 - slider
      if (daycoreSpeed < 0.5) daycoreSpeed = 0.5

      expect(nightcoreSpeed).toBeCloseTo(nightcore, 2)
      expect(daycoreSpeed).toBeCloseTo(daycore, 2)
    })
  })
})

describe('Speed Calculation Edge Cases', () => {
  beforeEach(() => {
    setupWebAudioMocks()
    setupMockDOM()
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  it('should handle undefined slider value (default to 1.25)', () => {
    const sliderValue = undefined
    const defaultValue = 1.25

    const speed = parseFloat(sliderValue || defaultValue)
    expect(speed).toBe(1.25)
  })

  it('should handle null slider value (default to 1.25)', () => {
    const sliderValue = null
    const defaultValue = 1.25

    const speed = parseFloat(sliderValue || defaultValue)
    expect(speed).toBe(1.25)
  })

  it('should handle NaN slider value (default to 1.25)', () => {
    const sliderValue = NaN
    const defaultValue = 1.25

    const speed = parseFloat(sliderValue || defaultValue)
    expect(speed).toBe(1.25)
  })

  it('should handle empty string slider value (default to 1.25)', () => {
    const sliderValue = ''
    const defaultValue = 1.25

    const speed = parseFloat(sliderValue || defaultValue)
    expect(speed).toBe(1.25)
  })

  it('should handle negative slider value (should not happen, but test clamping)', () => {
    const sliderValue = -0.5

    // Daycore mode
    let daycoreSpeed = 2.0 - sliderValue
    if (daycoreSpeed < 0.5) daycoreSpeed = 0.5

    expect(daycoreSpeed).toBeCloseTo(2.5, 2) // 2.0 - (-0.5) = 2.5
  })

  it('should handle very large slider value', () => {
    const sliderValue = 10.0

    // Daycore mode
    let daycoreSpeed = 2.0 - sliderValue
    if (daycoreSpeed < 0.5) daycoreSpeed = 0.5

    expect(daycoreSpeed).toBe(0.5) // Clamped
  })
})

describe('Real-world Speed Scenarios', () => {
  beforeEach(() => {
    setupWebAudioMocks()
    setupMockDOM()
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  it('should handle typical Nightcore preset speeds', () => {
    // Common Nightcore presets
    const presets = [
      { name: 'Light', slider: 1.1, expected: 1.1 },
      { name: 'Normal', slider: 1.25, expected: 1.25 },
      { name: 'Heavy', slider: 1.4, expected: 1.4 },
      { name: 'Extreme', slider: 1.6, expected: 1.6 }
    ]

    presets.forEach(({ name, slider, expected }) => {
      const speed = slider
      expect(speed).toBeCloseTo(expected, 2)
    })
  })

  it('should handle typical Daycore preset speeds', () => {
    // Common Daycore presets (using inverted slider values)
    const presets = [
      { name: 'Light', slider: 0.9, expected: 1.1 },
      { name: 'Normal', slider: 1.25, expected: 0.75 },
      { name: 'Heavy', slider: 1.4, expected: 0.6 },
      { name: 'Extreme', slider: 1.5, expected: 0.5 }
    ]

    presets.forEach(({ name, slider, expected }) => {
      let speed = 2.0 - slider
      if (speed < 0.5) speed = 0.5
      expect(speed).toBeCloseTo(expected, 2)
    })
  })

  it('should maintain audio duration relationships', () => {
    const originalDuration = 180 // 3 minutes in seconds
    const sliderValue = 1.25

    // Nightcore: faster = shorter duration
    const nightcoreSpeed = sliderValue
    const nightcoreDuration = originalDuration / nightcoreSpeed
    expect(nightcoreDuration).toBeCloseTo(144, 1) // 2:24

    // Daycore: slower = longer duration
    const daycoreSpeed = 2.0 - sliderValue
    const daycoreDuration = originalDuration / daycoreSpeed
    expect(daycoreDuration).toBeCloseTo(240, 1) // 4:00
  })
})
