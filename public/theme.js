// theme.js — shared light/dark theme from localStorage (apply early to avoid flash)
(function initModuleHubTheme() {
  const STORAGE_KEY = 'modulehub-theme';

  function applyDarkClass(enabled) {
    document.documentElement.classList.toggle('dark', enabled);
    if (document.body) {
      document.body.classList.toggle('dark', enabled);
    }
  }

  function isDarkTheme() {
    return localStorage.getItem(STORAGE_KEY) === 'dark';
  }

  if (isDarkTheme()) {
    applyDarkClass(true);
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', () => applyDarkClass(true));
    }
  }

  window.ModuleHubTheme = {
    isDark: isDarkTheme,

    setDark(enabled) {
      localStorage.setItem(STORAGE_KEY, enabled ? 'dark' : 'light');
      applyDarkClass(enabled);
    },

    toggle() {
      const nextDark = !document.body?.classList.contains('dark');
      this.setDark(nextDark);
      return nextDark;
    },
  };
})();
