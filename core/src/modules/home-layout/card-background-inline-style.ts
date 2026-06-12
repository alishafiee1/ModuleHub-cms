import type { CardBackground } from './types';

/**
 * purpose --- builds safe inline CSS variables for card custom background ---
 * Uses single quotes inside url() so values survive HTML style="..." attributes.
 * @param bg - Parsed cardBackground from layout node
 * @returns Semicolon-separated CSS custom properties string (may be empty)
 */
export function buildCardBackgroundInlineStyle(bg: CardBackground | null | undefined): string {
  if (!bg || bg.type === 'none') {
    return '';
  }

  const bgOpacity = (bg.backgroundOpacity ?? 100) / 100;
  const overlayOpacity = (bg.overlayOpacity ?? 45) / 100;
  const parts: string[] = [
    `--card-bg-opacity:${bgOpacity}`,
    `--card-overlay-opacity:${overlayOpacity}`,
  ];

  if (bg.type === 'color' && bg.color) {
    parts.unshift(`--card-bg-color:${bg.color}`);
  } else if (bg.type === 'image' && bg.imageUrl) {
    parts.unshift(`--card-bg-image:url('${bg.imageUrl}')`);
  }

  return `${parts.join(';')};`;
}
