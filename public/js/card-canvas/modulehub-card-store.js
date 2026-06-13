/**
 * مدل داده و رندر کارت‌های ModuleHub روی گرید
 * ModuleHub card store — layout nodes rendered as absolute grid cards.
 */
import { GRID_CONFIG, LEGACY_SPAN_TO_COL_SPAN } from './config.js';
import { findEmptySlot, gridToPixels } from './grid.js';

/** @typedef {{ id: string, col: number, row: number, colSpan: number, rowSpan: number, nodeType: string, moduleId?: string, displayName: string, cardBackground?: object|null, layoutNode: object, moduleMeta?: object|null }} CanvasCard */

const ICON_CLASS_PATTERN = /^[\w\s-]+$/;

/**
 * escapeAttr --- safe HTML attribute value ---
 * @param {string} str
 */
export function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * sanitizeIconClass --- allowlist Font Awesome class names ---
 * @param {string} [icon]
 */
export function sanitizeIconClass(icon) {
  const fallback = 'fas fa-puzzle-piece';
  if (!icon || !ICON_CLASS_PATTERN.test(icon)) {
    return fallback;
  }
  return icon;
}

/**
 * sanitizeImageUrl --- allow relative paths and data URLs for card backgrounds ---
 * @param {string} [url]
 */
export function sanitizeImageUrl(url) {
  if (!url || typeof url !== 'string') {
    return '';
  }
  if (url.startsWith('/') || url.startsWith('data:image/')) {
    return url;
  }
  return '';
}

/**
 * escapeCssUrl --- escape single quotes inside CSS url() ---
 * @param {string} url
 */
