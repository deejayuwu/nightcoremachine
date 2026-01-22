/**
 * Mock Canvas API for testing
 * Simulates HTMLCanvasElement and CanvasRenderingContext2D
 */

import { vi } from 'vitest'

/**
 * Mock CanvasGradient
 */
export class MockCanvasGradient {
  constructor() {
    this.colorStops = []
  }

  addColorStop(offset, color) {
    this.colorStops.push({ offset, color })
  }
}

/**
 * Mock CanvasRenderingContext2D
 */
export class MockCanvasRenderingContext2D {
  constructor(canvas) {
    this.canvas = canvas
    this.fillStyle = '#000000'
    this.strokeStyle = '#000000'
    this.lineWidth = 1
    this.lineCap = 'butt'
    this.lineJoin = 'miter'
    this.globalAlpha = 1
    this.globalCompositeOperation = 'source-over'
    this.font = '10px sans-serif'
    this.textAlign = 'start'
    this.textBaseline = 'alphabetic'

    // Track draw calls for testing
    this._drawCalls = []
  }

  // Rectangle methods
  clearRect(x, y, width, height) {
    this._drawCalls.push({ method: 'clearRect', args: [x, y, width, height] })
  }

  fillRect(x, y, width, height) {
    this._drawCalls.push({ method: 'fillRect', args: [x, y, width, height] })
  }

  strokeRect(x, y, width, height) {
    this._drawCalls.push({ method: 'strokeRect', args: [x, y, width, height] })
  }

  // Path methods
  beginPath() {
    this._drawCalls.push({ method: 'beginPath', args: [] })
  }

  closePath() {
    this._drawCalls.push({ method: 'closePath', args: [] })
  }

  moveTo(x, y) {
    this._drawCalls.push({ method: 'moveTo', args: [x, y] })
  }

  lineTo(x, y) {
    this._drawCalls.push({ method: 'lineTo', args: [x, y] })
  }

  arc(x, y, radius, startAngle, endAngle, counterclockwise = false) {
    this._drawCalls.push({
      method: 'arc',
      args: [x, y, radius, startAngle, endAngle, counterclockwise]
    })
  }

  // Drawing methods
  fill() {
    this._drawCalls.push({ method: 'fill', args: [] })
  }

  stroke() {
    this._drawCalls.push({ method: 'stroke', args: [] })
  }

  // Image methods
  drawImage(...args) {
    this._drawCalls.push({ method: 'drawImage', args })
  }

  // Gradient methods
  createLinearGradient(x0, y0, x1, y1) {
    return new MockCanvasGradient()
  }

  createRadialGradient(x0, y0, r0, x1, y1, r1) {
    return new MockCanvasGradient()
  }

  // Text methods
  fillText(text, x, y, maxWidth) {
    this._drawCalls.push({ method: 'fillText', args: [text, x, y, maxWidth] })
  }

  strokeText(text, x, y, maxWidth) {
    this._drawCalls.push({ method: 'strokeText', args: [text, x, y, maxWidth] })
  }

  measureText(text) {
    return { width: text.length * 8 } // Approximate
  }

  // State methods
  save() {
    this._drawCalls.push({ method: 'save', args: [] })
  }

  restore() {
    this._drawCalls.push({ method: 'restore', args: [] })
  }

  // Transform methods
  translate(x, y) {
    this._drawCalls.push({ method: 'translate', args: [x, y] })
  }

  rotate(angle) {
    this._drawCalls.push({ method: 'rotate', args: [angle] })
  }

  scale(x, y) {
    this._drawCalls.push({ method: 'scale', args: [x, y] })
  }

  // Get draw calls for testing
  getDrawCalls() {
    return this._drawCalls
  }

  clearDrawCalls() {
    this._drawCalls = []
  }
}

/**
 * Mock HTMLCanvasElement
 */
