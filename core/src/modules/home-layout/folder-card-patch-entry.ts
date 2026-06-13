import type { CardBackground, CardGridPosition } from './types';

export interface FolderCardPatchEntry {
  nodeId: string;
  cardGrid?: CardGridPosition;
  cardBackground?: CardBackground | null;
}

/**
 * purpose --- builds one PATCH /admin/folder/:id/cards entry from card DOM state ---
 * Client mirror: public/js/card-canvas/card-canvas-app.js collectCardPayload().
 * Omits cardBackground unless set or explicitly cleared (avoids wiping on reorder-only saves).
 * @param nodeId - Layout tree node id
 * @param cardGrid - Current grid position from data attributes
 * @param backgroundJson - Raw data-card-background attribute value
 * @param backgroundCleared - data-card-background-cleared flag
 * @returns Patch entry for one card
 */
export function buildFolderCardPatchEntry(
  nodeId: string,
  cardGrid: CardGridPosition,
  backgroundJson: string | null | undefined,
  backgroundCleared: boolean,
): FolderCardPatchEntry {
  const entry: FolderCardPatchEntry = { nodeId, cardGrid };

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
