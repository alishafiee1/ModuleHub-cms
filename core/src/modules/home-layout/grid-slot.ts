import {
  BACK_CARD_COL_SPAN,
  GRID_CANVAS_ROW_STEP,
  GRID_DEFAULT_ROW_SPAN,
  GRID_MAX_CANVAS_ROWS,
  GRID_MAX_COLUMNS,
  GRID_MIN_CANVAS_ROWS,
  GRID_MIN_COLUMN_SPAN,
  GRID_MIN_ROW_SPAN,
  LEGACY_SPAN_TO_COL_SPAN,
  NEW_CHILD_CARD_COL_SPAN,
  NEW_CHILD_CARD_ROW_SPAN,
} from './grid-config';
import type { CardGridPosition, CardSpan, LayoutBreakpoint, LayoutTreeNode } from './types';

/**
 * purpose --- thrown when the folder canvas cannot grow further to place a new card ---
 * Thrown when folder canvas cannot grow further to place a new card.
 */
export class CanvasFullError extends Error {
  readonly code = 'CANVAS_FULL' as const;

  constructor(
    message = 'ارتفاع بوم به حداکثر (۱۸۰ ردیف) رسیده — امکان افزودن کارت جدید نیست',
  ) {
    super(message);
    this.name = 'CanvasFullError';
  }
}

/**
 * purpose --- checks whether two grid rectangles overlap ---
 */
export function rectsOverlap(a: CardGridPosition, b: CardGridPosition): boolean {
  return !(
    a.col + a.colSpan <= b.col
    || b.col + b.colSpan <= a.col
    || a.row + a.rowSpan <= b.row
    || b.row + b.rowSpan <= a.row
  );
}

/**
 * purpose --- first empty slot on the folder canvas, row-by-row from the top ---
 * @param occupied - Existing card positions
 * @param gridRows - Canvas row count
 * @param startCol - Column offset (7 when back-card slot reserved in subfolders)
 */
export function findEmptyCardSlot(
  occupied: CardGridPosition[],
  gridRows: number,
  startCol = 0,
  colSpan = GRID_MIN_COLUMN_SPAN,
  rowSpan = GRID_MIN_ROW_SPAN,
): CardGridPosition | null {

  for (let row = 0; row <= gridRows - rowSpan; row += 1) {
    for (let col = startCol; col <= GRID_MAX_COLUMNS - colSpan; col += 1) {
      const candidate: CardGridPosition = { col, row, colSpan, rowSpan };
      const collides = occupied.some((rect) => rectsOverlap(candidate, rect));
      if (!collides) {
        return candidate;
      }
    }
  }
  return null;
}

/**
 * purpose --- minimum canvas rows needed to fit all placed cards ---
 */
export function computeMinCanvasRowsForCards(cards: CardGridPosition[]): number {
  let maxBottom = GRID_MIN_CANVAS_ROWS;
  for (const card of cards) {
    maxBottom = Math.max(maxBottom, card.row + card.rowSpan);
  }
  return maxBottom;
}

/**
 * purpose --- default gridRows for a folder canvas at a device breakpoint ---
 * @param folder - Folder node (or null)
 * @param breakpoint - desktop | tablet | mobile
 */
export function resolveFolderCanvasGridRows(
  folder: LayoutTreeNode | null | undefined,
  breakpoint: LayoutBreakpoint = 'desktop',
): number {
  const canvas = folder?.folderCanvas;
  if (!canvas) {
    return GRID_MIN_CANVAS_ROWS;
  }

  if (breakpoint === 'mobile') {
    const mobile = canvas.gridRowsMobile;
    if (typeof mobile === 'number' && mobile >= GRID_MIN_CANVAS_ROWS) {
      return mobile;
    }
    const tablet = canvas.gridRowsTablet;
    if (typeof tablet === 'number' && tablet >= GRID_MIN_CANVAS_ROWS) {
      return tablet;
    }
  }

  if (breakpoint === 'tablet') {
    const tablet = canvas.gridRowsTablet;
    if (typeof tablet === 'number' && tablet >= GRID_MIN_CANVAS_ROWS) {
      return tablet;
    }
  }

  const desktop = canvas.gridRows;
  if (typeof desktop === 'number' && desktop >= GRID_MIN_CANVAS_ROWS) {
    return desktop;
  }
  return GRID_MIN_CANVAS_ROWS;
}

/**
 * purpose --- bump folder canvas row counts when content needs more vertical space ---
 */
