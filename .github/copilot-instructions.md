# DJ UWU Nightcore Machine - AI Coding Guidelines

## Project Overview
Single-page web app (PWA) that creates nightcore/daycore audio effects entirely client-side. Spanish-first design with English support. Core features: file upload → speed/pitch adjustment → WAV/MP3 download with optional artwork.

## Architecture & Data Flow

### Key Components
- **Audio Processing**: Web Audio API (decoding, playback rate control, rendering)
  - `audioCtx` (AudioContext), `buffer` (decoded audio), `sourceNode` (playback)
  - Speed adjustment applies differently per mode: Nightcore uses `speed` directly, Daycore inverts (2.0 - speed)
  - See `startSource()` and `renderAudio()` for playback vs. export rendering

- **State Management**: Global variables in `js/app.js`
  - `isPlaying`, `currentTime`, `isDaycoreMode` control player state
  - Critical: `lastUpdateTime` tracks audio context time to calculate elapsed playback correctly
  - See `getCurrentPos()` for time calculation logic (accounts for playback rate)

- **Internationalization** (`i18n.js` + `translations.js`):
  - Two-tier system: `[data-i18n]`, `[data-i18n-placeholder]`, `[data-i18n-aria-label]` attributes
  - Spanish default; browser lang detection + localStorage persistence
  - Meta tags and structured data update dynamically with `updateMetaTags()`, `updateStructuredData()`

- **Artwork System**:
  - Fetches from `waifu.im` API (tags: waifu, maid, uniform, etc.)
  - Image processing: resize (max 1000x1000), JPEG compression (0.9 quality)
  - MP3 embedding via ID3v2.3 frames (see `addMP3Metadata()` and frame creation)

### Data Flow: File Upload → Download
1. `loadFile()` → decode → reset state → initialize UI controls
2. `generateWaveform()` creates visualization data
3. User adjusts `speed` slider → updates `sourceNode.playbackRate` (if playing)
4. Download triggers `renderAudio()` with OfflineAudioContext for speed-adjusted output
5. `bufferToWav()` or MP3 codec adds metadata (artwork blob, title, genre)

## Developer Workflows

### Adding UI Elements
1. Update HTML in `index.html`
2. Add to translations: `js/translations.js` (both `es` and `en` keys)
3. For dynamic translation: use `[data-i18n]` attribute or call `translatePage()` after DOM insert
4. For accessibility: add `[data-i18n-aria-label]` for screen readers

### Modifying Audio Speed Logic
- **Nightcore**: 1.0x - 1.6x (default 1.25x)
- **Daycore**: 0.5x - 0.8x (inverted from speed slider: `2.0 - sliderValue`)
- **Critical**: Update speed handling in THREE places:
  1. `startSource()` - playback rate calculation
  2. `getCurrentPos()` - position tracking during playback
  3. `renderAudio()` - export rendering
  4. Speed UI labels in `speed.addEventListener('input')`

### Bug Fixes: State Cleanup
- **File loading triggers `loadFile()` cleanup**:
  - `stopSource()` (must disconnect and clear raf ids)
  - Reset: `currentTime = 0`, `lastUpdateTime = 0`, `waveformData = null`
  - Clear canvas/waveform click handlers (see `loadFile()` implementation)
- **Playback position bugs** often stem from `lastUpdateTime` not tracking audio context time correctly

### MP3 Download & Metadata
- Uses `lame.min.js` library for encoding (included in `index.html`)
- Artwork requires ID3v2.3 frame format: frame header (10 bytes) + data
- Frame sizes must use **normal 32-bit integers (NOT synchsafe)** for ID3v2.3
- Blob size warning: high quality audio + 1000x1000 artwork can exceed browser limits; use compression

## Project-Specific Conventions

### Naming & Patterns
- Boolean prefixes: `is*` (isPlaying, isIOS), `isDaycore*`
- Handler cleanup: always store references for removal (see `waveformClickHandler`)
- Track events with `trackEvent()` for GA4 (dispatched dynamically after user cookie consent)
- Mode-specific labels use `getModePrefix()` function

### CSS Architecture (`css/style.css`)
- CSS variables: `--pink`, `--violet`, `--bg1`, `--bg2` (theme colors)
- Glassmorphism: `backdrop-filter: blur()`, `rgba(255,255,255,0.x)` transparency
- Responsive: flex layout with `flex-shrink` control; mobile hides full text (`.social-text-full` hidden on small screens)

### File Structure
```
js/app.js         (1879 lines: audio logic, downloads, artwork)
js/i18n.js        (183 lines: translation system, meta/structured data)
js/translations.js (175 lines: ES/EN strings)
js/lame.min.js    (MP3 encoding library, included in repo)
js/jsmediatags.min.js (unused currently, reference only)
css/style.css     (959 lines: glassmorphism UI, responsive)
index.html        (292 lines: semantic HTML, PWA manifest, meta tags)
```

## External Dependencies & APIs
- **waifu.im**: Fetches anime artwork (filters: `?included_tags=TAG&is_nsfw=false`)
- **Google Analytics 4**: Loads dynamically after cookie consent (gtag via window)
- **Cloudflare Analytics**: Always active (no user cookies)
- **Web Audio API**: Native browser API (no npm dependencies)

## Common Pitfalls
1. **Forgetting to reset state**: Always run cleanup in `loadFile()` before loading new audio
2. **Speed mode mismatch**: Daycore formula (2.0 - speed) must be applied consistently across playback AND position tracking
3. **Memory leaks**: Cancel RAF IDs in `stopSource()`; remove event listeners when replacing waveform
4. **iOS file handling**: May not set MIME type; check file extension in `loadFile()` validation
5. **MP3 frame sizes**: ID3v2.3 uses normal integers, not synchsafe encoding (common mistake)

## Testing Considerations
- Test both Nightcore (1.0-1.6x) and Daycore (0.5-0.8x) modes
- Verify i18n: toggle language, check localStorage persistence, verify meta tag updates
- Mobile: iOS file picker behavior differs; artwork loading may require CORS
- Audio state: rapid pause/play/seek should not cause playback artifacts

