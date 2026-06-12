import { buildFolderCardPatchEntry } from '../../../core/src/modules/home-layout/folder-card-patch-entry';

describe('buildFolderCardPatchEntry', () => {
  it('omits cardBackground when attribute is null (preserve server value)', () => {
    const entry = buildFolderCardPatchEntry('node-1', 1, 'null', false);
    expect(entry).toEqual({ nodeId: 'node-1' });
  });

  it('includes image background when set', () => {
    const bg = { type: 'image' as const, imageUrl: '/card-backgrounds/a.webp', backgroundOpacity: 90 };
    const entry = buildFolderCardPatchEntry('node-1', 2, JSON.stringify(bg), false);
    expect(entry).toEqual({
      nodeId: 'node-1',
      cardSpan: 2,
      cardBackground: bg,
    });
  });

  it('sends null when user explicitly cleared background', () => {
    const entry = buildFolderCardPatchEntry('node-1', 1, 'null', true);
    expect(entry).toEqual({ nodeId: 'node-1', cardBackground: null });
  });
});
