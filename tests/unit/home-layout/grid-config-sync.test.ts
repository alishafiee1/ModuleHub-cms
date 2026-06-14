import fs from 'fs';
import path from 'path';
import {
  GRID_CANVAS_ROW_STEP,
  GRID_MAX_CANVAS_ROWS,
  GRID_MAX_COLUMNS,
  GRID_MIN_CANVAS_ROWS,
  GRID_MIN_COLUMN_SPAN,
  GRID_MIN_ROW_SPAN,
  NEW_CHILD_CARD_COL_SPAN,
  NEW_CHILD_CARD_ROW_SPAN,
} from '../../../core/src/modules/home-layout/grid-config';

const CONFIG_JS_PATH = path.join(__dirname, '../../../public/js/card-canvas/config.js');

function readConfigJsNumber(key: string): number {
  const source = fs.readFileSync(CONFIG_JS_PATH, 'utf8');
  const match = source.match(new RegExp(`${key}:\\s*(\\d+)`));
  if (!match) {
    throw new Error(`Missing ${key} in config.js`);
  }
  return Number(match[1]);
}

describe('grid-config sync with public/js/card-canvas/config.js', () => {
  it('mirrors key GRID_CONFIG numeric constants', () => {
    expect(readConfigJsNumber('maxColumns')).toBe(GRID_MAX_COLUMNS);
    expect(readConfigJsNumber('minCanvasRows')).toBe(GRID_MIN_CANVAS_ROWS);
    expect(readConfigJsNumber('maxCanvasRows')).toBe(GRID_MAX_CANVAS_ROWS);
    expect(readConfigJsNumber('canvasRowStep')).toBe(GRID_CANVAS_ROW_STEP);
    expect(readConfigJsNumber('minColumnSpan')).toBe(GRID_MIN_COLUMN_SPAN);
    expect(readConfigJsNumber('minRowSpan')).toBe(GRID_MIN_ROW_SPAN);
    expect(readConfigJsNumber('newChildColSpan')).toBe(NEW_CHILD_CARD_COL_SPAN);
    expect(readConfigJsNumber('newChildRowSpan')).toBe(NEW_CHILD_CARD_ROW_SPAN);
  });
});
