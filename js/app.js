let audioCtx, buffer, sourceNode, gainNode;
let isPlaying = false;
let currentTime = 0; // Current playback time in seconds (in buffer time, not real time)
let duration = 0;
let lastUpdateTime = 0; // Last audio context time when we updated
let isDaycoreMode = false; // false = Nightcore, true = Daycore
let waveformData = null;
let waveformAnimId = null;

// Helper function to track events in Google Analytics (defined early for onclick handlers)
window.trackEvent = function(eventName, eventParams = {}){
  if(typeof gtag !== 'undefined'){
    gtag('event', eventName, eventParams);
  }
};

const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const uploadArea = document.getElementById('uploadArea');
const controls = document.getElementById('controls');

// Detect iOS and show help message
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
if(isIOS) {
  const iosHelp = document.querySelector('.ios-help');
  if(iosHelp) iosHelp.style.display = 'block';
}

const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const progressBar = document.getElementById('progressBar');
const progress = document.getElementById('progress');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const trackNameEl = document.getElementById('trackName');

const speed = document.getElementById('speed');
const speedVal = document.getElementById('speedVal');
const downloadWavBtn = document.getElementById('downloadWavBtn');
const downloadMp3Btn = document.getElementById('downloadMp3Btn');

// New elements - will be initialized when controls are shown
let nightcoreBtn = null;
let daycoreBtn = null;
let presetBtns = null;
let waveformCanvas = null;

let rafId = null;
let waveformClickHandler = null; // Store waveform click handler to allow removal

// Artwork variables
let currentArtworkUrl = null;
let currentArtworkBlob = null; // Store artwork image as blob for MP3 embedding
// Get artwork elements dynamically to ensure they exist
function getArtworkElements(){
  return {
    container: document.getElementById('artworkContainer'),
    preview: document.getElementById('artworkPreview'),
    loading: document.getElementById('artworkLoading'),
    refreshBtn: document.getElementById('refreshArtworkBtn'),
    checkbox: document.getElementById('includeArtworkCheckbox')
  };
}

function ensureAudioCtx(){
  if(!audioCtx){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
  }
}

if(browseBtn) browseBtn.addEventListener('click', (e)=> { 
  e.stopPropagation(); 
  fileInput?.click();
  
  // Track browse button click
  trackEvent('browse_button_clicked');
});
if(uploadArea) uploadArea.addEventListener('click', ()=> fileInput?.click());
if(uploadArea) uploadArea.addEventListener('dragover', e=> e.preventDefault());
if(uploadArea) uploadArea.addEventListener('drop', e=>{
  e.preventDefault();
  if(e.dataTransfer.files?.length) {
    // Track drag & drop event
    trackEvent('file_dropped', {
      'method': 'drag_drop'
    });
    loadFile(e.dataTransfer.files[0]);
  }
});
if(fileInput) fileInput.addEventListener('change', e=>{
  if(e.target.files?.length) {
    // Track file selection event
    trackEvent('file_selected', {
      'method': 'file_picker'
    });
    loadFile(e.target.files[0]);
  }
});

async function loadFile(file){
  // Check if file is audio by MIME type or extension (iOS sometimes doesn't set MIME type correctly)
  const isValidAudio = file.type.startsWith('audio/') || 
                       /\.(mp3|wav|aac|flac|m4a|ogg|webm|mp4|m4p|3gp|wma)$/i.test(file.name);
  
  if(!isValidAudio) {
    const errorMsg = window.i18n?.getCurrentLang() === 'en' 
      ? translations?.en?.errorInvalidFile || 'Please select a valid audio file (MP3, WAV, AAC, FLAC, M4A, etc.)'
      : translations?.es?.errorInvalidFile || 'Por favor, selecciona un archivo de audio válido (MP3, WAV, AAC, FLAC, M4A, etc.)';
    alert(errorMsg);
    return;
  }
  
  // CRITICAL: Clean up previous state before loading new file
  // Stop any ongoing playback
  stopSource();
  isPlaying = false;
  togglePlayUI(false);
  
  // Reset state variables
  currentTime = 0;
  lastUpdateTime = 0;
  waveformData = null;
  
    // Clear waveform canvas if it exists
    const canvas = document.getElementById('waveformCanvas');
    if(canvas) {
      const ctx = canvas.getContext('2d');
      if(ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      // Remove old click handler if it exists
      if(waveformClickHandler) {
        canvas.removeEventListener('click', waveformClickHandler);
        waveformClickHandler = null;
      }
    }
    
    // Reset artwork
    currentArtworkUrl = null;
    currentArtworkBlob = null;
    const artwork = getArtworkElements();
    if(artwork.preview) {
      artwork.preview.src = '';
      artwork.preview.classList.remove('loaded');
    }
    if(artwork.loading) {
      artwork.loading.classList.remove('hidden');
    }
    if(artwork.container) {
      artwork.container.hidden = true;
    }
  
  ensureAudioCtx();
  try {
    const arr = await file.arrayBuffer();
    buffer = await audioCtx.decodeAudioData(arr);
    duration = buffer.duration;
    if(trackNameEl) trackNameEl.textContent = (file.name || 'Canción') + ' ♪';
    if(totalTimeEl) totalTimeEl.textContent = fmt(duration);
    if(controls) controls.hidden = false;
    
    // Track file upload event
    trackEvent('file_uploaded', {
      'file_name': file.name,
      'file_type': file.type || 'unknown',
      'file_size': Math.round(file.size / 1024), // Size in KB
      'audio_duration': Math.round(duration)
    });
    
    currentTime = 0;
    lastUpdateTime = 0;
    updateProgressUI(0);
    
    // Wait for browser to render the controls before initializing
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      setTimeout(() => {
        // Initialize new controls after they're visible
        initializeNewControls();
        
        // Generate waveform data
        generateWaveform();
        
        // Update mode toggle visibility based on speed range
        updateSpeedRangeForMode();
        
        // Update preset labels to match current mode
        updatePresetLabels();
        
        // Initialize artwork button
        initializeArtworkButton();
        
        // Load artwork for MP3
        loadArtwork();
      }, 50);
    });
    
    // Clear file input to allow loading the same file again
    if(fileInput) {
      fileInput.value = '';
    }
  } catch(error) {
    console.error('Error loading audio file:', error);
    const errorMsg = window.i18n?.getCurrentLang() === 'en'
      ? translations?.en?.errorLoadingFile || 'Error loading audio file. Make sure it\'s a valid audio file.\n\nIf you\'re using iOS, try:\n- Opening the file from the Files app\n- Or from iTunes/Music'
      : translations?.es?.errorLoadingFile || 'Error al cargar el archivo de audio. Asegúrate de que es un archivo de audio válido.\n\nSi estás usando iOS, intenta:\n- Abrir el archivo desde la app Archivos\n- O desde iTunes/Música';
    alert(errorMsg);
    // Clear file input even on error
    if(fileInput) {
      fileInput.value = '';
    }
  }
}

function startSource(offset=0){
  if(!buffer || !audioCtx) return;
  stopSource();
  
  // Calculate speed based on mode (Daycore inverts speed range)
  let currentSpeed = parseFloat(speed?.value || 1.25);
  if(isDaycoreMode) {
    // Daycore: invert speed (e.g., 1.25x becomes 0.8x)
    currentSpeed = 2.0 - currentSpeed;
    if(currentSpeed < 0.5) currentSpeed = 0.5;
  }
  
  // Clamp offset to valid range
  offset = Math.max(0, Math.min(offset, duration));
  currentTime = offset;
  
  sourceNode = audioCtx.createBufferSource();
  sourceNode.buffer = buffer;
  sourceNode.playbackRate.value = currentSpeed;
  sourceNode.connect(gainNode);
  sourceNode.onended = onEnded;
  
  // Start playing from offset in buffer time
  sourceNode.start(0, offset);
  
  // Record when we started playing (in real time)
  lastUpdateTime = audioCtx.currentTime;
  isPlaying = true;
  togglePlayUI(true);
  tick();
  animateWaveform();
}