function ensureMinimumFolderCanvasRows(parent: LayoutTreeNode, minRows: number): void {
  const stepped = Math.ceil(minRows / GRID_CANVAS_ROW_STEP) * GRID_CANVAS_ROW_STEP;
  const nextRows = Math.max(GRID_MIN_CANVAS_ROWS, stepped);
  if (!parent.folderCanvas) {
    parent.folderCanvas = {
      gridRows: nextRows,
      gridRowsTablet: nextRows,
      gridRowsMobile: nextRows,
    };
    return;
  }
  if (parent.folderCanvas.gridRows < nextRows) {
    parent.folderCanvas.gridRows = nextRows;
  }
  const tabletRows = parent.folderCanvas.gridRowsTablet ?? parent.folderCanvas.gridRows;
  if (tabletRows < nextRows) {
    parent.folderCanvas.gridRowsTablet = nextRows;
  }
  const mobileRows = parent.folderCanvas.gridRowsMobile
    ?? parent.folderCanvas.gridRowsTablet
    ?? parent.folderCanvas.gridRows;
  if (mobileRows < nextRows) {
    parent.folderCanvas.gridRowsMobile = nextRows;
  }
}

/**
 * purpose --- reads stored cardGrid for a node at the given breakpoint ---
 */
export function getNodeCardGridForBreakpoint(
  node: LayoutTreeNode,
  breakpoint: LayoutBreakpoint,
): CardGridPosition | undefined {
  if (breakpoint === 'mobile') {
    return node.cardGridMobile ?? node.cardGridTablet ?? node.cardGrid;
  }
  if (breakpoint === 'tablet') {
    return node.cardGridTablet ?? node.cardGrid;
  }
  return node.cardGrid;
}

/**
 * purpose --- resolve start column for slot search (back card reserved in subfolders) ---
 */
function resolveFolderStartCol(parentId: string): number {
  return parentId === 'root' ? 0 : BACK_CARD_COL_SPAN;
}

/**
 * purpose --- converts legacy cardSpan to colSpan on the 30-column grid ---
 */
function legacySpanToColSpan(cardSpan: CardSpan | undefined): number {
  return LEGACY_SPAN_TO_COL_SPAN[cardSpan ?? 1] ?? LEGACY_SPAN_TO_COL_SPAN[1];
}

/**
 * purpose --- find a slot while growing canvas rows up to the configured maximum ---
 */
export function findCardSlotGrowingCanvas(
  occupied: CardGridPosition[],
  initialGridRows: number,
  startCol: number,
  colSpan: number,
  rowSpan: number,
): { slot: CardGridPosition; gridRows: number } {
  let gridRows = initialGridRows;
  let slot = findEmptyCardSlot(occupied, gridRows, startCol, colSpan, rowSpan);

  while (!slot && gridRows < GRID_MAX_CANVAS_ROWS) {
    gridRows += GRID_CANVAS_ROW_STEP;
    slot = findEmptyCardSlot(occupied, gridRows, startCol, colSpan, rowSpan);
  }

  if (!slot) {
    slot = findEmptyCardSlot(occupied, GRID_MAX_CANVAS_ROWS, startCol, colSpan, rowSpan);
  }

  if (!slot) {
    throw new CanvasFullError();
  }

  return { slot, gridRows };
}

/**
 * purpose --- all occupied card rectangles in a folder, including legacy children without cardGrid ---
 */
export function collectOccupiedCardGrids(
  parent: LayoutTreeNode,
  breakpoint: LayoutBreakpoint = 'desktop',
  parentId?: string,
): CardGridPosition[] {
  const startCol = resolveFolderStartCol(parentId ?? parent.id);
  const occupied: CardGridPosition[] = [];
  let gridRows = resolveFolderCanvasGridRows(parent, breakpoint);

  for (const child of parent.children ?? []) {
    const stored = getNodeCardGridForBreakpoint(child, breakpoint);
    if (stored) {
      occupied.push(stored);
      continue;
    }

    const colSpan = legacySpanToColSpan(child.cardSpan);
    const rowSpan = GRID_DEFAULT_ROW_SPAN;
    const { slot, gridRows: nextRows } = findCardSlotGrowingCanvas(
      occupied,
      gridRows,
      startCol,
      colSpan,
      rowSpan,
    );
    occupied.push(slot);
    gridRows = Math.max(gridRows, nextRows);
  }

  return occupied;
}

/**
 * purpose --- assigns cardGrid for a new child without moving existing cards ---
 * @param parent - Parent folder node
 * @param parentId - Parent folder id
 */
export function assignCardGridForNewChild(
  parent: LayoutTreeNode,
  parentId: string,
): CardGridPosition {
  const startCol = resolveFolderStartCol(parentId);
  const occupied = collectOccupiedCardGrids(parent, 'desktop', parentId);
  const initialRows = resolveFolderCanvasGridRows(parent);

  const { slot, gridRows } = findCardSlotGrowingCanvas(
    occupied,
    initialRows,
    startCol,
    NEW_CHILD_CARD_COL_SPAN,
    NEW_CHILD_CARD_ROW_SPAN,
  );

  ensureMinimumFolderCanvasRows(parent, gridRows);
  return slot;
}
