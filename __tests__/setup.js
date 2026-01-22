/**
 * Global test setup file
 * Runs before all tests to configure the test environment
 */

import { vi } from 'vitest'

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem(key) {
    return this.store[key] || null
  },
  setItem(key, value) {
    this.store[key] = String(value)
  },
  removeItem(key) {
    delete this.store[key]
  },
  clear() {
    this.store = {}
  }
}

global.localStorage = localStorageMock

// Mock sessionStorage (same interface as localStorage)
global.sessionStorage = { ...localStorageMock, store: {} }

// Mock navigator properties
Object.defineProperty(global.navigator, 'language', {
  value: 'en-US',
  writable: true,
  configurable: true
})

Object.defineProperty(global.navigator, 'languages', {
  value: ['en-US', 'en'],
  writable: true,
  configurable: true
})

// Mock window.matchMedia for theme detection
global.matchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
}))

// Mock console methods to reduce noise in tests (can be overridden per test)
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

// Mock alert/confirm/prompt
global.alert = vi.fn()
global.confirm = vi.fn(() => true)
global.prompt = vi.fn(() => null)

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

// Reset all mocks before each test
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.clearAllMocks()
})
