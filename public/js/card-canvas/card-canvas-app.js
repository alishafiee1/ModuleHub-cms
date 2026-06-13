/**
 * موتور گرید کارت ModuleHub — bootstrap و API سراسری
 * Card canvas engine — init, refresh, edit mode, ResizeObserver.
 */
import { GRID_CONFIG } from './config.js';
import {
  computeGridMetrics,
  computeMinCanvasRowsForCards,
  gridToPixels,
} from './grid.js';
import { SnapGhost, bindCardInteractions } from './interactions.js';
import { isInteracting, isResizingCanvas, setResizingCanvas } from './layout-state.js';
import { ModuleHubCardStore, getStatusDisplay } from './modulehub-card-store.js';

/** @type {import('./modulehub-card-store.js').ModuleHubCardStore | null} */
let store = null;
/** @type {SnapGhost | null} */
let ghost = null;
/** @type {HTMLElement | null} */
let container = null;
/** @type {HTMLElement | null} */
let cardsWrapper = null;
/** @type {HTMLElement | null} */
let heightHandle = null;

let canvasInitialized = false;
let editMode = false;
let prefersReducedMotion = false;
let resizeFrame = 0;
let activeGridRows = GRID_CONFIG.minCanvasRows;

/** @type {import('./grid.js').GridMetrics | null} */
let metrics = null;

/** @type {{
 *   getModules: () => Record<string, object>,
 *   getAuthStatus: () => { isSuperAdmin: boolean, managedModuleIds: string[] },
 *   onNavigateBack: (folderId: string) => void,
 *   onNavigateFolder: (nodeId: string) => void,
 *   onNavigateModule: (moduleId: string) => void,
 *   onGearClick: (nodeId: string, moduleId: string) => void,
 *   onCardSettled: () => void,
 *   onCanvasRowsSettled: () => void,
 *   onOpenBackground: (element: HTMLElement) => void,
 *   onPlacementRejected?: () => void,
 * } | null} */
let hooks = null;

/** @type {{ showBack: boolean, parentFolderId: string, parentName: string } | null} */
let backInfo = null;

function getPlacementStartCol() {
  return backInfo?.showBack ? GRID_CONFIG.backCardColSpan : 0;
}

function applyCanvasHeight() {
  if (!container) return;
  const rect = container.getBoundingClientRect();
  const innerWidth = Math.max(rect.width - GRID_CONFIG.containerPadding * 2, 1);
  const cellWidth = innerWidth / GRID_CONFIG.maxColumns;
  const height = GRID_CONFIG.containerPadding * 2 + cellWidth * activeGridRows;
  container.style.height = `${Math.max(height, GRID_CONFIG.minCanvasHeightPx)}px`;
  container.dataset.gridRows = String(activeGridRows);
}

function getMetrics() {
  if (!container) {
    throw new Error('Card canvas not mounted');
  }
  applyCanvasHeight();
  metrics = computeGridMetrics(container, activeGridRows);
  return metrics;
}

function getReservedRects() {
  if (!backInfo?.showBack) {
    return [];
  }
  return [{
    col: 0,
    row: 0,
    colSpan: GRID_CONFIG.backCardColSpan,
    rowSpan: GRID_CONFIG.backCardRowSpan,
  }];
}

function computeMinAllowedRows() {
  const cardRects = store?.cards.map((card) => card) ?? [];
  return computeMinCanvasRowsForCards(cardRects, getReservedRects());
}

function setActiveGridRows(rows, { skipMinCheck = false } = {}) {
  const minRows = skipMinCheck ? GRID_CONFIG.minCanvasRows : computeMinAllowedRows();
  const stepped = Math.round(rows / GRID_CONFIG.canvasRowStep) * GRID_CONFIG.canvasRowStep;
  activeGridRows = Math.min(
    GRID_CONFIG.maxCanvasRows,
    Math.max(GRID_CONFIG.minCanvasRows, minRows, stepped),
  );
  applyCanvasHeight();
}

function notifyPlacementRejected() {
  hooks?.onPlacementRejected?.();
}

