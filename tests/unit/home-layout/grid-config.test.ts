import {
  CARD_CANVAS_CONTAINER_PADDING,
  CARD_CANVAS_CSS_HORIZONTAL_PADDING,
  DEVICE_DESIGN_WIDTH,
  resolveGridInnerWidth,
  resolveShellOuterWidth,
} from '../../../core/src/modules/home-layout/grid-config';

const SHELL_PADDING = CARD_CANVAS_CONTAINER_PADDING * 2 + CARD_CANVAS_CSS_HORIZONTAL_PADDING;

describe('resolveGridInnerWidth', () => {
  it('fills tablet canvas when wider than design reference', () => {
    expect(resolveGridInnerWidth(854, 'tablet')).toBe(854);
  });

  it('fills mobile canvas from container width', () => {
    expect(resolveGridInnerWidth(360, 'mobile')).toBe(360);
  });

  it('fills desktop canvas when wider than design reference', () => {
    expect(resolveGridInnerWidth(1400, 'desktop')).toBe(1400);
  });

  it('uses full desktop container when narrower than design cap', () => {
    expect(resolveGridInnerWidth(1100, 'desktop')).toBe(1100);
  });
});

describe('resolveShellOuterWidth', () => {
  it('caps desktop shell near 1280px on wide viewport', () => {
    expect(resolveShellOuterWidth('desktop', 1440)).toBe(
      DEVICE_DESIGN_WIDTH.desktop + SHELL_PADDING,
    );
  });

  it('shrinks desktop shell when viewport narrows within desktop breakpoint', () => {
    expect(resolveShellOuterWidth('desktop', 1100)).toBe(1100 - 16);
  });

  it('fills tablet viewport in view mode (not design reference)', () => {
    expect(resolveShellOuterWidth('tablet', 900)).toBe(900 - 16);
  });

  it('simulates tablet design width in edit mode', () => {
    expect(resolveShellOuterWidth('tablet', 1440, { simulateDevice: true })).toBe(
      DEVICE_DESIGN_WIDTH.tablet + SHELL_PADDING,
    );
  });

  it('fills mobile viewport in view mode', () => {
    expect(resolveShellOuterWidth('mobile', 390)).toBe(390 - 16);
  });

  it('simulates mobile design width in edit mode on wide monitor', () => {
    expect(resolveShellOuterWidth('mobile', 1440, { simulateDevice: true })).toBe(
      DEVICE_DESIGN_WIDTH.mobile + SHELL_PADDING,
    );
  });
});

describe('grid corner bounds (pure math)', () => {
  const pad = 12;
  const gap = 10;
  const columns = 30;
  const minColSpan = 3;

  function gridToPixels(
    card: { col: number; row: number; colSpan: number; rowSpan: number },
    innerWidth: number,
  ) {
    const cellWidth = innerWidth / columns;
    const cellHeight = cellWidth;
    return {
      left: pad + card.col * cellWidth + gap / 2,
      top: pad + card.row * cellHeight + gap / 2,
      width: card.colSpan * cellWidth - gap,
      height: card.rowSpan * cellHeight - gap,
    };
  }

  it('col 0 and col 27+span fit inside 854px tablet inner width', () => {
    const innerWidth = 854;
    const leftCorner = gridToPixels({ col: 0, row: 0, colSpan: minColSpan, rowSpan: 3 }, innerWidth);
    const rightCorner = gridToPixels({ col: 27, row: 0, colSpan: minColSpan, rowSpan: 3 }, innerWidth);
    const maxRight = innerWidth + pad;

    expect(leftCorner.left).toBeGreaterThanOrEqual(0);
    expect(leftCorner.left + leftCorner.width).toBeLessThanOrEqual(maxRight);
    expect(rightCorner.left + rightCorner.width).toBeLessThanOrEqual(maxRight);
  });
});
