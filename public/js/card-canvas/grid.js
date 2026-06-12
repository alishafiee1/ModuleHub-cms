/**
 * محاسبات گرید و اسنپ
 * Grid metrics, snapping, overlap resolution, and background sync.
 */
import { GRID_CONFIG } from './config.js';

/** @typedef {{ cellWidth: number, cellHeight: number, columns: number, rows: number, width: number, height: number }} GridMetrics */

/**
 * computeGridMetrics --- pixel cell size from container rect ---
 * @param {HTMLElement} container
 * @returns {GridMetrics}
 */
export function computeGridMetrics(container) {
  const rect = container.getBoundingClientRect();
  const innerWidth = Math.max(rect.width - GRID_CONFIG.containerPadding * 2, 1);
  const innerHeight = Math.max(rect.height - GRID_CONFIG.containerPadding * 2, 1);
  const cellWidth = innerWidth / GRID_CONFIG.maxColumns;
  const cellHeight = innerHeight / GRID_CONFIG.maxRows;

  return {
    cellWidth,
    cellHeight,
    columns: GRID_CONFIG.maxColumns,
    rows: GRID_CONFIG.maxRows,
    width: innerWidth,
    height: cellHeight * GRID_CONFIG.maxRows,
  };
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
  return {
    left: pad + card.col * metrics.cellWidth + gap / 2,
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
  const gap = GRID_CONFIG.cardGap;
  const col = clampIndex(
    Math.round((box.left - pad - gap / 2) / metrics.cellWidth),
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
 * snapResize --- snap resize with fixed top-right corner ---
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
 * resolveSnapWithoutOverlap --- nudge snapped position away from obstacles ---
 * @param {{ col: number, row: number, colSpan: number, rowSpan: number }} candidate
 * @param {string} movingId
 * @param {Array<{ id: string, col: number, row: number, colSpan: number, rowSpan: number }>} cards
 * @param {Array<{ col: number, row: number, colSpan: number, rowSpan: number }>} [reservedRects]
 */
export function resolveSnapWithoutOverlap(candidate, movingId, cards, reservedRects = []) {
  const obstacles = [
    ...reservedRects,
    ...cards.filter((c) => c.id !== movingId).map((c) => c),
  ];

  const collides = (rect) => obstacles.some((o) => rectsOverlap(rect, o));
  if (!collides(candidate)) {
    return candidate;
  }

  const slot = findEmptySlot(
    cards.filter((c) => c.id !== movingId),
    { columns: GRID_CONFIG.maxColumns, rows: GRID_CONFIG.maxRows },
    candidate.colSpan,
    candidate.rowSpan,
    reservedRects,
  );
  return slot ?? candidate;
}

/**
 * findEmptySlot --- first free rectangle for new card ---
 */
export function findEmptySlot(cards, metrics, colSpan = GRID_CONFIG.minColumnSpan, rowSpan = GRID_CONFIG.minRowSpan, reservedRects = []) {
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
    for (let col = 0; col <= columns - colSpan; col += 1) {
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
 * minPixelSize --- minimum card size in pixels ---
 */
export function minPixelSize(metrics) {
  const gap = GRID_CONFIG.cardGap;
  return {
    width: GRID_CONFIG.minColumnSpan * metrics.cellWidth - gap,
    height: GRID_CONFIG.minRowSpan * metrics.cellHeight - gap,
  };
}

/**
 * applyGridBackground --- no-op; checkerboard grid lines are not shown ---
 */
export function applyGridBackground() {
  // Grid snapping still uses metrics; visual lines intentionally disabled.
}
