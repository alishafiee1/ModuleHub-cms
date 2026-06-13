/**
 * محاسبات گرید و اسنپ
 * Grid metrics, snapping, overlap resolution.
 */
import { GRID_CONFIG } from './config.js';

/** @typedef {{ cellWidth: number, cellHeight: number, columns: number, rows: number, width: number, height: number, containerInner: number, gridOffsetX: number }} GridMetrics */

/**
 * computeGridMetrics --- pixel cell size from container/wrapper width and row count ---
 * @param {HTMLElement} container - Usually #cardsWrapper or #cardCanvas
 * @param {number} [gridRows]
 * @param {{ innerWidth?: number }} [options] - Explicit grid width; defaults to container minus pad
 * @returns {GridMetrics}
 */
export function computeGridMetrics(container, gridRows = GRID_CONFIG.minCanvasRows, options = {}) {
  const rect = container.getBoundingClientRect();
  const containerInner = Math.max(rect.width - GRID_CONFIG.containerPadding * 2, 1);
  const innerWidth = options.innerWidth ?? containerInner;
  const gridOffsetX = Math.max(0, (containerInner - innerWidth) / 2);
  const cellWidth = innerWidth / GRID_CONFIG.maxColumns;
  const cellHeight = cellWidth;
  const rows = Math.max(GRID_CONFIG.minCanvasRows, gridRows);

  return {
    cellWidth,
    cellHeight,
    columns: GRID_CONFIG.maxColumns,
    rows,
    width: innerWidth,
    height: cellHeight * rows,
    containerInner,
    gridOffsetX,
  };
}

/**
 * cardGridRightEdge --- rightmost pixel edge of a grid rect (for bounds tests) ---
 */
export function cardGridRightEdge(card, metrics) {
  const box = gridToPixels(card, metrics);
  return box.left + box.width;
}

/**
 * computeMinCanvasRowsForCards --- lowest canvas rows that fit all cards ---
 * @param {Array<{ row: number, rowSpan: number }>} cards
 * @param {Array<{ row: number, rowSpan: number }>} [reservedRects]
 */
export function computeMinCanvasRowsForCards(cards, reservedRects = []) {
  let maxBottom = GRID_CONFIG.minCanvasRows;
  for (const rect of [...cards, ...reservedRects]) {
    maxBottom = Math.max(maxBottom, rect.row + rect.rowSpan);
  }
  return maxBottom;
}

/**
 * clampSpan --- keep card span inside min/max and container ---
 */
export function clampSpan(span, axis, startIndex, metrics) {
  const min = axis === 'col' ? GRID_CONFIG.minColumnSpan : GRID_CONFIG.minRowSpan;
  const max = axis === 'col' ? GRID_CONFIG.maxColumnSpan : GRID_CONFIG.maxRowSpan;
  const limit = axis === 'col' ? metrics.columns : metrics.rows;
  return Math.min(Math.max(span, min, 1), max, limit - startIndex);
}

/** @param {number} index @param {number} span @param {number} limit */
export function clampIndex(index, span, limit) {
  return Math.min(Math.max(index, 0), Math.max(0, limit - span));
}

/**
 * gridToPixels --- convert grid cell rect to pixel box ---
 * @param {{ col: number, row: number, colSpan: number, rowSpan: number }} card
 * @param {GridMetrics} metrics
 */
export function gridToPixels(card, metrics) {
  const gap = GRID_CONFIG.cardGap;
  const pad = GRID_CONFIG.containerPadding;
  const offsetX = metrics.gridOffsetX ?? 0;
  return {
    left: offsetX + pad + card.col * metrics.cellWidth + gap / 2,
    top: pad + card.row * metrics.cellHeight + gap / 2,
    width: card.colSpan * metrics.cellWidth - gap,
    height: card.rowSpan * metrics.cellHeight - gap,
  };
}

/**
 * snapMove --- snap free pixel box to grid keeping span ---
 */
export function snapMove(box, colSpan, rowSpan, metrics) {
  const pad = GRID_CONFIG.containerPadding;
  const offsetX = metrics.gridOffsetX ?? 0;
  const gap = GRID_CONFIG.cardGap;
  const col = clampIndex(
    Math.round((box.left - offsetX - pad - gap / 2) / metrics.cellWidth),
    colSpan,
    metrics.columns,
  );
  const row = clampIndex(
    Math.round((box.top - pad - gap / 2) / metrics.cellHeight),
    rowSpan,
    metrics.rows,
  );
  return { col, row, colSpan, rowSpan };
}

/**
 * snapResize --- snap resize with fixed right and top edges ---
 */
