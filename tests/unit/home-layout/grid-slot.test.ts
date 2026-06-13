import {
  assignCardGridForNewChild,
  findEmptyCardSlot,
  resolveFolderCanvasGridRows,
} from '../../../core/src/modules/home-layout/grid-slot';
import type { LayoutTreeNode } from '../../../core/src/modules/home-layout/types';

describe('findEmptyCardSlot', () => {
  it('skips occupied cells and finds next free slot', () => {
    const occupied = [{ col: 0, row: 0, colSpan: 7, rowSpan: 3 }];
    const slot = findEmptyCardSlot(occupied, 9, 0, 7, 3);
    expect(slot).toEqual({ col: 7, row: 0, colSpan: 7, rowSpan: 3 });
  });

  it('starts search after back-card column in subfolders', () => {
    const backCard = { col: 0, row: 0, colSpan: 7, rowSpan: 3 };
    const slot = findEmptyCardSlot([backCard], 9, 7, 3, 3);
    expect(slot).toEqual({ col: 7, row: 0, colSpan: 3, rowSpan: 3 });
  });
});

describe('assignCardGridForNewChild', () => {
  it('does not change existing child positions when adding a slot', () => {
    const parent: LayoutTreeNode = {
      id: 'root',
      name: 'Home',
      type: 'folder',
      parentId: null,
      children: [
        {
          id: 'existing',
          name: 'Existing',
          type: 'module',
          parentId: 'root',
          moduleId: 'mod-1',
          cardGrid: { col: 0, row: 0, colSpan: 15, rowSpan: 3 },
        },
      ],
    };

    const slot = assignCardGridForNewChild(parent, 'root');
    expect(slot).toEqual({ col: 15, row: 0, colSpan: 3, rowSpan: 3 });
    expect(parent.children?.[0].cardGrid).toEqual({ col: 0, row: 0, colSpan: 15, rowSpan: 3 });
  });
});

describe('resolveFolderCanvasGridRows', () => {
  it('returns stored gridRows or default 9', () => {
    expect(resolveFolderCanvasGridRows({ folderCanvas: { gridRows: 15 } } as LayoutTreeNode)).toBe(15);
    expect(resolveFolderCanvasGridRows(null)).toBe(9);
  });

  it('falls back through tablet to desktop for mobile', () => {
    const folder = { folderCanvas: { gridRows: 9, gridRowsTablet: 12, gridRowsMobile: 18 } } as LayoutTreeNode;
    expect(resolveFolderCanvasGridRows(folder, 'mobile')).toBe(18);
    expect(resolveFolderCanvasGridRows(folder, 'tablet')).toBe(12);
    expect(resolveFolderCanvasGridRows(folder, 'desktop')).toBe(9);
  });

  it('mobile falls back to tablet then desktop when mobile rows omitted', () => {
    const folder = { folderCanvas: { gridRows: 9, gridRowsTablet: 12 } } as LayoutTreeNode;
    expect(resolveFolderCanvasGridRows(folder, 'mobile')).toBe(12);
  });
});
