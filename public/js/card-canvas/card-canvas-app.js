/**
 * موتور گرید کارت ModuleHub — bootstrap و API سراسری
 * Card canvas engine — init, refresh, edit mode, ResizeObserver.
 */
import { GRID_CONFIG, resolveBreakpoint, resolveDesignWidth, resolveShellOuterWidth } from './config.js';
import {
  computeGridMetrics,
  computeMinCanvasRowsForCards,
  gridToPixels,
} from './grid.js';
import { SnapGhost, bindCardInteractions } from './interactions.js';
import { isInteracting, isResizingCanvas, setResizingCanvas } from './layout-state.js';
import { ModuleHubCardStore, getStatusDisplay, shouldShowGearForCard } from './modulehub-card-store.js';

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
/** @type {'desktop'|'tablet'|'mobile'} */
let activeBreakpoint = 'desktop';
/** @type {'desktop'|'tablet'|'mobile'} */
let activeEditDevice = 'desktop';
let lockedDesignWidth = null;
/** @type {object[]|null} */
let lastRefreshChildren = null;
/** @type {object|null} */
let lastRefreshContext = null;

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

function getEffectiveBreakpoint() {
  return editMode ? activeEditDevice : activeBreakpoint;
}

function getGridAreaElement() {
  return cardsWrapper ?? container;
}

function getGridAreaInnerWidth() {
  const el = getGridAreaElement();
  if (!el) {
    return 1;
  }
  const rect = el.getBoundingClientRect();
  return Math.max(rect.width - GRID_CONFIG.containerPadding * 2, 1);
}

function getGridInnerWidth() {
  return getGridAreaInnerWidth();
}

function getContainerInnerWidth() {
  return getGridAreaInnerWidth();
}

function lockDesignWidthForBreakpoint(breakpoint) {
  lockedDesignWidth = resolveDesignWidth(breakpoint, getContainerInnerWidth());
}

/**
 * applyAppShellWidth --- set CSS variables for centered shell (header + canvas share width) ---
 */
function applyAppShellWidth() {
  const bp = getEffectiveBreakpoint();
  const shellWidth = resolveShellOuterWidth(bp, window.innerWidth, { simulateDevice: editMode });
  const inner = lockedDesignWidth ?? resolveDesignWidth(bp, shellWidth);
  const root = document.documentElement;
  root.style.setProperty('--app-shell-width', `${shellWidth}px`);
  root.style.setProperty('--card-canvas-inner-width', `${inner}px`);
  root.dataset.activeDevice = bp;
}

function applyDeviceCanvasClasses() {
  if (!container) return;
  const bp = getEffectiveBreakpoint();
  container.classList.remove(
    'card-canvas--device-desktop',
    'card-canvas--device-tablet',
    'card-canvas--device-mobile',
  );
  container.classList.add(`card-canvas--device-${bp}`);
  container.dataset.activeDevice = bp;
  applyAppShellWidth();
}

function applyCanvasHeight() {
  if (!container) return;
  const innerWidth = getGridInnerWidth();
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
  const gridEl = getGridAreaElement();
  if (!gridEl) {
    throw new Error('Card canvas grid area missing');
  }
  metrics = computeGridMetrics(gridEl, activeGridRows);
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
  store.showGearFor = (card) => shouldShowGearForCard(card, hooks?.getAuthStatus() || { isSuperAdmin: false, managedModuleIds: [] });

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
    if (editMode) {
      return;
    }
    syncViewportBreakpoint();
  });
  resizeObserver.observe(document.documentElement);

  window.addEventListener('resize', () => {
    if (editMode) {
      applyAppShellWidth();
      if (store && cardsWrapper) {
        repositionCards(getMetrics());
      }
      return;
    }
    syncViewportBreakpoint();
  });

  activeBreakpoint = resolveBreakpoint(window.innerWidth);
  lockDesignWidthForBreakpoint(activeBreakpoint);
  applyDeviceCanvasClasses();

  canvasInitialized = true;
}

/**
 * syncViewportBreakpoint --- switch layout when viewport crosses 1024 / 640 ---
 */
function syncViewportBreakpoint() {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    const nextBreakpoint = resolveBreakpoint(window.innerWidth);
    if (nextBreakpoint !== activeBreakpoint) {
      handleBreakpointChange(nextBreakpoint);
      return;
    }
    lockDesignWidthForBreakpoint(activeBreakpoint);
    applyAppShellWidth();
    if (!isInteracting() && !isResizingCanvas() && store) {
      repositionCards(getMetrics());
    }
  });
}

