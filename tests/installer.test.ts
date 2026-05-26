import fs from 'fs';
import os from 'os';
import path from 'path';
import AdmZip from 'adm-zip';
import { ModuleInstaller } from '../core/src/modules/installer';
import { ModuleRegistry } from '../core/src/modules/registry';
import { ManifestValidator } from '../core/src/modules/manifest-validator';
import { isZipEntryNameSafe } from '../core/src/modules/path-safety';
import { AppConfig } from '../core/src/server/config';

describe('ModuleInstaller', () => {
  let tmpDir: string;
  let config: AppConfig;
  let registry: ModuleRegistry;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-install-'));
    config = {
      port: 4000,
      adminPassword: 'test',
      adminRole: 'admin',
      sessionSecret: 'secret',
      modulesJsonPath: path.join(tmpDir, 'modules.json'),
      staticModulesDir: path.join(tmpDir, 'static-modules'),
      standaloneModulesDir: path.join(tmpDir, 'standalone-modules'),
      dockerSocket: 'unix:///var/run/docker.sock',
      projectRoot: tmpDir,
    };
    fs.mkdirSync(config.staticModulesDir);
    fs.mkdirSync(config.standaloneModulesDir);
    registry = new ModuleRegistry(config.modulesJsonPath);
    registry.load();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('installs static module from zip', () => {
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

    const installer = new ModuleInstaller(config, registry, new ManifestValidator());
    const result = installer.installFromZip(zip.toBuffer());
    expect(result.success).toBe(true);
    expect(result.moduleId).toBe('zip-gallery');
    expect(registry.getById('zip-gallery')?.status).toBe('static');
  });

  it('rejects unsafe zip entry names', () => {
    expect(isZipEntryNameSafe('../escape.txt')).toBe(false);
    expect(isZipEntryNameSafe('subdir/../../escape.txt')).toBe(false);
    expect(isZipEntryNameSafe('manifest.json')).toBe(true);
  });
});
