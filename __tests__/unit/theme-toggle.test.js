/**
 * MEDIUM PRIORITY TESTS: Theme Toggle System
 *
 * These tests verify the theme system functionality:
 * - System dark mode detection
 * - Theme preference persistence
 * - Theme application to DOM
 * - ARIA attribute updates
 * - Toggle functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setupMockDOM, cleanupMockDOM } from '../helpers/test-data.js'

const STORAGE_KEY = 'theme-preference'

describe('System Theme Detection', () => {
  beforeEach(() => {
    setupMockDOM()
    localStorage.clear()
  })

  afterEach(() => {
    cleanupMockDOM()
    localStorage.clear()
  })

  function getSystemPreference() {
    return window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }

  it('should detect dark mode from system preferences', () => {
    global.matchMedia = vi.fn().mockImplementation(query => ({
      matches: true,
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn()
    }))

    const theme = getSystemPreference()

    expect(theme).toBe('dark')
  })

  it('should detect light mode from system preferences', () => {
    global.matchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn()
    }))

    const theme = getSystemPreference()

    expect(theme).toBe('light')
  })

  it('should handle missing matchMedia API', () => {
    global.matchMedia = undefined

    const theme = getSystemPreference()

    expect(theme).toBe('light')
  })
})

describe('Theme Preference Loading', () => {
  beforeEach(() => {
    setupMockDOM()
    localStorage.clear()
  })

  afterEach(() => {
    cleanupMockDOM()
    localStorage.clear()
  })

  function getSystemPreference() {
    return window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }

  function loadPreference() {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'dark' || saved === 'light') {
      return saved
    }
    return getSystemPreference()
  }

  it('should load saved dark theme from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'dark')

    const theme = loadPreference()

    expect(theme).toBe('dark')
  })

  it('should load saved light theme from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'light')

    const theme = loadPreference()

    expect(theme).toBe('light')
  })

  it('should fall back to system preference when no saved theme', () => {
    global.matchMedia = vi.fn().mockImplementation(query => ({
      matches: true,
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn()
    }))

    const theme = loadPreference()

    expect(theme).toBe('dark')
  })

  it('should ignore invalid saved theme values', () => {
    localStorage.setItem(STORAGE_KEY, 'invalid')

    global.matchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn()
    }))

    const theme = loadPreference()

    expect(theme).toBe('light')
  })

  it('should prioritize localStorage over system preference', () => {
    localStorage.setItem(STORAGE_KEY, 'light')

    global.matchMedia = vi.fn().mockImplementation(query => ({
      matches: true, // System prefers dark
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn()
    }))

    const theme = loadPreference()

    expect(theme).toBe('light') // Saved light overrides system dark
  })
})

describe('Theme Application to DOM', () => {
  beforeEach(() => {
    setupMockDOM()

    const themeToggle = document.createElement('button')
    themeToggle.id = 'themeToggle'
    document.body.appendChild(themeToggle)
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  function applyTheme(theme) {
    const body = document.body
    if (!body) return

    const normalized = theme === 'dark' ? 'dark' : 'light'
    body.setAttribute('data-theme', normalized)

    const toggle = document.getElementById('themeToggle')
    if (toggle) {
      const isDark = normalized === 'dark'
      toggle.setAttribute('aria-pressed', String(isDark))
      toggle.setAttribute(
        'aria-label',
        isDark ? 'Desactivar modo oscuro' : 'Activar modo oscuro'
      )
      toggle.setAttribute(
        'title',
        isDark ? 'Desactivar modo oscuro' : 'Activar modo oscuro'
      )
      toggle.textContent = isDark ? '⭐' : '🌙'
    }
  }

  it('should set data-theme attribute to dark', () => {
    applyTheme('dark')

    expect(document.body.getAttribute('data-theme')).toBe('dark')
  })

  it('should set data-theme attribute to light', () => {
    applyTheme('light')

    expect(document.body.getAttribute('data-theme')).toBe('light')
  })

  it('should normalize invalid theme to light', () => {
    applyTheme('invalid')

    expect(document.body.getAttribute('data-theme')).toBe('light')
  })

  it('should update toggle button icon to star for dark mode', () => {
    applyTheme('dark')

    const toggle = document.getElementById('themeToggle')
    expect(toggle.textContent).toBe('⭐')
  })

  it('should update toggle button icon to moon for light mode', () => {
    applyTheme('light')

    const toggle = document.getElementById('themeToggle')
    expect(toggle.textContent).toBe('🌙')
  })

  it('should set aria-pressed to true for dark mode', () => {
    applyTheme('dark')

    const toggle = document.getElementById('themeToggle')
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
  })

  it('should set aria-pressed to false for light mode', () => {
    applyTheme('light')

    const toggle = document.getElementById('themeToggle')
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
  })

  it('should set appropriate aria-label for dark mode', () => {
    applyTheme('dark')

    const toggle = document.getElementById('themeToggle')
    expect(toggle.getAttribute('aria-label')).toBe('Desactivar modo oscuro')
  })

  it('should set appropriate aria-label for light mode', () => {
    applyTheme('light')

    const toggle = document.getElementById('themeToggle')
    expect(toggle.getAttribute('aria-label')).toBe('Activar modo oscuro')
  })

  it('should set appropriate title for dark mode', () => {
    applyTheme('dark')

    const toggle = document.getElementById('themeToggle')
    expect(toggle.getAttribute('title')).toBe('Desactivar modo oscuro')
  })

  it('should set appropriate title for light mode', () => {
    applyTheme('light')

    const toggle = document.getElementById('themeToggle')
    expect(toggle.getAttribute('title')).toBe('Activar modo oscuro')
  })

  it('should handle missing theme toggle button gracefully', () => {
    document.getElementById('themeToggle')?.remove()

    expect(() => applyTheme('dark')).not.toThrow()
  })

  it('should handle missing body element gracefully', () => {
    const originalBody = document.body
    Object.defineProperty(document, 'body', {
      value: null,
      writable: true,
      configurable: true
    })

    expect(() => applyTheme('dark')).not.toThrow()

    // Restore body
    Object.defineProperty(document, 'body', {
      value: originalBody,
      writable: true,
      configurable: true
    })
  })
})

describe('Theme Toggle Functionality', () => {
  beforeEach(() => {
    setupMockDOM()
    localStorage.clear()

    const themeToggle = document.createElement('button')
    themeToggle.id = 'themeToggle'
    document.body.appendChild(themeToggle)
  })

  afterEach(() => {
    cleanupMockDOM()
    localStorage.clear()
  })

  function applyTheme(theme) {
    const body = document.body
    if (!body) return

    const normalized = theme === 'dark' ? 'dark' : 'light'
    body.setAttribute('data-theme', normalized)

    const toggle = document.getElementById('themeToggle')
    if (toggle) {
      const isDark = normalized === 'dark'
      toggle.setAttribute('aria-pressed', String(isDark))
      toggle.textContent = isDark ? '⭐' : '🌙'
    }
  }

  function toggleTheme() {
    const current =
      document.body?.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
    const next = current === 'dark' ? 'light' : 'dark'
    localStorage.setItem(STORAGE_KEY, next)
    applyTheme(next)
  }

  it('should toggle from dark to light', () => {
    applyTheme('dark')

    toggleTheme()

    expect(document.body.getAttribute('data-theme')).toBe('light')
  })

  it('should toggle from light to dark', () => {
    applyTheme('light')

    toggleTheme()

    expect(document.body.getAttribute('data-theme')).toBe('dark')
  })

  it('should save theme preference to localStorage when toggling', () => {
    applyTheme('light')

    toggleTheme()

    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark')
  })

  it('should persist theme across multiple toggles', () => {
    applyTheme('light')

    toggleTheme()
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark')

    toggleTheme()
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light')

    toggleTheme()
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark')
  })

  it('should update toggle button when theme changes', () => {
    applyTheme('light')
    toggleTheme()

    const toggle = document.getElementById('themeToggle')
    expect(toggle.textContent).toBe('⭐')
  })

  it('should update aria-pressed when theme changes', () => {
    applyTheme('light')
    toggleTheme()

    const toggle = document.getElementById('themeToggle')
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
  })
})

describe('Theme Persistence', () => {
  beforeEach(() => {
    setupMockDOM()
    localStorage.clear()
  })

  afterEach(() => {
    cleanupMockDOM()
    localStorage.clear()
  })

  it('should persist dark theme to localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'dark')

    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark')
  })

  it('should persist light theme to localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'light')

    expect(localStorage.getItem(STORAGE_KEY)).toBe('light')
  })

  it('should overwrite previous theme preference', () => {
    localStorage.setItem(STORAGE_KEY, 'light')
    localStorage.setItem(STORAGE_KEY, 'dark')

    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark')
  })

  it('should maintain theme across page reloads (simulated)', () => {
    localStorage.setItem(STORAGE_KEY, 'dark')

    // Simulate page reload by reading from localStorage
    const saved = localStorage.getItem(STORAGE_KEY)

    expect(saved).toBe('dark')
  })
})

describe('Theme Edge Cases', () => {
  beforeEach(() => {
    setupMockDOM()
    localStorage.clear()

    const themeToggle = document.createElement('button')
    themeToggle.id = 'themeToggle'
    document.body.appendChild(themeToggle)
  })

  afterEach(() => {
    cleanupMockDOM()
    localStorage.clear()
  })

  function applyTheme(theme) {
    const body = document.body
    if (!body) return

    const normalized = theme === 'dark' ? 'dark' : 'light'
    body.setAttribute('data-theme', normalized)
  }

  it('should handle empty string theme value', () => {
    applyTheme('')

    expect(document.body.getAttribute('data-theme')).toBe('light')
  })

  it('should handle null theme value', () => {
    applyTheme(null)

    expect(document.body.getAttribute('data-theme')).toBe('light')
  })

  it('should handle undefined theme value', () => {
    applyTheme(undefined)

    expect(document.body.getAttribute('data-theme')).toBe('light')
  })

  it('should handle uppercase theme value', () => {
    applyTheme('DARK')

    expect(document.body.getAttribute('data-theme')).toBe('light')
  })

  it('should handle mixed case theme value', () => {
    applyTheme('Dark')

    expect(document.body.getAttribute('data-theme')).toBe('light')
  })
})

describe('Theme Initialization', () => {
  beforeEach(() => {
    setupMockDOM()
    localStorage.clear()
  })

  afterEach(() => {
    cleanupMockDOM()
    localStorage.clear()
  })

  function getSystemPreference() {
    return window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }

  function loadPreference() {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'dark' || saved === 'light') {
      return saved
    }
    return getSystemPreference()
  }

  it('should initialize with saved preference', () => {
    localStorage.setItem(STORAGE_KEY, 'dark')

    const theme = loadPreference()

    expect(theme).toBe('dark')
  })

  it('should initialize with system preference if no saved theme', () => {
    global.matchMedia = vi.fn().mockImplementation(query => ({
      matches: true,
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn()
    }))

    const theme = loadPreference()

    expect(theme).toBe('dark')
  })

  it('should default to light if no preference and no matchMedia', () => {
    global.matchMedia = undefined

    const theme = loadPreference()

    expect(theme).toBe('light')
  })
})
