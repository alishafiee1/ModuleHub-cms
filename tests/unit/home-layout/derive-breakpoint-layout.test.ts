import validFixture from '../../fixtures/site-layout-valid.json';
import { parseSiteLayout } from '../../../core/src/modules/home-layout/layout-parser';
import {
  deriveCardGridForBreakpoint,
  ensureDeviceBreakpointLayouts,
} from '../../../core/src/modules/home-layout/derive-breakpoint-layout';
import { migrateSiteLayoutCardGrid } from '../../../core/src/modules/home-layout/migrate-card-grid';
import { rectsOverlap } from '../../../core/src/modules/home-layout/grid-slot';

describe('deriveCardGridForBreakpoint', () => {
  it('scales desktop grid toward mobile without overlap when alone', () => {
    const source = { col: 0, row: 0, colSpan: 15, rowSpan: 3 };
    const derived = deriveCardGridForBreakpoint(source, 'desktop', 'mobile', [], 9, 0);
    expect(derived.colSpan).toBeGreaterThanOrEqual(3);
    expect(derived.colSpan).toBeLessThanOrEqual(15);
    expect(derived.row).toBe(0);
    expect(derived.rowSpan).toBe(3);
  });
});

describe('ensureDeviceBreakpointLayouts', () => {
  const baseLayout = migrateSiteLayoutCardGrid(parseSiteLayout(validFixture)).layout;

  it('derives tablet and mobile grids for root children without overlap', () => {
    const { layout, changed } = ensureDeviceBreakpointLayouts(baseLayout);
    expect(changed).toBe(true);

    const grids = (layout.tree.children ?? []).map((c) => c.cardGridMobile).filter(Boolean);
    expect(grids.length).toBe(2);

    if (grids.length === 2) {
      expect(rectsOverlap(grids[0]!, grids[1]!)).toBe(false);
    }

    for (const child of layout.tree.children ?? []) {
      expect(child.cardGridTablet).toBeDefined();
      expect(child.cardGridMobile).toBeDefined();
    }
  });

  it('is idempotent on second run', () => {
    const first = ensureDeviceBreakpointLayouts(baseLayout);
    expect(first.changed).toBe(true);
    const second = ensureDeviceBreakpointLayouts(first.layout);
    expect(second.changed).toBe(false);
  });
});
