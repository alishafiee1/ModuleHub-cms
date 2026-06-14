/**
 * مشتق‌سازی چیدمان کارت برای breakpointهای کوچک‌تر
 * Derives tablet/mobile cardGrid from desktop layouts on site-layout read.
 */
import {
  DEVICE_DESIGN_WIDTH,
  GRID_MAX_COLUMNS,
  GRID_MIN_COLUMN_SPAN,
  GRID_MIN_ROW_SPAN,
} from './grid-config';
import {
  computeMinCanvasRowsForCards,
  findEmptyCardSlot,
  rectsOverlap,
  resolveFolderCanvasGridRows,
} from './grid-slot';
import type { CardGridPosition, LayoutBreakpoint, LayoutTreeNode, SiteLayoutDocument } from './types';

export function resolveDesignWidthForBreakpoint(breakpoint: LayoutBreakpoint): number {
  return DEVICE_DESIGN_WIDTH[breakpoint];
}

/**
 * purpose --- scale one card grid from source breakpoint to target ---
 */
export function deriveCardGridForBreakpoint(
  source: CardGridPosition,
  sourceBreakpoint: LayoutBreakpoint,
  targetBreakpoint: LayoutBreakpoint,
  occupied: CardGridPosition[],
  gridRows: number,
  startCol = 0,
): CardGridPosition {
  const sourceWidth = resolveDesignWidthForBreakpoint(sourceBreakpoint);
  const targetWidth = resolveDesignWidthForBreakpoint(targetBreakpoint);
  const scale = targetWidth / sourceWidth;

  let colSpan = Math.max(
    GRID_MIN_COLUMN_SPAN,
    Math.min(GRID_MAX_COLUMNS, Math.round(source.colSpan * scale)),
  );
  let col = Math.max(0, Math.min(GRID_MAX_COLUMNS - colSpan, Math.round(source.col * scale)));
  const row = source.row;
  const rowSpan = Math.max(GRID_MIN_ROW_SPAN, source.rowSpan);

  let candidate: CardGridPosition = { col, row, colSpan, rowSpan };
  const collides = occupied.some((rect) => rectsOverlap(candidate, rect));
  if (collides) {
    const slot = findEmptyCardSlot(occupied, gridRows, startCol, colSpan, rowSpan);
    if (slot) {
      candidate = slot;
    } else {
      colSpan = GRID_MIN_COLUMN_SPAN;
      col = Math.min(col, GRID_MAX_COLUMNS - colSpan);
      candidate = { col, row, colSpan, rowSpan };
      const fallbackSlot = findEmptyCardSlot(occupied, gridRows, startCol, colSpan, rowSpan);
      if (fallbackSlot) {
        candidate = fallbackSlot;
      }
    }
  }

  return candidate;
}

function sortByPosition(a: CardGridPosition, b: CardGridPosition): number {
  if (a.row !== b.row) {
    return a.row - b.row;
  }
  return a.col - b.col;
}

function placementStartCol(folderId: string): number {
  return folderId === 'root' ? 0 : 7;
}

/**
 * purpose --- derive missing tablet/mobile grids for one folder's children ---
 * @returns Updated children and folderCanvas patches, or null if nothing changed
 */
