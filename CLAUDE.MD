# CLAUDE.MD - DJ UWU Nightcore Machine

## Project Overview

**DJ UWU Nightcore Machine** is a free, open-source web application that creates nightcore and daycore audio effects entirely in the browser using the Web Audio API. The application is 100% client-side, ensuring user privacy by never uploading files to any server.

- **Live URL**: https://djuwu.club/machine.html
- **Portfolio**: https://djuwu.club/
- **License**: CC BY-NC 4.0 (non-commercial free, commercial requires license)
- **Hosting**: Cloudflare Workers

### What it does
- **Nightcore**: Speeds up songs (1.0x-1.6x) and raises pitch for energetic sound
- **Daycore**: Slows down songs (0.5x-0.8x) and lowers pitch for relaxed vibe
- Supports multiple audio formats: MP3, WAV, AAC, FLAC, M4A, OGG, WebM
- Exports to WAV (lossless) or MP3 (320 kbps) with anime artwork metadata
- Multi-language support (Spanish/English)
- Dark/Light theme toggle

## Architecture & Key Components

### File Structure
```
/
├── machine.html          # Main tool interface (279 lines)
├── index.html            # Portfolio landing page (196 lines)
├── contact.html          # Contact page
├── privacy.html          # Privacy policy
├── terms.html            # Terms of use
├── css/
│   └── style.css         # 1,759 lines - Glassmorphism UI design
├── js/
│   ├── app.js            # 1,878 lines - Core audio processing engine
│   ├── i18n.js           # 182 lines - Internationalization system
│   ├── translations.js   # 176 lines - Spanish/English translations
│   ├── theme-toggle.js   # 55 lines - Dark/Light mode switching
│   ├── index-i18n.js     # 108 lines - Home page i18n
│   ├── legal.js          # 324 lines - Legal pages functionality
│   ├── lame.min.js       # 307 lines - MP3 encoder (LGPL-3.0)
│   └── jsmediatags.min.js # 102 lines - Metadata parser (BSD-3-Clause)
└── images/               # Logos, icons, OG images
```

### Technology Stack
- **Pure Vanilla JavaScript** - No frameworks, lightweight and fast
- **Web Audio API** - All audio processing (AudioContext, OfflineAudioContext)
- **File API & Blob API** - Local file handling and downloads
- **lame.js** - Client-side MP3 encoding
- **waifu.im API** - Anime artwork for MP3 covers
- **Cloudflare Workers** - Static hosting platform

## Critical Implementation Details

### 1. Speed Mode Logic (CRITICAL)

The speed calculation must be **synchronized across three functions**:

#### `startSource()` - Applies playback speed
```javascript
if (isDaycore) {
    audioSource.playbackRate.value = 2.0 - speedSlider.value; // Inverts range
} else {
    audioSource.playbackRate.value = speedSlider.value;
}
```

#### `getCurrentPos()` - Tracks playback position
```javascript
if (isDaycore) {
    return lastPos + (deltaTime * (2.0 - speedSlider.value));
} else {
    return lastPos + (deltaTime * speedSlider.value);
}
```

#### `renderAudio()` - Exports audio
```javascript
if (isDaycore) {
    offlineSource.playbackRate.value = 2.0 - parseFloat(speedSlider.value);
} else {
    offlineSource.playbackRate.value = parseFloat(speedSlider.value);
}
```

**Why this matters**: If these three aren't synchronized, the playback position won't match the waveform, and the exported file will have a different speed than what the user heard.

### 2. State Management

Global state variables in `app.js`:
- `audioContext` - Web Audio API context
- `audioBuffer` - Decoded audio data
- `audioSource` - Current playback source node
- `isPlaying` - Playback state
- `currentTime` - Playback position (0 to duration)
- `lastUpdateTime` - AudioContext time when last updated
- `isDaycore` - Mode toggle (affects speed calculation)

**IMPORTANT**: `lastUpdateTime` tracks `audioContext.currentTime` to calculate elapsed time accurately when playback rate changes.

### 3. Audio Processing Pipeline

```
User uploads file
    ↓
File API reads as ArrayBuffer
    ↓
audioContext.decodeAudioData() converts to AudioBuffer
    ↓
initializeAudioControls() enables UI
    ↓
drawWaveform() visualizes audio
    ↓
User adjusts speed → playbackRate.value changes
    ↓
User clicks "Download"
    ↓
renderAudio() creates OfflineAudioContext with speed applied
    ↓
bufferToWav() OR bufferToMp3() + addMP3Metadata()
    ↓
Blob download triggered
```

### 4. Internationalization System

The i18n system (`js/i18n.js`) handles:
- Auto-detection of browser language (`navigator.language`)
- localStorage persistence of user preference
- Dynamic translation of `[data-i18n]` attributes
- Meta tag updates (title, description, OG tags)
- Structured data (JSON-LD) updates for SEO

**Key functions**:
- `detectLanguage()` - Returns 'es' or 'en' based on browser/localStorage
- `translatePage(lang)` - Updates all translatable elements
- `updateMetaTags(lang)` - SEO meta tag updates
- `updateStructuredData(lang)` - Schema.org WebApplication updates

### 5. MP3 Artwork System

Artwork pipeline:
1. Fetch from `waifu.im` API with user-selected tags (waifu, maid, uniform, etc.)
2. Download image and load into canvas
3. Resize to 1000x1000px max (preserving aspect ratio)
4. Convert to JPEG at 0.9 quality (compression for browser memory)
5. Manually construct ID3v2.3 APIC frame
6. Embed frame into MP3 file created by lame.js

