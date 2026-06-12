/**
 * تنظیمات گرید کارت‌ویو — ModuleHub embedded canvas
 * Card grid configuration for the home page canvas area.
 */
export const GRID_CONFIG = {
  maxColumns: 30,
  /** Default and minimum visible canvas rows */
  minCanvasRows: 9,
  /** Maximum expandable canvas rows */
  maxCanvasRows: 60,
  /** Row increment when dragging the bottom height handle */
  canvasRowStep: 3,
  /** Active rows before folder-specific override (alias for minCanvasRows) */
  maxRows: 9,
  minColumnSpan: 3,
  minRowSpan: 3,
  maxColumnSpan: 30,
  maxRowSpan: 60,
  cardGap: 10,
  containerPadding: 12,
  /** Reserved top-left for back-navigation card in subfolders */
  backCardColSpan: 7,
  backCardRowSpan: 3,
};
