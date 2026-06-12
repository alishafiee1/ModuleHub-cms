/**
 * تعاملات درگ و تغییر سایز کارت — فقط در حالت ویرایش
 * Pointer drag/resize with snap ghost; active when edit mode is on.
 */
import { GRID_CONFIG } from './config.js';
import {
  gridToPixels,
  minPixelSize,
  resolveSnapWithoutOverlap,
  snapMove,
  snapResize,
} from './grid.js';
import { setInteracting } from './layout-state.js';

/**
 * SnapGhost --- dashed preview during drag ---
 */
export class SnapGhost {
  /** @param {HTMLElement} layer */
  constructor(layer) {
    this.layer = layer;
    this.node = document.createElement('div');
    this.node.className = 'snap-ghost';
    this.layer.appendChild(this.node);
    this.hide();
  }

  /** @param {{ left: number, top: number, width: number, height: number } | null} box */
  show(box) {
    if (!box) {
      this.hide();
      return;
    }
    this.node.style.display = 'block';
    this.node.style.left = `${box.left}px`;
    this.node.style.top = `${box.top}px`;
    this.node.style.width = `${box.width}px`;
    this.node.style.height = `${box.height}px`;
  }

  hide() {
    this.node.style.display = 'none';
  }
}

/**
 * bindCardInteractions --- attach move + resize when edit mode allows ---
 * @param {HTMLElement} element
 * @param {import('./modulehub-card-store.js').CanvasCard} card
 * @param {import('./modulehub-card-store.js').ModuleHubCardStore} store
 * @param {() => import('./grid.js').GridMetrics} getMetrics
 * @param {SnapGhost} ghost
 * @param {() => boolean} isEditMode
 * @param {() => void} onSettled
 * @param {() => Array<{ col: number, row: number, colSpan: number, rowSpan: number }>} getReservedRects
 */
export function bindCardInteractions(element, card, store, getMetrics, ghost, isEditMode, onSettled, getReservedRects) {
  const resizeHandle = element.querySelector('.resize-handle');
  bindMove(element, card.id, store, getMetrics, ghost, isEditMode, onSettled, getReservedRects);
  if (resizeHandle) {
    bindResize(element, resizeHandle, card.id, store, getMetrics, ghost, isEditMode, onSettled, getReservedRects);
  }
}

/** @param {HTMLElement} element */
function readBox(element) {
  return {
    left: parseFloat(element.style.left) || 0,
    top: parseFloat(element.style.top) || 0,
    width: parseFloat(element.style.width) || 0,
    height: parseFloat(element.style.height) || 0,
  };
}

/** @param {HTMLElement} element @param {{ left: number, top: number, width: number, height: number }} box */
function applyRawBox(element, box) {
  element.style.left = `${box.left}px`;
  element.style.top = `${box.top}px`;
  element.style.width = `${box.width}px`;
  element.style.height = `${box.height}px`;
}

function settleCard(element, store, cardId, metrics, grid, onSettled) {
  const card = store.find(cardId);
  if (!card) return;

  store.update(cardId, grid);
  const updated = store.find(cardId);
  if (!updated) return;

  element.classList.add('is-settling');
  store.applyPixels(element, updated, metrics);
  element.dataset.col = String(updated.col);
  element.dataset.row = String(updated.row);
  element.dataset.colSpan = String(updated.colSpan);
  element.dataset.rowSpan = String(updated.rowSpan);

  window.setTimeout(() => {
    element.classList.remove('is-settling');
  }, 340);

  if (onSettled) {
    onSettled();
  }
}

