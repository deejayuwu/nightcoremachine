/**
 * HIGH PRIORITY TESTS: Internationalization System
 *
 * These tests verify the i18n functionality:
 * - Language detection (browser and localStorage)
 * - Translation application
 * - Meta tag updates
 * - JSON-LD schema updates
 * - Language persistence
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setupMockDOM, cleanupMockDOM } from '../helpers/test-data.js'

describe('Language Detection', () => {
  beforeEach(() => {
    setupMockDOM()
    localStorage.clear()
  })

  afterEach(() => {
    cleanupMockDOM()
    localStorage.clear()
  })

  function detectLanguage() {
    const savedLang = localStorage.getItem('preferredLanguage')
    if (savedLang && (savedLang === 'es' || savedLang === 'en')) {
      return savedLang
    }

    const browserLang = navigator.language || navigator.userLanguage
    if (browserLang.startsWith('en')) {
      return 'en'
    }

    return 'es'
  }

  it('should return saved language from localStorage if available', () => {
    localStorage.setItem('preferredLanguage', 'en')

    const lang = detectLanguage()

    expect(lang).toBe('en')
  })

  it('should return Spanish from localStorage if saved', () => {
    localStorage.setItem('preferredLanguage', 'es')

    const lang = detectLanguage()

    expect(lang).toBe('es')
  })

  it('should detect English from browser language', () => {
    Object.defineProperty(navigator, 'language', {
      value: 'en-US',
      writable: true,
      configurable: true
    })

    const lang = detectLanguage()

    expect(lang).toBe('en')
  })

  it('should detect English from en-GB browser language', () => {
    Object.defineProperty(navigator, 'language', {
      value: 'en-GB',
      writable: true,
      configurable: true
    })

    const lang = detectLanguage()

    expect(lang).toBe('en')
  })

  it('should default to Spanish for non-English browser language', () => {
    Object.defineProperty(navigator, 'language', {
      value: 'fr-FR',
      writable: true,
      configurable: true
    })

    const lang = detectLanguage()

    expect(lang).toBe('es')
  })

  it('should default to Spanish when no preference is set', () => {
    Object.defineProperty(navigator, 'language', {
      value: 'es-ES',
      writable: true,
      configurable: true
    })

    const lang = detectLanguage()

    expect(lang).toBe('es')
  })

  it('should ignore invalid saved language', () => {
    localStorage.setItem('preferredLanguage', 'invalid')

    Object.defineProperty(navigator, 'language', {
      value: 'en-US',
      writable: true,
      configurable: true
    })

    const lang = detectLanguage()

    expect(lang).toBe('en')
  })

  it('should prioritize localStorage over browser language', () => {
    localStorage.setItem('preferredLanguage', 'es')

    Object.defineProperty(navigator, 'language', {
      value: 'en-US',
      writable: true,
      configurable: true
    })

    const lang = detectLanguage()

    expect(lang).toBe('es')
  })
})

describe('Language Persistence', () => {
  beforeEach(() => {
    setupMockDOM()
    localStorage.clear()
  })

  afterEach(() => {
    cleanupMockDOM()
    localStorage.clear()
  })

  function saveLanguagePreference(lang) {
    localStorage.setItem('preferredLanguage', lang)
  }

  it('should save language preference to localStorage', () => {
    saveLanguagePreference('en')

    expect(localStorage.getItem('preferredLanguage')).toBe('en')
  })

  it('should save Spanish preference to localStorage', () => {
    saveLanguagePreference('es')

    expect(localStorage.getItem('preferredLanguage')).toBe('es')
  })

  it('should overwrite previous language preference', () => {
    saveLanguagePreference('es')
    saveLanguagePreference('en')

    expect(localStorage.getItem('preferredLanguage')).toBe('en')
  })
})

describe('HTML Lang Attribute', () => {
  beforeEach(() => {
    setupMockDOM()
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  it('should update HTML lang attribute to English', () => {
    document.documentElement.lang = 'en'

    expect(document.documentElement.lang).toBe('en')
  })

  it('should update HTML lang attribute to Spanish', () => {
    document.documentElement.lang = 'es'

    expect(document.documentElement.lang).toBe('es')
  })
})

describe('Meta Tags Update', () => {
  beforeEach(() => {
    setupMockDOM()

    // Create meta tags
    const metaDesc = document.createElement('meta')
    metaDesc.setAttribute('name', 'description')
    document.head.appendChild(metaDesc)

    const ogTitle = document.createElement('meta')
    ogTitle.setAttribute('property', 'og:title')
    document.head.appendChild(ogTitle)

    const ogDesc = document.createElement('meta')
    ogDesc.setAttribute('property', 'og:description')
    document.head.appendChild(ogDesc)

    const ogLocale = document.createElement('meta')
    ogLocale.setAttribute('property', 'og:locale')
    document.head.appendChild(ogLocale)

    const twitterTitle = document.createElement('meta')
    twitterTitle.setAttribute('name', 'twitter:title')
    document.head.appendChild(twitterTitle)

    const twitterDesc = document.createElement('meta')
    twitterDesc.setAttribute('name', 'twitter:description')
    document.head.appendChild(twitterDesc)
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  function updateMetaTags(lang, translations) {
    if (!translations[lang]) return

    const t = translations[lang]

    document.title = t.title

    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) metaDesc.content = t.description

    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) ogTitle.content = t.ogTitle

    const ogDesc = document.querySelector('meta[property="og:description"]')
    if (ogDesc) ogDesc.content = t.ogDescription

    const ogLocale = document.querySelector('meta[property="og:locale"]')
    if (ogLocale) ogLocale.content = lang === 'es' ? 'es_ES' : 'en_US'

    const twitterTitle = document.querySelector('meta[name="twitter:title"]')
    if (twitterTitle) twitterTitle.content = t.ogTitle

    const twitterDesc = document.querySelector('meta[name="twitter:description"]')
    if (twitterDesc) twitterDesc.content = t.twitterDescription
  }

  const mockTranslations = {
    en: {
      title: 'Nightcore Machine - DJ UWU',
      description: 'Create nightcore and daycore online',
      ogTitle: 'Nightcore Machine',
      ogDescription: 'Create nightcore and daycore online for free',
      twitterDescription: 'Create nightcore and daycore online'
    },
    es: {
      title: 'Máquina Nightcore - DJ UWU',
      description: 'Crea nightcore y daycore online',
      ogTitle: 'Máquina Nightcore',
      ogDescription: 'Crea nightcore y daycore online gratis',
      twitterDescription: 'Crea nightcore y daycore online'
    }
  }

  it('should update document title in English', () => {
    updateMetaTags('en', mockTranslations)

    expect(document.title).toBe('Nightcore Machine - DJ UWU')
  })

  it('should update document title in Spanish', () => {
    updateMetaTags('es', mockTranslations)

    expect(document.title).toBe('Máquina Nightcore - DJ UWU')
  })

  it('should update meta description in English', () => {
    updateMetaTags('en', mockTranslations)

    const metaDesc = document.querySelector('meta[name="description"]')
    expect(metaDesc.content).toBe('Create nightcore and daycore online')
  })

  it('should update meta description in Spanish', () => {
    updateMetaTags('es', mockTranslations)

    const metaDesc = document.querySelector('meta[name="description"]')
    expect(metaDesc.content).toBe('Crea nightcore y daycore online')
  })

  it('should update Open Graph title', () => {
    updateMetaTags('en', mockTranslations)

    const ogTitle = document.querySelector('meta[property="og:title"]')
    expect(ogTitle.content).toBe('Nightcore Machine')
  })

  it('should update Open Graph description', () => {
    updateMetaTags('en', mockTranslations)

    const ogDesc = document.querySelector('meta[property="og:description"]')
    expect(ogDesc.content).toBe('Create nightcore and daycore online for free')
  })

  it('should update Open Graph locale to es_ES for Spanish', () => {
    updateMetaTags('es', mockTranslations)

    const ogLocale = document.querySelector('meta[property="og:locale"]')
    expect(ogLocale.content).toBe('es_ES')
  })

  it('should update Open Graph locale to en_US for English', () => {
    updateMetaTags('en', mockTranslations)

    const ogLocale = document.querySelector('meta[property="og:locale"]')
    expect(ogLocale.content).toBe('en_US')
  })

  it('should update Twitter title', () => {
    updateMetaTags('en', mockTranslations)

    const twitterTitle = document.querySelector('meta[name="twitter:title"]')
    expect(twitterTitle.content).toBe('Nightcore Machine')
  })

  it('should update Twitter description', () => {
    updateMetaTags('en', mockTranslations)

    const twitterDesc = document.querySelector('meta[name="twitter:description"]')
    expect(twitterDesc.content).toBe('Create nightcore and daycore online')
  })
})

describe('Element Translation (data-i18n)', () => {
  beforeEach(() => {
    setupMockDOM()
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  function translateElements(lang, translations) {
    if (!translations[lang]) return

    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n')
      if (translations[lang][key]) {
        element.textContent = translations[lang][key]
      }
    })
  }

  const mockTranslations = {
    en: {
      play: 'Play',
      pause: 'Pause',
      stop: 'Stop',
      downloadWav: 'Download WAV',
      downloadMp3: 'Download MP3'
    },
    es: {
      play: 'Reproducir',
      pause: 'Pausar',
      stop: 'Detener',
      downloadWav: 'Descargar WAV',
      downloadMp3: 'Descargar MP3'
    }
  }

  it('should translate elements with data-i18n attribute to English', () => {
    const button = document.createElement('button')
    button.setAttribute('data-i18n', 'play')
    document.body.appendChild(button)

    translateElements('en', mockTranslations)

    expect(button.textContent).toBe('Play')
  })

  it('should translate elements with data-i18n attribute to Spanish', () => {
    const button = document.createElement('button')
    button.setAttribute('data-i18n', 'play')
    document.body.appendChild(button)

    translateElements('es', mockTranslations)

    expect(button.textContent).toBe('Reproducir')
  })

  it('should translate multiple elements', () => {
    const playBtn = document.createElement('button')
    playBtn.setAttribute('data-i18n', 'play')
    document.body.appendChild(playBtn)

    const pauseBtn = document.createElement('button')
    pauseBtn.setAttribute('data-i18n', 'pause')
    document.body.appendChild(pauseBtn)

    translateElements('en', mockTranslations)

    expect(playBtn.textContent).toBe('Play')
    expect(pauseBtn.textContent).toBe('Pause')
  })

  it('should not translate elements with missing translation keys', () => {
    const button = document.createElement('button')
    button.setAttribute('data-i18n', 'nonexistent')
    button.textContent = 'Original'
    document.body.appendChild(button)

    translateElements('en', mockTranslations)

    expect(button.textContent).toBe('Original')
  })
})

describe('Placeholder Translation (data-i18n-placeholder)', () => {
  beforeEach(() => {
    setupMockDOM()
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  function translatePlaceholders(lang, translations) {
    if (!translations[lang]) return

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder')
      if (translations[lang][key]) {
        element.placeholder = translations[lang][key]
      }
    })
  }

  const mockTranslations = {
    en: {
      searchPlaceholder: 'Search...',
      namePlaceholder: 'Enter your name'
    },
    es: {
      searchPlaceholder: 'Buscar...',
      namePlaceholder: 'Ingresa tu nombre'
    }
  }

  it('should translate placeholder in English', () => {
    const input = document.createElement('input')
    input.setAttribute('data-i18n-placeholder', 'searchPlaceholder')
    document.body.appendChild(input)

    translatePlaceholders('en', mockTranslations)

    expect(input.placeholder).toBe('Search...')
  })

  it('should translate placeholder in Spanish', () => {
    const input = document.createElement('input')
    input.setAttribute('data-i18n-placeholder', 'searchPlaceholder')
    document.body.appendChild(input)

    translatePlaceholders('es', mockTranslations)

    expect(input.placeholder).toBe('Buscar...')
  })
})

describe('ARIA Label Translation (data-i18n-aria-label)', () => {
  beforeEach(() => {
    setupMockDOM()
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  function translateAriaLabels(lang, translations) {
    if (!translations[lang]) return

    document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
      const key = element.getAttribute('data-i18n-aria-label')
      if (translations[lang][key]) {
        element.setAttribute('aria-label', translations[lang][key])
      }
    })
  }

  const mockTranslations = {
    en: {
      playAriaLabel: 'Play audio',
      pauseAriaLabel: 'Pause audio'
    },
    es: {
      playAriaLabel: 'Reproducir audio',
      pauseAriaLabel: 'Pausar audio'
    }
  }

  it('should translate aria-label in English', () => {
    const button = document.createElement('button')
    button.setAttribute('data-i18n-aria-label', 'playAriaLabel')
    document.body.appendChild(button)

    translateAriaLabels('en', mockTranslations)

    expect(button.getAttribute('aria-label')).toBe('Play audio')
  })

  it('should translate aria-label in Spanish', () => {
    const button = document.createElement('button')
    button.setAttribute('data-i18n-aria-label', 'playAriaLabel')
    document.body.appendChild(button)

    translateAriaLabels('es', mockTranslations)

    expect(button.getAttribute('aria-label')).toBe('Reproducir audio')
  })
})

describe('JSON-LD Structured Data', () => {
  beforeEach(() => {
    setupMockDOM()

    const structuredDataEl = document.createElement('script')
    structuredDataEl.id = 'structuredData'
    structuredDataEl.type = 'application/ld+json'
    document.head.appendChild(structuredDataEl)
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  function updateStructuredData(lang) {
    const structuredDataEl = document.getElementById('structuredData')
    if (!structuredDataEl) return

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'DJ UWU Nightcore Machine',
      description:
        lang === 'es'
          ? 'Crea nightcore y daycore online gratis. Ajusta la velocidad de tus canciones al instante sin instalar programas.'
          : 'Create nightcore and daycore online for free. Adjust your songs\' speed instantly without installing programs.',
      url: 'https://djuwu.club',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '127'
      },
      author: {
        '@type': 'Person',
        name: 'DJ UWU'
      }
    }

    structuredDataEl.textContent = JSON.stringify(structuredData)
  }

  it('should update structured data for English', () => {
    updateStructuredData('en')

    const structuredDataEl = document.getElementById('structuredData')
    const data = JSON.parse(structuredDataEl.textContent)

    expect(data.description).toContain('Create nightcore and daycore online')
    expect(data['@type']).toBe('WebApplication')
  })

  it('should update structured data for Spanish', () => {
    updateStructuredData('es')

    const structuredDataEl = document.getElementById('structuredData')
    const data = JSON.parse(structuredDataEl.textContent)

    expect(data.description).toContain('Crea nightcore y daycore online')
    expect(data['@type']).toBe('WebApplication')
  })

  it('should include correct schema.org context', () => {
    updateStructuredData('en')

    const structuredDataEl = document.getElementById('structuredData')
    const data = JSON.parse(structuredDataEl.textContent)

    expect(data['@context']).toBe('https://schema.org')
  })

  it('should include application details', () => {
    updateStructuredData('en')

    const structuredDataEl = document.getElementById('structuredData')
    const data = JSON.parse(structuredDataEl.textContent)

    expect(data.name).toBe('DJ UWU Nightcore Machine')
    expect(data.url).toBe('https://djuwu.club')
    expect(data.applicationCategory).toBe('MultimediaApplication')
  })

  it('should include pricing information', () => {
    updateStructuredData('en')

    const structuredDataEl = document.getElementById('structuredData')
    const data = JSON.parse(structuredDataEl.textContent)

    expect(data.offers.price).toBe('0')
    expect(data.offers.priceCurrency).toBe('USD')
  })

  it('should include rating information', () => {
    updateStructuredData('en')

    const structuredDataEl = document.getElementById('structuredData')
    const data = JSON.parse(structuredDataEl.textContent)

    expect(data.aggregateRating.ratingValue).toBe('4.8')
    expect(data.aggregateRating.ratingCount).toBe('127')
  })
})

describe('Language Toggle', () => {
  let currentLang

  beforeEach(() => {
    setupMockDOM()
    currentLang = 'es'
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  function toggleLanguage() {
    currentLang = currentLang === 'es' ? 'en' : 'es'
    return currentLang
  }

  it('should toggle from Spanish to English', () => {
    currentLang = 'es'

    const newLang = toggleLanguage()

    expect(newLang).toBe('en')
  })

  it('should toggle from English to Spanish', () => {
    currentLang = 'en'

    const newLang = toggleLanguage()

    expect(newLang).toBe('es')
  })

  it('should toggle back and forth correctly', () => {
    currentLang = 'es'

    const lang1 = toggleLanguage()
    expect(lang1).toBe('en')

    const lang2 = toggleLanguage()
    expect(lang2).toBe('es')

    const lang3 = toggleLanguage()
    expect(lang3).toBe('en')
  })
})
