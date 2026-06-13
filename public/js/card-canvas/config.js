/**
 * تنظیمات گرید کارت‌ویو — ModuleHub embedded canvas
 * Card grid configuration for the home page canvas area.
 * Keep in sync with core/src/modules/home-layout/grid-config.ts
 */
export const GRID_CONFIG = {
  maxColumns: 30,
  /** Default and minimum visible canvas rows */
  minCanvasRows: 9,
  /** Maximum expandable canvas rows */
  maxCanvasRows: 60,
  /** Row increment when dragging the bottom height handle */
  canvasRowStep: 3,
  minColumnSpan: 3,
  minRowSpan: 3,
  maxColumnSpan: 30,
  maxRowSpan: 60,
  cardGap: 10,
  containerPadding: 12,
  /** Reserved top-left for back-navigation card in subfolders */
  backCardColSpan: 7,
  backCardRowSpan: 3,
  /** Minimum canvas container height in pixels */
  minCanvasHeightPx: 280,
};

/** Legacy cardSpan → colSpan — mirrors grid-config.ts LEGACY_SPAN_TO_COL_SPAN */
export const LEGACY_SPAN_TO_COL_SPAN = {
  1: 7,
  2: 15,
  4: 30,
};

/** Horizontal padding on .card-canvas (2rem × 2) — keep in sync with card-canvas.css */
export const CARD_CANVAS_CSS_HORIZONTAL_PADDING = 64;

/** Viewport / design settings per device — keep in sync with grid-config.ts */
export const DEVICE_BREAKPOINTS = {
  desktop: { minWidth: 1024, designWidth: 1200 },
  tablet: { minWidth: 641, designWidth: 768 },
  mobile: { minWidth: 0, designWidth: 390 },
};

/** Max width of .demo-container — header + card column share this shell */
export const APP_CONTENT_SHELL_MAX_WIDTH = 1280;

/**
 * resolveBreakpoint --- active layout breakpoint from viewport width ---
 * @param {number} viewportWidth
 * @returns {'desktop'|'tablet'|'mobile'}
 */
export function resolveBreakpoint(viewportWidth) {
  if (viewportWidth >= DEVICE_BREAKPOINTS.desktop.minWidth) {
    return 'desktop';
  }
  if (viewportWidth >= DEVICE_BREAKPOINTS.tablet.minWidth) {
    return 'tablet';
  }
  return 'mobile';
}

/**
 * resolveDesignWidth --- pixel width used for grid cell math ---
 * @param {'desktop'|'tablet'|'mobile'} breakpoint
 * @param {number} [_containerInnerWidth] - unused; kept for call-site compatibility
 */
export function resolveDesignWidth(breakpoint, _containerInnerWidth) {
  const configured = DEVICE_BREAKPOINTS[breakpoint]?.designWidth;
  if (typeof configured === 'number') {
    return configured;
  }
  return DEVICE_BREAKPOINTS.desktop.designWidth;
}

/**
 * resolveGridInnerWidth --- grid cell area width: always fill the measured canvas inner area ---
 * Shell width (resolveShellOuterWidth) enforces desktop design cap; cells scale to containerInner.
 * @param {number} containerInner - Usable width inside cards wrapper (px)
 * @param {'desktop'|'tablet'|'mobile'} [_breakpoint]
 */
export function resolveGridInnerWidth(containerInner, _breakpoint) {
  return containerInner;
}

/**
 * resolveCardCanvasCssHorizontalPadding --- match card-canvas.css h-pad per breakpoint ---
 * @param {number} [viewportWidth]
 */
export function resolveCardCanvasCssHorizontalPadding(viewportWidth = window.innerWidth) {
  return viewportWidth <= 640 ? 32 : CARD_CANVAS_CSS_HORIZONTAL_PADDING;
}

/**
 * resolveShellOuterWidth --- total outer width of card canvas shell (grid + padding) ---
 * View mode: tablet/mobile fill viewport; desktop caps at design width.
 * Edit mode (simulateDevice): tablet/mobile use design reference width for centered preview.
 * @param {'desktop'|'tablet'|'mobile'} breakpoint
 * @param {number} [viewportWidth]
 * @param {{ simulateDevice?: boolean }} [options]
 */
export function resolveShellOuterWidth(
  breakpoint,
  viewportWidth = window.innerWidth,
  options = {},
) {
  const { simulateDevice = false } = options;
  const viewportCap = Math.max(viewportWidth - 16, 280);
  const cssHorizontalPadding = resolveCardCanvasCssHorizontalPadding(viewportWidth);
  const shellPadding = GRID_CONFIG.containerPadding * 2 + cssHorizontalPadding;

  if (breakpoint === 'desktop') {
    const designInner = resolveDesignWidth(breakpoint, viewportWidth);
    const maxInnerFromViewport = Math.max(viewportCap - shellPadding, 1);
    const inner = Math.min(designInner, maxInnerFromViewport);
    return inner + shellPadding;
  }

  if (simulateDevice) {
    const inner = resolveDesignWidth(breakpoint, viewportWidth);
    return Math.min(inner + shellPadding, viewportCap);
  }

  return viewportCap;
}
