import fs from 'fs';
import os from 'os';
import path from 'path';
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
    classList: { add: jest.fn(), remove: jest.fn(), toggle: jest.fn() },
    textContent: '',
    value: '',
    checked: false,
  });
  return {
    fetch: fetchMock,
    IS_GLOBAL_ADMIN: true,
    sessionStorage: {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
    },
    document: {
      getElementById: jest.fn(() => elementStub()),
      querySelectorAll: jest.fn(() => []),
    },
    location: { reload: jest.fn() },
    alert: jest.fn(),
    confirm: jest.fn(() => true),
    prompt: jest.fn(() => 'pass'),
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
    expect(adminHtml).toContain('gear-settings-module-password');

    const anonHtml = renderHomepage({
      layout: standaloneLayout,
      modules: [standaloneModule],
      isAuthenticated: false,
      currentFolderId: 'root',
    });
    expect(anonHtml).not.toContain('class="card-gear"');
    expect(anonHtml).not.toContain('id="gear-modal"');
  });

  it('shows gear for anonymous users when module password is configured', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-gear-pwd-'));
    const moduleDir = path.join(tmpDir, 'demo-api');
    fs.mkdirSync(moduleDir, { recursive: true });
    fs.writeFileSync(
      path.join(moduleDir, 'manifest.json'),
      JSON.stringify({ modulePasswordHash: '$2b$10$abcdefghijklmnopqrstuv' }),
    );
    const html = renderHomepage({
      layout: standaloneLayout,
      modules: [{ ...standaloneModule, installPath: moduleDir }],
      isAuthenticated: false,
      currentFolderId: 'root',
    });
    expect(html).toContain('class="card-gear"');
    expect(html).toContain('id="gear-modal"');
    expect(html).toContain('openGearModal');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('gear modal script includes git pull and partial upload', () => {
    const html = renderHomepage({
      layout: standaloneLayout,
      modules: [standaloneModule],
      isAuthenticated: true,
      userRole: 'admin',
      currentFolderId: 'root',
    });
    expect(html).toContain('gearGitPull');
    expect(html).toContain('gearPartialUpload');
    expect(html).toContain('/git-pull');
    expect(html).toContain('/partial-upload');
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
