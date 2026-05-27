import fs from 'fs';
import os from 'os';
import path from 'path';
import { ModuleSettingsService } from '../core/src/modules/module-settings-service';
import { ManifestValidator } from '../core/src/modules/manifest-validator';
import { ModuleRegistry } from '../core/src/modules/registry';
import { SiteLayoutRegistry } from '../core/src/site-layout/registry';
import { DockerManager } from '../core/src/docker/manager';
import { ReverseProxyManager } from '../core/src/proxy/reverse-proxy-manager';

describe('ModuleSettingsService', () => {
  let tmpDir: string;
  let registry: ModuleRegistry;
  let layoutRegistry: SiteLayoutRegistry;
  let service: ModuleSettingsService;
  let dockerManager: jest.Mocked<Pick<DockerManager, 'startModule'>>;
  let proxyManager: ReverseProxyManager;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-settings-'));
    registry = new ModuleRegistry(path.join(tmpDir, 'modules.json'));
    registry.load();
    layoutRegistry = new SiteLayoutRegistry(path.join(tmpDir, 'site-layout.json'));
    layoutRegistry.load();
    layoutRegistry.setData({
      siteTitle: 'Test',
      siteSubtitle: 'Sub',
      rootFolderId: 'root',
      folders: [{ id: 'root', title: 'Home', parentId: null }],
      items: [
        {
          id: 'zip-api',
          folderId: 'root',
          kind: 'module',
          title: 'Zip API',
          subtitle: 'API',
          iconClass: 'fas fa-plug',
          pageType: 'standalone',
          route: '/modules/zip-api/',
          sortOrder: 1,
        },
      ],
    });

    const moduleDir = path.join(tmpDir, 'standalone-modules', 'zip-api');
    fs.mkdirSync(moduleDir, { recursive: true });
    fs.writeFileSync(
      path.join(moduleDir, 'manifest.json'),
      JSON.stringify({
        name: 'Zip API',
        type: 'standalone',
        version: '1.0.0',
        icon: 'a.png',
        description: 'API',
        docker: { composeFile: 'docker-compose.yml', ports: [3000] },
        proxy: { prefix: '/modules/zip-api/', internalPort: 3000, paths: ['api'] },
      }),
    );
    fs.writeFileSync(path.join(moduleDir, 'index.html'), '<html></html>');
    fs.writeFileSync(
      path.join(moduleDir, 'docker-compose.yml'),
      'services:\n  app:\n    cap_drop:\n      - ALL\n    read_only: true',
    );

    registry.upsert({
      id: 'zip-api',
      name: 'Zip API',
      type: 'standalone',
      version: '1.0.0',
      icon: 'a.png',
      description: 'API',
      status: 'settings_pending',
      installPath: moduleDir,
      proxyPrefix: '/modules/zip-api/',
      proxyPaths: ['api'],
      internalPort: 3000,
      permissionsApproved: true,
      createdAt: '',
      updatedAt: '',
    });

    dockerManager = {
      startModule: jest.fn().mockResolvedValue({
        success: true,
        hostPort: 32775,
        containerId: 'container-1',
      }),
    };
    proxyManager = new ReverseProxyManager(registry);
    service = new ModuleSettingsService(
      registry,
      layoutRegistry,
      new ManifestValidator(),
      dockerManager as unknown as DockerManager,
      proxyManager,
    );
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('GET settings auto-fills from manifest and layout', () => {
    const settings = service.getSettings('zip-api');
    expect(settings).not.toBeNull();
    expect(settings?.ports).toEqual([3000]);
    expect(settings?.proxyPrefix).toBe('/modules/zip-api/');
    expect(settings?.layoutIconClass).toBe('fas fa-plug');
    expect(settings?.hasModulePassword).toBe(false);
    expect(settings?.status).toBe('settings_pending');
  });

  it('PUT rejects invalid ports', async () => {
    const result = await service.saveSettings('zip-api', {
      ports: [],
      internalPort: 3000,
      proxyPrefix: '/modules/zip-api/',
    });
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('PUT success transitions module to running', async () => {
    const result = await service.saveSettings('zip-api', {
      ports: [3000],
      internalPort: 3000,
      proxyPrefix: '/modules/zip-api/',
      proxyPaths: ['api'],
      layoutIconClass: 'fas fa-server',
    });
    expect(result.success).toBe(true);
    expect(result.module?.status).toBe('running');
    expect(registry.getById('zip-api')?.status).toBe('running');
    expect(dockerManager.startModule).toHaveBeenCalled();
    const layoutItem = layoutRegistry.getData().items.find((item) => item.id === 'zip-api');
    expect(layoutItem?.kind).toBe('module');
    if (layoutItem?.kind === 'module') {
      expect(layoutItem.iconClass).toBe('fas fa-server');
    }
  });
});
