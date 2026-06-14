/**
 * card-markdown.js — safe Markdown rendering for card descriptions
 * purpose --- full GFM blocks on scrollable card area via marked + DOMPurify ---
 */
(function initCardMarkdown() {
  const CARD_DESCRIPTION_ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'b', 'i', 'code', 'pre', 'a',
    'ul', 'ol', 'li', 'blockquote', 'span',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ];

  const CARD_DESCRIPTION_ALLOWED_ATTR = ['href', 'title', 'target', 'rel'];

  let markdownInitFailed = false;
  let markdownReady = false;

  /**
   * escapeHtml --- plain-text fallback when marked/DOMPurify unavailable ---
   */
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getMarkedLib() {
    const lib = window.marked;
    if (!lib) {
      return null;
    }
    if (typeof lib.parse === 'function') {
      return lib;
    }
    if (lib.marked && typeof lib.marked.parse === 'function') {
      return lib.marked;
    }
    return null;
  }

  function getDOMPurify() {
    return window.DOMPurify;
  }

  /**
   * canUseMarkdown --- true when vendored marked.parse and DOMPurify are available ---
   */
  function canUseMarkdown() {
    const markedLib = getMarkedLib();
    const purify = getDOMPurify();
    return Boolean(markedLib && typeof markedLib.parse === 'function' && purify);
  }

  function ensureMarkdownReady() {
    if (markdownReady) {
      return true;
    }
    if (!canUseMarkdown()) {
      if (!markdownInitFailed) {
        markdownInitFailed = true;
        console.warn('[CardMarkdown] marked or DOMPurify not loaded — card descriptions render as plain text');
      }
      return false;
    }
    const markedLib = getMarkedLib();
    if (typeof markedLib.use === 'function') {
      markedLib.use({ gfm: true, breaks: true });
    }
    markdownReady = true;
    return true;
  }

  /**
   * parseMarkdown --- marked + DOMPurify with tag allowlist ---
   * @param {string} text
   */
  function parseMarkdown(text) {
    if (!text || !ensureMarkdownReady()) {
      return null;
    }
    const markedLib = getMarkedLib();
    const purify = getDOMPurify();
    const rawHtml = markedLib.parse(text, { async: false, breaks: true, gfm: true });
    if (typeof rawHtml !== 'string') {
      return null;
    }
    return purify.sanitize(rawHtml, {
      ALLOWED_TAGS: CARD_DESCRIPTION_ALLOWED_TAGS,
      ALLOWED_ATTR: CARD_DESCRIPTION_ALLOWED_ATTR,
    });
  }

  /**
   * renderPlainTextFallback --- preserve newlines when markdown libs missing ---
   * @param {string} text
   */
  function renderPlainTextFallback(text) {
    return escapeHtml(text).replace(/\n/g, '<br>');
  }

  /**
   * renderCardDescriptionPreview --- HTML for scrollable card description area ---
   * @param {string} text
   */
  function renderCardDescriptionPreview(text) {
    if (!text) {
      return '';
    }
    const sanitized = parseMarkdown(text);
    if (!sanitized) {
      return renderPlainTextFallback(text);
    }
    return sanitized.trim();
  }

  /**
   * renderCardDescriptionFull --- same block markdown as card preview ---
   * @param {string} text
   */
  function renderCardDescriptionFull(text) {
    return renderCardDescriptionPreview(text);
  }

  window.CardMarkdown = {
    canUseMarkdown,
    renderCardDescriptionPreview,
    renderCardDescriptionFull,
  };
})();
