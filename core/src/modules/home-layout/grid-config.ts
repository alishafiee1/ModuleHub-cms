/**
 * Logical grid dimensions for the card canvas.
 * Keep in sync with public/js/card-canvas/config.js (GRID_CONFIG, LEGACY_SPAN_TO_COL_SPAN).
 */
export const GRID_MAX_COLUMNS = 30;
/** Default visible canvas rows per folder */
export const GRID_MIN_CANVAS_ROWS = 9;
/** Maximum canvas rows a folder can expand to */
export const GRID_MAX_CANVAS_ROWS = 60;
/** Row step when dragging canvas height handle */
export const GRID_CANVAS_ROW_STEP = 3;
/** @deprecated Use GRID_MIN_CANVAS_ROWS — kept for validation fallbacks */
export const GRID_MAX_ROWS = GRID_MIN_CANVAS_ROWS;
export const GRID_MIN_COLUMN_SPAN = 3;
export const GRID_MIN_ROW_SPAN = 3;
export const GRID_DEFAULT_ROW_SPAN = 3;

/** Maps legacy cardSpan (1|2|4) to colSpan on a 30-column grid */
export const LEGACY_SPAN_TO_COL_SPAN: Readonly<Record<number, number>> = {
  1: 7,
  2: 15,
  4: 30,
};

/** Reserved top-left slot for the back-navigation card in subfolders */
export const BACK_CARD_COL_SPAN = 7;
export const BACK_CARD_ROW_SPAN = GRID_DEFAULT_ROW_SPAN;

/** Viewport width at or above which the desktop layout applies */
export const BREAKPOINT_DESKTOP_MIN_WIDTH = 1024;
/** Viewport width at or above which the tablet layout applies (below desktop) */
export const BREAKPOINT_TABLET_MIN_WIDTH = 641;
/** Viewport width at or below which the mobile layout applies */
export const BREAKPOINT_MOBILE_MAX_WIDTH = 640;

/**
 * Reference design widths for grid cell sizing per breakpoint.
 * Desktop uses fixed 1200px grid — centered in .demo-container shell.
 */
export const DEVICE_DESIGN_WIDTH: Readonly<Record<'desktop' | 'tablet' | 'mobile', number>> = {
  desktop: 1200,
  tablet: 768,
  mobile: 390,
};

/** Max outer width for header + card column (px) */
export const APP_CONTENT_SHELL_MAX_WIDTH = 1280;

/** Grid wrapper padding — keep in sync with public/js/card-canvas/config.js */
export const CARD_CANVAS_CONTAINER_PADDING = 12;
/** Horizontal padding on .card-canvas (2rem × 2) */
export const CARD_CANVAS_CSS_HORIZONTAL_PADDING = 64;

export type LayoutBreakpointKey = 'desktop' | 'tablet' | 'mobile';

/**
 * purpose --- grid cell area width: fill canvas; desktop capped at design width ---
 */
export function resolveGridInnerWidth(
  containerInner: number,
  breakpoint: LayoutBreakpointKey,
): number {
  const maxDesign = DEVICE_DESIGN_WIDTH[breakpoint];
  if (breakpoint === 'desktop') {
    return Math.min(containerInner, maxDesign);
  }
  return containerInner;
}

export interface ResolveShellOuterWidthOptions {
  /** When true (edit mode), tablet/mobile use design reference width for centered preview */
  simulateDevice?: boolean;
}

/**
 * purpose --- outer shell width for header + card column (grid + padding) ---
 */
export function resolveShellOuterWidth(
  breakpoint: LayoutBreakpointKey,
  viewportWidth: number,
  options: ResolveShellOuterWidthOptions = {},
): number {
  const { simulateDevice = false } = options;
  const viewportCap = Math.max(viewportWidth - 16, 280);
  const shellPadding = CARD_CANVAS_CONTAINER_PADDING * 2 + CARD_CANVAS_CSS_HORIZONTAL_PADDING;

  if (breakpoint === 'desktop') {
    const designInner = DEVICE_DESIGN_WIDTH.desktop;
    const maxInnerFromViewport = Math.max(viewportCap - shellPadding, 1);
    const inner = Math.min(designInner, maxInnerFromViewport);
    return inner + shellPadding;
  }

  if (simulateDevice) {
    const inner = DEVICE_DESIGN_WIDTH[breakpoint];
    return Math.min(inner + shellPadding, viewportCap);
  }

  return viewportCap;
}
