/**
 * محاسبات گرید و اسنپ
 * Grid metrics, snapping, overlap resolution.
 * Placement settle: keep resolvePlacementWithShrink in sync with core/.../grid-placement.ts
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
  return Math.min(Math.max(span, min), max, Math.max(min, limit - startIndex));
}

/**
 * normalizeCardGrid --- enforce 3×3 minimum span and keep card inside canvas ---
 * @param {{ col: number, row: number, colSpan: number, rowSpan: number }} grid
 * @param {{ columns?: number, rows?: number }} [bounds]
 */
export function normalizeCardGrid(grid, bounds = {}) {
  const columns = bounds.columns ?? GRID_CONFIG.maxColumns;
  const rows = bounds.rows ?? GRID_CONFIG.minCanvasRows;

  const colSpan = Math.max(
    GRID_CONFIG.minColumnSpan,
    Math.min(grid.colSpan, GRID_CONFIG.maxColumnSpan, columns),
  );
  const rowSpan = Math.max(
    GRID_CONFIG.minRowSpan,
    Math.min(grid.rowSpan, GRID_CONFIG.maxRowSpan, rows),
  );
  const col = clampIndex(grid.col, colSpan, columns);
  const row = clampIndex(grid.row, rowSpan, rows);

  return { col, row, colSpan, rowSpan };
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
 * snapMoveTopRight --- snap pixel box with fixed top and right edges ---
 * @param {{ left: number, top: number, width: number, height: number }} box
 */
export function snapMoveTopRight(box, colSpan, rowSpan, metrics) {
  const pad = GRID_CONFIG.containerPadding;
  const offsetX = metrics.gridOffsetX ?? 0;
  const gap = GRID_CONFIG.cardGap;
  const minColSpan = GRID_CONFIG.minColumnSpan;
  const minRowSpan = GRID_CONFIG.minRowSpan;

  let fixedTopRow = Math.round((box.top - pad - gap / 2) / metrics.cellHeight);
  fixedTopRow = Math.max(0, Math.min(fixedTopRow, metrics.rows - minRowSpan));

  let fixedRightCol = Math.round(
    (box.left + box.width - offsetX - pad + gap / 2) / metrics.cellWidth,
  );
  fixedRightCol = Math.max(minColSpan, Math.min(fixedRightCol, metrics.columns));

  let fitColSpan = Math.max(minColSpan, Math.min(colSpan, fixedRightCol));
  let fitRowSpan = Math.min(rowSpan, metrics.rows - fixedTopRow);
  if (fitRowSpan < minRowSpan) {
    fitRowSpan = minRowSpan;
    fixedTopRow = Math.max(0, metrics.rows - fitRowSpan);
  }

  return normalizeCardGrid({
    col: fixedRightCol - fitColSpan,
    row: fixedTopRow,
    colSpan: fitColSpan,
    rowSpan: fitRowSpan,
  }, metrics);
}

/**
 * snapResize --- snap resize with fixed right and top edges ---
 */
export function snapResize(box, fixedRightCol, fixedTopRow, metrics) {
  const gap = GRID_CONFIG.cardGap;
  let colSpan = clampSpan(
    Math.round((box.width + gap) / metrics.cellWidth),
    'col',
    0,
    metrics,
  );
  let rowSpan = clampSpan(
    Math.round((box.height + gap) / metrics.cellHeight),
    'row',
    fixedTopRow,
    metrics,
  );

  const maxColSpan = Math.min(
    GRID_CONFIG.maxColumnSpan,
    Math.max(GRID_CONFIG.minColumnSpan, fixedRightCol),
  );
  const maxRowSpan = Math.min(
    GRID_CONFIG.maxRowSpan,
    Math.max(GRID_CONFIG.minRowSpan, metrics.rows - fixedTopRow),
  );

  colSpan = Math.max(
    GRID_CONFIG.minColumnSpan,
    Math.min(colSpan, maxColSpan),
  );
  rowSpan = Math.max(
    GRID_CONFIG.minRowSpan,
    Math.min(rowSpan, maxRowSpan),
  );

  return normalizeCardGrid({
    col: Math.max(0, fixedRightCol - colSpan),
    row: fixedTopRow,
    colSpan,
    rowSpan,
  }, metrics);
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
 * tryShrinkAtAnchor --- shrink card at a top-right anchor until it fits or fails ---
 * @returns {{ position: object, shrunk: boolean } | null}
 */
function tryShrinkAtAnchor(
  anchorRightCol,
  anchorTopRow,
  startColSpan,
  startRowSpan,
  bounds,
  collides,
  minColSpan,
  minRowSpan,
) {
  const rows = bounds.rows ?? GRID_CONFIG.minCanvasRows;

  const buildAtAnchor = (nextColSpan, nextRowSpan) => {
    const cappedColSpan = Math.min(nextColSpan, anchorRightCol);
    const cappedRowSpan = Math.min(nextRowSpan, rows - anchorTopRow);
    if (cappedColSpan < minColSpan || cappedRowSpan < minRowSpan) {
      return null;
    }
    return normalizeCardGrid({
      col: anchorRightCol - cappedColSpan,
      row: anchorTopRow,
      colSpan: cappedColSpan,
      rowSpan: cappedRowSpan,
    }, bounds);
  };

  let colSpan = startColSpan;
  let rowSpan = startRowSpan;

  const initial = buildAtAnchor(colSpan, rowSpan);
  if (initial && !collides(initial)) {
    return { position: initial, shrunk: false };
  }

  while (colSpan > minColSpan || rowSpan > minRowSpan) {
    if (colSpan > minColSpan) {
      colSpan -= 1;
      const shrunkCol = buildAtAnchor(colSpan, rowSpan);
      if (shrunkCol && !collides(shrunkCol)) {
        return { position: shrunkCol, shrunk: true };
      }
    }
    if (rowSpan > minRowSpan) {
      rowSpan -= 1;
      const shrunkRow = buildAtAnchor(colSpan, rowSpan);
      if (shrunkRow && !collides(shrunkRow)) {
        return { position: shrunkRow, shrunk: true };
      }
    }
  }

  const minimumRect = buildAtAnchor(minColSpan, minRowSpan);
  if (minimumRect && !collides(minimumRect)) {
    return { position: minimumRect, shrunk: true };
  }
  return null;
}

/**
 * resolvePlacementWithShrink --- top-right anchor settle for drag and resize ---
 * @param {object} options
 * @param {{ col: number, row: number, colSpan: number, rowSpan: number }} options.candidate
 * @param {string} options.movingId
 * @param {Array<{ id: string, col: number, row: number, colSpan: number, rowSpan: number }>} options.cards
 * @param {Array<{ col: number, row: number, colSpan: number, rowSpan: number }>} [options.reservedRects]
 * @param {{ columns?: number, rows?: number } | null} [options.metrics]
 * @param {{ col: number, row: number, colSpan: number, rowSpan: number } | null} [options.fallback]
 * @returns {{ position: { col: number, row: number, colSpan: number, rowSpan: number }, rejected: boolean, shrunk: boolean }}
 */
export function resolvePlacementWithShrink({
  candidate,
  movingId,
  cards,
  reservedRects = [],
  metrics = null,
  fallback = null,
}) {
  const bounds = metrics ?? {
    columns: GRID_CONFIG.maxColumns,
    rows: GRID_CONFIG.minCanvasRows,
  };
  const obstacles = [
    ...reservedRects,
    ...cards.filter((card) => card.id !== movingId),
  ];
  const collides = (rect) => obstacles.some((obstacle) => rectsOverlap(rect, obstacle));

  const normalizedCandidate = normalizeCardGrid(candidate, bounds);
  if (!collides(normalizedCandidate)) {
    return { position: normalizedCandidate, rejected: false, shrunk: false };
  }

  const fixedRightCol = normalizedCandidate.col + normalizedCandidate.colSpan;
  const fixedTopRow = normalizedCandidate.row;
  const minColSpan = GRID_CONFIG.minColumnSpan;
  const minRowSpan = GRID_CONFIG.minRowSpan;
  const shrinkArgs = [
    bounds,
    collides,
    minColSpan,
    minRowSpan,
  ];

  const primaryFit = tryShrinkAtAnchor(
    fixedRightCol,
    fixedTopRow,
    normalizedCandidate.colSpan,
    normalizedCandidate.rowSpan,
    ...shrinkArgs,
  );
  if (primaryFit) {
    return { position: primaryFit.position, rejected: false, shrunk: primaryFit.shrunk };
  }

  for (let anchorRightCol = fixedRightCol - 1; anchorRightCol >= minColSpan; anchorRightCol -= 1) {
    const slidFit = tryShrinkAtAnchor(
      anchorRightCol,
      fixedTopRow,
      normalizedCandidate.colSpan,
      normalizedCandidate.rowSpan,
      ...shrinkArgs,
    );
    if (slidFit) {
      return { position: slidFit.position, rejected: false, shrunk: true };
    }
  }

  const movingCard = cards.find((card) => card.id === movingId);
  const revert = fallback ?? (movingCard
    ? {
      col: movingCard.col,
      row: movingCard.row,
      colSpan: movingCard.colSpan,
      rowSpan: movingCard.rowSpan,
    }
    : normalizedCandidate);
  return { position: revert, rejected: true, shrunk: false };
}

/**
 * resolveSnapWithoutOverlap --- @deprecated use resolvePlacementWithShrink ---
 * @returns {{ position: { col: number, row: number, colSpan: number, rowSpan: number }, rejected: boolean }}
 */
export function resolveSnapWithoutOverlap(
  candidate,
  movingId,
  cards,
  reservedRects = [],
  metrics = null,
  fallback = null,
) {
  const { position, rejected } = resolvePlacementWithShrink({
    candidate,
    movingId,
    cards,
    reservedRects,
    metrics,
    fallback,
  });
  return { position, rejected };
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
