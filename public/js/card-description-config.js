/**
 * card-description-config.js — shared card description limits (keep in sync with server)
 * purpose --- single max length for UI counter and server normalizeCardDescription ---
 */
(function initCardDescriptionConfig() {
  window.CardDescriptionConfig = {
    maxLength: 4000,
    warnNearLength: 3800,
  };
})();
