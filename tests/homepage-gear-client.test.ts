import vm from 'vm';
import { renderHomepage } from '../core/src/public/homepage-renderer';
import { SiteLayoutData } from '../core/src/site-layout/types';

const standaloneLayout: SiteLayoutData = {
  siteTitle: 'ModuleHub CMS',
  siteSubtitle: 'تست',
  rootFolderId: 'root',
  folders: [{ id: 'root', title: 'خانه', parentId: null }],
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
};

const standaloneModule = {
  id: 'demo-api',
  name: 'Demo API',
  type: 'standalone' as const,
  version: '1',
  icon: 'a.png',
  description: 'API',
  status: 'stopped' as const,
  installPath: '/tmp/demo-api',
  createdAt: '',
  updatedAt: '',
};

function extractInlineScript(html: string): string {
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!match) throw new Error('script block not found');
  return match[1];
}

function createGearSandbox(fetchMock: jest.Mock): vm.Context {
  const elementStub = () => ({
    classList: { add: jest.fn(), remove: jest.fn() },
    textContent: '',
    value: '',
  });
  return {
    fetch: fetchMock,
    document: { getElementById: jest.fn(() => elementStub()) },
    location: { reload: jest.fn() },
    alert: jest.fn(),
    confirm: jest.fn(() => true),
    setInterval: jest.fn(() => 1),
    clearInterval: jest.fn(),
    JSON,
    console,
  };
}

describe('homepage gear dialog', () => {
  it('renders gear on standalone cards for admin only', () => {
    const adminHtml = renderHomepage({
      layout: standaloneLayout,
      modules: [standaloneModule],
      isAuthenticated: true,
      userRole: 'admin',
      currentFolderId: 'root',
    });
    expect(adminHtml).toContain('class="card-gear"');
    expect(adminHtml).toContain('id="gear-modal"');
    expect(adminHtml).toContain('openGearModal');
    expect(adminHtml).not.toContain('class="admin-actions"');

    const anonHtml = renderHomepage({
      layout: standaloneLayout,
      modules: [standaloneModule],
      isAuthenticated: false,
      currentFolderId: 'root',
    });
    expect(anonHtml).not.toContain('class="card-gear"');
    expect(anonHtml).not.toContain('id="gear-modal"');
  });

  it('gear modal script includes P3 disabled stubs', () => {
    const html = renderHomepage({
      layout: standaloneLayout,
      modules: [standaloneModule],
      isAuthenticated: true,
      userRole: 'admin',
      currentFolderId: 'root',
    });
    expect(html).toContain('Coming in P3');
    expect(html).toContain('Git Pull');
    expect(html).toContain('Partial ZIP');
  });

  it('gearStartModule calls fetch with start API URL', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    const html = renderHomepage({
      layout: standaloneLayout,
      modules: [standaloneModule],
      isAuthenticated: true,
      userRole: 'admin',
      currentFolderId: 'root',
    });
    const sandbox = createGearSandbox(fetchMock);
    vm.createContext(sandbox);
    vm.runInContext(extractInlineScript(html), sandbox);
    vm.runInContext("gearModuleId = 'demo-api';", sandbox);
    await sandbox.gearStartModule();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/modules/demo-api/start',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('gearDeleteModule calls DELETE API URL', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    const html = renderHomepage({
      layout: standaloneLayout,
      modules: [standaloneModule],
      isAuthenticated: true,
      userRole: 'admin',
      currentFolderId: 'root',
    });
    const sandbox = createGearSandbox(fetchMock);
    vm.createContext(sandbox);
    vm.runInContext(extractInlineScript(html), sandbox);
    vm.runInContext("gearModuleId = 'demo-api';", sandbox);
    await sandbox.gearDeleteModule();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/modules/demo-api',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
