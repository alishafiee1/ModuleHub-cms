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
