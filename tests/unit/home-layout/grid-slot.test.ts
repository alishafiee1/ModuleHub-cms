import {
  assignCardGridForNewChild,
  CanvasFullError,
  collectOccupiedCardGrids,
  findEmptyCardSlot,
  resolveEffectiveCanvasRows,
  resolveFolderCanvasGridRows,
} from '../../../core/src/modules/home-layout/grid-slot';
import { GRID_MAX_CANVAS_ROWS, NEW_CHILD_CARD_COL_SPAN, NEW_CHILD_CARD_ROW_SPAN } from '../../../core/src/modules/home-layout/grid-config';
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
  it('places new child as 5×5 in first free slot from the top', () => {
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
    expect(slot).toEqual({
      col: 15,
      row: 0,
      colSpan: NEW_CHILD_CARD_COL_SPAN,
      rowSpan: NEW_CHILD_CARD_ROW_SPAN,
    });
    expect(parent.children?.[0].cardGrid).toEqual({ col: 0, row: 0, colSpan: 15, rowSpan: 3 });
  });

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

    assignCardGridForNewChild(parent, 'root');
    expect(parent.children?.[0].cardGrid).toEqual({ col: 0, row: 0, colSpan: 15, rowSpan: 3 });
  });

  it('counts legacy children without cardGrid in occupied map', () => {
    const parent: LayoutTreeNode = {
      id: 'root',
      name: 'Home',
      type: 'folder',
      parentId: null,
      children: [
        {
          id: 'legacy',
          name: 'Legacy',
          type: 'module',
          parentId: 'root',
          moduleId: 'mod-legacy',
          cardSpan: 2,
        },
      ],
    };

    const occupied = collectOccupiedCardGrids(parent, 'desktop', 'root');
    expect(occupied).toHaveLength(1);
    expect(occupied[0].colSpan).toBe(15);

    const slot = assignCardGridForNewChild(parent, 'root');
    expect(slot.col).toBeGreaterThanOrEqual(15);
    expect(slot.colSpan).toBe(5);
    expect(slot.rowSpan).toBe(5);
  });

  it('expands folder canvas rows when the grid is full', () => {
    const occupied: Array<{ col: number; row: number; colSpan: number; rowSpan: number }> = [];
    for (let row = 0; row < 9; row += 3) {
      for (let col = 0; col < 30; col += 3) {
        occupied.push({ col, row, colSpan: 3, rowSpan: 3 });
      }
    }

    const parent: LayoutTreeNode = {
      id: 'root',
      name: 'Home',
      type: 'folder',
      parentId: null,
      folderCanvas: { gridRows: 9 },
      children: occupied.map((cardGrid, index) => ({
        id: `node-${index}`,
        name: `Card ${index}`,
        type: 'module' as const,
        parentId: 'root',
        moduleId: `mod-${index}`,
        cardGrid,
      })),
    };

    const slot = assignCardGridForNewChild(parent, 'root');
    expect(slot.row).toBeGreaterThanOrEqual(9);
    expect(parent.folderCanvas?.gridRows).toBeGreaterThan(9);
    expect(slot.colSpan).toBe(5);
    expect(slot.rowSpan).toBe(5);
  });

  it('throws CANVAS_FULL when even max canvas rows cannot fit a 5×5 card', () => {
    const occupied: Array<{ col: number; row: number; colSpan: number; rowSpan: number }> = [];
    for (let row = 0; row < GRID_MAX_CANVAS_ROWS; row += 5) {
      for (let col = 0; col < 30; col += 5) {
        occupied.push({ col, row, colSpan: 5, rowSpan: 5 });
      }
    }

    const parent: LayoutTreeNode = {
      id: 'root',
      name: 'Home',
      type: 'folder',
      parentId: null,
      folderCanvas: { gridRows: GRID_MAX_CANVAS_ROWS },
      children: occupied.map((cardGrid, index) => ({
        id: `node-${index}`,
        name: `Card ${index}`,
        type: 'module' as const,
        parentId: 'root',
        moduleId: `mod-${index}`,
        cardGrid,
      })),
    };

    expect(() => assignCardGridForNewChild(parent, 'root')).toThrow(CanvasFullError);
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

describe('resolveEffectiveCanvasRows', () => {
  it('uses stored rows when larger than card footprint', () => {
    const rows = resolveEffectiveCanvasRows({
      folderCanvas: { gridRows: 21, gridRowsTablet: 15 },
      breakpoint: 'tablet',
      children: [{
        id: 'a',
        name: 'A',
        type: 'module',
        parentId: 'root',
        moduleId: 'm1',
        cardGridTablet: { col: 0, row: 0, colSpan: 5, rowSpan: 5 },
      }],
    });
    expect(rows).toBe(15);
  });

  it('expands below stored rows when cards extend further on target breakpoint', () => {
    const rows = resolveEffectiveCanvasRows({
      folderCanvas: { gridRows: 21, gridRowsTablet: 9 },
      breakpoint: 'tablet',
      children: [{
        id: 'a',
        name: 'A',
        type: 'module',
        parentId: 'root',
        moduleId: 'm1',
        cardGridTablet: { col: 0, row: 12, colSpan: 5, rowSpan: 5 },
      }],
    });
    expect(rows).toBe(17);
  });

  it('falls back to desktop stored rows for tablet when tablet rows omitted', () => {
    const rows = resolveEffectiveCanvasRows({
      folderCanvas: { gridRows: 18 },
      breakpoint: 'tablet',
      children: [],
    });
    expect(rows).toBe(18);
  });
});
