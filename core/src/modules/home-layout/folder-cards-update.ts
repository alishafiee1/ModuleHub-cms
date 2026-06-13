import type { Request, Response } from 'express';
import { GRID_MAX_CANVAS_ROWS, GRID_MIN_CANVAS_ROWS } from './grid-config';
import { computeMinCanvasRowsForCards, resolveFolderCanvasGridRows } from './grid-slot';
import { readSiteLayout, writeSiteLayout } from './layout-store';
import { findNodeById } from './layout-tree';
import { assertValidCardGrid } from './migrate-card-grid';
import type {
  CardBackground,
  CardGridPosition,
  FolderCardUpdateEntry,
  FolderCardsUpdatePayload,
  FolderCanvasSettings,
  LayoutBreakpoint,
  LayoutTreeNode,
  SiteLayoutDocument,
} from './types';

/**
 * purpose --- validates folder canvas row count from PATCH payload ---
 * @param gridRows - Requested canvas rows
 */
function assertValidCanvasGridRows(gridRows: number): void {
  if (!Number.isInteger(gridRows) || gridRows < GRID_MIN_CANVAS_ROWS || gridRows > GRID_MAX_CANVAS_ROWS) {
    throw new Error(`canvasGridRows must be an integer ${GRID_MIN_CANVAS_ROWS}–${GRID_MAX_CANVAS_ROWS}`);
  }
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const CARD_BG_IMAGE_PREFIX = '/card-backgrounds/';

const BREAKPOINT_GRID_FIELDS: ReadonlyArray<{
  breakpoint: LayoutBreakpoint;
  gridField: keyof Pick<FolderCardUpdateEntry, 'cardGrid' | 'cardGridTablet' | 'cardGridMobile'>;
  canvasField: keyof Pick<FolderCardsUpdatePayload, 'canvasGridRows' | 'canvasGridRowsTablet' | 'canvasGridRowsMobile'>;
  folderCanvasField: keyof Pick<FolderCanvasSettings, 'gridRows' | 'gridRowsTablet' | 'gridRowsMobile'>;
}> = [
  { breakpoint: 'desktop', gridField: 'cardGrid', canvasField: 'canvasGridRows', folderCanvasField: 'gridRows' },
  { breakpoint: 'tablet', gridField: 'cardGridTablet', canvasField: 'canvasGridRowsTablet', folderCanvasField: 'gridRowsTablet' },
  { breakpoint: 'mobile', gridField: 'cardGridMobile', canvasField: 'canvasGridRowsMobile', folderCanvasField: 'gridRowsMobile' },
];

/**
 * purpose --- validates a CardBackground object from the PATCH payload ---
 * @param bg - Unvalidated background object
 * @param nodeId - Node id for error messages
 */
function assertValidCardBackground(bg: unknown, nodeId: string): void {
  if (typeof bg !== 'object' || bg === null || Array.isArray(bg)) {
    throw new Error(`cardBackground for "${nodeId}" must be an object`);
  }
  const obj = bg as Record<string, unknown>;
  const type = obj.type;
  if (type !== 'none' && type !== 'color' && type !== 'image') {
    throw new Error(`cardBackground.type for "${nodeId}" must be none|color|image`);
  }
  if (type === 'color' && (typeof obj.color !== 'string' || !HEX_COLOR_RE.test(obj.color))) {
    throw new Error(`cardBackground.color for "${nodeId}" must be a 6-digit hex e.g. #3b82f6`);
  }
  if (type === 'image' && (typeof obj.imageUrl !== 'string' || !obj.imageUrl.startsWith(CARD_BG_IMAGE_PREFIX))) {
    throw new Error(`cardBackground.imageUrl for "${nodeId}" must start with ${CARD_BG_IMAGE_PREFIX}`);
  }
  for (const field of ['backgroundOpacity', 'overlayOpacity'] as const) {
    if (obj[field] !== undefined) {
      const v = Number(obj[field]);
      if (!Number.isFinite(v) || v < 0 || v > 100) {
        throw new Error(`cardBackground.${field} for "${nodeId}" must be 0–100`);
      }
    }
  }
}

/**
 * purpose --- validates and applies a folder cards reorder/resize request ---
 * Ensures all nodeIds belong to the folder and cardGrid values are legal.
 * @param layout - Current site layout
 * @param folderId - Folder to update
 * @param payload - Cards update body from request
 * @returns Updated layout document
 */
export function applyFolderCardsUpdate(
  layout: SiteLayoutDocument,
  folderId: string,
  payload: FolderCardsUpdatePayload,
): SiteLayoutDocument {
  const folderNode = findNodeById(layout.tree, folderId);
  if (!folderNode || folderNode.type !== 'folder') {
    throw new Error(`Folder "${folderId}" not found`);
  }

  const existingChildren = folderNode.children ?? [];
  const existingById = new Map<string, LayoutTreeNode>(
    existingChildren.map((child) => [child.id, child]),
  );

  const { cards, canvasGridRows, canvasGridRowsTablet, canvasGridRowsMobile } = payload;
  if (!Array.isArray(cards)) {
    throw new Error('cards must be an array');
  }

  if (canvasGridRows !== undefined) {
    assertValidCanvasGridRows(canvasGridRows);
  }
  if (canvasGridRowsTablet !== undefined) {
    assertValidCanvasGridRows(canvasGridRowsTablet);
  }
  if (canvasGridRowsMobile !== undefined) {
    assertValidCanvasGridRows(canvasGridRowsMobile);
  }

  const canvasRowsByBreakpoint: Record<LayoutBreakpoint, number> = {
    desktop: canvasGridRows ?? resolveFolderCanvasGridRows(folderNode, 'desktop'),
    tablet: canvasGridRowsTablet ?? resolveFolderCanvasGridRows(folderNode, 'tablet'),
    mobile: canvasGridRowsMobile ?? resolveFolderCanvasGridRows(folderNode, 'mobile'),
  };

  for (const entry of cards) {
    if (typeof entry.nodeId !== 'string' || !entry.nodeId) {
      throw new Error('Each card entry must have a non-empty nodeId');
    }
    if (!existingById.has(entry.nodeId)) {
      throw new Error(`Node "${entry.nodeId}" is not a child of folder "${folderId}"`);
    }

    for (const { breakpoint, gridField } of BREAKPOINT_GRID_FIELDS) {
      const grid = entry[gridField];
      if (grid !== undefined) {
        assertValidCardGrid(grid, entry.nodeId, canvasRowsByBreakpoint[breakpoint]);
      }
    }

    if (entry.cardBackground !== undefined && entry.cardBackground !== null) {
      assertValidCardBackground(entry.cardBackground, entry.nodeId);
    }
    if ((entry as { cardSpan?: number }).cardSpan !== undefined) {
      throw new Error(`cardSpan is deprecated — use cardGrid for node "${entry.nodeId}"`);
    }
  }

  const receivedIds = new Set(cards.map((c) => c.nodeId));
  const missingIds = existingChildren.map((c) => c.id).filter((id) => !receivedIds.has(id));
  if (missingIds.length > 0) {
    throw new Error(`cards list is missing existing nodes: ${missingIds.join(', ')}`);
  }

  for (const { breakpoint, gridField } of BREAKPOINT_GRID_FIELDS) {
    const placedGrids = cards
      .map((entry) => entry[gridField])
      .filter((grid): grid is CardGridPosition => grid !== undefined);
    if (placedGrids.length === 0) {
      continue;
    }
    const minRequiredRows = computeMinCanvasRowsForCards(placedGrids);
    const effectiveRows = canvasRowsByBreakpoint[breakpoint];
    if (effectiveRows < minRequiredRows) {
      throw new Error(
        `canvas rows for ${breakpoint} (${effectiveRows}) is too small for placed cards (need ${minRequiredRows})`,
      );
    }
  }

  const updatedChildren = cards.map((entry) => {
    const original = existingById.get(entry.nodeId) as LayoutTreeNode;
    const updated: LayoutTreeNode = { ...original };

    if (entry.cardGrid !== undefined) {
      updated.cardGrid = entry.cardGrid as CardGridPosition;
      delete updated.cardSpan;
    }
    if (entry.cardGridTablet !== undefined) {
      updated.cardGridTablet = entry.cardGridTablet as CardGridPosition;
    }
    if (entry.cardGridMobile !== undefined) {
      updated.cardGridMobile = entry.cardGridMobile as CardGridPosition;
    }

    if (entry.cardBackground === null) {
      delete updated.cardBackground;
    } else if (entry.cardBackground !== undefined) {
      updated.cardBackground = entry.cardBackground as CardBackground;
    }

    return updated;
  });

  function patchNodeInTree(node: LayoutTreeNode): LayoutTreeNode {
    if (node.id === folderId) {
      const hasCanvasUpdate = canvasGridRows !== undefined
        || canvasGridRowsTablet !== undefined
        || canvasGridRowsMobile !== undefined;

      let folderCanvas = node.folderCanvas;
      if (hasCanvasUpdate) {
        folderCanvas = {
          ...(node.folderCanvas ?? { gridRows: resolveFolderCanvasGridRows(node, 'desktop') }),
        };
        if (canvasGridRows !== undefined) {
          folderCanvas.gridRows = canvasGridRows;
        }
        if (canvasGridRowsTablet !== undefined) {
          folderCanvas.gridRowsTablet = canvasGridRowsTablet;
        }
        if (canvasGridRowsMobile !== undefined) {
          folderCanvas.gridRowsMobile = canvasGridRowsMobile;
        }
      }

      return {
        ...node,
        children: updatedChildren,
        ...(folderCanvas ? { folderCanvas } : {}),
      };
    }
    if (!node.children) {
      return node;
    }
    return { ...node, children: node.children.map(patchNodeInTree) };
  }

  return { ...layout, tree: patchNodeInTree(layout.tree) };
}

/**
 * purpose --- Express handler for PATCH /admin/folder/:folderId/cards ---
 * Super Admin only — CSRF enforced at router level.
 * @param request - Express request
 * @param response - Express response
 */
export async function patchFolderCardsHandler(request: Request, response: Response): Promise<void> {
  const rawParam = request.params.folderId;
  const folderId = Array.isArray(rawParam) ? rawParam[0] : rawParam;
  if (!folderId) {
    response.status(400).json({ error: 'folderId is required' });
    return;
  }

  const body = request.body as unknown;
  if (typeof body !== 'object' || body === null || !Array.isArray((body as Record<string, unknown>).cards)) {
    response.status(400).json({ error: 'Request body must be { cards: [...] }' });
    return;
  }

  try {
    const layout = await readSiteLayout();
    const updated = applyFolderCardsUpdate(layout, folderId, body as FolderCardsUpdatePayload);
    await writeSiteLayout(updated);
    response.status(200).json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update folder cards';
    response.status(400).json({ error: message });
  }
}
