import validFixture from '../../fixtures/site-layout-valid.json';
import { parseSiteLayout } from '../../../core/src/modules/home-layout/layout-parser';
import { applyFolderCardsUpdate } from '../../../core/src/modules/home-layout/folder-cards-update';
import { migrateSiteLayoutCardGrid } from '../../../core/src/modules/home-layout/migrate-card-grid';

describe('applyFolderCardsUpdate — cardBackground', () => {
  const baseLayout = migrateSiteLayoutCardGrid(parseSiteLayout(validFixture)).layout;

  function getNode(layout: ReturnType<typeof parseSiteLayout>, nodeId: string) {
    return layout.tree.children?.find((c) => c.id === nodeId);
  }

  it('sets a color cardBackground on a node', () => {
    const updated = applyFolderCardsUpdate(baseLayout, 'root', {
      cards: [
        {
          nodeId: 'folder-a',
          cardGrid: { col: 0, row: 0, colSpan: 7, rowSpan: 3 },
          cardBackground: { type: 'color', color: '#ff0000' },
        },
        {
          nodeId: 'node-mod-2',
          cardGrid: { col: 7, row: 0, colSpan: 15, rowSpan: 3 },
        },
      ],
    });
    expect(getNode(updated, 'folder-a')?.cardBackground).toEqual({ type: 'color', color: '#ff0000' });
  });

  it('sets an image cardBackground on a node', () => {
    const updated = applyFolderCardsUpdate(baseLayout, 'root', {
      cards: [
        { nodeId: 'folder-a', cardGrid: { col: 0, row: 0, colSpan: 7, rowSpan: 3 } },
        {
          nodeId: 'node-mod-2',
          cardGrid: { col: 7, row: 0, colSpan: 15, rowSpan: 3 },
          cardBackground: { type: 'image', imageUrl: '/card-backgrounds/abc.webp', backgroundOpacity: 90, overlayOpacity: 50 },
        },
      ],
    });
    expect(getNode(updated, 'node-mod-2')?.cardBackground).toEqual({
      type: 'image',
      imageUrl: '/card-backgrounds/abc.webp',
      backgroundOpacity: 90,
      overlayOpacity: 50,
    });
  });

  it('removes cardBackground when null is passed', () => {
    const updated = applyFolderCardsUpdate(baseLayout, 'root', {
      cards: [
        { nodeId: 'folder-a', cardGrid: { col: 0, row: 0, colSpan: 7, rowSpan: 3 } },
        { nodeId: 'node-mod-2', cardGrid: { col: 7, row: 0, colSpan: 15, rowSpan: 3 }, cardBackground: null },
      ],
    });
    expect(getNode(updated, 'node-mod-2')?.cardBackground).toBeUndefined();
  });

  it('preserves existing cardBackground when not provided in payload', () => {
    const updated = applyFolderCardsUpdate(baseLayout, 'root', {
      cards: [
        { nodeId: 'folder-a', cardGrid: { col: 0, row: 0, colSpan: 7, rowSpan: 3 } },
        { nodeId: 'node-mod-2', cardGrid: { col: 7, row: 0, colSpan: 15, rowSpan: 3 } },
      ],
    });
    expect(getNode(updated, 'node-mod-2')?.cardBackground).toEqual(
      getNode(baseLayout, 'node-mod-2')?.cardBackground,
    );
  });

  it('rejects invalid cardBackground type', () => {
    expect(() =>
      applyFolderCardsUpdate(baseLayout, 'root', {
        cards: [
          { nodeId: 'folder-a', cardGrid: { col: 0, row: 0, colSpan: 7, rowSpan: 3 } },
          { nodeId: 'node-mod-2', cardGrid: { col: 7, row: 0, colSpan: 15, rowSpan: 3 }, cardBackground: { type: 'rainbow' } as never },
        ],
      }),
    ).toThrow('must be none|color|image');
  });

  it('rejects invalid hex color', () => {
    expect(() =>
      applyFolderCardsUpdate(baseLayout, 'root', {
        cards: [
          { nodeId: 'folder-a', cardGrid: { col: 0, row: 0, colSpan: 7, rowSpan: 3 } },
          { nodeId: 'node-mod-2', cardGrid: { col: 7, row: 0, colSpan: 15, rowSpan: 3 }, cardBackground: { type: 'color', color: 'notahex' } },
        ],
      }),
    ).toThrow('6-digit hex');
  });

  it('rejects imageUrl not starting with /card-backgrounds/', () => {
    expect(() =>
      applyFolderCardsUpdate(baseLayout, 'root', {
        cards: [
          { nodeId: 'folder-a', cardGrid: { col: 0, row: 0, colSpan: 7, rowSpan: 3 } },
          { nodeId: 'node-mod-2', cardGrid: { col: 7, row: 0, colSpan: 15, rowSpan: 3 }, cardBackground: { type: 'image', imageUrl: '/thumbnails/hack.jpg' } },
        ],
      }),
    ).toThrow('/card-backgrounds/');
  });

  it('rejects overlayOpacity out of 0-100 range', () => {
    expect(() =>
      applyFolderCardsUpdate(baseLayout, 'root', {
        cards: [
          { nodeId: 'folder-a', cardGrid: { col: 0, row: 0, colSpan: 7, rowSpan: 3 } },
          { nodeId: 'node-mod-2', cardGrid: { col: 7, row: 0, colSpan: 15, rowSpan: 3 }, cardBackground: { type: 'color', color: '#123456', overlayOpacity: 150 } },
        ],
      }),
    ).toThrow('0–100');
  });

  it('reorders children when cards list order changes', () => {
    const updated = applyFolderCardsUpdate(baseLayout, 'root', {
      cards: [
        { nodeId: 'node-mod-2', cardGrid: { col: 0, row: 3, colSpan: 15, rowSpan: 3 } },
        { nodeId: 'folder-a', cardGrid: { col: 0, row: 0, colSpan: 7, rowSpan: 3 } },
      ],
    });
    expect(updated.tree.children?.[0].id).toBe('node-mod-2');
    expect(updated.tree.children?.[1].id).toBe('folder-a');
  });

  it('rejects unknown nodeId', () => {
    expect(() =>
      applyFolderCardsUpdate(baseLayout, 'root', {
        cards: [
          { nodeId: 'folder-a', cardGrid: { col: 0, row: 0, colSpan: 7, rowSpan: 3 } },
          { nodeId: 'ghost-node', cardGrid: { col: 7, row: 0, colSpan: 7, rowSpan: 3 } },
        ],
      }),
    ).toThrow('not a child');
  });

  it('rejects deprecated cardSpan in payload', () => {
    expect(() =>
      applyFolderCardsUpdate(baseLayout, 'root', {
        cards: [
          { nodeId: 'folder-a', cardSpan: 2 } as never,
          { nodeId: 'node-mod-2', cardGrid: { col: 7, row: 0, colSpan: 15, rowSpan: 3 } },
        ],
      }),
    ).toThrow('cardSpan is deprecated');
  });

  it('rejects invalid cardGrid colSpan', () => {
    expect(() =>
      applyFolderCardsUpdate(baseLayout, 'root', {
        cards: [
          { nodeId: 'folder-a', cardGrid: { col: 0, row: 0, colSpan: 2, rowSpan: 3 } },
          { nodeId: 'node-mod-2', cardGrid: { col: 7, row: 0, colSpan: 15, rowSpan: 3 } },
        ],
      }),
    ).toThrow('colSpan must be 3');
  });

  it('stores canvasGridRows on the folder node', () => {
    const updated = applyFolderCardsUpdate(baseLayout, 'root', {
      canvasGridRows: 15,
      cards: [
        { nodeId: 'folder-a', cardGrid: { col: 0, row: 0, colSpan: 7, rowSpan: 3 } },
        { nodeId: 'node-mod-2', cardGrid: { col: 7, row: 0, colSpan: 15, rowSpan: 3 } },
      ],
    });
    expect(updated.tree.folderCanvas).toEqual({ gridRows: 15 });
  });
});

