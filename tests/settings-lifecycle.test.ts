import fs from 'fs';
import os from 'os';
import path from 'path';
import AdmZip from 'adm-zip';
import { ModuleInstaller } from '../core/src/modules/installer';
import { ModuleRegistry } from '../core/src/modules/registry';
import { SiteLayoutRegistry } from '../core/src/site-layout/registry';
import { ManifestValidator } from '../core/src/modules/manifest-validator';
import { DockerManager } from '../core/src/docker/manager';
import { AppConfig } from '../core/src/server/config';

describe('standalone settings lifecycle', () => {
  let tmpDir: string;
  let config: AppConfig;
  let registry: ModuleRegistry;
  let layoutRegistry: SiteLayoutRegistry;
  let dockerManager: jest.Mocked<Pick<DockerManager, 'startModule'>>;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-lifecycle-'));
    config = {
      port: 4000,
      adminPassword: 'test',
      adminRole: 'admin',
      sessionSecret: 'secret',
      modulesJsonPath: path.join(tmpDir, 'modules.json'),
      siteLayoutJsonPath: path.join(tmpDir, 'site-layout.json'),
      builtinModulesDir: path.join(tmpDir, 'core/builtin-modules'),
      catalogModulesDir: path.join(tmpDir, 'core/catalog-modules'),
      staticModulesDir: path.join(tmpDir, 'static-modules'),
      standaloneModulesDir: path.join(tmpDir, 'standalone-modules'),
      dockerSocket: 'unix:///var/run/docker.sock',
      projectRoot: tmpDir,
    } as AppConfig;
    fs.mkdirSync(config.standaloneModulesDir, { recursive: true });
    registry = new ModuleRegistry(config.modulesJsonPath);
    registry.load();
    layoutRegistry = new SiteLayoutRegistry(config.siteLayoutJsonPath);
    layoutRegistry.load();
    dockerManager = {
      startModule: jest.fn().mockResolvedValue({
        success: true,
        hostPort: 32775,
        containerId: 'abc',
      }),
    };
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function buildStandaloneZip(): Buffer {
    const zip = new AdmZip();
    zip.addFile(
      'manifest.json',
      Buffer.from(
        JSON.stringify({
          name: 'zip-api',
          type: 'standalone',
          version: '1.0.0',
          icon: 'a.png',
          description: 'API zip',
          docker: { composeFile: 'docker-compose.yml', ports: [3000] },
          proxy: { prefix: '/modules/zip-api/', internalPort: 3000 },
        }),
      ),
    );
    zip.addFile('index.html', Buffer.from('<html><body>landing</body></html>'));
    zip.addFile(
      'docker-compose.yml',
      Buffer.from('services:\n  app:\n    cap_drop:\n      - ALL\n    read_only: true'),
    );
    return zip.toBuffer();
  }

  it('post-install status is settings_pending with docker start', async () => {
    const installer = new ModuleInstaller(
      config,
      registry,
      new ManifestValidator(),
      layoutRegistry,
      dockerManager as unknown as DockerManager,
    );
    const result = await installer.installFromZip(buildStandaloneZip());
    expect(result.success).toBe(true);
    expect(result.needsSettings).toBe(true);

    const mod = registry.getById('zip-api');
    expect(mod?.status).toBe('settings_pending');
    expect(mod?.permissionsApproved).toBe(true);
    expect(mod?.hostPort).toBe(32775);
    expect(dockerManager.startModule).toHaveBeenCalled();

    const registryRaw = JSON.parse(fs.readFileSync(config.modulesJsonPath, 'utf-8')) as {
      modules: Array<{ status: string }>;
    };
    expect(registryRaw.modules[0].status).toBe('settings_pending');
  });
});