function bindCanvasHeightHandle() {
  if (!heightHandle || !container) return;

  let startY = 0;
  let startRows = GRID_CONFIG.minCanvasRows;

  const onMove = (event) => {
    const currentMetrics = getMetrics();
    const deltaY = event.clientY - startY;
    const rowDelta = Math.round(deltaY / currentMetrics.cellHeight / GRID_CONFIG.canvasRowStep)
      * GRID_CONFIG.canvasRowStep;
    setActiveGridRows(startRows + rowDelta);
    repositionCards(currentMetrics);
  };

  const finish = () => {
    setResizingCanvas(false);
    heightHandle?.classList.remove('is-dragging');
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', finish);
    document.removeEventListener('pointercancel', finish);
    hooks?.onCanvasRowsSettled?.();
    refreshLayout({ forceRender: true });
  };

  heightHandle.addEventListener('pointerdown', (event) => {
    if (!editMode) return;
    if (event.button !== 0) return;
    event.preventDefault();
    startY = event.clientY;
    startRows = activeGridRows;
    heightHandle.setPointerCapture(event.pointerId);
    heightHandle.classList.add('is-dragging');
    setResizingCanvas(true);
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', finish);
    document.addEventListener('pointercancel', finish);
  });
}

function syncHeightHandleVisibility() {
  if (!heightHandle) return;
  heightHandle.hidden = !editMode;
  heightHandle.setAttribute('aria-hidden', editMode ? 'false' : 'true');
}

function bindCardClick(element) {
  element.addEventListener('click', (event) => {
    if (editMode) {
      if (event.target.closest('.card-bg-btn')) {
        event.stopPropagation();
        hooks?.onOpenBackground(element);
      }
      return;
    }
    if (event.target.closest('.gear-icon')) {
      return;
    }
    const nodeType = element.dataset.type;
    if (nodeType === 'back') {
      hooks?.onNavigateBack(element.dataset.folder || 'root');
      return;
    }
    if (nodeType === 'folder') {
      hooks?.onNavigateFolder(element.dataset.id || '');
      return;
    }
    const moduleId = element.dataset.moduleId;
    if (moduleId) {
      hooks?.onNavigateModule(moduleId);
    }
  });

  const gear = element.querySelector('.gear-icon');
  if (gear) {
    gear.addEventListener('click', (event) => {
      event.stopPropagation();
      hooks?.onGearClick(element.dataset.id || '', element.dataset.moduleId || '');
    });
  }
}

/**
 * repositionCards --- update pixel positions without rebuilding DOM ---
 * @param {import('./grid.js').GridMetrics} [cachedMetrics]
 */
function repositionCards(cachedMetrics) {
  if (!store || !cardsWrapper) return;
  const currentMetrics = cachedMetrics ?? getMetrics();
  for (const card of store.cards) {
    const element = store.elements.get(card.id);
    if (element) {
      store.applyPixels(element, card, currentMetrics);
    }
  }
  if (backInfo?.showBack) {
    const backEl = cardsWrapper.querySelector('.back-card');
    if (backEl) {
      const box = gridToPixels({
        col: 0,
        row: 0,
        colSpan: GRID_CONFIG.backCardColSpan,
        rowSpan: GRID_CONFIG.backCardRowSpan,
      }, currentMetrics);
      backEl.style.left = `${box.left}px`;
      backEl.style.top = `${box.top}px`;
      backEl.style.width = `${box.width}px`;
      backEl.style.height = `${box.height}px`;
    }
  }
}

function refreshLayout({ forceRender = false } = {}) {
  if (!container || !cardsWrapper || !store || !ghost) return;

  metrics = getMetrics();

  if ((isInteracting() || isResizingCanvas()) && !forceRender) {
    repositionCards(metrics);
    return;
  }

  store.editMode = editMode;
  store.showGearFor = (card) => {
    if (card.nodeType !== 'module') return false;
    const auth = hooks?.getAuthStatus() || { isSuperAdmin: false, managedModuleIds: [] };
    if (auth.isSuperAdmin) return true;
    return auth.managedModuleIds.includes(card.moduleId);
  };

  store.render(cardsWrapper, metrics, (element, card) => {
    bindCardInteractions(
      element,
      card,
      store,
      getMetrics,
      ghost,
      () => editMode,
      () => hooks?.onCardSettled?.(),
      getReservedRects,
      getPlacementStartCol,
      notifyPlacementRejected,
    );
    bindCardClick(element);
  }, { prefersReducedMotion });

  if (backInfo?.showBack) {
    const backEl = store.createBackCardElement(backInfo, metrics);
    bindCardClick(backEl);
    cardsWrapper.insertBefore(backEl, cardsWrapper.firstChild);
  }
}

/**
 * init --- mount canvas and wire hooks from script.js ---
 * @param {object} options
 */
