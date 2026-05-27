import fs from 'fs';
import os from 'os';
import path from 'path';
import AdmZip from 'adm-zip';
import { ModuleInstaller } from '../core/src/modules/installer';
import { ModuleRegistry } from '../core/src/modules/registry';
import { SiteLayoutRegistry } from '../core/src/site-layout/registry';
import { ManifestValidator } from '../core/src/modules/manifest-validator';
import { isZipEntryNameSafe } from '../core/src/modules/path-safety';
import { AppConfig } from '../core/src/server/config';

describe('ModuleInstaller', () => {
  let tmpDir: string;
  let config: AppConfig;
  let registry: ModuleRegistry;
  let layoutRegistry: SiteLayoutRegistry;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-install-'));
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
      bootstrapBuiltinLayout: false,
    };
    fs.mkdirSync(config.staticModulesDir);
    fs.mkdirSync(config.standaloneModulesDir);
    registry = new ModuleRegistry(config.modulesJsonPath);
    registry.load();
    layoutRegistry = new SiteLayoutRegistry(config.siteLayoutJsonPath);
    layoutRegistry.load();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('rejects static module zip upload', async () => {
    const zip = new AdmZip();
    zip.addFile(
      'manifest.json',
      Buffer.from(
        JSON.stringify({
          name: 'zip-gallery',
          type: 'static',
          version: '1.0.0',
          icon: 'g.png',
          description: 'From zip',
        }),
      ),
    );
    zip.addFile('index.html', Buffer.from('<html><body>hi</body></html>'));

    const installer = new ModuleInstaller(config, registry, new ManifestValidator(), layoutRegistry);
    const result = await installer.installFromZip(zip.toBuffer());
    expect(result.success).toBe(false);
    expect(result.errors.join(' ')).toMatch(/standalone|static|built-in/i);
  });

  it('installs standalone module from zip when index.html present', async () => {
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
    zip.addFile('docker-compose.yml', Buffer.from('services:\n  app:\n    cap_drop:\n      - ALL\n    read_only: true'));

    const installer = new ModuleInstaller(config, registry, new ManifestValidator(), layoutRegistry);
    const result = await installer.installFromZip(zip.toBuffer());
    expect(result.success).toBe(true);
    expect(result.moduleId).toBe('zip-api');
    expect(registry.getById('zip-api')?.status).toBe('settings_pending');
    expect(registry.getById('zip-api')?.permissionsApproved).toBe(true);
    expect(layoutRegistry.getData().items.some((i) => i.id === 'zip-api')).toBe(true);
  });

  it('rejects standalone zip without index.html', async () => {
    const zip = new AdmZip();
    zip.addFile(
      'manifest.json',
      Buffer.from(
        JSON.stringify({
          name: 'no-index',
          type: 'standalone',
          version: '1.0.0',
          icon: 'a.png',
          description: 'API',
          docker: { composeFile: 'docker-compose.yml', ports: [3000] },
          proxy: { prefix: '/modules/no-index/', internalPort: 3000 },
        }),
      ),
    );
    zip.addFile('docker-compose.yml', Buffer.from('cap_drop:\nread_only: true'));

    const installer = new ModuleInstaller(config, registry, new ManifestValidator(), layoutRegistry);
    const result = await installer.installFromZip(zip.toBuffer());
    expect(result.success).toBe(false);
    expect(result.errors.join(' ')).toMatch(/index.html/i);
  });

  it('rejects zip with manifest in subfolder', async () => {
    const zip = new AdmZip();
    zip.addFile(
      'thankio/manifest.json',
      Buffer.from(
        JSON.stringify({
          name: 'thankio',
          type: 'standalone',
          version: '1.0.0',
          icon: 'a.png',
          description: 'Game',
          docker: { composeFile: 'docker-compose.yml', ports: [3000] },
          proxy: { prefix: '/modules/thankio/', internalPort: 3000 },
        }),
      ),
    );
    zip.addFile('thankio/index.html', Buffer.from('<html></html>'));
    zip.addFile('thankio/docker-compose.yml', Buffer.from('cap_drop:\nread_only: true'));

    const installer = new ModuleInstaller(config, registry, new ManifestValidator(), layoutRegistry);
    const result = await installer.installFromZip(zip.toBuffer());
    expect(result.success).toBe(false);
    expect(result.errors.join(' ')).toMatch(/ZIP root|thankio/);
  });
});