export function escapeCssUrl(url) {
  return url.replace(/'/g, "\\'");
}

/**
 * getStatusDisplay --- localized module status ---
 * @param {string} status
 */
export function getStatusDisplay(status) {
  if (status === 'running') return { label: 'فعال', cssClass: 'status-running' };
  if (status === 'crashed') return { label: 'خطا', cssClass: 'status-crashed' };
  return { label: 'متوقف', cssClass: 'status-stopped' };
}

/**
 * buildCardBackgroundAttrs --- CSS vars + layer HTML for custom background ---
 * @param {object|null|undefined} bg
 */
export function buildCardBackgroundAttrs(bg) {
  if (!bg || bg.type === 'none') {
    return { bgClass: '', bgStyle: '', bgLayerHtml: '' };
  }

  const bgOpacity = (bg.backgroundOpacity ?? 100) / 100;
  const overlayOpacity = (bg.overlayOpacity ?? 45) / 100;
  let extraClass = '';
  const styleParts = [
    `--card-bg-opacity:${bgOpacity}`,
    `--card-overlay-opacity:${overlayOpacity}`,
  ];

  if (bg.type === 'color' && bg.color) {
    styleParts.unshift(`--card-bg-color:${bg.color}`);
    extraClass = ' card--has-bg card--bg-color';
  } else if (bg.type === 'image' && bg.imageUrl) {
    const safeUrl = sanitizeImageUrl(bg.imageUrl);
    if (safeUrl) {
      styleParts.unshift(`--card-bg-image:url('${escapeCssUrl(safeUrl)}')`);
      extraClass = ' card--has-bg card--bg-image';
    }
  }

  const style = `${styleParts.join(';')};`;
  const layerHtml = '<div class="card-bg-layer" aria-hidden="true"></div><div class="card-overlay" aria-hidden="true"></div>';
  return { bgClass: extraClass, bgStyle: style, bgLayerHtml: layerHtml };
}

/**
 * resolveNodeGrid --- cardGrid from layout node with server-aligned fallback ---
 * @param {object} node
 * @param {object} options
 * @param {number} [options.startCol]
 * @param {number} [options.gridRows]
 * @param {Array<{ col: number, row: number, colSpan: number, rowSpan: number }>} [options.placedCards]
 * @param {Array<{ col: number, row: number, colSpan: number, rowSpan: number }>} [options.reservedRects]
 */
export function resolveNodeGrid(node, {
  startCol = 0,
  gridRows = GRID_CONFIG.minCanvasRows,
  placedCards = [],
  reservedRects = [],
} = {}) {
  if (node.cardGrid) {
    return { ...node.cardGrid };
  }

  const colSpan = LEGACY_SPAN_TO_COL_SPAN[node.cardSpan] ?? GRID_CONFIG.minColumnSpan;
  const slot = findEmptySlot(
    placedCards,
    { columns: GRID_CONFIG.maxColumns, rows: gridRows },
    colSpan,
    GRID_CONFIG.minRowSpan,
    reservedRects,
    startCol,
  );
  if (slot) {
    return slot;
  }

  return {
    col: startCol,
    row: 0,
    colSpan,
    rowSpan: GRID_CONFIG.minRowSpan,
  };
}

/**
 * ModuleHubCardStore --- in-memory canvas cards from layout nodes ---
 */
export class ModuleHubCardStore {
  /** @param {CanvasCard[]} cards */
  constructor(cards) {
    /** @type {CanvasCard[]} */
    this.cards = cards.map((c) => ({ ...c }));
    /** @type {Map<string, HTMLElement>} */
    this.elements = new Map();
    this.editMode = false;
    this.showGearFor = () => false;
  }

  /** @param {string} id */
  find(id) {
    return this.cards.find((c) => c.id === id);
  }

  /** @param {string} id @param {Partial<CanvasCard>} patch */
  update(id, patch) {
    const index = this.cards.findIndex((c) => c.id === id);
    if (index === -1) return;
    this.cards[index] = { ...this.cards[index], ...patch };
  }

  /**
   * fromLayoutNodes --- build store cards from folder children ---
   * @param {object[]} children
   * @param {Record<string, object>} modules
   * @param {object} [options]
   * @param {number} [options.startCol]
   * @param {number} [options.gridRows]
   * @param {Array<{ col: number, row: number, colSpan: number, rowSpan: number }>} [options.reservedRects]
   */
  static fromLayoutNodes(children, modules, {
    startCol = 0,
    gridRows = GRID_CONFIG.minCanvasRows,
    reservedRects = [],
  } = {}) {
    /** @type {Array<{ col: number, row: number, colSpan: number, rowSpan: number }>} */
    const placedCards = [];

    return children.map((node) => {
      const isFolder = node.type === 'folder';
      const moduleMeta = !isFolder && node.moduleId ? modules[node.moduleId] : null;
      const grid = resolveNodeGrid(node, {
        startCol,
        gridRows,
        placedCards,
        reservedRects,
      });
      placedCards.push({ ...grid });

      return {
        id: node.id,
        ...grid,
        nodeType: node.type,
        moduleId: node.moduleId || '',
        displayName: isFolder ? node.name : (moduleMeta?.name || node.name),
        cardBackground: node.cardBackground || null,
        layoutNode: node,
        moduleMeta,
      };
    });
  }

  /**
   * render --- rebuild card elements in wrapper ---
   * @param {HTMLElement} wrapper
   * @param {import('./grid.js').GridMetrics} metrics
   * @param {(el: HTMLElement, card: CanvasCard) => void} bindEvents
   * @param {{ prefersReducedMotion?: boolean }} [options]
   */
  render(wrapper, metrics, bindEvents, options = {}) {
    wrapper.innerHTML = '';
    this.elements.clear();

    this.cards.forEach((card, index) => {
      const element = this.createCardElement(card, metrics, options);
      if (!options.prefersReducedMotion) {
        element.classList.add('card-enter');
        element.style.animationDelay = `${index * 40}ms`;
      }
      wrapper.appendChild(element);
      this.elements.set(card.id, element);
      bindEvents(element, card);
    });
  }

  /**
   * createBackCardElement --- virtual back navigation card ---
   * @param {{ parentName: string, parentFolderId: string }} backInfo
   * @param {import('./grid.js').GridMetrics} metrics
   */
  createBackCardElement(backInfo, metrics) {
    const grid = {
      col: 0,
      row: 0,
      colSpan: GRID_CONFIG.backCardColSpan,
      rowSpan: GRID_CONFIG.backCardRowSpan,
    };
    const box = gridToPixels(grid, metrics);
    const root = document.createElement('div');
    root.className = 'card back-card card-canvas-item';
    root.dataset.type = 'back';
    root.dataset.folder = backInfo.parentFolderId;
    root.style.left = `${box.left}px`;
    root.style.top = `${box.top}px`;
    root.style.width = `${box.width}px`;
    root.style.height = `${box.height}px`;
    root.innerHTML = `
      <div class="card-content">
        <div class="card-icon">
          <div class="card-icon-img"><i class="fas fa-arrow-right"></i></div>
        </div>
        <div class="card-title">بازگشت</div>
        <div class="card-desc">${escapeAttr(backInfo.parentName)}</div>
      </div>`;
    return root;
  }

  /**
   * createCardElement --- one layout card DOM node ---
   * @param {CanvasCard} card
   * @param {import('./grid.js').GridMetrics} metrics
   * @param {{ prefersReducedMotion?: boolean }} options
   */
  createCardElement(card, metrics, options = {}) {
    const box = gridToPixels(card, metrics);
    const isFolder = card.nodeType === 'folder';
    const moduleMeta = card.moduleMeta;
    const { bgClass, bgStyle, bgLayerHtml } = buildCardBackgroundAttrs(card.cardBackground);

    const iconClass = isFolder ? 'fas fa-folder' : sanitizeIconClass(moduleMeta?.icon);
    const thumbnail = sanitizeImageUrl(moduleMeta?.thumbnail || '');
    const iconHtml = thumbnail
      ? `<img src="${escapeAttr(thumbnail)}" class="thumbnail-icon" alt="">`
      : `<i class="${iconClass}"></i>`;

    let statusHtml = '';
    if (moduleMeta) {
      const statusDisplay = getStatusDisplay(moduleMeta.status);
      statusHtml = `<div class="status-badge ${statusDisplay.cssClass}">
        <i class="fas fa-circle"></i> ${statusDisplay.label}
      </div>`;
    }

    const resourceHint = moduleMeta?.resources
      ? `<div class="card-resource-hint">CPU: ${moduleMeta.resources.cpu_limit} | RAM: ${moduleMeta.resources.ram_limit_mb}MB</div>`
      : '';

    const descriptionHtml = !isFolder && moduleMeta?.changelog
      ? `<div class="card-desc">${escapeAttr(moduleMeta.changelog)}</div>`
      : '';

    const showGear = !this.editMode && this.showGearFor(card);
    const gearHtml = showGear
      ? `<div class="gear-icon" data-gear-id="${escapeAttr(card.id)}" data-module-id="${escapeAttr(card.moduleId || '')}">
          <i class="fas fa-cog"></i>
        </div>`
      : '';

    const editControlsHtml = this.editMode
      ? '<button type="button" class="card-bg-btn" aria-label="پس‌زمینه کارت"><i class="fas fa-palette"></i></button>'
      : '';

    const resizeHtml = this.editMode
      ? `<button type="button" class="resize-handle" aria-label="تغییر اندازه کارت">
          <svg class="resize-icon" viewBox="0 0 21 21" aria-hidden="true">
            <line x1="2.3" y1="9.3" x2="10.3" y2="17.3" />
            <line x1="5" y1="4" x2="17" y2="16" />
          </svg>
        </button>`
      : '';

    const root = document.createElement('div');
    root.className = `card card-canvas-item ${isFolder ? 'folder-card' : 'module-card'}${bgClass}${this.editMode ? ' card--edit-mode' : ''}`;
    root.dataset.id = card.id;
    root.dataset.type = card.nodeType;
    root.dataset.moduleId = card.moduleId || '';
    root.dataset.col = String(card.col);
    root.dataset.row = String(card.row);
    root.dataset.colSpan = String(card.colSpan);
    root.dataset.rowSpan = String(card.rowSpan);
    root.dataset.cardBackground = JSON.stringify(card.cardBackground || null);
    root.style.cssText = `left:${box.left}px;top:${box.top}px;width:${box.width}px;height:${box.height}px;${bgStyle}`;

    root.innerHTML = `
      ${bgLayerHtml}
      <div class="card-content">
        <div class="card-icon">
          <div class="card-icon-img">${iconHtml}</div>
          ${gearHtml}
          ${editControlsHtml}
        </div>
        <div class="card-title">${escapeAttr(card.displayName)}</div>
        ${descriptionHtml}
        ${statusHtml}
        ${resourceHint}
      </div>
      ${resizeHtml}`;

    return root;
  }

  /**
   * applyPixels --- sync element box from grid coords ---
   */
  applyPixels(element, card, metrics) {
    const box = gridToPixels(card, metrics);
    element.style.left = `${box.left}px`;
    element.style.top = `${box.top}px`;
    element.style.width = `${box.width}px`;
    element.style.height = `${box.height}px`;
  }
}
