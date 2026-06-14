/**
 * card-markdown.js — safe Markdown rendering for card descriptions
 * purpose --- preview on card (inline-friendly) and full view in gear help dialog ---
 */
(function initCardMarkdown() {
  const PREVIEW_ALLOWED_TAGS = ['strong', 'em', 'b', 'i', 'code', 'a', 'br', 'span'];
  const FULL_ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'b', 'i', 'code', 'pre', 'a',
    'ul', 'ol', 'li', 'blockquote', 'span',
  ];

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

  function canUseMarkdown() {
    return typeof window.marked !== 'undefined' && typeof window.DOMPurify !== 'undefined';
  }

  /**
   * parseMarkdown --- marked + DOMPurify with tag allowlist ---
   * @param {string} text
   * @param {string[]} allowedTags
   */
  function parseMarkdown(text, allowedTags) {
    if (!canUseMarkdown() || !text) {
      return null;
    }
    const rawHtml = window.marked.parse(text, { breaks: true, gfm: true });
    return window.DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    });
  }

  /**
   * renderCardDescriptionPreview --- inline-friendly HTML for 2-line card subtitle ---
   * @param {string} text
   */
  function renderCardDescriptionPreview(text) {
    if (!text) {
      return '';
    }
    const sanitized = parseMarkdown(text, PREVIEW_ALLOWED_TAGS);
    if (!sanitized) {
      return escapeHtml(text);
    }
    return sanitized
      .replace(/<\/?p>/gi, '')
      .replace(/<br\s*\/?>/gi, '<br>')
      .trim();
  }

  /**
   * renderCardDescriptionFull --- block markdown for help dialog ---
   * @param {string} text
   */
  function renderCardDescriptionFull(text) {
    if (!text) {
      return '';
    }
    const sanitized = parseMarkdown(text, FULL_ALLOWED_TAGS);
    if (!sanitized) {
      return `<p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>`;
    }
    return sanitized;
  }

  window.CardMarkdown = {
    renderCardDescriptionPreview,
    renderCardDescriptionFull,
  };
})();
