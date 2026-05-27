import fs from 'fs';
import os from 'os';
import path from 'path';
import { CatalogService } from '../core/src/catalog/catalog-service';
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
      templateVersion: '2.0.0',
    }),
  );
  fs.writeFileSync(
    path.join(templateDir, 'catalog.meta.json'),
    JSON.stringify({
      title: 'گالری تست',
      description: 'توضیح تست',
      defaultIconClass: 'fas fa-images',
    }),
  );
  fs.writeFileSync(path.join(templateDir, 'index.html'), '<html></html>');
}

describe('CatalogService', () => {
  let tmpDir: string;
  let config: AppConfig;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-catalog-'));
    config = {
      projectRoot: tmpDir,
      catalogModulesDir: path.join(tmpDir, 'catalog-modules'),
    } as AppConfig;
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty list when catalog dir is missing', () => {
    const service = new CatalogService(config);
    expect(service.listTemplates()).toEqual([]);
  });

  it('lists templates with manifest.template.json', () => {
    writeCatalogTemplate(config.catalogModulesDir, 'image-gallery');
    const service = new CatalogService(config);
    const templates = service.listTemplates();
    expect(templates).toHaveLength(1);
    expect(templates[0].templateId).toBe('image-gallery');
    expect(templates[0].title).toBe('گالری تست');
    expect(templates[0].templateVersion).toBe('2.0.0');
  });

  it('resolves template path only when manifest exists', () => {
    writeCatalogTemplate(config.catalogModulesDir, 'markdown-viewer');
    const service = new CatalogService(config);
    expect(service.getTemplatePath('markdown-viewer')).toContain('markdown-viewer');
    expect(service.getTemplatePath('missing')).toBeNull();
  });
});
