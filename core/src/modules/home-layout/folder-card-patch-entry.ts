import type { CardBackground, CardGridPosition, LayoutBreakpoint } from './types';

export interface FolderCardPatchEntry {
  nodeId: string;
  cardGrid?: CardGridPosition;
  cardGridTablet?: CardGridPosition;
  cardGridMobile?: CardGridPosition;
  cardBackground?: CardBackground | null;
}

/**
 * purpose --- maps breakpoint to the PATCH field name for card grid ---
 */
function gridFieldForBreakpoint(breakpoint: LayoutBreakpoint): keyof Pick<
  FolderCardPatchEntry,
  'cardGrid' | 'cardGridTablet' | 'cardGridMobile'
> {
  if (breakpoint === 'tablet') {
    return 'cardGridTablet';
  }
  if (breakpoint === 'mobile') {
    return 'cardGridMobile';
  }
  return 'cardGrid';
}

/**
 * purpose --- builds one PATCH /admin/folder/:id/cards entry from card DOM state ---
 * Client mirror: public/js/card-canvas/card-canvas-app.js collectCardPayload().
 * Omits cardBackground unless set or explicitly cleared (avoids wiping on reorder-only saves).
 * @param nodeId - Layout tree node id
 * @param cardGrid - Current grid position from data attributes
 * @param backgroundJson - Raw data-card-background attribute value
 * @param backgroundCleared - data-card-background-cleared flag
 * @param breakpoint - Active edit breakpoint (default desktop)
 * @returns Patch entry for one card
 */
export function buildFolderCardPatchEntry(
  nodeId: string,
  cardGrid: CardGridPosition,
  backgroundJson: string | null | undefined,
  backgroundCleared: boolean,
  breakpoint: LayoutBreakpoint = 'desktop',
): FolderCardPatchEntry {
  const entry: FolderCardPatchEntry = { nodeId };
  entry[gridFieldForBreakpoint(breakpoint)] = cardGrid;

  if (backgroundCleared) {
    entry.cardBackground = null;
    return entry;
  }

  if (!backgroundJson || backgroundJson === 'null') {
    return entry;
  }

  try {
    const parsed = JSON.parse(backgroundJson) as CardBackground;
    if (parsed?.type === 'color' || parsed?.type === 'image') {
      entry.cardBackground = parsed;
    }
  } catch {
    // ignore invalid JSON — do not send cardBackground
  }

  return entry;
}
