import { renderHomepage } from '../core/src/public/homepage-renderer';
import { SiteLayoutData } from '../core/src/site-layout/types';

const baseLayout: SiteLayoutData = {
  siteTitle: 'ModuleHub CMS',
  siteSubtitle: 'تست',
  rootFolderId: 'root',
  folders: [{ id: 'root', title: 'خانه', parentId: null }],
  items: [
    {
      id: 'sample-gallery',
      folderId: 'root',
      kind: 'module',
      title: 'گالری نمونه',
      subtitle: 'توضیح',
      iconClass: 'fas fa-images',
      pageType: 'builtin',
      route: '/pages/sample-gallery/',
      sortOrder: 1,
    },
  ],
};

describe('renderHomepage', () => {
  it('renders hero and tile titles', () => {
    const html = renderHomepage({
      layout: baseLayout,
      modules: [
        {
          id: 'sample-gallery',
          name: 'Gallery',
          type: 'builtin',
          version: '1',
          icon: 'g.png',
          description: 'd',
          status: 'static',
          installPath: '/tmp',
          createdAt: '',
          updatedAt: '',
        },
      ],
      isAuthenticated: false,
      currentFolderId: 'root',
    });
    expect(html).toContain('ModuleHub CMS');
    expect(html).toContain('گالری نمونه');
    expect(html).toContain('/pages/sample-gallery/');
    expect(html).not.toContain('class="admin-actions"');
    expect(html).not.toContain('class="card-add"');
  });

  it('shows admin actions for standalone when authenticated', () => {
    const html = renderHomepage({
      layout: {
        ...baseLayout,
        items: [
          {
            id: 'demo-api',
            folderId: 'root',
            kind: 'module',
            title: 'Demo API',
            subtitle: 'API',
            iconClass: 'fas fa-plug',
            pageType: 'standalone',
            route: '/modules/demo-api/',
            sortOrder: 1,
          },
        ],
      },
      modules: [
        {
          id: 'demo-api',
          name: 'Demo API',
          type: 'standalone',
          version: '1',
          icon: 'a.png',
          description: 'API',
          status: 'stopped',
          installPath: '/tmp/demo-api',
          createdAt: '',
          updatedAt: '',
        },
      ],
      isAuthenticated: true,
      userRole: 'admin',
      currentFolderId: 'root',
    });
    expect(html).toContain('Start');
    expect(html).toContain('status-dot stopped');
  });

  it('shows add card for authenticated admin', () => {
    const html = renderHomepage({
      layout: baseLayout,
      modules: [],
      isAuthenticated: true,
      userRole: 'admin',
      currentFolderId: 'root',
    });
    expect(html).toContain('class="card-add"');
    expect(html).toContain('add-modal');
  });
});
