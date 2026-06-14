/**
 * drag-handle-metrics.js — scale edit-mode drag handle with card width
 * purpose --- handle width = max(min, cardWidth / 6); bars scale proportionally ---
 */

export const DRAG_HANDLE_MIN_WIDTH_PX = 54;
export const DRAG_HANDLE_MIN_BAR_WIDTH_PX = 21;
export const DRAG_HANDLE_WIDTH_CARD_RATIO = 1 / 6;

/**
 * resolveDragHandleMetrics --- pixel widths for handle and bars ---
 * @param {number} cardWidthPx
 */
export function resolveDragHandleMetrics(cardWidthPx) {
  const handleWidth = Math.max(
    DRAG_HANDLE_MIN_WIDTH_PX,
    Math.round(cardWidthPx * DRAG_HANDLE_WIDTH_CARD_RATIO),
  );
  const barWidth = Math.max(
    DRAG_HANDLE_MIN_BAR_WIDTH_PX,
    Math.round(handleWidth * (DRAG_HANDLE_MIN_BAR_WIDTH_PX / DRAG_HANDLE_MIN_WIDTH_PX)),
  );
  return { handleWidth, barWidth };
}

/**
 * syncCardDragHandleMetrics --- set CSS vars on card for handle sizing ---
 * @param {HTMLElement} cardElement
 * @param {number} cardWidthPx
 */
export function syncCardDragHandleMetrics(cardElement, cardWidthPx) {
  if (!cardElement?.querySelector?.('.card-drag-handle')) {
    return;
  }
  const { handleWidth, barWidth } = resolveDragHandleMetrics(cardWidthPx);
  cardElement.style.setProperty('--card-drag-handle-width', `${handleWidth}px`);
  cardElement.style.setProperty('--card-drag-handle-bar-width', `${barWidth}px`);
}
