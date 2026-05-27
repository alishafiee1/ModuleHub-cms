import fs from 'fs';
import os from 'os';
import path from 'path';
import { CatalogInstanceService } from '../core/src/catalog/catalog-instance-service';
import { ManifestValidator } from '../core/src/modules/manifest-validator';
import { ModuleRegistry } from '../core/src/modules/registry';
import { SiteLayoutRegistry } from '../core/src/site-layout/registry';
import { AppConfig } from '../core/src/server/config';

function writeCatalogTemplate(catalogDir: string, templateId: string): void {
  const templateDir = path.join(catalogDir, templateId);
  fs.mkdirSync(templateDir, { recursive: true });
  fs.writeFileSync(
    path.join(templateDir, 'manifest.template.json'),
    JSON.stringify({
      name: '{{cardTitle}}',
      type: 'instance',
      version: '1.0.0',
      templateVersion: '1.0.0',
      icon: 'gallery.png',
      description: '{{cardDescription}}',
      catalogTemplateId: templateId,
    }),
  );
  fs.writeFileSync(
    path.join(templateDir, 'catalog.meta.json'),
    JSON.stringify({ title: 'Test', description: 'Desc' }),
  );
  fs.writeFileSync(
    path.join(templateDir, 'index.html'),
    '<html><title>{{cardTitle}}</title><body>Instance OK</body></html>',
  );
}

describe('CatalogInstanceService', () => {
  let tmpDir: string;
  let config: AppConfig;
  let registry: ModuleRegistry;
  let layoutRegistry: SiteLayoutRegistry;
  let service: CatalogInstanceService;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-instance-'));
    config = {
      projectRoot: tmpDir,
      catalogModulesDir: path.join(tmpDir, 'catalog-modules'),
      standaloneModulesDir: path.join(tmpDir, 'standalone-modules'),
      modulesJsonPath: path.join(tmpDir, 'modules.json'),
      siteLayoutJsonPath: path.join(tmpDir, 'site-layout.json'),
    } as AppConfig;
    writeCatalogTemplate(config.catalogModulesDir, 'image-gallery');
    registry = new ModuleRegistry(config.modulesJsonPath);
    registry.load();
    layoutRegistry = new SiteLayoutRegistry(config.siteLayoutJsonPath);
    layoutRegistry.load();
    service = new CatalogInstanceService(
      config,
      registry,
      layoutRegistry,
      new ManifestValidator(),
    );
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('copies template and registers instance module + layout item', () => {
    const result = service.create({
      templateId: 'image-gallery',
      instanceId: 'my-gallery',
      cardTitle: 'گالری من',
      cardDescription: 'توضیح گالری',
      folderId: 'root',
    });

    expect(result.success).toBe(true);
    expect(result.instanceId).toBe('my-gallery');

    const targetDir = path.join(config.standaloneModulesDir, 'my-gallery');
    expect(fs.existsSync(path.join(targetDir, 'manifest.json'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'manifest.template.json'))).toBe(false);

    const manifest = JSON.parse(fs.readFileSync(path.join(targetDir, 'manifest.json'), 'utf-8')) as {
      type: string;
      name: string;
    };
    expect(manifest.type).toBe('instance');
    expect(manifest.name).toBe('گالری من');

    const indexHtml = fs.readFileSync(path.join(targetDir, 'index.html'), 'utf-8');
    expect(indexHtml).toContain('گالری من');

    const module = registry.getById('my-gallery');
    expect(module?.type).toBe('instance');
    expect(module?.status).toBe('static');

    const layoutItem = layoutRegistry.getData().items.find((item) => item.id === 'my-gallery');
    expect(layoutItem?.kind).toBe('module');
    if (layoutItem?.kind === 'module') {
      expect(layoutItem.route).toBe('/modules/my-gallery/');
      expect(layoutItem.folderId).toBe('root');
    }
  });

  it('rejects duplicate instance id', () => {
    const first = service.create({
      templateId: 'image-gallery',
      instanceId: 'dup-id',
      cardTitle: 'First',
    });
    expect(first.success).toBe(true);

    const second = service.create({
      templateId: 'image-gallery',
      instanceId: 'dup-id',
      cardTitle: 'Second',
    });
    expect(second.success).toBe(false);
    expect(second.errors.some((message) => message.includes('already'))).toBe(true);
  });
});
