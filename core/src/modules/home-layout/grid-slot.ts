import {
  BACK_CARD_COL_SPAN,
  GRID_DEFAULT_ROW_SPAN,
  GRID_MAX_COLUMNS,
  GRID_MIN_CANVAS_ROWS,
  GRID_MIN_COLUMN_SPAN,
  GRID_MIN_ROW_SPAN,
} from './grid-config';
import type { CardGridPosition, LayoutTreeNode } from './types';

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
 * purpose --- default gridRows for a folder canvas ---
 */
export function resolveFolderCanvasGridRows(folder: LayoutTreeNode | null | undefined): number {
  const raw = folder?.folderCanvas?.gridRows;
  if (typeof raw === 'number' && raw >= GRID_MIN_CANVAS_ROWS) {
    return raw;
  }
  return GRID_MIN_CANVAS_ROWS;
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
  const gridRows = resolveFolderCanvasGridRows(parent);
  const startCol = parentId === 'root' ? 0 : BACK_CARD_COL_SPAN;
  const occupied = (parent.children ?? [])
    .filter((child) => child.cardGrid)
    .map((child) => child.cardGrid as CardGridPosition);

  const slot = findEmptyCardSlot(occupied, gridRows, startCol);
  if (slot) {
    return slot;
  }

  return {
    col: startCol,
    row: 0,
    colSpan: 7,
    rowSpan: GRID_DEFAULT_ROW_SPAN,
  };
}