function bindMove(element, cardId, store, getMetrics, ghost, isEditMode, onSettled, getReservedRects) {
  element.addEventListener('pointerdown', (event) => {
    if (!isEditMode()) return;
    if (event.button !== 0) return;
    if (event.target.closest('.resize-handle')) return;
    if (event.target.closest('.card-bg-btn')) return;

    const card = store.find(cardId);
    if (!card) return;

    event.preventDefault();
    setInteracting(true);

    const startX = event.clientX;
    const startY = event.clientY;
    const startBox = readBox(element);

    element.setPointerCapture(event.pointerId);
    element.classList.add('is-dragging');

    const onMove = (moveEvent) => {
      const currentMetrics = getMetrics();
      const liveBox = {
        left: startBox.left + (moveEvent.clientX - startX),
        top: startBox.top + (moveEvent.clientY - startY),
        width: startBox.width,
        height: startBox.height,
      };
      applyRawBox(element, liveBox);
      const snapped = snapMove(liveBox, card.colSpan, card.rowSpan, currentMetrics);
      ghost.show(gridToPixels(snapped, currentMetrics));
      element.classList.add('snap-preview');
    };

    const finish = (endEvent) => {
      element.releasePointerCapture(endEvent.pointerId);
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerup', finish);
      element.removeEventListener('pointercancel', finish);
      element.classList.remove('is-dragging', 'snap-preview');
      ghost.hide();

      const currentMetrics = getMetrics();
      const freshCard = store.find(cardId);
      if (!freshCard) {
        setInteracting(false);
        return;
      }
      const finalBox = {
        left: startBox.left + (endEvent.clientX - startX),
        top: startBox.top + (endEvent.clientY - startY),
        width: startBox.width,
        height: startBox.height,
      };
      let snapped = snapMove(finalBox, freshCard.colSpan, freshCard.rowSpan, currentMetrics);
      snapped = resolveSnapWithoutOverlap(
        snapped,
        cardId,
        store.cards,
        getReservedRects(),
      );
      settleCard(element, store, cardId, currentMetrics, snapped, onSettled);
      setInteracting(false);
    };

    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerup', finish);
    element.addEventListener('pointercancel', finish);
  });
}

function bindResize(element, handle, cardId, store, getMetrics, ghost, isEditMode, onSettled, getReservedRects) {
  handle.addEventListener('pointerdown', (event) => {
    if (!isEditMode()) return;
    if (event.button !== 0) return;

    const card = store.find(cardId);
    if (!card) return;

    event.preventDefault();
    event.stopPropagation();
    setInteracting(true);

    const metrics = getMetrics();
    const minSize = minPixelSize(metrics);
    const startX = event.clientX;
    const startY = event.clientY;
    const startBox = readBox(element);
    const fixedRightPx = startBox.left + startBox.width;
    const fixedTopPx = startBox.top;
    const fixedRightCol = card.col + card.colSpan;
    const fixedTopRow = card.row;

    handle.setPointerCapture(event.pointerId);
    element.classList.add('is-resizing');

    const buildLiveBox = (moveEvent) => {
      const width = Math.max(minSize.width, startBox.width + (startX - moveEvent.clientX));
      const height = Math.max(minSize.height, startBox.height + (moveEvent.clientY - startY));
      return { left: fixedRightPx - width, top: fixedTopPx, width, height };
    };

    const onMove = (moveEvent) => {
      const currentMetrics = getMetrics();
      const liveBox = buildLiveBox(moveEvent);
      applyRawBox(element, liveBox);
      const snapped = snapResize(liveBox, fixedRightCol, fixedTopRow, currentMetrics);
      ghost.show(gridToPixels(snapped, currentMetrics));
      element.classList.add('snap-preview');
    };

    const finish = (endEvent) => {
      handle.releasePointerCapture(endEvent.pointerId);
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', finish);
      handle.removeEventListener('pointercancel', finish);
      element.classList.remove('is-resizing', 'snap-preview');
      ghost.hide();

      const currentMetrics = getMetrics();
      const liveBox = buildLiveBox(endEvent);
      let snapped = snapResize(liveBox, fixedRightCol, fixedTopRow, currentMetrics);
      snapped = resolveSnapWithoutOverlap(
        snapped,
        cardId,
        store.cards,
        getReservedRects(),
      );
      settleCard(element, store, cardId, currentMetrics, snapped, onSettled);
      setInteracting(false);
    };

    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', finish);
    handle.addEventListener('pointercancel', finish);
  });
}

export { GRID_CONFIG };
