import type { SiteLayoutDocument } from '../../../core/src/modules/home-layout/types';
import { moveLayoutNode } from '../../../core/src/modules/home-layout/layout-node-move';
import { findNodeById } from '../../../core/src/modules/home-layout/layout-tree';

function makeLayoutWithModule(): SiteLayoutDocument {
  return {
    version: '1.0',
    tree: {
      id: 'root',
      name: 'خانه',
      type: 'folder',
      parentId: null,
      children: [
        {
          id: 'folder-a',
          name: 'پوشه الف',
          type: 'folder',
          parentId: 'root',
          children: [
            {
              id: 'node-mod-1',
              name: 'ماژول',
              type: 'module',
              moduleId: 'mod-1',
              parentId: 'folder-a',
              cardGrid: { col: 7, row: 0, colSpan: 3, rowSpan: 3 },
            },
          ],
          cardGrid: { col: 0, row: 0, colSpan: 3, rowSpan: 3 },
        },
        {
          id: 'folder-b',
          name: 'پوشه ب',
          type: 'folder',
          parentId: 'root',
          children: [],
          cardGrid: { col: 3, row: 0, colSpan: 3, rowSpan: 3 },
        },
      ],
    },
    modules: {
      'mod-1': {
        name: 'تست',
        status: 'stopped',
        version: '1.0.0',
        docker: false,
        port: 4100,
        permissions: 'network',
        resources: { cpu_limit: 0.5, ram_limit_mb: 512, swap_limit_mb: 128 },
        icon: 'fas fa-cube',
        thumbnail: '',
      },
    },
  };
}

describe('layout-node-move', () => {
  it('moves module node to another folder', () => {
    const layout = makeLayoutWithModule();
    moveLayoutNode(layout, 'node-mod-1', { parentId: 'folder-b' });
    const moved = findNodeById(layout.tree, 'node-mod-1');
    expect(moved?.parentId).toBe('folder-b');
    expect(findNodeById(layout.tree, 'folder-b')?.children?.some((c) => c.id === 'node-mod-1')).toBe(true);
    expect(findNodeById(layout.tree, 'folder-a')?.children).toHaveLength(0);
    expect(moved?.cardGrid).toBeDefined();
  });

  it('no-ops when module already in target parent', () => {
    const layout = makeLayoutWithModule();
    const before = findNodeById(layout.tree, 'node-mod-1')?.cardGrid;
    moveLayoutNode(layout, 'node-mod-1', { parentId: 'folder-a' });
    expect(findNodeById(layout.tree, 'node-mod-1')?.cardGrid).toEqual(before);
  });

  it('moves folder via shared moveLayoutNode', () => {
    const layout = makeLayoutWithModule();
    moveLayoutNode(layout, 'folder-a', { parentId: 'folder-b' });
    expect(findNodeById(layout.tree, 'folder-a')?.parentId).toBe('folder-b');
  });

  it('rejects moving root', () => {
    const layout = makeLayoutWithModule();
    expect(() => moveLayoutNode(layout, 'root', { parentId: 'folder-a' })).toThrow(/root/i);
  });

  it('rejects folder move into descendant', () => {
    const layout = makeLayoutWithModule();
    const folderA = findNodeById(layout.tree, 'folder-a');
    folderA?.children?.push({
      id: 'folder-c',
      name: 'زیر',
      type: 'folder',
      parentId: 'folder-a',
      children: [],
      cardGrid: { col: 10, row: 0, colSpan: 3, rowSpan: 3 },
    });
    expect(() => moveLayoutNode(layout, 'folder-a', { parentId: 'folder-c' })).toThrow(/descendant/i);
  });
});