function init(options) {
  if (canvasInitialized) return;

  container = document.getElementById('cardCanvas');
  cardsWrapper = document.getElementById('cardsWrapper');
  const ghostLayer = document.getElementById('ghostLayer');
  heightHandle = document.getElementById('cardCanvasHeightHandle');

  if (!container || !cardsWrapper || !ghostLayer) {
    console.error('Card canvas root elements missing');
    return;
  }

  hooks = options;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  prefersReducedMotion = motionQuery.matches;
  motionQuery.addEventListener('change', (event) => {
    prefersReducedMotion = event.matches;
  });

  ghost = new SnapGhost(ghostLayer);
  store = new ModuleHubCardStore([]);

  bindCanvasHeightHandle();
  applyCanvasHeight();

  const resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => refreshLayout());
  });
  resizeObserver.observe(container);

  canvasInitialized = true;
}

/**
 * refresh --- load folder children into canvas ---
 * @param {object[]} children - Layout folder children
 * @param {object} context
 * @param {boolean} [context.showBackCard]
 * @param {string} [context.parentFolderId]
 * @param {string} [context.parentName]
 * @param {number} [context.canvasGridRows]
 */
function refresh(children, context = {}) {
  if (!store) return;

  const modules = hooks?.getModules() || {};
  const reservedRects = context.showBackCard
    ? [{
      col: 0,
      row: 0,
      colSpan: GRID_CONFIG.backCardColSpan,
      rowSpan: GRID_CONFIG.backCardRowSpan,
    }]
    : [];
  const startCol = context.showBackCard ? GRID_CONFIG.backCardColSpan : 0;
  const gridRows = Number(context.canvasGridRows) || GRID_CONFIG.minCanvasRows;

  store.cards = ModuleHubCardStore.fromLayoutNodes(children || [], modules, {
    startCol,
    gridRows,
    reservedRects,
  });
  backInfo = context.showBackCard
    ? {
      showBack: true,
      parentFolderId: context.parentFolderId || 'root',
      parentName: context.parentName || 'خانه',
    }
    : null;

  setActiveGridRows(gridRows, { skipMinCheck: true });
  setActiveGridRows(activeGridRows);

  refreshLayout({ forceRender: true });
}

function setEditMode(active) {
  editMode = Boolean(active);
  if (container) {
    container.classList.toggle('card-canvas--edit-mode', editMode);
  }
  syncHeightHandleVisibility();
  refreshLayout({ forceRender: true });
}

/**
 * collectCardPayload --- PATCH entries; shape mirrors folder-card-patch-entry.ts ---
 */
function collectCardPayload() {
  if (!store) return [];
  return store.cards.map((card) => {
    const element = store.elements.get(card.id);
    const bgRaw = element?.dataset.cardBackground || 'null';
    const bgCleared = element?.getAttribute('data-card-background-cleared') === '1';
    const entry = {
      nodeId: card.id,
      cardGrid: {
        col: Number(element?.dataset.col ?? card.col),
        row: Number(element?.dataset.row ?? card.row),
        colSpan: Number(element?.dataset.colSpan ?? card.colSpan),
        rowSpan: Number(element?.dataset.rowSpan ?? card.rowSpan),
      },
    };
    if (bgCleared) {
      entry.cardBackground = null;
    } else if (bgRaw && bgRaw !== 'null') {
      try {
        const parsed = JSON.parse(bgRaw);
        if (parsed?.type === 'color' || parsed?.type === 'image') {
          entry.cardBackground = parsed;
        }
      } catch {
        // skip invalid JSON
      }
    }
    return entry;
  });
}

function collectCanvasGridRows() {
  return activeGridRows;
}

function getCardElement(nodeId) {
  return store?.elements.get(nodeId) || null;
}

function showEmptyState(message) {
  if (!cardsWrapper || !store) return;
  store.cards = [];
  store.elements.clear();
  backInfo = null;
  cardsWrapper.replaceChildren();
  const empty = document.createElement('div');
  empty.className = 'card-canvas-empty';
  empty.textContent = message;
  cardsWrapper.appendChild(empty);
}

function setNavigating(active) {
  container?.classList.toggle('card-canvas--navigating', active);
}

window.CardCanvas = {
  init,
  refresh,
  setEditMode,
  collectCardPayload,
  collectCanvasGridRows,
  getCardElement,
  showEmptyState,
  setNavigating,
  getStatusDisplay,
  getStore: () => store,
};

window.dispatchEvent(new Event('modulehub:card-canvas-ready'));
