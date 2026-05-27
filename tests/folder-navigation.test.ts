import {
  buildBreadcrumb,
  getChildFolders,
  getItemsForFolder,
  resolveFolderPath,
} from '../core/src/site-layout/folder-navigation';
import { SiteLayoutData } from '../core/src/site-layout/types';

const sampleLayout: SiteLayoutData = {
  siteTitle: 'Test',
  siteSubtitle: 'Sub',
  rootFolderId: 'root',
  folders: [
    { id: 'root', title: 'خانه', parentId: null },
    { id: 'portfolio', title: 'نمونه‌کارها', parentId: 'root' },
    { id: 'y1404', title: '۱۴۰۴', parentId: 'portfolio' },
  ],
  items: [
    {
      id: 'gallery',
      folderId: 'portfolio',
      kind: 'module',
      title: 'گالری',
      subtitle: 'تصاویر',
      pageType: 'builtin',
      route: '/pages/gallery/',
      sortOrder: 1,
    },
  ],
};

describe('folder navigation', () => {
  it('resolves browse path segments', () => {
    expect(resolveFolderPath(sampleLayout, [])).toBe('root');
    expect(resolveFolderPath(sampleLayout, ['portfolio'])).toBe('portfolio');
    expect(resolveFolderPath(sampleLayout, ['portfolio', 'y1404'])).toBe('y1404');
    expect(resolveFolderPath(sampleLayout, ['invalid'])).toBeNull();
  });

  it('builds breadcrumb chain', () => {
    const crumbs = buildBreadcrumb(sampleLayout, 'y1404');
    expect(crumbs).toHaveLength(3);
    expect(crumbs[0].href).toBe('/');
    expect(crumbs[2].href).toBe('/browse/portfolio/y1404/');
  });

  it('lists child folders and folder items', () => {
    expect(getChildFolders(sampleLayout, 'root').map((f) => f.id)).toEqual(['portfolio']);
    expect(getItemsForFolder(sampleLayout, 'portfolio')).toHaveLength(1);
    expect(getItemsForFolder(sampleLayout, 'root')).toHaveLength(0);
  });
});