**Why manual construction?** lame.js doesn't support metadata, so we manually create ID3v2.3 frames and prepend them to the encoded MP3 data.

## Common Development Tasks

### Adding a new translation string

1. Add to `js/translations.js`:
```javascript
const translations = {
    es: {
        "your.new.key": "Texto en español",
        // ...
    },
    en: {
        "your.new.key": "Text in English",
        // ...
    }
};
```

2. Add `data-i18n` attribute to HTML element:
```html
<button data-i18n="your.new.key">Fallback text</button>
```

### Adding a new speed preset

1. Add button in `machine.html`:
```html
<button class="preset-btn" data-speed="1.40">Your Preset (1.40x)</button>
```

2. The click handler in `app.js` automatically handles all `.preset-btn` elements.

### Modifying the glassmorphism design

All glassmorphism effects are in `css/style.css` using:
- `backdrop-filter: blur(10px)` for blur
- `background: rgba(255, 255, 255, 0.1)` for transparency
- CSS custom properties (variables) for theming

**Dark mode variables** start at line ~1650 with `[data-theme="dark"]`.

### Adding new audio format support

The browser's Web Audio API handles decoding automatically. To add a new format:
1. Verify browser support (check caniuse.com)
2. Update the `<input type="file" accept="...">` in `machine.html`
3. No code changes needed in `app.js` - decoding is automatic

## Things to Watch Out For

### 1. Browser Memory Limits
- Large audio files + high-quality artwork can exceed browser memory
- Always use JPEG compression for artwork (canvas.toBlob at quality 0.9)
- Consider adding file size warnings for 50MB+ files

### 2. AudioContext Restrictions
- Browsers require user interaction before creating AudioContext
- The app handles this with `audioContext.resume()` on user gestures
- Always test audio initialization in different browsers

### 3. Playback Rate Edge Cases
- Speed values below 0.5x or above 2.0x may cause browser issues
- The UI limits to 0.5x-2.0x range (appropriate constraints)

### 4. ID3v2.3 Frame Construction
- When modifying MP3 metadata, maintain exact byte structure
- ID3v2.3 uses synchsafe integers (7 bits per byte) for sizes
- Test with various MP3 players (iTunes, VLC, Windows Media Player)

### 5. Waveform Rendering Performance
- `drawWaveform()` processes every sample - can be slow for long files
- Consider downsampling for files >10 minutes
- Use `requestAnimationFrame` for smooth rendering

### 6. Accessibility Requirements
- Always add `aria-label` to interactive elements
- Maintain keyboard navigation support
- Test with screen readers (NVDA, JAWS, VoiceOver)

### 7. CSS Theme Variables
- Theme toggle affects `:root[data-theme="dark"]` attribute
- Always test new components in both light and dark modes
- Use CSS variables for colors, never hardcode

## External Dependencies & APIs

### Third-Party Libraries
- **lame.js** (LGPL-3.0): MP3 encoding - Must maintain license notices
- **jsmediatags** (BSD-3-Clause): Currently unused but included

### External APIs
- **waifu.im**: Anime artwork (no API key required, rate limits unknown)
- **waifu.pics**: Background images for portfolio
- **Google Analytics 4**: Optional analytics (user consent required)
- **Cloudflare Analytics**: Always active (zero-cookie tracking)

## Deployment

### Cloudflare Workers Configuration
File: `wrangler.jsonc`
```json
{
  "compatibility_date": "2025-11-19",
  "assets": {
    "directory": "."
  }
}
```

### Deploy Command
```bash
npx wrangler deploy
```

### Local Development
```bash
# Option 1: Python
python -m http.server 8000

# Option 2: Node.js
npx http-server

# Option 3: VS Code Live Server extension
```

## SEO & PWA

### SEO Files
- `robots.txt` - Allows all crawlers, references sitemap
- `sitemap.xml` - 4 main pages indexed
- Meta tags - Open Graph, Twitter Card, canonical URLs
- Structured data - JSON-LD WebApplication schema in each page

### PWA Configuration
- `manifest.webmanifest` - App name, icons, theme colors
- Service worker support ready (not currently implemented)
- Offline functionality possible future enhancement

## Design Philosophy

1. **Privacy-First**: Never upload user files, all processing client-side
2. **Zero Dependencies**: Pure vanilla JavaScript, no frameworks
3. **Accessibility**: ARIA labels, semantic HTML, keyboard navigation
4. **Performance**: Minified libraries, optimized asset loading
5. **Kawaii Aesthetic**: Glassmorphism design with anime artwork integration
6. **International**: Multi-language support with proper SEO

## Licensing Notes

When modifying or distributing:
- Project code: CC BY-NC 4.0 (non-commercial free)
- Commercial use: Requires license from deejayuwu@gmail.com
- lame.js: Must include LGPL-3.0 notice (see `LICENSES/lgpl-3.0.txt`)
- jsmediatags: Must include BSD-3-Clause notice

See `THIRD_PARTY_NOTICES.md` for full attribution.

## Contact & Support

- **Email**: deejayuwu@gmail.com
- **GitHub**: Repository issues
- **Ko-fi**: Support link on contact page
- **Social**: Links on portfolio page

## Recent Development Focus

Recent commits show work on:
- Dark mode styling improvements
- Kawaii aesthetic refinements
- Social media integration
- Content updates and translations

---

**Last Updated**: 2026-01-22
**Claude Agent Session**: claude/update-claude-md-vxA8G