export class MockHTMLCanvasElement {
  constructor(width = 300, height = 150) {
    this.width = width
    this.height = height
    this.style = {}
    this._context = null
    this._listeners = {}
    this.parentElement = null
  }

  getContext(contextType, options) {
    if (contextType === '2d') {
      if (!this._context) {
        this._context = new MockCanvasRenderingContext2D(this)
      }
      return this._context
    }
    return null
  }

  toDataURL(type = 'image/png', quality = 0.92) {
    return `data:${type};base64,mockBase64Data==`
  }

  toBlob(callback, type = 'image/png', quality = 0.92) {
    // Create a mock blob
    const blob = new Blob(['mock image data'], { type })

    // Call callback asynchronously to match real behavior
    setTimeout(() => {
      callback(blob)
    }, 0)
  }

  addEventListener(event, handler) {
    if (!this._listeners[event]) {
      this._listeners[event] = []
    }
    this._listeners[event].push(handler)
  }

  removeEventListener(event, handler) {
    if (this._listeners[event]) {
      this._listeners[event] = this._listeners[event].filter(h => h !== handler)
    }
  }

  dispatchEvent(event) {
    if (this._listeners[event.type]) {
      this._listeners[event.type].forEach(handler => handler(event))
    }
  }

  getBoundingClientRect() {
    return {
      x: 0,
      y: 0,
      width: this.width,
      height: this.height,
      top: 0,
      left: 0,
      right: this.width,
      bottom: this.height
    }
  }
}

/**
 * Mock Image element
 */
export class MockImage {
  constructor() {
    this.src = ''
    this.width = 0
    this.height = 0
    this.onload = null
    this.onerror = null
    this.crossOrigin = null
  }

  set src(value) {
    this._src = value
    // Simulate async image loading
    setTimeout(() => {
      if (this.onload) {
        // Set some default dimensions
        this.width = 1000
        this.height = 1000
        this.onload()
      }
    }, 0)
  }

  get src() {
    return this._src
  }
}

/**
 * Setup Canvas API mocks in global scope
 */
export function setupCanvasMocks() {
  // Mock document.createElement for canvas
  const originalCreateElement = document.createElement.bind(document)

  document.createElement = vi.fn((tagName) => {
    if (tagName.toLowerCase() === 'canvas') {
      return new MockHTMLCanvasElement()
    }
    return originalCreateElement(tagName)
  })

  // Mock HTMLCanvasElement prototype
  if (typeof HTMLCanvasElement !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = vi.fn(function(contextType) {
      if (contextType === '2d') {
        return new MockCanvasRenderingContext2D(this)
      }
      return null
    })

    HTMLCanvasElement.prototype.toDataURL = vi.fn(function(type, quality) {
      return `data:${type || 'image/png'};base64,mockBase64Data==`
    })

    HTMLCanvasElement.prototype.toBlob = vi.fn(function(callback, type, quality) {
      const blob = new Blob(['mock image data'], { type: type || 'image/png' })
      setTimeout(() => callback(blob), 0)
    })
  }

  // Mock Image constructor
  global.Image = MockImage

  return {
    HTMLCanvasElement: MockHTMLCanvasElement,
    CanvasRenderingContext2D: MockCanvasRenderingContext2D,
    Image: MockImage
  }
}

/**
 * Create a mock canvas element for testing
 */
export function createMockCanvas(width = 300, height = 150) {
  return new MockHTMLCanvasElement(width, height)
}

/**
 * Get draw calls from a canvas context
 */
export function getCanvasDrawCalls(canvas) {
  const ctx = canvas.getContext('2d')
  return ctx ? ctx.getDrawCalls() : []
}

/**
 * Assert that a specific method was called on canvas context
 */
export function assertCanvasMethodCalled(canvas, methodName, times = 1) {
  const calls = getCanvasDrawCalls(canvas)
  const methodCalls = calls.filter(call => call.method === methodName)
  return methodCalls.length === times
}
