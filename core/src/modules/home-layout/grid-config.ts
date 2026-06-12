/** Logical grid dimensions for the card canvas (matches cart view template) */
export const GRID_MAX_COLUMNS = 30;
export const GRID_MAX_ROWS = 9;
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
