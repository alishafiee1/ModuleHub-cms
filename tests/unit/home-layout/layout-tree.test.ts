import validFixture from '../../fixtures/site-layout-valid.json';
import { parseSiteLayout } from '../../../core/src/modules/home-layout/layout-parser';
import { buildBreadcrumbPath, findNodeById, getFolderChildren, resolveFolderChildren } from '../../../core/src/modules/home-layout/layout-tree';

describe('layout-tree', () => {
  const layout = parseSiteLayout(validFixture);

  it('traverses virtual folder tree and finds children', () => {
    const folder = findNodeById(layout.tree, 'folder-a');
    expect(folder?.type).toBe('folder');
    expect(getFolderChildren(folder!)).toHaveLength(1);
    expect(findNodeById(layout.tree, 'missing')).toBeNull();
  });

  it('distinguishes module nodes from folder nodes', () => {
    const rootChildren = getFolderChildren(layout.tree);
    expect(rootChildren.some((node) => node.type === 'folder')).toBe(true);
    expect(rootChildren.some((node) => node.type === 'module')).toBe(true);
  });

  it('builds breadcrumb path for nested folder navigation', () => {
    const pathToFolder = buildBreadcrumbPath(layout.tree, 'folder-a');
    expect(pathToFolder.map((segment) => segment.name)).toEqual(['خانه', 'پوشه A']);
  });

  it('merges module metadata when resolving folder children', () => {
    const folder = findNodeById(layout.tree, 'folder-a');
    const children = resolveFolderChildren(folder!, layout.modules);
    expect(children[0].type).toBe('module');
    expect(children[0].module?.status).toBe('running');
  });
});
