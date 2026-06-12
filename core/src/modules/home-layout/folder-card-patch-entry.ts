import type { CardBackground } from './types';

export interface FolderCardPatchEntry {
  nodeId: string;
  cardSpan?: number;
  cardBackground?: CardBackground | null;
}

/**
 * purpose --- builds one PATCH /admin/folder/:id/cards entry from card DOM state ---
 * Omits cardBackground unless set or explicitly cleared (avoids wiping on reorder-only saves).
 * @param nodeId - Layout tree node id
 * @param cardSpan - Active span (1 = default, omitted from payload)
 * @param backgroundJson - Raw data-card-background attribute value
 * @param backgroundCleared - data-card-background-cleared flag
 * @returns Patch entry for one card
 */
export function buildFolderCardPatchEntry(
  nodeId: string,
  cardSpan: number,
  backgroundJson: string | null | undefined,
  backgroundCleared: boolean,
): FolderCardPatchEntry {
  const entry: FolderCardPatchEntry = { nodeId };

  if (cardSpan !== 1) {
    entry.cardSpan = cardSpan;
  }

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