describe('applyFolderCardsUpdate — per-device breakpoints', () => {
  const baseLayout = migrateSiteLayoutCardGrid(parseSiteLayout(validFixture)).layout;

  function getNode(layout: ReturnType<typeof parseSiteLayout>, nodeId: string) {
    return layout.tree.children?.find((c) => c.id === nodeId);
  }

  const rootCards = [
    { nodeId: 'folder-a', cardGrid: { col: 0, row: 0, colSpan: 7, rowSpan: 3 } },
    { nodeId: 'node-mod-2', cardGrid: { col: 7, row: 0, colSpan: 15, rowSpan: 3 } },
  ];

  it('stores tablet and mobile grids on nodes', () => {
    const updated = applyFolderCardsUpdate(baseLayout, 'root', {
      canvasGridRowsTablet: 12,
      canvasGridRowsMobile: 15,
      cards: [
        {
          nodeId: 'folder-a',
          cardGridTablet: { col: 0, row: 0, colSpan: 7, rowSpan: 3 },
          cardGridMobile: { col: 0, row: 0, colSpan: 15, rowSpan: 3 },
        },
        {
          nodeId: 'node-mod-2',
          cardGridTablet: { col: 7, row: 0, colSpan: 15, rowSpan: 3 },
          cardGridMobile: { col: 0, row: 3, colSpan: 15, rowSpan: 3 },
        },
      ],
    });
    expect(getNode(updated, 'folder-a')?.cardGridTablet).toEqual({ col: 0, row: 0, colSpan: 7, rowSpan: 3 });
    expect(getNode(updated, 'folder-a')?.cardGridMobile).toEqual({ col: 0, row: 0, colSpan: 15, rowSpan: 3 });
    expect(updated.tree.folderCanvas).toEqual({
      gridRows: 9,
      gridRowsTablet: 12,
      gridRowsMobile: 15,
    });
  });

  it('tablet-only PATCH preserves desktop cardGrid', () => {
    const updated = applyFolderCardsUpdate(baseLayout, 'root', {
      cards: [
        { nodeId: 'folder-a', cardGridTablet: { col: 0, row: 3, colSpan: 7, rowSpan: 3 } },
        { nodeId: 'node-mod-2', cardGridTablet: { col: 7, row: 0, colSpan: 15, rowSpan: 3 } },
      ],
    });
    expect(getNode(updated, 'folder-a')?.cardGrid).toEqual(getNode(baseLayout, 'folder-a')?.cardGrid);
    expect(getNode(updated, 'folder-a')?.cardGridTablet).toEqual({ col: 0, row: 3, colSpan: 7, rowSpan: 3 });
  });

  it('desktop PATCH preserves tablet and mobile grids on folderCanvas', () => {
    const withTablet = applyFolderCardsUpdate(baseLayout, 'root', {
      canvasGridRowsTablet: 12,
      canvasGridRowsMobile: 15,
      cards: [
        { nodeId: 'folder-a', cardGridTablet: { col: 0, row: 0, colSpan: 7, rowSpan: 3 } },
        { nodeId: 'node-mod-2', cardGridTablet: { col: 7, row: 0, colSpan: 15, rowSpan: 3 } },
      ],
    });
    const updated = applyFolderCardsUpdate(withTablet, 'root', {
      canvasGridRows: 18,
      cards: rootCards,
    });
    expect(updated.tree.folderCanvas).toEqual({
      gridRows: 18,
      gridRowsTablet: 12,
      gridRowsMobile: 15,
    });
  });

  it('rejects invalid cardGridTablet colSpan', () => {
    expect(() =>
      applyFolderCardsUpdate(baseLayout, 'root', {
        cards: [
          { nodeId: 'folder-a', cardGridTablet: { col: 0, row: 0, colSpan: 2, rowSpan: 3 } },
          { nodeId: 'node-mod-2', cardGrid: { col: 7, row: 0, colSpan: 15, rowSpan: 3 } },
        ],
      }),
    ).toThrow('colSpan must be 3');
  });
});
