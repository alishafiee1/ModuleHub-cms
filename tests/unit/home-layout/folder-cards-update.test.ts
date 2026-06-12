import validFixture from '../../fixtures/site-layout-valid.json';
import { parseSiteLayout } from '../../../core/src/modules/home-layout/layout-parser';
import { applyFolderCardsUpdate } from '../../../core/src/modules/home-layout/folder-cards-update';

describe('applyFolderCardsUpdate — cardBackground', () => {
  const baseLayout = parseSiteLayout(validFixture);

  function getNode(layout: ReturnType<typeof parseSiteLayout>, nodeId: string) {
    return layout.tree.children?.find((c) => c.id === nodeId);
  }

  it('sets a color cardBackground on a node', () => {
    const updated = applyFolderCardsUpdate(baseLayout, 'root', {
      cards: [
        { nodeId: 'folder-a', cardBackground: { type: 'color', color: '#ff0000' } },
        { nodeId: 'node-mod-2' },
      ],
    });
    expect(getNode(updated, 'folder-a')?.cardBackground).toEqual({ type: 'color', color: '#ff0000' });
  });

  it('sets an image cardBackground on a node', () => {
    const updated = applyFolderCardsUpdate(baseLayout, 'root', {
      cards: [
        { nodeId: 'folder-a' },
        { nodeId: 'node-mod-2', cardBackground: { type: 'image', imageUrl: '/card-backgrounds/abc.webp', backgroundOpacity: 90, overlayOpacity: 50 } },
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
        { nodeId: 'folder-a' },
        { nodeId: 'node-mod-2', cardBackground: null },
      ],
    });
    expect(getNode(updated, 'node-mod-2')?.cardBackground).toBeUndefined();
  });

  it('preserves existing cardBackground when not provided in payload', () => {
    const updated = applyFolderCardsUpdate(baseLayout, 'root', {
      cards: [
        { nodeId: 'folder-a' },
        { nodeId: 'node-mod-2' },
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
          { nodeId: 'folder-a' },
          { nodeId: 'node-mod-2', cardBackground: { type: 'rainbow' } as never },
        ],
      }),
    ).toThrow('must be none|color|image');
  });

  it('rejects invalid hex color', () => {
    expect(() =>
      applyFolderCardsUpdate(baseLayout, 'root', {
        cards: [
          { nodeId: 'folder-a' },
          { nodeId: 'node-mod-2', cardBackground: { type: 'color', color: 'notahex' } },
        ],
      }),
    ).toThrow('6-digit hex');
  });

  it('rejects imageUrl not starting with /card-backgrounds/', () => {
    expect(() =>
      applyFolderCardsUpdate(baseLayout, 'root', {
        cards: [
          { nodeId: 'folder-a' },
          { nodeId: 'node-mod-2', cardBackground: { type: 'image', imageUrl: '/thumbnails/hack.jpg' } },
        ],
      }),
    ).toThrow('/card-backgrounds/');
  });

  it('rejects overlayOpacity out of 0-100 range', () => {
    expect(() =>
      applyFolderCardsUpdate(baseLayout, 'root', {
        cards: [
          { nodeId: 'folder-a' },
          { nodeId: 'node-mod-2', cardBackground: { type: 'color', color: '#123456', overlayOpacity: 150 } },
        ],
      }),
    ).toThrow('0–100');
  });

  it('reorders children when cards list order changes', () => {
    const updated = applyFolderCardsUpdate(baseLayout, 'root', {
      cards: [
        { nodeId: 'node-mod-2' },
        { nodeId: 'folder-a' },
      ],
    });
    expect(updated.tree.children?.[0].id).toBe('node-mod-2');
    expect(updated.tree.children?.[1].id).toBe('folder-a');
  });

  it('rejects unknown nodeId', () => {
    expect(() =>
      applyFolderCardsUpdate(baseLayout, 'root', {
        cards: [
          { nodeId: 'folder-a' },
          { nodeId: 'ghost-node' },
        ],
      }),
    ).toThrow('not a child');
  });
});