function handleBreakpointChange(nextBreakpoint) {
  activeBreakpoint = nextBreakpoint;
  lockDesignWidthForBreakpoint(activeBreakpoint);
  applyDeviceCanvasClasses();
  window.dispatchEvent(new CustomEvent('modulehub:viewport-breakpoint-changed', {
    detail: { breakpoint: nextBreakpoint },
  }));
}

/**
 * refresh --- load folder children into canvas ---
 * @param {object[]} children - Layout folder children
 * @param {object} context
 * @param {boolean} [context.showBackCard]
 * @param {string} [context.parentFolderId]
 * @param {string} [context.parentName]
 * @param {number} [context.canvasGridRows]
 * @param {'desktop'|'tablet'|'mobile'} [context.breakpoint]
 */
function refresh(children, context = {}) {
  if (!store) return;

  lastRefreshChildren = children;
  lastRefreshContext = context;

  const modules = hooks?.getModules() || {};
  const breakpoint = context.breakpoint || getEffectiveBreakpoint();
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
    breakpoint,
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

  lockDesignWidthForBreakpoint(breakpoint);
  applyDeviceCanvasClasses();
  refreshLayout({ forceRender: true });
}

function setEditMode(active) {
  const wasEditMode = editMode;
  editMode = Boolean(active);
  if (container) {
    container.classList.toggle('card-canvas--edit-mode', editMode);
  }
  if (editMode) {
    if (!wasEditMode) {
      // Match viewport breakpoint so drag/save targets the layout the user sees
      activeEditDevice = activeBreakpoint;
    }
    lockDesignWidthForBreakpoint(activeEditDevice);
  } else {
    lockDesignWidthForBreakpoint(activeBreakpoint);
  }
  applyDeviceCanvasClasses();
  syncHeightHandleVisibility();
  if (wasEditMode === editMode) {
    return;
  }
  if (!editMode) {
    return;
  }
  if (lastRefreshChildren) {
    refresh(lastRefreshChildren, lastRefreshContext || {});
  } else {
    refreshLayout({ forceRender: true });
  }
}

/**
 * setActiveEditDevice --- switch layout breakpoint while editing (after save flush) ---
 * @param {'desktop'|'tablet'|'mobile'} device
 */
function setActiveEditDevice(device) {
  activeEditDevice = device;
  lockDesignWidthForBreakpoint(device);
  applyDeviceCanvasClasses();
  if (lastRefreshChildren) {
    refresh(lastRefreshChildren, {
      ...(lastRefreshContext || {}),
      breakpoint: device,
    });
  }
}

function getActiveEditDevice() {
  return activeEditDevice;
}

function getEffectiveBreakpointPublic() {
  return getEffectiveBreakpoint();
}

function resolveViewportBreakpointPublic() {
  return resolveBreakpoint(window.innerWidth);
}

const GRID_PATCH_FIELD = {
  desktop: 'cardGrid',
  tablet: 'cardGridTablet',
  mobile: 'cardGridMobile',
};

/**
 * collectCardPayload --- PATCH entries for the active edit breakpoint ---
 */
function collectCardPayload() {
  if (!store) return [];
  const breakpoint = editMode ? activeEditDevice : activeBreakpoint;
  const gridField = GRID_PATCH_FIELD[breakpoint];

  return store.cards.map((card) => {
    const element = store.elements.get(card.id);
    const bgRaw = element?.dataset.cardBackground || 'null';
    const bgCleared = element?.getAttribute('data-card-background-cleared') === '1';
    const entry = {
      nodeId: card.id,
      [gridField]: {
        col: card.col,
        row: card.row,
        colSpan: card.colSpan,
        rowSpan: card.rowSpan,
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
  const breakpoint = editMode ? activeEditDevice : activeBreakpoint;
  if (breakpoint === 'tablet') {
    return { canvasGridRowsTablet: activeGridRows, breakpoint: 'tablet' };
  }
  if (breakpoint === 'mobile') {
    return { canvasGridRowsMobile: activeGridRows, breakpoint: 'mobile' };
  }
  return { canvasGridRows: activeGridRows, breakpoint: 'desktop' };
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

function updateLayoutChildren(children) {
  lastRefreshChildren = children;
}

window.CardCanvas = {
  init,
  refresh,
  setEditMode,
  setActiveEditDevice,
  getActiveEditDevice,
  getEffectiveBreakpoint: getEffectiveBreakpointPublic,
  resolveViewportBreakpoint: resolveViewportBreakpointPublic,
  syncViewportBreakpoint,
  collectCardPayload,
  collectCanvasGridRows,
  getCardElement,
  showEmptyState,
  setNavigating,
  getStatusDisplay,
  getStore: () => store,
  updateLayoutChildren,
  getGridInnerWidth: () => getGridInnerWidth(),
};

window.dispatchEvent(new Event('modulehub:card-canvas-ready'));