export function deriveFolderBreakpointLayouts(
  folder: LayoutTreeNode,
  folderId: string,
): { children: LayoutTreeNode[]; folderCanvas?: LayoutTreeNode['folderCanvas']; changed: boolean } {
  const children = folder.children ?? [];
  if (children.length === 0) {
    return { children, changed: false };
  }

  const startCol = placementStartCol(folderId);
  let changed = false;
  const updatedChildren = children.map((child) => ({ ...child }));

  for (const target of ['tablet', 'mobile'] as const) {
    const targetField = target === 'tablet' ? 'cardGridTablet' : 'cardGridMobile';
    const sourceBreakpoint: LayoutBreakpoint = target === 'tablet' ? 'desktop' : 'tablet';
    const sourceField = sourceBreakpoint === 'desktop' ? 'cardGrid' : 'cardGridTablet';

    const needsDerive = updatedChildren.some((child) => {
      if (child[targetField]) {
        return false;
      }
      return Boolean(child[sourceField] ?? (sourceBreakpoint === 'tablet' ? child.cardGrid : undefined));
    });
    if (!needsDerive) {
      continue;
    }

    const gridRows = resolveFolderCanvasGridRows(folder, target);
    const occupied: CardGridPosition[] = [];
    const sortedIndices = updatedChildren
      .map((child, index) => ({ child, index }))
      .filter(({ child }) => child[targetField] || child[sourceField] || child.cardGrid)
      .sort((a, b) => {
        const gridA = a.child[targetField]
          ?? a.child[sourceField]
          ?? a.child.cardGrid;
        const gridB = b.child[targetField]
          ?? b.child[sourceField]
          ?? b.child.cardGrid;
        if (!gridA || !gridB) {
          return 0;
        }
        return sortByPosition(gridA, gridB);
      });

    for (const { child, index } of sortedIndices) {
      if (child[targetField]) {
        occupied.push(child[targetField] as CardGridPosition);
        continue;
      }

      const sourceGrid = child[sourceField]
        ?? (sourceBreakpoint === 'tablet' ? child.cardGrid : undefined);
      if (!sourceGrid) {
        continue;
      }

      const derived = deriveCardGridForBreakpoint(
        sourceGrid,
        sourceField === 'cardGrid' ? 'desktop' : 'tablet',
        target,
        occupied,
        gridRows,
        startCol,
      );
      updatedChildren[index] = { ...updatedChildren[index], [targetField]: derived };
      occupied.push(derived);
      changed = true;
    }
  }

  let folderCanvas = folder.folderCanvas;
  if (changed) {
    const tabletGrids = updatedChildren
      .map((c) => c.cardGridTablet)
      .filter((g): g is CardGridPosition => g !== undefined);
    const mobileGrids = updatedChildren
      .map((c) => c.cardGridMobile)
      .filter((g): g is CardGridPosition => g !== undefined);

    const nextCanvas = { ...(folderCanvas ?? { gridRows: resolveFolderCanvasGridRows(folder, 'desktop') }) };
    if (tabletGrids.length > 0 && nextCanvas.gridRowsTablet === undefined) {
      nextCanvas.gridRowsTablet = computeMinCanvasRowsForCards(tabletGrids);
    }
    if (mobileGrids.length > 0 && nextCanvas.gridRowsMobile === undefined) {
      nextCanvas.gridRowsMobile = computeMinCanvasRowsForCards(mobileGrids);
    }
    folderCanvas = nextCanvas;
  }

  return { children: updatedChildren, folderCanvas, changed };
}

function deriveTreeNode(node: LayoutTreeNode): { node: LayoutTreeNode; changed: boolean } {
  if (node.type !== 'folder' || !node.children) {
    return { node, changed: false };
  }

  let changed = false;
  let children = node.children;
  const folderResult = deriveFolderBreakpointLayouts({ ...node, children }, node.id);
  if (folderResult.changed) {
    children = folderResult.children;
    changed = true;
  }

  const derivedChildren: LayoutTreeNode[] = [];
  for (const child of children) {
    if (child.type === 'folder' && child.children) {
      const sub = deriveTreeNode(child);
      derivedChildren.push(sub.node);
      changed = changed || sub.changed;
    } else {
      derivedChildren.push(child);
    }
  }

  const updatedNode: LayoutTreeNode = {
    ...node,
    children: derivedChildren,
    ...(folderResult.changed && folderResult.folderCanvas ? { folderCanvas: folderResult.folderCanvas } : {}),
  };

  return { node: updatedNode, changed };
}

/**
 * purpose --- ensures all folders have tablet/mobile layouts derived from desktop ---
 * Idempotent — second call returns changed: false.
 */
export function ensureDeviceBreakpointLayouts(
  layout: SiteLayoutDocument,
): { layout: SiteLayoutDocument; changed: boolean } {
  const { node: tree, changed } = deriveTreeNode(layout.tree);
  if (!changed) {
    return { layout, changed: false };
  }
  return { layout: { ...layout, tree }, changed: true };
}
