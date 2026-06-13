import { DEVICE_DESIGN_WIDTH, resolveGridInnerWidth } from '../../../core/src/modules/home-layout/grid-config';

describe('resolveGridInnerWidth', () => {
  it('fills tablet canvas when wider than design reference', () => {
    expect(resolveGridInnerWidth(854, 'tablet')).toBe(854);
  });

  it('fills mobile canvas from container width', () => {
    expect(resolveGridInnerWidth(360, 'mobile')).toBe(360);
  });

  it('caps desktop grid at 1200px when container is wider', () => {
    expect(resolveGridInnerWidth(1400, 'desktop')).toBe(DEVICE_DESIGN_WIDTH.desktop);
  });

  it('uses full desktop container when narrower than design cap', () => {
    expect(resolveGridInnerWidth(1100, 'desktop')).toBe(1100);
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