function stopSource(){
  if(sourceNode){
    try{ 
      sourceNode.stop(); 
    }catch(e){
      // SourceNode may already be stopped, ignore error
    }
    try{ 
      sourceNode.disconnect(); 
    }catch(e){
      // SourceNode may already be disconnected, ignore error
    }
    sourceNode = null;
  }
  if(rafId){
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if(waveformAnimId){
    cancelAnimationFrame(waveformAnimId);
    waveformAnimId = null;
  }
  isPlaying = false;
}

function onEnded(){
  isPlaying = false;
  currentTime = duration || 0; // Set to end of track
  lastUpdateTime = 0;
  togglePlayUI(false);
  updateProgressUI(currentTime);
  stopSource();
}

function togglePlayUI(playing){
  if(playBtn) playBtn.hidden = playing;
  if(pauseBtn) pauseBtn.hidden = !playing;
}

if(playBtn) playBtn.addEventListener('click', async ()=>{
  if(!buffer) return;
  ensureAudioCtx();
  if(audioCtx.state === 'suspended') await audioCtx.resume();
  startSource(currentTime);
  
  // Track play event
  trackEvent('audio_play', {
    'mode': isDaycoreMode ? 'daycore' : 'nightcore',
    'speed': speed ? parseFloat(speed.value).toFixed(2) : 'unknown',
    'position': Math.round(currentTime)
  });
});

if(pauseBtn) pauseBtn.addEventListener('click', async ()=>{
  if(!isPlaying) return;
  // Update current time before stopping
  currentTime = getCurrentPos();
  
  // Track pause event
  trackEvent('audio_pause', {
    'mode': isDaycoreMode ? 'daycore' : 'nightcore',
    'speed': speed ? parseFloat(speed.value).toFixed(2) : 'unknown',
    'position': Math.round(currentTime),
    'duration': Math.round(duration)
  });
  
  stopSource();
  isPlaying = false;
  togglePlayUI(false);
  if(audioCtx?.state === 'running') await audioCtx.suspend();
});

function getCurrentPos(){
  if(!audioCtx || !duration) return currentTime || 0;
  
  // If not playing, return current position
  if(!isPlaying || !sourceNode) {
    return currentTime || 0;
  }
  
  // Calculate elapsed real time since last update
  const now = audioCtx.currentTime;
  const elapsedRealTime = now - lastUpdateTime;
  
  // Get playback rate
  let rate = parseFloat(speed?.value || 1.25);
  if(isDaycoreMode) {
    rate = 2.0 - rate;
    if(rate < 0.5) rate = 0.5;
  }
  
  // Update current time: elapsed real time * playback rate
  currentTime = currentTime + (elapsedRealTime * rate);
  
  // Clamp to valid range
  if(currentTime > duration) {
    currentTime = duration;
    onEnded();
    return duration;
  }
  
  if(currentTime < 0) currentTime = 0;
  
  // Update last update time
  lastUpdateTime = now;
  
  return currentTime;
}

function tick(){
  if(!isPlaying || !sourceNode) {
    if(rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    return;
  }
  
  const pos = getCurrentPos();
  if(pos >= 0 && pos <= duration) {
    updateProgressUI(pos);
  }
  
  rafId = requestAnimationFrame(tick);
}

function updateProgressUI(sec){
  const pct = duration ? (sec/duration)*100 : 0;
  if(progress) progress.style.width = `${pct}%`;
  if(progressBar) progressBar.setAttribute('aria-valuenow', String(Math.round(pct)));
  if(currentTimeEl) currentTimeEl.textContent = fmt(sec);
}

if(progressBar) {
  progressBar.addEventListener('click', seekFromEvent);
  progressBar.addEventListener('keydown', e=>{
    if(!buffer || !audioCtx) return;
    const step = duration/20;
    if(e.key === 'ArrowRight' || e.key === 'ArrowUp'){ 
      doSeek(Math.min(getCurrentPos()+step, duration)); 
    }
    if(e.key === 'ArrowLeft' || e.key === 'ArrowDown'){ 
      doSeek(Math.max(getCurrentPos()-step, 0)); 
    }
  });
}

function seekFromEvent(e){
  if(!buffer || !audioCtx) return;
  const rect = progressBar.getBoundingClientRect();
  const pct = (e.clientX - rect.left)/rect.width;
  const newTime = Math.max(0, Math.min(duration * pct, duration));
  doSeek(newTime);
}

function doSeek(newTime){
  if(!buffer || !audioCtx || !duration) return;
  
  const wasPlaying = isPlaying;
  const seekTime = Math.max(0, Math.min(newTime, duration));
  
  // Stop current playback first
  stopSource();
  
  // Update current time immediately
  currentTime = seekTime;
  lastUpdateTime = 0;
  updateProgressUI(seekTime);
  
  // Update waveform visualization immediately
  if(waveformData && waveformData.length > 0) {
    drawWaveform(0);
  }
  
  // If was playing, resume from new position
  if(wasPlaying){
    // Small delay to ensure stopSource() completed and state is clean
    setTimeout(() => {
      ensureAudioCtx();
      if(audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => {
          startSource(seekTime);
        }).catch(err => {
          console.error('Error resuming audio context:', err);
          startSource(seekTime);
        });
      } else {
        startSource(seekTime);
      }
    }, 50);
  }
}

if(speed) {
  let lastTrackedSpeed = speed.value;
  speed.addEventListener('input', ()=>{
    const speedValue = parseFloat(speed.value);
    
    // Track speed change (only if changed significantly to avoid spam)
    if(Math.abs(parseFloat(speedValue) - parseFloat(lastTrackedSpeed)) >= 0.1){
      trackEvent('speed_changed', {
        'speed': speedValue.toFixed(2),
        'mode': isDaycoreMode ? 'daycore' : 'nightcore'
      });
      lastTrackedSpeed = speed.value;
    }
    
    if(speedVal) {
      if(isDaycoreMode) {
        const invertedSpeed = (2.0 - speedValue).toFixed(2);
        speedVal.textContent = `${invertedSpeed}x (Daycore)`;
      } else {
        speedVal.textContent = `${speedValue.toFixed(2)}x`;
      }
    }
    // Update active preset
    updateActivePreset(speedValue);
    
    if(sourceNode){
      let adjustedSpeed = speedValue;
      if(isDaycoreMode) {
        adjustedSpeed = 2.0 - speedValue;
        if(adjustedSpeed < 0.5) adjustedSpeed = 0.5;
      }
      sourceNode.playbackRate.value = adjustedSpeed;
    }
  });
}

// Shared function to render audio with speed adjustment
async function renderAudio(){
  if(!buffer) return null;
  
  let rate = parseFloat(speed?.value || 1.25);
  
  // Apply Daycore mode if active
  if(isDaycoreMode) {
    rate = 2.0 - rate;
    if(rate < 0.5) rate = 0.5;
  }
  
  const length = Math.max(1, Math.floor(buffer.length / rate));
  const off = new OfflineAudioContext({
    numberOfChannels: buffer.numberOfChannels,
    length,
    sampleRate: buffer.sampleRate
  });
  const src = off.createBufferSource();
  src.buffer = buffer;
  src.playbackRate.value = rate;
  const g = off.createGain();
  g.gain.value = 1;
  src.connect(g); 
  g.connect(off.destination);
  src.start(0);
  return await off.startRendering();
}

// Download WAV
if(downloadWavBtn) downloadWavBtn.addEventListener('click', async ()=>{
  if(!buffer) return;
  
  try {
    const rendered = await renderAudio();
    if(!rendered) return;
    
    const blob = bufferToWav(rendered);
    const filename = `${sanitize(getTrackName())} (${getModePrefix()}).wav`;
    downloadFile(blob, filename);
    
    // Track WAV download event
    trackEvent('file_download', {
      'file_format': 'wav',
      'file_size': Math.round(blob.size / 1024),
      'mode': getModePrefix(),
      'speed': speed ? parseFloat(speed.value).toFixed(2) : 'unknown',
      'audio_duration': Math.round(duration),
      'value': 1
    });
  } catch(error) {
    console.error('Error downloading WAV:', error);
    const errorMsg = window.i18n?.getCurrentLang() === 'en'
      ? translations?.en?.errorDownloadWav || 'Error downloading WAV file. Please try again.'
      : translations?.es?.errorDownloadWav || 'Error al descargar el archivo WAV. Por favor, intenta de nuevo.';
    alert(errorMsg);
  }
});

// ===== ARTWORK FUNCTIONS =====

// Load artwork from waifu.im
async function loadArtwork(){
  const artwork = getArtworkElements();
  
  if(!artwork.container || !artwork.preview || !artwork.loading) {
    console.warn('Artwork elements not found');
    return;
  }
  
  try {
    // Show container and loading
    if(artwork.container) {
      artwork.container.removeAttribute('hidden');
      artwork.container.style.display = '';
    }
    
    if(artwork.preview) {
      artwork.preview.classList.remove('loaded');
      artwork.preview.style.display = 'none';
    }
    
    if(artwork.loading) {
      artwork.loading.classList.remove('hidden');
      artwork.loading.style.display = 'block';
      artwork.loading.style.color = '#7b5cff';
      
      const currentLang = window.i18n?.getCurrentLang() || 'es';
      if(translations && translations[currentLang] && translations[currentLang].artworkLoading) {
        artwork.loading.textContent = translations[currentLang].artworkLoading;
      } else {
        artwork.loading.textContent = 'Cargando...';
      }
    }
    
    // Get tags from input or use defaults
    const tagsInput = document.getElementById('artworkTagsInput');
    let tags = [];
    
    if(tagsInput && tagsInput.value.trim()) {
      // User provided tags - split by comma and clean
      tags = tagsInput.value.split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0);
      console.log('Using user-provided tags:', tags);
    } else {
      // Default tags for kawaii/cute images - SFW only (verified working tags)
      tags = ['waifu', 'maid', 'marin-kitagawa', 'mori-calliope', 'raiden-shogun', 'selfies', 'uniform'];
      console.log('Using default SFW tags');
    }
    
    // Normalize tag names (cat-girl -> catgirl, etc.)
    tags = tags.map(tag => {
      // Replace common variations
      if(tag === 'cat-girl') return 'catgirl';
      if(tag === 'catgirl') return 'catgirl';
      return tag;
    });
    
    // Determine which tags to use
    let tagsToUse = [];
    const userSpecifiedTags = tagsInput && tagsInput.value.trim() && tags.length > 0;
    
    if(userSpecifiedTags) {
      // User wants specific tags - use ALL of them
      tagsToUse = tags;
      console.log('User specified tags (AND logic - must have all):', tagsToUse);
    } else {
      // No user input - select one random tag from defaults
      const selectedTag = tags[Math.floor(Math.random() * tags.length)];
      tagsToUse = [selectedTag];
      console.log('Using random default tag:', selectedTag);
    }
    
    // Build API URL - waifu.im uses comma-separated tags for OR logic
    // We'll request with all tags, then filter for AND logic on client side
    const tagsParam = tagsToUse.join(',');
    let apiUrl = `https://api.waifu.im/search?included_tags=${tagsParam}&is_nsfw=false`;
    
    console.log('API URL:', apiUrl);
    
    let res = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    // If multiple tags fail, try with just one tag
    if(!res.ok && tagsToUse.length > 1 && userSpecifiedTags) {
      console.log('Multiple tags request failed, trying single tags...');
      // Try with first tag
      apiUrl = `https://api.waifu.im/search?included_tags=${tagsToUse[0]}&is_nsfw=false`;
      res = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
    }
    
    // If still fails and user provided tags, clear input and use random
    // If no user tags, fallback to random SFW
    if(!res.ok) {
      if(userSpecifiedTags) {
        console.warn(`No se encontraron imágenes con los tags: ${tagsToUse.join(', ')}`);
        console.log('Limpiando tags y usando imagen aleatoria...');
        
        // Clear the tags input
        if(tagsInput) {
          tagsInput.value = '';
        }
        
        // Use random SFW image instead
        apiUrl = 'https://api.waifu.im/search?is_nsfw=false';
        res = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        // Update tagsToUse for logging
        tagsToUse = [];
      } else {
        console.log('Tag-based request failed, trying random SFW image...');
        apiUrl = 'https://api.waifu.im/search?is_nsfw=false';
        res = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
      }
    }
    
    if(!res.ok) {
      const errorText = await res.text().catch(() => 'Unable to read error response');
      throw new Error(`HTTP error! status: ${res.status}, response: ${errorText}`);
    }
    
    const data = await res.json();
    console.log('Artwork API response:', data);
    
    if(data?.images && Array.isArray(data.images) && data.images.length > 0) {
      let imageData = null;
      
      // Check if we're using fallback (tags were cleared)
      const usingFallback = userSpecifiedTags && tagsToUse.length === 0;
      
      if(!usingFallback && userSpecifiedTags && tagsToUse.length > 1) {
        // User specified multiple tags - find image that has ALL tags (AND logic)
        for(const img of data.images) {
          const imageTags = img.tags?.map(t => (t.name || t).toLowerCase()) || [];
          // Check if image has ALL requested tags
          const hasAllTags = tagsToUse.every(requestedTag => 
            imageTags.some(imgTag => {
              const tagName = typeof imgTag === 'string' ? imgTag : imgTag.toLowerCase();
              return tagName === requestedTag || tagName.includes(requestedTag);
            })
          );
          
          if(hasAllTags) {
            imageData = img;
            console.log('Found image with ALL requested tags:', tagsToUse, 'Image tags:', imageTags);
            break;
          }
        }
        
        // If no image has all tags, try to find one with at least most tags
        if(!imageData) {
          let bestMatch = null;
          let bestMatchCount = 0;
          
          for(const img of data.images) {
            const imageTags = img.tags?.map(t => (t.name || t).toLowerCase()) || [];
            const matchCount = tagsToUse.filter(requestedTag =>
              imageTags.some(imgTag => {
                const tagName = typeof imgTag === 'string' ? imgTag : imgTag.toLowerCase();
                return tagName === requestedTag || tagName.includes(requestedTag);
              })
            ).length;
            
            if(matchCount > bestMatchCount) {
              bestMatchCount = matchCount;
              bestMatch = img;
            }
          }
          
          if(bestMatch && bestMatchCount > 0) {
            imageData = bestMatch;
            console.log(`Found image with ${bestMatchCount}/${tagsToUse.length} requested tags:`, tagsToUse);
          }
        }
        
        // If still no match, use first image but warn
        if(!imageData) {
          imageData = data.images[0];
          console.warn('No image matches all requested tags, using first image. Requested:', tagsToUse);
        }
      } else if(!usingFallback && userSpecifiedTags && tagsToUse.length === 1) {
        // Single tag - find image with that exact tag
        for(const img of data.images) {
          const imageTags = img.tags?.map(t => (t.name || t).toLowerCase()) || [];
          const requestedTag = tagsToUse[0];
          const hasTag = imageTags.some(imgTag => {
            const tagName = typeof imgTag === 'string' ? imgTag : imgTag.toLowerCase();
            return tagName === requestedTag || tagName.includes(requestedTag);
          });
          
          if(hasTag) {
            imageData = img;
            console.log('Found image with requested tag:', requestedTag, 'Image tags:', imageTags);
            break;
          }
        }
        
        if(!imageData) {
          // No match found - this shouldn't happen if API worked, but handle it
          imageData = data.images[0];
          console.warn('No exact tag match, using first image. Requested:', tagsToUse[0]);
        }
      } else {
        // No user tags or using fallback - just use first image (random)
        imageData = data.images[0];
        if(usingFallback) {
          console.log('Using random image after tag failure');
        }
      }
      
      const imageUrl = imageData?.url || imageData?.urls?.original || imageData?.urls?.large || imageData?.source;
      
      if(imageUrl) {
        console.log('Image URL found:', imageUrl);
        if(imageData.tags) {
          console.log('Image tags:', imageData.tags.map(t => t.name));
        }
        await processAndSetArtwork(imageUrl, artwork);
      } else {
        throw new Error('No URL found in image data: ' + JSON.stringify(imageData));
      }
    } else {
      throw new Error('No images in response: ' + JSON.stringify(data));
    }
  } catch(error) {
    console.error('Error loading artwork:', error);
    
    // If user specified tags that failed, clear input and try random
    const tagsInput = document.getElementById('artworkTagsInput');
    if(tagsInput && tagsInput.value.trim() && error.message?.includes('No se encontraron imágenes')) {
      console.log('Tag error detected, clearing input and trying random image...');
      tagsInput.value = '';
      
      // Try one more time with random image
      try {
        const randomApiUrl = 'https://api.waifu.im/search?is_nsfw=false';
        const res = await fetch(randomApiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if(res.ok) {
          const data = await res.json();
          if(data?.images && Array.isArray(data.images) && data.images.length > 0) {
            const imageData = data.images[0];
            const imageUrl = imageData?.url || imageData?.urls?.original || imageData?.urls?.large || imageData?.source;
            if(imageUrl) {
              await processAndSetArtwork(imageUrl, artwork);
              return; // Success, exit early
            }
          }
        }
      } catch(retryError) {
        console.error('Retry also failed:', retryError);
      }
    }
    
    // Show error only if retry failed
    if(artwork.loading) {
      artwork.loading.textContent = 'Error: ' + (error.message || 'No se pudo cargar la imagen');
      artwork.loading.style.color = '#ff4444';
    }
  }
}

// Process and set artwork image
async function processAndSetArtwork(imageUrl, artworkElements = null){
  const artwork = artworkElements || getArtworkElements();
  
  try {
    console.log('Fetching artwork image from:', imageUrl);
    // Fetch image
    const response = await fetch(imageUrl);
    
    if(!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log('Image blob received, size:', blob.size);
    
    // Create image element to process
    const img = new Image();
    const imgUrl = URL.createObjectURL(blob);
    
    img.onload = function() {
      try {
        console.log('Image loaded, dimensions:', img.width, 'x', img.height);
        // Create canvas to resize/compress image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set max dimensions (1000x1000 for artwork, but keep aspect ratio)
        const maxSize = 1000;
        let width = img.width;
        let height = img.height;
        
        if(width > maxSize || height > maxSize) {
          if(width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob (JPEG with 0.9 quality for good balance)
        canvas.toBlob(function(processedBlob) {
          if(processedBlob) {
            console.log('Artwork processed successfully');
            // Store blob for MP3 embedding
            currentArtworkBlob = processedBlob;
            currentArtworkUrl = imageUrl;
            
            // Update preview
            if(artwork.preview) {
              const previewUrl = URL.createObjectURL(processedBlob);
              artwork.preview.onload = function() {
                console.log('Preview image loaded successfully');
                this.classList.add('loaded');
                this.style.display = 'block';
              };
              artwork.preview.onerror = function() {
                console.error('Error loading preview image');
                if(artwork.loading) {
                  artwork.loading.textContent = 'Error mostrando preview';
                  artwork.loading.style.display = 'block';
                }
              };
              artwork.preview.src = previewUrl;
              console.log('Preview src set');
            }
            if(artwork.loading) {
              artwork.loading.classList.add('hidden');
              artwork.loading.style.display = 'none';
            }
            
            // Clean up
            URL.revokeObjectURL(imgUrl);
          } else {
            console.error('Failed to create blob from canvas');
            if(artwork.loading) {
              artwork.loading.textContent = 'Error procesando imagen';
            }
          }
        }, 'image/jpeg', 0.9);
      } catch(error) {
        console.error('Error processing artwork:', error);
        if(artwork.loading) {
          artwork.loading.textContent = 'Error: ' + (error.message || 'Error procesando');
        }
        URL.revokeObjectURL(imgUrl);
      }
    };
    
    img.onerror = function(e) {
      console.error('Error loading artwork image:', e);
      if(artwork.loading) {
        artwork.loading.textContent = 'Error cargando imagen';
      }
      URL.revokeObjectURL(imgUrl);
    };
    
    img.src = imgUrl;
  } catch(error) {
    console.error('Error fetching artwork:', error);
    if(artwork.loading) {
      artwork.loading.textContent = 'Error: ' + (error.message || 'Error descargando');
    }
  }
}

// Refresh artwork (load new image) - Initialize when DOM is ready
function initializeArtworkButton(){
  const artwork = getArtworkElements();
  if(artwork.refreshBtn && !artwork.refreshBtn.hasAttribute('data-initialized')) {
    artwork.refreshBtn.setAttribute('data-initialized', 'true');
    artwork.refreshBtn.addEventListener('click', function() {
      console.log('Refresh artwork button clicked');
      loadArtwork();
      trackEvent('artwork_refreshed');
    });
  }
}

// Initialize artwork button when controls are shown
// Also initialize it immediately in case it's already in DOM
if(document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeArtworkButton);
} else {
  initializeArtworkButton();
}

// Add MP3 metadata with artwork - ID3v2.3 compliant
async function addMP3Metadata(mp3Blob, artworkBlob) {
  const mp3Array = new Uint8Array(await mp3Blob.arrayBuffer());
  const artworkArray = new Uint8Array(await artworkBlob.arrayBuffer());
  const audioData = mp3Array;
  const title = getTrackName();
  const genre = 'Nightcore';
  const year = new Date().getFullYear().toString();
  
  // Helper: UTF-8 encoding
  const utf8 = (str) => {
    const encoder = new TextEncoder();
    return encoder.encode(str);
  };
  
  // Helper: Latin-1 encoding
  const latin1 = (str) => {
    const arr = new Uint8Array(str.length);
    for(let i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i) & 0xFF;
    return arr;
  };
  
  // Create frame - ID3v2.3: frame size uses normal 32-bit integers (NOT synchsafe)
  const createFrame = (frameId, data) => {
    const frame = new Uint8Array(10 + data.length);
    // Frame ID (4 bytes)
    for(let i = 0; i < 4; i++) frame[i] = frameId.charCodeAt(i);
    // Size (4 bytes, normal big-endian, NOT synchsafe)
    const size = data.length;
    frame[4] = (size >> 24) & 0xFF;
    frame[5] = (size >> 16) & 0xFF;
    frame[6] = (size >> 8) & 0xFF;
    frame[7] = size & 0xFF;
    // Flags (2 bytes)
    frame[8] = 0x00;
    frame[9] = 0x00;
    // Data
    frame.set(data, 10);
    return frame;
  };
  
  const frames = [];
  
  // Title (TIT2) - UTF-8 encoding (0x03)
  if(title) {
    const titleBytes = utf8(title);
    const frameData = new Uint8Array(1 + titleBytes.length);
    frameData[0] = 0x03; // UTF-8 encoding
    frameData.set(titleBytes, 1);
    frames.push(createFrame('TIT2', frameData));
  }
  
  // Genre (TCON) - UTF-8 encoding (0x03)
  if(genre) {
    const genreBytes = utf8(genre);
    const frameData = new Uint8Array(1 + genreBytes.length);
    frameData[0] = 0x03; // UTF-8 encoding
    frameData.set(genreBytes, 1);
    frames.push(createFrame('TCON', frameData));
  }
  
  // Year (TYER) - ID3v2.3 uses TYER, not TDRC
  if(year) {
    const yearBytes = latin1(year);
    const frameData = new Uint8Array(1 + yearBytes.length);
    frameData[0] = 0x00; // ISO-8859-1 encoding
    frameData.set(yearBytes, 1);
    frames.push(createFrame('TYER', frameData));
  }
  
  // Artwork (APIC) - ID3v2.3 format
  if(artworkArray.length > 0) {
    const mimeBytes = latin1('image/jpeg');
    const descBytes = latin1('Cover');
    
    // APIC structure for ID3v2.3:
    // - Text encoding (1 byte)
    // - MIME type (n bytes, null-terminated)
    // - Picture type (1 byte)
    // - Description (n bytes, null-terminated)
    // - Picture data (n bytes)
    const apicData = new Uint8Array(1 + mimeBytes.length + 1 + 1 + descBytes.length + 1 + artworkArray.length);
    let pos = 0;
    
    apicData[pos++] = 0x00; // Text encoding: ISO-8859-1
    apicData.set(mimeBytes, pos); pos += mimeBytes.length;
    apicData[pos++] = 0x00; // MIME type null terminator
    apicData[pos++] = 0x03; // Picture type: Cover (front)
    apicData.set(descBytes, pos); pos += descBytes.length;
    apicData[pos++] = 0x00; // Description null terminator
    apicData.set(artworkArray, pos);
    
    frames.push(createFrame('APIC', apicData));
  }
  
  // Calculate total frame size (excluding header)
  const totalFrameSize = frames.reduce((sum, f) => sum + f.length, 0);
  
  // Create ID3v2.3 header (10 bytes)
  // Header size uses synchsafe integers (7 bits per byte)
  const header = new Uint8Array(10);
  header[0] = 0x49; // 'I'
  header[1] = 0x44; // 'D'
  header[2] = 0x33; // '3'
  header[3] = 0x03; // Version 2.3.0
  header[4] = 0x00; // Revision
  header[5] = 0x00; // Flags
  // Size: synchsafe integer (4 bytes, 7 bits each)
  header[6] = (totalFrameSize >> 21) & 0x7F;
  header[7] = (totalFrameSize >> 14) & 0x7F;
  header[8] = (totalFrameSize >> 7) & 0x7F;
  header[9] = totalFrameSize & 0x7F;
  
  // Combine: header (10 bytes) + frames + audio data
  const result = new Uint8Array(10 + totalFrameSize + audioData.length);
  result.set(header, 0);
  let offset = 10;
  for(const frame of frames) {
    result.set(frame, offset);
    offset += frame.length;
  }
  result.set(audioData, offset);
  
  return new Blob([result], { type: 'audio/mpeg' });
}

// Using simple ID3v2.3 implementation - no external library needed

// Download MP3 (320kbps)
if(downloadMp3Btn) downloadMp3Btn.addEventListener('click', async ()=>{
  if(!buffer) return;
  
  // Check if lamejs is available
  if(typeof lamejs === 'undefined') {
    const errorMsg = window.i18n?.getCurrentLang() === 'en'
      ? translations?.en?.errorMp3Library || 'Error: MP3 encoding library not loaded. Please reload the page.'
      : translations?.es?.errorMp3Library || 'Error: La librería de codificación MP3 no está cargada. Por favor, recarga la página.';
    alert(errorMsg);
    return;
  }
  
  try {
    // Disable button during processing
    downloadMp3Btn.disabled = true;
    const processingText = window.i18n?.getCurrentLang() === 'en' ? 'Processing MP3...' : 'Procesando MP3...';
    downloadMp3Btn.textContent = processingText;
    
    const rendered = await renderAudio();
    if(!rendered) return;
    
    let mp3Blob = bufferToMp3(rendered, 320);
    
    // Add metadata if artwork should be included
    const artwork = getArtworkElements();
    const shouldIncludeArtwork = artwork.checkbox && artwork.checkbox.checked && currentArtworkBlob;
    
    if(shouldIncludeArtwork) {
      try {
        mp3Blob = await addMP3Metadata(mp3Blob, currentArtworkBlob);
      } catch(metadataError) {
        console.error('Error adding metadata:', metadataError);
      }
    }
    
    const filename = `${sanitize(getTrackName())} (${getModePrefix()}).mp3`;
    downloadFile(mp3Blob, filename);
    
    // Track MP3 download event
    trackEvent('file_download', {
      'file_format': 'mp3',
      'file_size': Math.round(mp3Blob.size / 1024),
      'bitrate': '320',
      'mode': getModePrefix(),
      'speed': speed ? parseFloat(speed.value).toFixed(2) : 'unknown',
      'audio_duration': Math.round(duration),
      'has_artwork': shouldIncludeArtwork ? 'yes' : 'no',
      'value': 1
    });
    
    // Re-enable button
    downloadMp3Btn.disabled = false;
    const btnText = window.i18n?.getCurrentLang() === 'en'
      ? translations?.en?.downloadMp3 || 'Download MP3 (320kbps)'
      : translations?.es?.downloadMp3 || 'Descargar MP3 (320kbps)';
    downloadMp3Btn.textContent = btnText;
  } catch(error) {
    console.error('Error downloading MP3:', error);
    const errorMsg = window.i18n?.getCurrentLang() === 'en'
      ? translations?.en?.errorDownloadMp3 || 'Error downloading MP3 file. Please try again.'
      : translations?.es?.errorDownloadMp3 || 'Error al descargar el archivo MP3. Por favor, intenta de nuevo.';
    alert(errorMsg);
    
    // Restore button text based on language
    const btnText = window.i18n?.getCurrentLang() === 'en'
      ? translations?.en?.downloadMp3 || 'Download MP3 (320kbps)'
      : translations?.es?.downloadMp3 || 'Descargar MP3 (320kbps)';
    downloadMp3Btn.disabled = false;
    downloadMp3Btn.textContent = btnText;
  }
});

function bufferToWav(abuf){
  const numChan = abuf.numberOfChannels;
  const length = abuf.length * numChan * 2 + 44;
  const buf = new ArrayBuffer(length);
  const view = new DataView(buf);
  writeStr(view,0,'RIFF');
  view.setUint32(4, 36 + abuf.length * numChan * 2, true);
  writeStr(view,8,'WAVE');
  writeStr(view,12,'fmt ');
  view.setUint32(16,16,true); 
  view.setUint16(20,1,true);
  view.setUint16(22,numChan,true);
  view.setUint32(24,abuf.sampleRate,true);
  view.setUint32(28,abuf.sampleRate*numChan*2,true);
  view.setUint16(32,numChan*2,true);
  view.setUint16(34,16,true);
  writeStr(view,36,'data');
  view.setUint32(40,abuf.length * numChan * 2, true);
  let offset = 44;
  for(let i=0;i<abuf.length;i++){
    for(let ch=0; ch<numChan; ch++){
      const s = Math.max(-1, Math.min(1, abuf.getChannelData(ch)[i]));
      view.setInt16(offset, s<0 ? s*0x8000 : s*0x7FFF, true);
      offset += 2;
    }
  }
  return new Blob([view], {type:'audio/wav'});
}

function writeStr(view, offset, str){ 
  for(let i=0;i<str.length;i++) view.setUint8(offset+i, str.charCodeAt(i)); 
}

// Convert AudioBuffer to MP3 using lamejs (320kbps)
function bufferToMp3(audioBuffer, kbps = 320){
  if(typeof lamejs === 'undefined' || !lamejs.Mp3Encoder) {
    throw new Error('lamejs library not loaded');
  }
  
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;
  
  // Initialize MP3 encoder with 320kbps
  const mp3encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, kbps);
  const sampleBlockSize = 1152; // Standard MP3 frame size
  const mp3Data = [];
  
  // Get audio data
  let leftChannel, rightChannel;
  if(numChannels === 1) {
    leftChannel = audioBuffer.getChannelData(0);
    rightChannel = null;
  } else {
    leftChannel = audioBuffer.getChannelData(0);
    rightChannel = audioBuffer.getChannelData(1);
  }
  
  // Convert Float32 samples to Int16 for MP3 encoder
  const convertToInt16 = (samples) => {
    const int16Array = new Int16Array(samples.length);
    for(let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  };
  
  // Process audio in blocks
  for(let i = 0; i < leftChannel.length; i += sampleBlockSize) {
    const leftChunk = convertToInt16(leftChannel.subarray(i, i + sampleBlockSize));
    let mp3buf;
    
    if(numChannels === 1) {
      mp3buf = mp3encoder.encodeBuffer(leftChunk);
    } else {
      const rightChunk = convertToInt16(rightChannel.subarray(i, i + sampleBlockSize));
      mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    }
    
    if(mp3buf.length > 0) {
      mp3Data.push(new Uint8Array(mp3buf));
    }
  }
  
  // Flush remaining data
  const mp3buf = mp3encoder.flush();
  if(mp3buf.length > 0) {
    mp3Data.push(new Uint8Array(mp3buf));
  }
  
  // Combine all MP3 data chunks
  const totalLength = mp3Data.reduce((sum, chunk) => sum + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for(const chunk of mp3Data) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }
  
  return new Blob([combined], {type: 'audio/mpeg'});
}

// Sanitize filename - only remove characters that are invalid in filenames, keep spaces
function sanitize(s){ 
  // Remove invalid filename characters: / \ : * ? " < > |
  // Keep spaces and other valid characters
  return s.replace(/[\/\\:*?"<>|]/g, '').trim();
}

function fmt(sec){ 
  sec = Math.max(0, Math.floor(sec)); 
  const m = Math.floor(sec/60); 
  const s = (sec%60).toString().padStart(2,'0'); 
  return `${m}:${s}`; 
}

// Helper function to get clean track name
function getTrackName(){
  return trackNameEl ? trackNameEl.textContent.replace(' ♪', '').trim() : 'nightcore';
}

// Helper function to get mode prefix
function getModePrefix(){
  return isDaycoreMode ? 'daycore' : 'nightcore';
}

// Helper function to download file
function downloadFile(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Manual ID3v2.3 implementation functions are above in addMP3Metadata

// Fondos waifu.pics y partículas kawaii
const bg = document.getElementById('bg');
async function loadWaifu(){
  if(!bg) return;
  try{
    const cats = ['waifu','neko','shinobu','megumin'];
    const cat = cats[Math.floor(Math.random()*cats.length)];
    const res = await fetch(`https://api.waifu.pics/sfw/${cat}`);
    const data = await res.json();
    if(data?.url) bg.style.backgroundImage = `url('${data.url}')`;
  }catch(e){
    console.error('Error loading waifu background:', e);
  }
}
if(bg) {
  loadWaifu(); 
  setInterval(loadWaifu, 30000);
}

const particles = document.getElementById('particles');
const glyphs = ['✨','⭐','🌸','💖','🎵','♪','☆','♡','💫','🌟'];
function spawnParticle(){
  if(!particles) return;
  const el = document.createElement('div');
  el.className = 'particle';
  el.textContent = glyphs[Math.floor(Math.random()*glyphs.length)];
  el.style.left = Math.random()*100 + 'vw';
  el.style.bottom = '-20px';
  el.style.animationDuration = (3 + Math.random()*4) + 's';
  el.style.opacity = String(0.4 + Math.random()*0.5);
  particles.appendChild(el);
  setTimeout(()=> el.remove(), 8000);
}
if(particles) {
  for(let i=0;i<8;i++) setTimeout(spawnParticle, i*400);
  setInterval(spawnParticle, 1500);
}

// Accesibilidad DnD global
document.addEventListener('dragover', e=> e.preventDefault(), false);
document.addEventListener('drop', e=> e.preventDefault(), false);

// Cookie Banner Management
const cookieBanner = document.getElementById('cookieBanner');
const acceptBtn = document.getElementById('acceptCookies');
const rejectBtn = document.getElementById('rejectCookies');

// Check if user already made a choice
function checkCookieConsent(){
  if(!cookieBanner) return;
  const consent = localStorage.getItem('cookieConsent');
  if(!consent){
    // Show cookie banner after a delay to ensure better UX
    // Cloudflare Analytics is already active (no cookies, no consent needed)
    // This banner is only for Google Analytics (requires cookies)
    setTimeout(() => {
      cookieBanner.classList.add('show');
    }, 3000); // 3 seconds delay - user can read content first
  }
  // If consent is already saved, don't show banner
}

if(acceptBtn) acceptBtn.addEventListener('click', ()=>{
  localStorage.setItem('cookieConsent', 'accepted');
  if(cookieBanner) cookieBanner.classList.remove('show');
  // Load analytics and tracking services that require consent
  loadAnalytics();
});

if(rejectBtn) rejectBtn.addEventListener('click', ()=>{
  localStorage.setItem('cookieConsent', 'rejected');
  if(cookieBanner) cookieBanner.classList.remove('show');
  // Don't load analytics that require cookies
});

// Load analytics based on consent
function loadAnalytics(){
  const consent = localStorage.getItem('cookieConsent');
  
  // Google Analytics 4 - Only load if user accepted cookies
  if(consent === 'accepted' && typeof gtag === 'undefined'){
    // Google Analytics 4 Measurement ID
    const GA_MEASUREMENT_ID = 'G-7FL76B6R30';
    
    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    
    // Configure GA4 with privacy settings
    gtag('config', GA_MEASUREMENT_ID, {
      'anonymize_ip': true, // Privacy-friendly: anonymize IP addresses
      'allow_google_signals': false, // Disable Google signals for privacy
      'allow_ad_personalization_signals': false // Disable ad personalization
    });
    
    // Load GA4 script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
    
    // Track initial page view
    gtag('event', 'page_view', {
      'page_path': window.location.pathname,
      'page_title': document.title
    });
    
    console.log('Google Analytics 4 loaded');
  }
}

// trackEvent is already defined at the top of the file for early availability

// Check if user already accepted cookies on page load
const savedConsent = localStorage.getItem('cookieConsent');
if(savedConsent === 'accepted'){
  loadAnalytics();
}

// Show banner on load if needed
checkCookieConsent();

// ===== NEW FEATURES: Daycore Toggle, Presets, Waveform =====

// Initialize new controls when they become available
function initializeNewControls(){
  try {
    // Get elements now that controls are visible
    const controlsSection = document.getElementById('controls');
    if(!controlsSection || controlsSection.hidden) {
      setTimeout(initializeNewControls, 100);
      return;
    }
    
    // Get elements
    nightcoreBtn = document.getElementById('nightcoreBtn');
    daycoreBtn = document.getElementById('daycoreBtn');
    presetBtns = document.querySelectorAll('.preset-btn');
    waveformCanvas = document.getElementById('waveformCanvas');
    
    // Setup mode toggle listeners (only if not already set)
    if(nightcoreBtn && !nightcoreBtn.hasAttribute('data-initialized')) {
      nightcoreBtn.setAttribute('data-initialized', 'true');
      nightcoreBtn.addEventListener('click', function(e){
        e.preventDefault();
        toggleMode(false);
      });
    }
    
    if(daycoreBtn && !daycoreBtn.hasAttribute('data-initialized')) {
      daycoreBtn.setAttribute('data-initialized', 'true');
      daycoreBtn.addEventListener('click', function(e){
        e.preventDefault();
        toggleMode(true);
      });
    }
    
    // Setup preset buttons listeners
    if(presetBtns && presetBtns.length > 0) {
      for(let i = 0; i < presetBtns.length; i++) {
        const btn = presetBtns[i];
        if(!btn.hasAttribute('data-initialized')) {
          btn.setAttribute('data-initialized', 'true');
          btn.addEventListener('click', function(e){
            e.preventDefault();
            const presetSpeed = this.getAttribute('data-speed');
            applyPreset(presetSpeed);
          });
        }
      }
    }
    
    // Setup waveform canvas click listener for seeking
    if(waveformCanvas) {
      // Remove old handler if it exists
      if(waveformClickHandler) {
        waveformCanvas.removeEventListener('click', waveformClickHandler);
      }
      
      // Create new handler function
      waveformClickHandler = function(e){
        if(!buffer || !audioCtx || !duration) return;
        const rect = waveformCanvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, clickX / rect.width));
        const newTime = duration * pct;
        doSeek(newTime);
        
        // Track waveform click event
        trackEvent('waveform_clicked', {
          'position': Math.round(newTime),
          'duration': Math.round(duration)
        });
      };
      
      // Add new handler
      waveformCanvas.style.cursor = 'pointer';
      waveformCanvas.addEventListener('click', waveformClickHandler);
    }
  } catch(error) {
    console.error('Error initializing new controls:', error);
  }
}

// Mode Toggle (Nightcore/Daycore)
function toggleMode(isDaycore){
  isDaycoreMode = isDaycore;
  
  // Track mode change event
  trackEvent('mode_changed', {
    'mode': isDaycore ? 'daycore' : 'nightcore',
    'previous_mode': isDaycore ? 'nightcore' : 'daycore'
  });
  
  // Re-get elements in case they weren't set
  if(!nightcoreBtn) nightcoreBtn = document.getElementById('nightcoreBtn');
  if(!daycoreBtn) daycoreBtn = document.getElementById('daycoreBtn');
  
  if(nightcoreBtn) {
    nightcoreBtn.classList.toggle('active', !isDaycore);
    nightcoreBtn.setAttribute('aria-pressed', !isDaycore);
  }
  if(daycoreBtn) {
    daycoreBtn.classList.toggle('active', isDaycore);
    daycoreBtn.setAttribute('aria-pressed', isDaycore);
  }
  
  // Update speed range and display
  updateSpeedRangeForMode();
  
  // Update preset labels to show correct values for current mode
  updatePresetLabels();
  
  // Update current playback if playing
  if(isPlaying && sourceNode){
    let currentSpeed = parseFloat(speed?.value || 1.25);
    if(isDaycoreMode) {
      currentSpeed = 2.0 - currentSpeed;
      if(currentSpeed < 0.5) currentSpeed = 0.5;
    }
    sourceNode.playbackRate.value = currentSpeed;
  }
  
  // Update speed display
  if(speed && speedVal) {
    const speedValue = parseFloat(speed.value);
    if(isDaycoreMode) {
      const invertedSpeed = (2.0 - speedValue).toFixed(2);
      speedVal.textContent = `${invertedSpeed}x (Daycore)`;
    } else {
      speedVal.textContent = `${speedValue.toFixed(2)}x`;
    }
  }
  
  // Update active preset highlight
  if(speed) {
    const currentSpeedValue = parseFloat(speed.value);
    updateActivePreset(currentSpeedValue);
  }
}

// Event listeners are now set up in initializeNewControls()

function updateSpeedRangeForMode(){
  if(!speed) return;
  
  if(isDaycoreMode) {
    // Daycore: slider works inversely (1.25 = 0.75x speed)
    speed.min = '0.50';
    speed.max = '2.00';
    // Invert current value
    let currentValue = parseFloat(speed.value);
    speed.value = (2.0 - currentValue).toString();
  } else {
    // Nightcore: normal range
    speed.min = '0.50';
    speed.max = '2.00';
    // If coming from daycore, invert back
    let currentValue = parseFloat(speed.value);
    if(currentValue < 1.0) {
      speed.value = (2.0 - currentValue).toString();
    }
  }
}

// Speed Presets
function applyPreset(presetSpeed){
  if(!speed) {
    return;
  }
  
  speed.value = presetSpeed.toString();
  const speedValue = parseFloat(presetSpeed);
  
  // Track preset usage event
  const presetLabel = document.querySelector(`[data-speed="${presetSpeed}"]`)?.getAttribute('data-label') || 'unknown';
  trackEvent('preset_used', {
    'preset_speed': presetSpeed.toString(),
    'preset_label': presetLabel,
    'mode': isDaycoreMode ? 'daycore' : 'nightcore'
  });
  
  if(speedVal) {
    if(isDaycoreMode) {
      const invertedSpeed = (2.0 - speedValue).toFixed(2);
      speedVal.textContent = `${invertedSpeed}x (Daycore)`;
    } else {
      speedVal.textContent = `${speedValue.toFixed(2)}x`;
    }
  }
  
  updateActivePreset(speedValue);
  
  // Update playback if playing
  if(isPlaying && sourceNode){
    let adjustedSpeed = speedValue;
    if(isDaycoreMode) {
      adjustedSpeed = 2.0 - speedValue;
      if(adjustedSpeed < 0.5) adjustedSpeed = 0.5;
    }
    sourceNode.playbackRate.value = adjustedSpeed;
  }
  
  // Trigger input event to ensure all handlers run
  if(speed) {
    speed.dispatchEvent(new Event('input'));
  }
}

function updateActivePreset(currentSpeed){
  if(!presetBtns || presetBtns.length === 0) return;
  
  presetBtns.forEach(btn => {
    const presetSpeed = parseFloat(btn.getAttribute('data-speed'));
    // In Daycore mode, compare with inverted speed
    let speedToCompare = currentSpeed;
    if(isDaycoreMode) {
      speedToCompare = 2.0 - currentSpeed;
    }
    // Allow small tolerance for active state (within 0.05)
    if(Math.abs(speedToCompare - presetSpeed) < 0.05){
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Update preset button labels based on current mode
function updatePresetLabels(){
  if(!presetBtns || presetBtns.length === 0) return;
  
  presetBtns.forEach(btn => {
    const presetSpeed = parseFloat(btn.getAttribute('data-speed'));
    const label = btn.getAttribute('data-label') || '';
    
    if(isDaycoreMode) {
      const invertedSpeed = (2.0 - presetSpeed).toFixed(2);
      btn.textContent = `${label} (${invertedSpeed}x)`;
    } else {
      btn.textContent = `${label} (${presetSpeed.toFixed(2)}x)`;
    }
  });
}

// Event listeners are now set up in initializeNewControls()

// Waveform Generator and Visualizer
function generateWaveform(){
  try {
    if(!buffer || !duration) return;
    
    // Get canvas element
    const canvas = document.getElementById('waveformCanvas');
    if(!canvas) return;
    
    // Get mono channel data (average if stereo)
    let channelData;
    if(buffer.numberOfChannels > 1) {
      channelData = mixChannels(buffer);
    } else {
      channelData = buffer.getChannelData(0);
    }
    
    const dataLength = channelData.length;
    
    // Always generate a fixed number of samples regardless of canvas width
    // This ensures the entire song is represented
    const targetSamples = 1500; // Fixed number of samples to represent entire song
    
    // Sample data evenly across the ENTIRE audio length
    // Simple and direct approach: divide audio into targetSamples segments
    waveformData = [];
    const samplesPerSegment = dataLength / targetSamples;
    
    for(let i = 0; i < targetSamples; i++){
      // Calculate segment boundaries - ensure we cover ALL audio samples
      const startIndex = Math.floor(i * samplesPerSegment);
      const endIndex = (i === targetSamples - 1) 
        ? dataLength  // Last segment goes to the end
        : Math.floor((i + 1) * samplesPerSegment);
      
      // Find max amplitude in this segment
      let max = 0;
      const segmentLength = endIndex - startIndex;
      
      if(segmentLength > 0 && startIndex < dataLength){
        // Sample a few points in the segment (or all if segment is small)
        const sampleStep = Math.max(1, Math.floor(segmentLength / 10));
        for(let j = startIndex; j < endIndex; j += sampleStep){
          if(j < dataLength){
            const absValue = Math.abs(channelData[j]);
            if(absValue > max) max = absValue;
          }
        }
      }
      
      // Ensure minimum value so bars are visible
      waveformData.push(max || 0.01);
    }
    
    // Now set canvas size and draw
    setTimeout(function() {
      try {
        const container = canvas.parentElement;
        let width = 800;
        if(container && container.offsetWidth > 0) {
          width = Math.min(container.offsetWidth - 24, 800);
        }
        canvas.width = width;
        canvas.height = 120;
        
        drawWaveform(0); // Initial draw
      } catch(err) {
        console.error('Error setting canvas size:', err);
      }
    }, 150);
  } catch(error) {
    console.error('Error in generateWaveform:', error);
  }
}

function mixChannels(buffer){
  const length = buffer.length;
  const channelCount = buffer.numberOfChannels;
  const mixed = new Float32Array(length);
  
  for(let i = 0; i < length; i++){
    let sum = 0;
    for(let ch = 0; ch < channelCount; ch++){
      sum += buffer.getChannelData(ch)[i];
    }
    mixed[i] = sum / channelCount;
  }
  return mixed;
}

function drawWaveform(offset){
  offset = offset || 0;
  try {
    if(!waveformData || waveformData.length === 0) return;
    
    const canvas = document.getElementById('waveformCanvas');
    if(!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if(!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    if(width === 0 || height === 0) return;
    
    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(255, 123, 192, 0.1)');
    gradient.addColorStop(0.5, 'rgba(138, 108, 255, 0.15)');
    gradient.addColorStop(1, 'rgba(255, 123, 192, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    const centerY = height / 2;
    
    // Calculate progress ratio (0.0 to 1.0), ensuring it's clamped
    // Use currentTime directly (it's already updated in getCurrentPos when playing)
    let progress = 0;
    if(duration && duration > 0) {
      // Get the actual current position if playing, otherwise use stored currentTime
      const timePos = isPlaying ? getCurrentPos() : currentTime;
      progress = Math.max(0, Math.min(1, timePos / duration)); // Clamp between 0 and 1
    }
    
    // Draw waveform - always show ALL data points, compressed to fit canvas width
    // Use all waveformData samples, just compress them to fit
    const totalSamples = waveformData.length;
    const spacing = width / totalSamples; // Space each sample takes
    const barWidth = Math.max(0.5, spacing * 0.8); // 80% bar, 20% gap for clarity
    
    // Calculate progress in sample index (0 to totalSamples-1)
    const progressSampleIndex = Math.floor(progress * totalSamples);
    
    // Find max amplitude for normalization
    let maxAmplitude = 0;
    for(let i = 0; i < totalSamples; i++){
      if(waveformData[i] > maxAmplitude) maxAmplitude = waveformData[i];
    }
    if(maxAmplitude === 0) maxAmplitude = 1; // Prevent division by zero
    
    // Draw all bars
    for(let i = 0; i < totalSamples; i++){
      const amplitude = waveformData[i] || 0.01;
      
      // Normalize amplitude
      const normalizedAmp = amplitude / maxAmplitude;
      const barHeight = Math.max(1, normalizedAmp * height * 0.75);
      
      const x = i * spacing;
      
      // Color based on progress - simpler calculation using sample index
      if(i < progressSampleIndex){
        ctx.fillStyle = 'rgba(138, 108, 255, 0.75)';
      } else if(i === progressSampleIndex || i === progressSampleIndex + 1){
        ctx.fillStyle = 'rgba(255, 123, 192, 1)';
      } else {
        ctx.fillStyle = 'rgba(138, 108, 255, 0.55)';
      }
      
      // Draw bar from center
      ctx.fillRect(
        Math.floor(x), 
        Math.floor(centerY - barHeight/2), 
        Math.max(1, Math.floor(barWidth)), 
        Math.floor(barHeight)
      );
    }
    
    // Draw progress line at precise position
    const progressX = progress * width;
    if(progressX >= 0 && progressX <= width){
      ctx.strokeStyle = '#ff7bc0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(progressX, 0);
      ctx.lineTo(progressX, height);
      ctx.stroke();
      
      // Draw progress circle indicator at waveform height
      if(progressSampleIndex >= 0 && progressSampleIndex < totalSamples) {
        const waveAmplitude = waveformData[progressSampleIndex] || 0.01;
        const normalizedWaveAmp = waveAmplitude / maxAmplitude;
        const waveHeight = normalizedWaveAmp * height * 0.75;
        ctx.fillStyle = '#ff7bc0';
        ctx.beginPath();
        ctx.arc(progressX, centerY - waveHeight/2, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } catch(error) {
    console.error('Error drawing waveform:', error);
  }
}

function animateWaveform(){
  try {
    if(!isPlaying) return;
    
    const canvas = document.getElementById('waveformCanvas');
    if(!canvas) return;
    
    // drawWaveform uses currentTime directly, no need to pass it
    drawWaveform(0);
    waveformAnimId = requestAnimationFrame(animateWaveform);
  } catch(error) {
    console.error('Error animating waveform:', error);
  }
}
