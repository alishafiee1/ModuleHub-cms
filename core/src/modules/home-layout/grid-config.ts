/** Logical grid dimensions for the card canvas (matches cart view template) */
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