export function snapResize(box, fixedRightCol, fixedTopRow, metrics) {
  const gap = GRID_CONFIG.cardGap;
  let colSpan = clampSpan(
    Math.max(1, Math.round((box.width + gap) / metrics.cellWidth)),
    'col',
    0,
    metrics,
  );
  let rowSpan = clampSpan(
    Math.max(1, Math.round((box.height + gap) / metrics.cellHeight)),
    'row',
    fixedTopRow,
    metrics,
  );

  colSpan = Math.min(
    Math.max(colSpan, GRID_CONFIG.minColumnSpan),
    fixedRightCol,
    GRID_CONFIG.maxColumnSpan,
  );
  rowSpan = Math.min(
    Math.max(rowSpan, GRID_CONFIG.minRowSpan),
    metrics.rows - fixedTopRow,
    GRID_CONFIG.maxRowSpan,
  );

  return {
    col: Math.max(0, fixedRightCol - colSpan),
    row: fixedTopRow,
    colSpan,
    rowSpan,
  };
}

/**
 * rectsOverlap --- true when two grid rects share a cell ---
 */
export function rectsOverlap(a, b) {
  return !(
    a.col + a.colSpan <= b.col
    || b.col + b.colSpan <= a.col
    || a.row + a.rowSpan <= b.row
    || b.row + b.rowSpan <= a.row
  );
}

/**
 * findEmptySlot --- first free rectangle for new card ---
 * @param {number} [startCol] - Column offset (back-card zone in subfolders)
 */
export function findEmptySlot(
  cards,
  metrics,
  colSpan = GRID_CONFIG.minColumnSpan,
  rowSpan = GRID_CONFIG.minRowSpan,
  reservedRects = [],
  startCol = 0,
) {
  const { columns, rows } = metrics;
  const occupied = Array.from({ length: rows }, () => Array(columns).fill(false));

  const mark = (rect) => {
    for (let row = rect.row; row < rect.row + rect.rowSpan; row += 1) {
      for (let col = rect.col; col < rect.col + rect.colSpan; col += 1) {
        if (row < rows && col < columns) {
          occupied[row][col] = true;
        }
      }
    }
  };

  reservedRects.forEach(mark);
  cards.forEach(mark);

  for (let row = 0; row <= rows - rowSpan; row += 1) {
    for (let col = startCol; col <= columns - colSpan; col += 1) {
      let fits = true;
      for (let deltaRow = 0; deltaRow < rowSpan && fits; deltaRow += 1) {
        for (let deltaCol = 0; deltaCol < colSpan && fits; deltaCol += 1) {
          if (occupied[row + deltaRow][col + deltaCol]) {
            fits = false;
          }
        }
      }
      if (fits) {
        return { col, row, colSpan, rowSpan };
      }
    }
  }
  return null;
}

/**
 * resolveSnapWithoutOverlap --- nudge snapped position away from obstacles ---
 * @returns {{ position: { col: number, row: number, colSpan: number, rowSpan: number }, rejected: boolean }}
 */
export function resolveSnapWithoutOverlap(
  candidate,
  movingId,
  cards,
  reservedRects = [],
  metrics = null,
  fallback = null,
  startCol = 0,
) {
  const obstacles = [
    ...reservedRects,
    ...cards.filter((c) => c.id !== movingId),
  ];

  const collides = (rect) => obstacles.some((o) => rectsOverlap(rect, o));
  if (!collides(candidate)) {
    return { position: candidate, rejected: false };
  }

  const rows = metrics?.rows ?? GRID_CONFIG.minCanvasRows;
  const slot = findEmptySlot(
    cards.filter((c) => c.id !== movingId),
    { columns: GRID_CONFIG.maxColumns, rows },
    candidate.colSpan,
    candidate.rowSpan,
    reservedRects,
    startCol,
  );
  if (slot) {
    return { position: slot, rejected: false };
  }

  const movingCard = cards.find((c) => c.id === movingId);
  const revert = fallback ?? (movingCard
    ? { col: movingCard.col, row: movingCard.row, colSpan: movingCard.colSpan, rowSpan: movingCard.rowSpan }
    : candidate);
  return { position: revert, rejected: true };
}

/**
 * minPixelSize --- minimum card size in pixels ---
 */
export function minPixelSize(metrics) {
  const gap = GRID_CONFIG.cardGap;
  return {
    width: GRID_CONFIG.minColumnSpan * metrics.cellWidth - gap,
    height: GRID_CONFIG.minRowSpan * metrics.cellHeight - gap,
  };
}
