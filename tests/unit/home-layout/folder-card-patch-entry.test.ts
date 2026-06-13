import { buildFolderCardPatchEntry } from '../../../core/src/modules/home-layout/folder-card-patch-entry';

const sampleGrid = { col: 7, row: 0, colSpan: 15, rowSpan: 3 };

describe('buildFolderCardPatchEntry', () => {
  it('includes cardGrid always', () => {
    const entry = buildFolderCardPatchEntry('node-1', sampleGrid, 'null', false);
    expect(entry).toEqual({ nodeId: 'node-1', cardGrid: sampleGrid });
  });

  it('emits cardGridTablet when editing tablet breakpoint', () => {
    const entry = buildFolderCardPatchEntry('node-1', sampleGrid, 'null', false, 'tablet');
    expect(entry).toEqual({ nodeId: 'node-1', cardGridTablet: sampleGrid });
  });

  it('emits cardGridMobile when editing mobile breakpoint', () => {
    const entry = buildFolderCardPatchEntry('node-1', sampleGrid, 'null', false, 'mobile');
    expect(entry).toEqual({ nodeId: 'node-1', cardGridMobile: sampleGrid });
  });

  it('includes image background when set', () => {
    const bg = { type: 'image' as const, imageUrl: '/card-backgrounds/a.webp', backgroundOpacity: 90 };
    const entry = buildFolderCardPatchEntry('node-1', sampleGrid, JSON.stringify(bg), false);
    expect(entry).toEqual({
      nodeId: 'node-1',
      cardGrid: sampleGrid,
      cardBackground: bg,
    });
  });

  it('sends null when user explicitly cleared background', () => {
    const entry = buildFolderCardPatchEntry('node-1', sampleGrid, 'null', true);
    expect(entry).toEqual({ nodeId: 'node-1', cardGrid: sampleGrid, cardBackground: null });
  });

  it('parses image URL with ampersand in query string', () => {
    const bg = {
      type: 'image' as const,
      imageUrl: '/card-backgrounds/a.webp?token=1&size=2',
      backgroundOpacity: 100,
    };
    const entry = buildFolderCardPatchEntry('node-1', sampleGrid, JSON.stringify(bg), false);
    expect(entry.cardBackground?.imageUrl).toBe('/card-backgrounds/a.webp?token=1&size=2');
  });
});
