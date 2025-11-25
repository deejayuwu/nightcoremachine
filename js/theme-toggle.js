(function() {
  const STORAGE_KEY = 'theme-preference';

  function getSystemPreference() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function loadPreference() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    return getSystemPreference();
  }

  function applyTheme(theme) {
    const body = document.body;
    if (!body) return;

    const normalized = theme === 'dark' ? 'dark' : 'light';
    body.setAttribute('data-theme', normalized);

    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      const isDark = normalized === 'dark';
      toggle.setAttribute('aria-pressed', String(isDark));
      toggle.setAttribute('aria-label', isDark ? 'Desactivar modo oscuro' : 'Activar modo oscuro');
      toggle.setAttribute('title', isDark ? 'Desactivar modo oscuro' : 'Activar modo oscuro');
      toggle.textContent = isDark ? '⭐' : '🌙';
    }
  }

  function toggleTheme() {
    const current = document.body?.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  function initThemeToggle() {
    applyTheme(loadPreference());

    const toggle = document.getElementById('themeToggle');
    if (toggle && !toggle.dataset.initialized) {
      toggle.dataset.initialized = 'true';
      toggle.addEventListener('click', toggleTheme);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeToggle);
  } else {
    initThemeToggle();
  }
})();
