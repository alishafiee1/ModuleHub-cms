import {
  BACK_CARD_COL_SPAN,
  GRID_CANVAS_ROW_STEP,
  GRID_MAX_COLUMNS,
  GRID_MIN_CANVAS_ROWS,
  GRID_MIN_COLUMN_SPAN,
  GRID_MIN_ROW_SPAN,
} from './grid-config';
import type { CardGridPosition, LayoutBreakpoint, LayoutTreeNode } from './types';

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
 * purpose --- first empty 3×3 slot on the folder canvas ---
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
 * purpose --- bump folder canvas row count when content needs more vertical space ---
 */
function ensureMinimumFolderCanvasRows(parent: LayoutTreeNode, minRows: number): void {
  const stepped = Math.ceil(minRows / GRID_CANVAS_ROW_STEP) * GRID_CANVAS_ROW_STEP;
  const nextRows = Math.max(GRID_MIN_CANVAS_ROWS, stepped);
  if (!parent.folderCanvas) {
    parent.folderCanvas = { gridRows: nextRows };
    return;
  }
  if (parent.folderCanvas.gridRows < nextRows) {
    parent.folderCanvas.gridRows = nextRows;
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
 * purpose --- assigns cardGrid for a new child without moving existing cards ---
 * @param parent - Parent folder node
 * @param parentId - Parent folder id
 */
export function assignCardGridForNewChild(
  parent: LayoutTreeNode,
  parentId: string,
): CardGridPosition {
  const startCol = parentId === 'root' ? 0 : BACK_CARD_COL_SPAN;
  const occupied = (parent.children ?? [])
    .filter((child) => child.cardGrid)
    .map((child) => child.cardGrid as CardGridPosition);

  let gridRows = resolveFolderCanvasGridRows(parent);
  let slot = findEmptyCardSlot(occupied, gridRows, startCol);

  while (!slot) {
    gridRows += GRID_CANVAS_ROW_STEP;
    slot = findEmptyCardSlot(occupied, gridRows, startCol);
  }

  ensureMinimumFolderCanvasRows(parent, gridRows);
  return slot;
}
