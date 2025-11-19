# DJ UWU Nightcore Machine 🎵✨

Create **nightcore** and **daycore** audio effects online, instantly and for free. All processing happens locally on your device—100% private, no registration required.

**Live**: [djuwu.club](https://djuwu.club)

## Features

✨ **Real-time Processing** — Adjust speed and pitch instantly  
🔒 **100% Private** — Everything processes on your device  
💾 **Multiple Formats** — Download as WAV or MP3 (320kbps)  
🎨 **Album Artwork** — Auto-generate anime artwork for MP3 files  
📱 **Mobile & Desktop** — Works on any device with a modern browser  
🆓 **Completely Free** — No limits, no registration, forever  

## What is Nightcore?

Nightcore is a music style that **speeds up** songs (typically 1.2x–1.6x) and raises the pitch, creating an energetic, high-pitched sound. Born in Norway in the early 2000s, it's now a global phenomenon on YouTube, SoundCloud, and TikTok.

**Daycore** is the opposite—it slows songs down (0.5x–0.8x) and lowers the pitch for a deep, relaxing vibe.

## Getting Started

### Online (No Installation)
1. Visit [djuwu.club](https://djuwu.club)
2. Upload an audio file (MP3, WAV, AAC, FLAC, M4A, etc.)
3. Adjust the speed slider (1.0x–1.6x for nightcore, 0.5x–0.8x for daycore)
4. Download as WAV or MP3

### Local Development

**Requirements**: Modern browser (Chrome, Firefox, Safari, Edge)

```bash
# Clone the repo
git clone https://github.com/deejayuwu/nightcoremachine.git
cd nightcoremachine

# Serve locally (Python 3)
python -m http.server 8000

# Or use Node.js
npx http-server

# Or use VS Code Live Server extension
# Then open http://localhost:5500
```

## Project Structure

```
nightcoremachine/
├── index.html              # Main HTML (semantic structure, PWA manifest)
├── css/
│   └── style.css          # Glassmorphism UI + responsive design
├── js/
│   ├── app.js             # Audio processing, file handling (1879 lines)
│   ├── i18n.js            # Internationalization system
│   ├── translations.js    # Spanish + English strings
│   ├── lame.min.js        # MP3 encoding library
│   └── jsmediatags.min.js # Metadata library (optional)
├── images/                # Logo, icons, OG images
└── .github/
    └── copilot-instructions.md  # AI coding guidelines
```

## Technology Stack

- **Web Audio API** — Native browser audio processing (no plugins)
- **Lame.js** — Client-side MP3 encoding
- **ID3v2.3** — MP3 metadata embedding
- **waifu.im API** — Anime artwork generation
- **PWA** — Works offline (service worker ready)

## Key Capabilities

### Audio Processing
- **Decode**: MP3, WAV, AAC, FLAC, M4A, OGG, WebM, MP4, and more
- **Speed Control**: 1.0x–1.6x (Nightcore) or 0.5x–0.8x (Daycore)
- **Export**: WAV (lossless) or MP3 (320kbps with optional artwork)

### Artwork System
- Auto-fetches anime artwork from **waifu.im** API
- Customizable tags (e.g., "maid", "marin-kitagawa", "uniform")
- Auto-resizes to 1000x1000px + JPEG compression
- Embeds in MP3 as ID3v2.3 frame

### Internationalization
- **Spanish** (default) + **English**
- Browser language auto-detection
- localStorage persistence
- Dynamic meta tags + structured data (SEO)

## Supported Formats

**Upload**: MP3, WAV, AAC, FLAC, M4A, OGG, WebM, MP4, 3GP, WMA  
**Download**: WAV (lossless), MP3 (320kbps)

## Troubleshooting

### "Why does it sound distorted?"
- Use speeds between 1.20x–1.40x for best results
- Avoid speeds > 1.6x
- Use high-quality source files (≥192kbps)

### "Does it work on iOS?"
- Yes! But the file picker works differently:
  - Tap "Browse Files" → Select from "Files" app or "Music" app
  - Or use iTunes to add files to your device

### "Is it legal?"
- **Personal use**: Yes ✓
- **YouTube/Distribution**: You need copyright rights. Many creators use YouTube's Content ID system.

## Contributing

Contributions welcome! Found a bug? Want a feature? [Open an issue](https://github.com/deejayuwu/nightcoremachine/issues) or submit a PR.

### Development Tips
- See `.github/copilot-instructions.md` for AI coding guidelines
- Audio logic: `js/app.js` (state management with `lastUpdateTime`)
- Translations: Add keys to `js/translations.js` + HTML `[data-i18n]` attributes
- Speed math: Daycore uses formula `2.0 - speed` (invert range)

## Browser Support

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome  | ✓       | ✓      |
| Firefox | ✓       | ✓      |
| Safari  | ✓       | ✓      |
| Edge    | ✓       | ✓      |

## Analytics & Privacy

- **Cloudflare Analytics**: Always active (zero user cookies)
- **Google Analytics 4**: Optional, user consent required
- **Audio Processing**: 100% local, nothing uploaded to servers
- **Artwork Fetches**: To waifu.im only (external API)

## License
**Project license:** The code and assets in this repository authored by DJ UWU are licensed under the
Creative Commons Attribution-NonCommercial 4.0 International (`CC BY-NC 4.0`). This permits others to
share and adapt the material for non-commercial purposes, provided appropriate credit is given and changes
are indicated. Commercial use (including selling, charging for access, or bundling in a paid service)
is prohibited without a separate commercial license from the author.

**Third-party libraries:** This project bundles third-party libraries that are licensed separately:

- `js/lame.min.js` (lamejs) — LGPL-3.0 (see `LICENSES/lgpl-3.0.txt` and `THIRD_PARTY_NOTICES.md`)
- `js/jsmediatags.min.js` (jsmediatags) — BSD-3-Clause (see `LICENSES/bsd-3-clause.txt` and `THIRD_PARTY_NOTICES.md`)

Please review `THIRD_PARTY_NOTICES.md` and the license texts in the `LICENSES/` directory for obligations
when redistributing this project. If you need a commercial license for this software, contact the author at
`deejayuwu@gmail.com` to request terms.

**User-uploaded content:** Users are responsible for copyrights and rights in any files they upload.
This project does not claim ownership of user uploads.

## Support

If you enjoy the tool and want to support development:

- **Ko-fi**: [ko-fi.com/djuwu](https://ko-fi.com/djuwu)
- **Twitter**: [@deejayuwu](https://twitter.com/deejayuwu)
- **Instagram**: [@deejayuwu](https://instagram.com/deejayuwu)
- **SoundCloud**: [soundcloud.com/djuwu](https://soundcloud.com/djuwu)

---

Made with 💜 by **DJ UWU**  
Artwork by **waifu.pics**  
© 2025

