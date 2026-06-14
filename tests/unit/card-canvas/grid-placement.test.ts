import {
  resolvePlacementWithShrink,
  snapMoveTopRight,
} from '../../../core/src/modules/home-layout/grid-placement';

const metrics = {
  cellWidth: 40,
  cellHeight: 40,
  columns: 30,
  rows: 12,
  gridOffsetX: 0,
};

const cardA = {
  id: 'card-a',
  col: 0,
  row: 0,
  colSpan: 6,
  rowSpan: 3,
};

const cardB = {
  id: 'card-b',
  col: 10,
  row: 0,
  colSpan: 6,
  rowSpan: 3,
};

const backCardZone = { col: 0, row: 0, colSpan: 7, rowSpan: 3 };

describe('snapMoveTopRight', () => {
  it('anchors drop position to top-right grid edges', () => {
    const box = {
      left: 12 + 7 * 40 + 5,
      top: 12 + 2 * 40 + 5,
      width: 6 * 40 - 10,
      height: 3 * 40 - 10,
    };

    const snapped = snapMoveTopRight(box, 6, 3, metrics);

    expect(snapped).toEqual({
      col: 7,
      row: 2,
      colSpan: 6,
      rowSpan: 3,
    });
  });
});

describe('resolvePlacementWithShrink', () => {
  it('keeps candidate when there is no overlap', () => {
    const candidate = { col: 15, row: 0, colSpan: 6, rowSpan: 3 };
    const result = resolvePlacementWithShrink({
      candidate,
      movingId: 'card-b',
      cards: [cardA, cardB],
      metrics,
      fallback: cardB,
    });

    expect(result.rejected).toBe(false);
    expect(result.shrunk).toBe(false);
    expect(result.position).toEqual(candidate);
  });

  it('shrinks width first when overlap blocks full size (drag)', () => {
    const candidate = { col: 3, row: 0, colSpan: 6, rowSpan: 3 };
    const result = resolvePlacementWithShrink({
      candidate,
      movingId: 'card-b',
      cards: [cardA, cardB],
      metrics,
      fallback: cardB,
    });

    expect(result.rejected).toBe(false);
    expect(result.shrunk).toBe(true);
    expect(result.position).toEqual({
      col: 6,
      row: 0,
      colSpan: 3,
      rowSpan: 3,
    });
  });

  it('shrinks from resize candidate size, not original card size', () => {
    const candidate = { col: 3, row: 0, colSpan: 9, rowSpan: 4 };
    const result = resolvePlacementWithShrink({
      candidate,
      movingId: 'card-b',
      cards: [cardA, cardB],
      metrics,
      fallback: cardB,
    });

    expect(result.rejected).toBe(false);
    expect(result.shrunk).toBe(true);
    expect(result.position.colSpan).toBeLessThan(9);
    expect(result.position.row).toBe(0);
    expect(result.position.col + result.position.colSpan).toBe(candidate.col + candidate.colSpan);
  });

  it('rejects and reverts when even 3x3 does not fit at anchor', () => {
    const candidate = { col: 0, row: 0, colSpan: 6, rowSpan: 3 };
    const fallback = { col: 10, row: 0, colSpan: 6, rowSpan: 3 };
    const result = resolvePlacementWithShrink({
      candidate,
      movingId: 'card-b',
      cards: [cardA, cardB],
      metrics,
      fallback,
    });

    expect(result.rejected).toBe(true);
    expect(result.position).toEqual(fallback);
  });

  it('treats reserved back-card zone as obstacle', () => {
    const candidate = { col: 4, row: 0, colSpan: 6, rowSpan: 3 };
    const result = resolvePlacementWithShrink({
      candidate,
      movingId: 'card-b',
      cards: [cardB],
      reservedRects: [backCardZone],
      metrics,
      fallback: cardB,
    });

    expect(result.rejected).toBe(false);
    expect(result.shrunk).toBe(true);
    expect(result.position.col).toBeGreaterThanOrEqual(7);
  });

  it('slides anchor left when shrink at drop right edge cannot fit', () => {
    const obstacle = { id: 'block', col: 10, row: 0, colSpan: 6, rowSpan: 3 };
    const candidate = { col: 12, row: 0, colSpan: 6, rowSpan: 3 };
    const result = resolvePlacementWithShrink({
      candidate,
      movingId: 'card-b',
      cards: [obstacle, cardB],
      metrics,
      fallback: cardB,
    });

    expect(result.rejected).toBe(false);
    expect(result.shrunk).toBe(true);
    expect(result.position.col + result.position.colSpan).toBeLessThanOrEqual(18);
    expect(result.position.col + result.position.colSpan).toBeLessThanOrEqual(10);
  });
});
