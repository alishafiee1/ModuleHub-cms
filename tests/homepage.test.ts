import { renderHomepage } from '../core/src/public/homepage-renderer';

describe('renderHomepage', () => {
  it('renders hero and tile titles', () => {
    const html = renderHomepage({
      layout: {
        siteTitle: 'ModuleHub CMS',
        siteSubtitle: 'تست',
        items: [
          {
            id: 'sample-gallery',
            title: 'گالری نمونه',
            subtitle: 'توضیح',
            iconClass: 'fas fa-images',
            pageType: 'builtin',
            route: '/pages/sample-gallery/',
            sortOrder: 1,
          },
        ],
      },
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
    });
    expect(html).toContain('ModuleHub CMS');
    expect(html).toContain('گالری نمونه');
    expect(html).toContain('/pages/sample-gallery/');
    expect(html).not.toContain('class="admin-actions"');
  });

  it('shows admin actions for standalone when authenticated', () => {
    const html = renderHomepage({
      layout: {
        siteTitle: 'ModuleHub CMS',
        siteSubtitle: 'تست',
        items: [
          {
            id: 'demo-api',
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
    });
    expect(html).toContain('Start');
    expect(html).toContain('status-dot stopped');
  });
});
