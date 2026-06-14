/**
 * settle هوشمند کارت — چسبیدن بالا-راست و shrink تا جا شود
 * Smart card placement for drag/resize settle — keep in sync with public/js/card-canvas/grid.js
 */
import {
  GRID_MAX_COLUMNS,
  GRID_MAX_CANVAS_ROWS,
  GRID_MIN_CANVAS_ROWS,
  GRID_MIN_COLUMN_SPAN,
  GRID_MIN_ROW_SPAN,
} from './grid-config';
import { rectsOverlap } from './grid-slot';
import type { CardGridPosition } from './types';

export const GRID_CONTAINER_PADDING = 12;
export const GRID_CARD_GAP = 10;

export interface GridPlacementMetrics {
  cellWidth: number;
  cellHeight: number;
  columns: number;
  rows: number;
  gridOffsetX?: number;
}

export interface PixelBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface PlacementCard extends CardGridPosition {
  id: string;
}

export interface PlacementResult {
  position: CardGridPosition;
  rejected: boolean;
  shrunk: boolean;
}

function clampIndex(index: number, span: number, limit: number): number {
  return Math.min(Math.max(index, 0), Math.max(0, limit - span));
}

export function normalizeCardGrid(
  grid: CardGridPosition,
  bounds: { columns?: number; rows?: number } = {},
): CardGridPosition {
  const columns = bounds.columns ?? GRID_MAX_COLUMNS;
  const rows = bounds.rows ?? GRID_MIN_CANVAS_ROWS;
  const colSpan = Math.max(
    GRID_MIN_COLUMN_SPAN,
    Math.min(grid.colSpan, GRID_MAX_COLUMNS, columns),
  );
  const rowSpan = Math.max(
    GRID_MIN_ROW_SPAN,
    Math.min(grid.rowSpan, GRID_MAX_CANVAS_ROWS, rows),
  );
  return {
    col: clampIndex(grid.col, colSpan, columns),
    row: clampIndex(grid.row, rowSpan, rows),
    colSpan,
    rowSpan,
  };
}

/**
 * snapMoveTopRight --- snap pixel box with fixed top and right edges ---
 */
export function snapMoveTopRight(
  box: PixelBox,
  colSpan: number,
  rowSpan: number,
  metrics: GridPlacementMetrics,
): CardGridPosition {
  const pad = GRID_CONTAINER_PADDING;
  const offsetX = metrics.gridOffsetX ?? 0;
  const gap = GRID_CARD_GAP;

  let fixedTopRow = Math.round((box.top - pad - gap / 2) / metrics.cellHeight);
  fixedTopRow = Math.max(0, Math.min(fixedTopRow, metrics.rows - GRID_MIN_ROW_SPAN));

  let fixedRightCol = Math.round(
    (box.left + box.width - offsetX - pad + gap / 2) / metrics.cellWidth,
  );
  fixedRightCol = Math.max(GRID_MIN_COLUMN_SPAN, Math.min(fixedRightCol, metrics.columns));

  let fitColSpan = Math.max(GRID_MIN_COLUMN_SPAN, Math.min(colSpan, fixedRightCol));
  let fitRowSpan = Math.min(rowSpan, metrics.rows - fixedTopRow);
  if (fitRowSpan < GRID_MIN_ROW_SPAN) {
    fitRowSpan = GRID_MIN_ROW_SPAN;
    fixedTopRow = Math.max(0, metrics.rows - fitRowSpan);
  }

  return normalizeCardGrid({
    col: fixedRightCol - fitColSpan,
    row: fixedTopRow,
    colSpan: fitColSpan,
    rowSpan: fitRowSpan,
  }, metrics);
}

function tryShrinkAtAnchor(
  anchorRightCol: number,
  anchorTopRow: number,
  startColSpan: number,
  startRowSpan: number,
  bounds: { columns?: number; rows?: number },
  collides: (rect: CardGridPosition) => boolean,
): { position: CardGridPosition; shrunk: boolean } | null {
  const rows = bounds.rows ?? GRID_MIN_CANVAS_ROWS;

  const buildAtAnchor = (nextColSpan: number, nextRowSpan: number) => {
    const cappedColSpan = Math.min(nextColSpan, anchorRightCol);
    const cappedRowSpan = Math.min(nextRowSpan, rows - anchorTopRow);
    if (cappedColSpan < GRID_MIN_COLUMN_SPAN || cappedRowSpan < GRID_MIN_ROW_SPAN) {
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

  while (colSpan > GRID_MIN_COLUMN_SPAN || rowSpan > GRID_MIN_ROW_SPAN) {
    if (colSpan > GRID_MIN_COLUMN_SPAN) {
      colSpan -= 1;
      const shrunkCol = buildAtAnchor(colSpan, rowSpan);
      if (shrunkCol && !collides(shrunkCol)) {
        return { position: shrunkCol, shrunk: true };
      }
    }
    if (rowSpan > GRID_MIN_ROW_SPAN) {
      rowSpan -= 1;
      const shrunkRow = buildAtAnchor(colSpan, rowSpan);
      if (shrunkRow && !collides(shrunkRow)) {
        return { position: shrunkRow, shrunk: true };
      }
    }
  }

  const minimumRect = buildAtAnchor(GRID_MIN_COLUMN_SPAN, GRID_MIN_ROW_SPAN);
  if (minimumRect && !collides(minimumRect)) {
    return { position: minimumRect, shrunk: true };
  }
  return null;
}

/**
 * resolvePlacementWithShrink --- top-right anchor settle for drag and resize ---
 */
export function resolvePlacementWithShrink(options: {
  candidate: CardGridPosition;
  movingId: string;
  cards: PlacementCard[];
  reservedRects?: CardGridPosition[];
  metrics?: GridPlacementMetrics | null;
  fallback?: CardGridPosition | null;
}): PlacementResult {
  const {
    candidate,
    movingId,
    cards,
    reservedRects = [],
    metrics = null,
    fallback = null,
  } = options;

  const bounds = metrics ?? {
    columns: GRID_MAX_COLUMNS,
    rows: GRID_MIN_CANVAS_ROWS,
    cellWidth: 1,
    cellHeight: 1,
  };
  const obstacles: CardGridPosition[] = [
    ...reservedRects,
    ...cards.filter((card) => card.id !== movingId),
  ];
  const collides = (rect: CardGridPosition) => obstacles.some((obstacle) => rectsOverlap(rect, obstacle));

  const normalizedCandidate = normalizeCardGrid(candidate, bounds);
  if (!collides(normalizedCandidate)) {
    return { position: normalizedCandidate, rejected: false, shrunk: false };
  }

  const fixedRightCol = normalizedCandidate.col + normalizedCandidate.colSpan;
  const fixedTopRow = normalizedCandidate.row;

  const primaryFit = tryShrinkAtAnchor(
    fixedRightCol,
    fixedTopRow,
    normalizedCandidate.colSpan,
    normalizedCandidate.rowSpan,
    bounds,
    collides,
  );
  if (primaryFit) {
    return { position: primaryFit.position, rejected: false, shrunk: primaryFit.shrunk };
  }

  for (let anchorRightCol = fixedRightCol - 1; anchorRightCol >= GRID_MIN_COLUMN_SPAN; anchorRightCol -= 1) {
    const slidFit = tryShrinkAtAnchor(
      anchorRightCol,
      fixedTopRow,
      normalizedCandidate.colSpan,
      normalizedCandidate.rowSpan,
      bounds,
      collides,
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
