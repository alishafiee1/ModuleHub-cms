import {
  BACK_CARD_COL_SPAN,
  GRID_DEFAULT_ROW_SPAN,
  GRID_MAX_COLUMNS,
  GRID_MAX_ROWS,
  LEGACY_SPAN_TO_COL_SPAN,
} from './grid-config';
import type { CardGridPosition, CardSpan, LayoutTreeNode, SiteLayoutDocument } from './types';

/**
 * purpose --- validates cardGrid bounds against the 30×9 canvas ---
 * @param grid - Grid position to validate
 * @param nodeId - Node id for error messages
 */
export function assertValidCardGrid(grid: CardGridPosition, nodeId: string): void {
  const { col, row, colSpan, rowSpan } = grid;
  if (!Number.isInteger(col) || col < 0 || col >= GRID_MAX_COLUMNS) {
    throw new Error(`Node "${nodeId}" cardGrid.col must be 0–${GRID_MAX_COLUMNS - 1}`);
  }
  if (!Number.isInteger(row) || row < 0 || row >= GRID_MAX_ROWS) {
    throw new Error(`Node "${nodeId}" cardGrid.row must be 0–${GRID_MAX_ROWS - 1}`);
  }
  if (!Number.isInteger(colSpan) || colSpan < 3 || colSpan > GRID_MAX_COLUMNS) {
    throw new Error(`Node "${nodeId}" cardGrid.colSpan must be 3–${GRID_MAX_COLUMNS}`);
  }
  if (!Number.isInteger(rowSpan) || rowSpan < 3 || rowSpan > GRID_MAX_ROWS) {
    throw new Error(`Node "${nodeId}" cardGrid.rowSpan must be 3–${GRID_MAX_ROWS}`);
  }
  if (col + colSpan > GRID_MAX_COLUMNS) {
    throw new Error(`Node "${nodeId}" cardGrid extends past column ${GRID_MAX_COLUMNS}`);
  }
  if (row + rowSpan > GRID_MAX_ROWS) {
    throw new Error(`Node "${nodeId}" cardGrid extends past row ${GRID_MAX_ROWS}`);
  }
}

/**
 * purpose --- converts legacy cardSpan to colSpan on the 30-column grid ---
 * @param cardSpan - Legacy span value
 */
export function legacySpanToColSpan(cardSpan: CardSpan | undefined): number {
  return LEGACY_SPAN_TO_COL_SPAN[cardSpan ?? 1] ?? LEGACY_SPAN_TO_COL_SPAN[1];
}

/**
 * purpose --- auto-layout children in folder order when migrating from cardSpan ---
 * @param children - Folder children in stored order
 * @param startCol - First column (7 when back slot reserved in UI)
 */
export function autoLayoutChildrenToGrid(
  children: LayoutTreeNode[],
  startCol = 0,
): LayoutTreeNode[] {
  let col = startCol;
  let row = 0;

  return children.map((child) => {
    const colSpan = legacySpanToColSpan(child.cardSpan);
    const rowSpan = GRID_DEFAULT_ROW_SPAN;

    if (col + colSpan > GRID_MAX_COLUMNS) {
      col = startCol;
      row += GRID_DEFAULT_ROW_SPAN;
    }

    const cardGrid: CardGridPosition = { col, row, colSpan, rowSpan };
    col += colSpan;

    const updated: LayoutTreeNode = { ...child, cardGrid };
    delete updated.cardSpan;
    return updated;
  });
}

/**
 * purpose --- migrates a single folder's children from cardSpan to cardGrid ---
 * @param children - Folder children
 * @param parentId - Parent folder id (nested folders reserve back-card slot)
 */
function migrateFolderChildren(children: LayoutTreeNode[], parentId: string | null): LayoutTreeNode[] {
  const needsMigration = children.some((child) => child.cardSpan !== undefined || !child.cardGrid);
  if (!needsMigration) {
    return children;
  }

  const startCol = parentId === null || parentId === 'root' ? 0 : BACK_CARD_COL_SPAN;
  return autoLayoutChildrenToGrid(children, startCol);
}

/**
 * purpose --- recursively migrates cardSpan → cardGrid across the layout tree ---
 * @param node - Tree node
 * @returns Updated node and whether any change was made
 */
function migrateTreeNode(node: LayoutTreeNode): { node: LayoutTreeNode; changed: boolean } {
  let changed = false;
  const updated: LayoutTreeNode = { ...node };

  if (node.cardSpan !== undefined || (node.type === 'module' && !node.cardGrid)) {
    if (!node.cardGrid) {
      updated.cardGrid = {
        col: 0,
        row: 0,
        colSpan: legacySpanToColSpan(node.cardSpan),
        rowSpan: GRID_DEFAULT_ROW_SPAN,
      };
      delete updated.cardSpan;
      changed = true;
    } else if (node.cardSpan !== undefined) {
      delete updated.cardSpan;
      changed = true;
    }
  }

  if (node.type === 'folder' && node.children) {
    const migratedChildren = migrateFolderChildren(node.children, node.id);
    if (migratedChildren !== node.children) {
      changed = true;
    }
    updated.children = migratedChildren.map((child) => {
      const result = migrateTreeNode(child);
      if (result.changed) {
        changed = true;
      }
      return result.node;
    });
  }

  return { node: updated, changed };
}

/**
 * purpose --- migrates entire site layout from cardSpan to cardGrid if needed ---
 * @param layout - Parsed layout document
 * @returns Migrated layout and whether write-back is required
 */
export function migrateSiteLayoutCardGrid(
  layout: SiteLayoutDocument,
): { layout: SiteLayoutDocument; migrated: boolean } {
  const { node: tree, changed } = migrateTreeNode(layout.tree);
  if (!changed) {
    return { layout, migrated: false };
  }
  return { layout: { ...layout, tree }, migrated: true };
}

/** Exported for tests — column offset when back card occupies top-left slot */
export { BACK_CARD_COL_SPAN };
