import type { SiteLayoutDocument } from '../../../core/src/modules/home-layout/types';
import {
  deleteVirtualFolder,
  isDescendantOf,
  patchVirtualFolder,
} from '../../../core/src/modules/home-layout/folder-management';
import { findNodeById } from '../../../core/src/modules/home-layout/layout-tree';

function makeLayoutWithFolder(): SiteLayoutDocument {
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
          cardDescription: 'توضیح الف',
          children: [
            {
              id: 'folder-b',
              name: 'زیرپوشه',
              type: 'folder',
              parentId: 'folder-a',
              children: [],
              cardGrid: { col: 0, row: 0, colSpan: 3, rowSpan: 3 },
            },
          ],
          cardGrid: { col: 0, row: 0, colSpan: 3, rowSpan: 3 },
        },
        {
          id: 'folder-c',
          name: 'پوشه ج',
          type: 'folder',
          parentId: 'root',
          children: [],
          cardGrid: { col: 3, row: 0, colSpan: 3, rowSpan: 3 },
        },
      ],
    },
    modules: {},
  };
}

describe('folder-management', () => {
  it('patches folder name and cardDescription', () => {
    const layout = makeLayoutWithFolder();
    const node = patchVirtualFolder(layout, 'folder-a', {
      name: 'آرشیو',
      cardDescription: 'پروژه‌های تمام‌شده',
    });
    expect(node.name).toBe('آرشیو');
    expect(node.cardDescription).toBe('پروژه‌های تمام‌شده');
  });

  it('rejects move into descendant', () => {
    const layout = makeLayoutWithFolder();
    expect(() => patchVirtualFolder(layout, 'folder-a', { parentId: 'folder-b' })).toThrow(
      /descendant/i,
    );
  });

  it('moves folder to another parent', () => {
    const layout = makeLayoutWithFolder();
    patchVirtualFolder(layout, 'folder-b', { parentId: 'folder-c' });
    const moved = findNodeById(layout.tree, 'folder-b');
    expect(moved?.parentId).toBe('folder-c');
    expect(findNodeById(layout.tree, 'folder-c')?.children?.some((c) => c.id === 'folder-b')).toBe(true);
  });

  it('delete rejects non-empty folder without policy', async () => {
    const layout = makeLayoutWithFolder();
    await expect(
      deleteVirtualFolder(layout, 'folder-a', { contentPolicy: 'reject-if-not-empty' }),
    ).rejects.toThrow('FOLDER_NOT_EMPTY');
  });

  it('delete moves children to parent', async () => {
    const layout = makeLayoutWithFolder();
    const result = await deleteVirtualFolder(layout, 'folder-a', { contentPolicy: 'move-to-parent' });
    expect(result.deletedId).toBe('folder-a');
    expect(result.movedChildren).toBe(1);
    expect(findNodeById(layout.tree, 'folder-a')).toBeNull();
    expect(findNodeById(layout.tree, 'root')?.children?.some((c) => c.id === 'folder-b')).toBe(true);
  });

  it('isDescendantOf detects nested folders', () => {
    const layout = makeLayoutWithFolder();
    expect(isDescendantOf(layout.tree, 'folder-a', 'folder-b')).toBe(true);
    expect(isDescendantOf(layout.tree, 'folder-c', 'folder-b')).toBe(false);
  });
});
