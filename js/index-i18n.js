(function(){
  const translations = {
    es: {
      title: "DJ UWU | Portfolio y Nightcore Machine",
      description: "Productor nightcore y creador de herramientas de audio. Escucha mis proyectos, descubre colaboraciones y usa la Nightcore Machine para acelerar o ralentizar tus canciones.",
      langToggle: { text: "EN", label: "Cambiar a inglés" },
      heroTitle: "Productor nightcore & creador de herramientas",
      heroSubtitle: "Edits rápidos, visuales kawaii y una app hecha para la comunidad.",
      heroCtaMachine: "Probar Nightcore Machine",
      heroCtaSoundcloud: "Escuchar en SoundCloud",
      projectsHeading: "Proyectos destacados",
      projectItem1: "<strong>Nightcore Machine:</strong> acelerador y ralentizador de audio 100% en el navegador, con descargas WAV/MP3 y tags automáticos.",
      projectItem2: "<strong>Visual packs:</strong> fondos animados y overlays kawaii listos para streams y videos musicales.",
      projectItem3: "<strong>Colaboraciones:</strong> remixes y ediciones para creadores de contenido, VTubers y DJs independientes.",
      musicHeading: "Lanzamientos y playlists",
      musicIntro: "Encuentra mis últimos edits y selecciones en tus plataformas favoritas:",
      musicItem1: "<a class=\"social-link\" href=\"https://soundcloud.com/djuwu\" target=\"_blank\" rel=\"noopener\">SoundCloud</a> · Singles y sets nightcore/daycore.",
      musicItem2: "<a class=\"social-link\" href=\"https://www.youtube.com/@djuwu\" target=\"_blank\" rel=\"noopener\">YouTube</a> · Visuales con fondos anime y packs de transición.",
      musicItem3: "<a class=\"social-link\" href=\"https://open.spotify.com/artist/4ztf8P53PUHCNROmV1tK50\" target=\"_blank\" rel=\"noopener\">Spotify</a> · Playlists curadas para streamers.",
      servicesHeading: "Servicios",
      serviceItem1: "Edición rápida de tracks para shorts, TikTok o reels.",
      serviceItem2: "Optimización de audio para directos y DJ sets digitales.",
      serviceItem3: "Consultoría técnica sobre audio web y procesamiento local.",
      connectHeading: "Conecta conmigo",
      connectIntro: "¿Quieres una colaboración o feedback sobre tu track? Escríbeme o agenda una sesión rápida.",
      contactCta: "Enviar mensaje",
      openMachineCta: "Abrir Nightcore Machine",
      socialTwitter: "Twitter",
      socialInstagram: "Instagram",
      socialSoundcloud: "SoundCloud",
      kofiLink: "Invitar un Ko-fi",
      footerText: "Portfolio de DJ UWU · © 2025",
      footerPrivacy: "Política de Privacidad",
      footerTerms: "Términos de Uso",
      footerContact: "Contacto"
    },
    en: {
      title: "DJ UWU | Portfolio and Nightcore Machine",
      description: "Nightcore producer and audio tool creator. Listen to my projects, discover collabs, and use the Nightcore Machine to speed up or slow down your songs.",
      langToggle: { text: "ES", label: "Switch to Spanish" },
      heroTitle: "Nightcore producer & tool maker",
      heroSubtitle: "Fast edits, cute kawaii visuals, and an app made for the community.",
      heroCtaMachine: "Try Nightcore Machine",
      heroCtaSoundcloud: "Listen on SoundCloud",
      projectsHeading: "Featured projects",
      projectItem1: "<strong>Nightcore Machine:</strong> audio speed-up/slow-down in your browser, with WAV/MP3 downloads and automatic tags.",
      projectItem2: "<strong>Visual packs:</strong> animated backgrounds and kawaii overlays ready for streams and music videos.",
      projectItem3: "<strong>Collabs:</strong> remixes and edits for creators, VTubers, and independent DJs.",
      musicHeading: "Releases and playlists",
      musicIntro: "Find my latest edits and picks on your favorite platforms:",
      musicItem1: "<a class=\"social-link\" href=\"https://soundcloud.com/djuwu\" target=\"_blank\" rel=\"noopener\">SoundCloud</a> · Nightcore/daycore singles and sets.",
      musicItem2: "<a class=\"social-link\" href=\"https://www.youtube.com/@djuwu\" target=\"_blank\" rel=\"noopener\">YouTube</a> · Visuals with anime backgrounds and transition packs.",
      musicItem3: "<a class=\"social-link\" href=\"https://open.spotify.com/artist/4ztf8P53PUHCNROmV1tK50\" target=\"_blank\" rel=\"noopener\">Spotify</a> · Curated playlists for streamers.",
      servicesHeading: "Services",
      serviceItem1: "Fast track edits for shorts, TikTok, or reels.",
      serviceItem2: "Audio optimization for live streams and digital DJ sets.",
      serviceItem3: "Technical consulting on web audio and local processing.",
      connectHeading: "Connect with me",
      connectIntro: "Want a collab or feedback on your track? Message me or book a quick session.",
      contactCta: "Send message",
      openMachineCta: "Open Nightcore Machine",
      socialTwitter: "Twitter",
      socialInstagram: "Instagram",
      socialSoundcloud: "SoundCloud",
      kofiLink: "Send a Ko-fi",
      footerText: "DJ UWU portfolio · © 2025",
      footerPrivacy: "Privacy Policy",
      footerTerms: "Terms of Use",
      footerContact: "Contact"
    }
  };

  const textIds = [
    "heroTitle","heroSubtitle","heroCtaMachine","heroCtaSoundcloud",
    "projectsHeading","projectItem1","projectItem2","projectItem3",
    "musicHeading","musicIntro","musicItem1","musicItem2","musicItem3",
    "servicesHeading","serviceItem1","serviceItem2","serviceItem3",
    "connectHeading","connectIntro","contactCta","openMachineCta",
    "socialTwitter","socialInstagram","socialSoundcloud","kofiLink",
    "footerText","footerPrivacy","footerTerms","footerContact"
  ];

  function detectLanguage(){
    const saved = localStorage.getItem('preferredLanguage');
    if(saved === 'es' || saved === 'en') return saved;
    const browser = navigator.language || navigator.userLanguage;
    if(browser && browser.startsWith('en')) return 'en';
    return 'es';
  }

  function applyTranslations(lang){
    const t = translations[lang];
    if(!t) return;

    document.documentElement.lang = lang;

    const metaTitle = document.getElementById('metaTitle');
    if(metaTitle) metaTitle.textContent = t.title;

    const metaDesc = document.getElementById('metaDescription');
    if(metaDesc) metaDesc.setAttribute('content', t.description);

    textIds.forEach(id => {
      const el = document.getElementById(id);
      if(!el) return;
      const value = t[id];
      if(typeof value === 'string'){
        el.innerHTML = value;
      }
    });

    const toggle = document.getElementById('langToggle');
    if(toggle){
      toggle.textContent = t.langToggle.text;
      toggle.setAttribute('aria-label', t.langToggle.label);
      toggle.setAttribute('title', t.langToggle.label);
    }

    localStorage.setItem('preferredLanguage', lang);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const lang = detectLanguage();
    applyTranslations(lang);

    const toggle = document.getElementById('langToggle');
    if(toggle){
      toggle.addEventListener('click', () => {
        const newLang = (document.documentElement.lang === 'es') ? 'en' : 'es';
        applyTranslations(newLang);
      });
    }
  });
})();
