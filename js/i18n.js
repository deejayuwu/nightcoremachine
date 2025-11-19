// Internationalization (i18n) System for DJ UWU Nightcore Machine

let currentLang = 'es'; // Default language

// Detect user language preference
function detectLanguage() {
  // Check localStorage first
  const savedLang = localStorage.getItem('preferredLanguage');
  if (savedLang && (savedLang === 'es' || savedLang === 'en')) {
    return savedLang;
  }
  
  // Check browser language
  const browserLang = navigator.language || navigator.userLanguage;
  if (browserLang.startsWith('en')) {
    return 'en';
  }
  
  // Default to Spanish
  return 'es';
}

// Translate all elements
function translatePage(lang) {
  if (!translations[lang]) return;
  
  currentLang = lang;
  localStorage.setItem('preferredLanguage', lang);
  
  // Update HTML lang attribute
  document.documentElement.lang = lang;
  
  // Update meta tags
  updateMetaTags(lang);
  
  // Update structured data
  updateStructuredData(lang);
  
  // Translate all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[lang][key]) {
      // For artwork label, preserve emoji
      if (key === 'artworkLabel') {
        element.textContent = '🎨 ' + translations[lang][key];
      } else if (key === 'refreshArtworkBtn') {
        element.textContent = '🔄 ' + translations[lang][key];
      } else if (key === 'artworkTagsLabel') {
        element.textContent = translations[lang][key];
      } else {
        element.textContent = translations[lang][key];
      }
    }
  });
  
  // Translate placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (translations[lang][key]) {
      element.placeholder = translations[lang][key];
    }
  });
  
  // Translate aria-labels
  document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
    const key = element.getAttribute('data-i18n-aria-label');
    if (translations[lang][key]) {
      element.setAttribute('aria-label', translations[lang][key]);
    }
  });
  
  // Update download button texts
  const downloadMp3Btn = document.getElementById('downloadMp3Btn');
  if (downloadMp3Btn && translations[lang].downloadMp3) {
    downloadMp3Btn.textContent = translations[lang].downloadMp3;
  }
  
  // Update Ko-fi button text
  const kofiButton = document.querySelector('.kofi-button-embed');
  if (kofiButton && translations[lang].kofiButtonText) {
    kofiButton.textContent = translations[lang].kofiButtonText;
  }
  
  // Update language toggle button
  const langToggle = document.getElementById('langToggle');
  if (langToggle) {
    langToggle.textContent = translations[lang].langButton;
    langToggle.setAttribute('aria-label', lang === 'es' ? 'Cambiar idioma' : 'Change language');
    langToggle.setAttribute('title', lang === 'es' ? 'Cambiar idioma' : 'Change language');
  }
}

// Update meta tags for SEO
function updateMetaTags(lang) {
  if (!translations[lang]) return;
  
  const t = translations[lang];
  
  // Update title
  document.title = t.title;
  
  // Update meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.content = t.description;
  
  // Update OG tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.content = t.ogTitle;
  
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.content = t.ogDescription;
  
  const ogLocale = document.querySelector('meta[property="og:locale"]');
  if (ogLocale) ogLocale.content = lang === 'es' ? 'es_ES' : 'en_US';
  
  // Update Twitter tags
  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (twitterTitle) twitterTitle.content = t.ogTitle;
  
  const twitterDesc = document.querySelector('meta[name="twitter:description"]');
  if (twitterDesc) twitterDesc.content = t.twitterDescription;
}

// Update structured data (JSON-LD)
function updateStructuredData(lang) {
  if (!translations[lang]) return;
  
  const structuredDataEl = document.getElementById('structuredData');
  if (!structuredDataEl) return;
  
  const t = translations[lang];
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "DJ UWU Nightcore Machine",
    "description": lang === 'es' 
      ? "Crea nightcore y daycore online gratis. Ajusta la velocidad de tus canciones al instante sin instalar programas."
      : "Create nightcore and daycore online for free. Adjust your songs' speed instantly without installing programs.",
    "url": "https://djuwu.club",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "127"
    },
    "author": {
      "@type": "Person",
      "name": "DJ UWU"
    }
  };
  
  structuredDataEl.textContent = JSON.stringify(structuredData);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Detect and set language
  const lang = detectLanguage();
  translatePage(lang);
  
  // Language toggle button
  const langToggle = document.getElementById('langToggle');
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      const newLang = currentLang === 'es' ? 'en' : 'es';
      translatePage(newLang);
    });
  }
});

// Export for use in other scripts if needed
window.i18n = {
  translate: translatePage,
  getCurrentLang: () => currentLang
};

