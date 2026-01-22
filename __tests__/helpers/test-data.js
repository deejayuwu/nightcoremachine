/**
 * Test data helpers for creating mock audio files and test fixtures
 */

/**
 * Create a mock File object with audio data
 */
export function createMockAudioFile(options = {}) {
  const {
    name = 'test-audio.mp3',
    type = 'audio/mpeg',
    size = 1024 * 1024, // 1MB default
    lastModified = Date.now()
  } = options

  // Create a simple ArrayBuffer with test data
  const buffer = new ArrayBuffer(size)
  const view = new Uint8Array(buffer)

  // Fill with some pattern (simulating audio data)
  for (let i = 0; i < size; i++) {
    view[i] = (i % 256)
  }

  const blob = new Blob([buffer], { type })

  // Create File from Blob
  const file = new File([blob], name, {
    type,
    lastModified
  })

  return file
}

/**
 * Create mock audio files for different formats
 */
export const MOCK_AUDIO_FILES = {
  mp3: () => createMockAudioFile({
    name: 'test.mp3',
    type: 'audio/mpeg'
  }),

  wav: () => createMockAudioFile({
    name: 'test.wav',
    type: 'audio/wav'
  }),

  aac: () => createMockAudioFile({
    name: 'test.aac',
    type: 'audio/aac'
  }),

  flac: () => createMockAudioFile({
    name: 'test.flac',
    type: 'audio/flac'
  }),

  m4a: () => createMockAudioFile({
    name: 'test.m4a',
    type: 'audio/mp4'
  }),

  ogg: () => createMockAudioFile({
    name: 'test.ogg',
    type: 'audio/ogg'
  }),

  webm: () => createMockAudioFile({
    name: 'test.webm',
    type: 'audio/webm'
  }),

  mp4: () => createMockAudioFile({
    name: 'test.mp4',
    type: 'audio/mp4'
  }),

  // iOS edge case - file with empty type
  iosFile: () => createMockAudioFile({
    name: 'test.m4a',
    type: ''
  }),

  // Invalid file types
  pdf: () => createMockAudioFile({
    name: 'document.pdf',
    type: 'application/pdf'
  }),

  txt: () => createMockAudioFile({
    name: 'file.txt',
    type: 'text/plain'
  }),

  // Very large file (500MB)
  largeFile: () => createMockAudioFile({
    name: 'large.mp3',
    type: 'audio/mpeg',
    size: 500 * 1024 * 1024
  }),

  // Very small file
  tinyFile: () => createMockAudioFile({
    name: 'tiny.mp3',
    type: 'audio/mpeg',
    size: 100
  })
}

/**
 * Create a mock Blob URL
 */
