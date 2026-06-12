import {
  autoLayoutChildrenToGrid,
  legacySpanToColSpan,
  migrateSiteLayoutCardGrid,
} from '../../../core/src/modules/home-layout/migrate-card-grid';
import type { LayoutTreeNode } from '../../../core/src/modules/home-layout/types';
import validFixture from '../../fixtures/site-layout-valid.json';
import { parseSiteLayout } from '../../../core/src/modules/home-layout/layout-parser';

describe('legacySpanToColSpan', () => {
  it('maps 1/2/4 to 7/15/30', () => {
    expect(legacySpanToColSpan(1)).toBe(7);
    expect(legacySpanToColSpan(2)).toBe(15);
    expect(legacySpanToColSpan(4)).toBe(30);
    expect(legacySpanToColSpan(undefined)).toBe(7);
  });
});

describe('autoLayoutChildrenToGrid', () => {
  it('flows children left-to-right and wraps row', () => {
    const children: LayoutTreeNode[] = [
      { id: 'a', name: 'A', type: 'module', parentId: 'root', moduleId: 'm1', cardSpan: 2 },
      { id: 'b', name: 'B', type: 'module', parentId: 'root', moduleId: 'm2', cardSpan: 2 },
    ];
    const laid = autoLayoutChildrenToGrid(children, 0);
    expect(laid[0].cardGrid).toEqual({ col: 0, row: 0, colSpan: 15, rowSpan: 3 });
    expect(laid[1].cardGrid).toEqual({ col: 15, row: 0, colSpan: 15, rowSpan: 3 });
    expect(laid[0].cardSpan).toBeUndefined();
  });

  it('starts nested folders at col 7 for back-card slot', () => {
    const children: LayoutTreeNode[] = [
      { id: 'm1', name: 'M', type: 'module', parentId: 'folder-a', moduleId: 'mod-1' },
    ];
    const laid = autoLayoutChildrenToGrid(children, 7);
    expect(laid[0].cardGrid?.col).toBe(7);
  });
});

describe('migrateSiteLayoutCardGrid', () => {
  it('migrates cardSpan to cardGrid in fixture', () => {
    const baseLayout = parseSiteLayout(validFixture);
    const { layout, migrated } = migrateSiteLayoutCardGrid(baseLayout);
    expect(migrated).toBe(true);
    const mod2 = layout.tree.children?.find((c) => c.id === 'node-mod-2');
    expect(mod2?.cardGrid).toEqual({ col: 7, row: 0, colSpan: 15, rowSpan: 3 });
    expect(mod2?.cardSpan).toBeUndefined();
    const nested = layout.tree.children?.find((c) => c.id === 'folder-a')?.children?.[0];
    expect(nested?.cardGrid?.col).toBe(7);
  });
});
