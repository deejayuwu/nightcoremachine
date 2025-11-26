(function(){
  const translations = {
    es: {
      title: "DJ UWU | Portfolio y Nightcore Machine",
      description: "Productor nightcore y creador de herramientas de audio. Escucha mis proyectos, descubre colaboraciones y usa la Nightcore Machine para acelerar o ralentizar tus canciones.",
      langToggle: { text: "EN", label: "Cambiar a inglés" },
      heroTitle: "Nightcore, herramientas y mis cosas",
      heroSubtitle: "Aquí podrás encontrar todo lo que he hecho y lo que voy haciendo :)",
      heroCtaMachine: "Probar Nightcore Machine",
      heroCtaSoundcloud: "Escuchar en SoundCloud",
      videoHeading: "Video destacado",
      videoDescription: "Un edit kawaii con la vibra nightcore del canal.",
      connectHeading: "Conecta conmigo",
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
      videoHeading: "Featured video",
      videoDescription: "A kawaii edit with the nightcore vibe from the channel.",
      connectHeading: "Connect with me",
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
    "videoHeading","videoDescription",
    "connectHeading","contactCta","openMachineCta",
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