export function createMockBlobUrl(blob) {
  return `blob:http://localhost/${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Create mock DOM elements for testing
 */
export function createMockDOMElements() {
  const elements = {
    fileInput: document.createElement('input'),
    fileName: document.createElement('div'),
    fileSize: document.createElement('div'),
    fileDuration: document.createElement('div'),
    playBtn: document.createElement('button'),
    pauseBtn: document.createElement('button'),
    stopBtn: document.createElement('button'),
    downloadWavBtn: document.createElement('button'),
    downloadMp3Btn: document.createElement('button'),
    speedSlider: document.createElement('input'),
    speedValue: document.createElement('div'),
    currentTimeDisplay: document.createElement('div'),
    durationDisplay: document.createElement('div'),
    progressBar: document.createElement('div'),
    volumeSlider: document.createElement('input'),
    waveformCanvas: document.createElement('canvas'),
    artworkImg: document.createElement('img'),
    artworkContainer: document.createElement('div'),
    tagSelect: document.createElement('select'),
    customTitle: document.createElement('input'),
    customArtist: document.createElement('input'),
    customAlbum: document.createElement('input')
  }

  // Set required attributes
  elements.fileInput.type = 'file'
  elements.fileInput.accept = 'audio/*'
  elements.speedSlider.type = 'range'
  elements.speedSlider.min = '50'
  elements.speedSlider.max = '160'
  elements.speedSlider.value = '125'
  elements.volumeSlider.type = 'range'
  elements.volumeSlider.min = '0'
  elements.volumeSlider.max = '100'
  elements.volumeSlider.value = '100'

  // Set IDs to match actual app
  elements.fileInput.id = 'file-input'
  elements.fileName.id = 'file-name'
  elements.fileSize.id = 'file-size'
  elements.fileDuration.id = 'file-duration'
  elements.playBtn.id = 'play-btn'
  elements.pauseBtn.id = 'pause-btn'
  elements.stopBtn.id = 'stop-btn'
  elements.downloadWavBtn.id = 'download-wav'
  elements.downloadMp3Btn.id = 'download-mp3'
  elements.speedSlider.id = 'speed'
  elements.speedValue.id = 'speed-value'
  elements.currentTimeDisplay.id = 'current-time'
  elements.durationDisplay.id = 'duration'
  elements.progressBar.id = 'progress-bar'
  elements.volumeSlider.id = 'volume'
  elements.waveformCanvas.id = 'waveform'
  elements.artworkImg.id = 'artwork-img'
  elements.artworkContainer.id = 'artwork-container'
  elements.tagSelect.id = 'tag-select'
  elements.customTitle.id = 'custom-title'
  elements.customArtist.id = 'custom-artist'
  elements.customAlbum.id = 'custom-album'

  return elements
}

/**
 * Setup DOM elements in document for testing
 */
export function setupMockDOM() {
  const elements = createMockDOMElements()

  // Add all elements to document.body
  Object.values(elements).forEach(element => {
    document.body.appendChild(element)
  })

  return elements
}

/**
 * Clean up DOM elements after testing
 */
export function cleanupMockDOM() {
  document.body.innerHTML = ''
}

/**
 * Create mock translation data
 */
export const MOCK_TRANSLATIONS = {
  en: {
    'app-title': 'Nightcore Machine',
    'upload-prompt': 'Upload an audio file',
    'play': 'Play',
    'pause': 'Pause',
    'stop': 'Stop',
    'speed-label': 'Speed',
    'download-wav': 'Download WAV',
    'download-mp3': 'Download MP3'
  },
  es: {
    'app-title': 'Máquina Nightcore',
    'upload-prompt': 'Sube un archivo de audio',
    'play': 'Reproducir',
    'pause': 'Pausar',
    'stop': 'Detener',
    'speed-label': 'Velocidad',
    'download-wav': 'Descargar WAV',
    'download-mp3': 'Descargar MP3'
  }
}

/**
 * Create mock artwork API response
 */
export function createMockArtworkResponse(options = {}) {
  const {
    url = 'https://example.com/test-image.jpg',
    tags = ['waifu', 'maid']
  } = options

  return {
    images: [
      {
        signature: 'mock-signature',
        extension: '.jpg',
        image_id: 12345,
        favorites: 100,
        dominant_color: '#8A6CFF',
        source: 'https://example.com',
        artist: {
          artist_id: 1,
          name: 'Test Artist',
          patreon: null,
          pixiv: null,
          twitter: null
        },
        uploaded_at: '2024-01-01T00:00:00.000000Z',
        is_nsfw: false,
        width: 1920,
        height: 1080,
        byte_size: 500000,
        url: url,
        preview_url: url,
        tags: tags.map(name => ({
          tag_id: 1,
          name,
          description: `Test ${name} tag`,
          is_nsfw: false
        }))
      }
    ]
  }
}

/**
 * Wait for async operations to complete
 */
export function waitForAsync(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Trigger a file input change event
 */
export function triggerFileInputChange(fileInput, file) {
  const dataTransfer = new DataTransfer()
  dataTransfer.items.add(file)
  fileInput.files = dataTransfer.files

  const event = new Event('change', { bubbles: true })
  fileInput.dispatchEvent(event)
}

/**
 * Mock fetch responses
 */
export function mockFetchResponses() {
  global.fetch = vi.fn((url) => {
    // Mock artwork API
    if (url.includes('api.waifu.im')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(createMockArtworkResponse())
      })
    }

    // Mock image fetch
    if (url.includes('.jpg') || url.includes('.png')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        blob: () => Promise.resolve(new Blob(['mock image data'], { type: 'image/jpeg' }))
      })
    }

    // Default mock
    return Promise.resolve({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    })
  })
}

/**
 * Format time for display (MM:SS)
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Create a mock FileReader
 */
export function createMockFileReader() {
  return {
    readAsArrayBuffer: vi.fn(function(file) {
      setTimeout(() => {
        if (this.onload) {
          this.result = new ArrayBuffer(1024)
          this.onload({ target: this })
        }
      }, 0)
    }),
    onload: null,
    onerror: null,
    result: null
  }
}
