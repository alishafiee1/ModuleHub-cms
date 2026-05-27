import express from 'express';
import session from 'express-session';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createAdminRouter } from '../core/src/admin/routes';
import { CatalogService } from '../core/src/catalog/catalog-service';
import { CatalogInstanceService } from '../core/src/catalog/catalog-instance-service';
import { DockerManager } from '../core/src/docker/manager';
import { ManifestValidator } from '../core/src/modules/manifest-validator';
import { ModuleInstaller } from '../core/src/modules/installer';
import { ModuleRegistry } from '../core/src/modules/registry';
import { ReverseProxyManager } from '../core/src/proxy/reverse-proxy-manager';
import { mountStandaloneHostFiles } from '../core/src/public/routes';
import { AppConfig } from '../core/src/server/config';
import { SiteLayoutRegistry } from '../core/src/site-layout/registry';
import { ModuleSettingsService } from '../core/src/modules/module-settings-service';

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
    }),
  );
  fs.writeFileSync(
    path.join(templateDir, 'catalog.meta.json'),
    JSON.stringify({ title: 'API Gallery', description: 'API test' }),
  );
  fs.writeFileSync(
    path.join(templateDir, 'index.html'),
    '<html><body>Catalog instance served</body></html>',
  );
}

describe('catalog instances API', () => {
  let tmpDir: string;
  let config: AppConfig;
  let registry: ModuleRegistry;
  let layoutRegistry: SiteLayoutRegistry;
  let catalogService: CatalogService;
  let catalogInstanceService: CatalogInstanceService;
  let server: ReturnType<express.Application['listen']>;
  let baseUrl: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-catalog-api-'));
    config = {
      projectRoot: tmpDir,
      catalogModulesDir: path.join(tmpDir, 'catalog-modules'),
      standaloneModulesDir: path.join(tmpDir, 'standalone-modules'),
      modulesJsonPath: path.join(tmpDir, 'modules.json'),
      siteLayoutJsonPath: path.join(tmpDir, 'site-layout.json'),
      adminPassword: 'secret',
      adminRole: 'admin',
    } as AppConfig;
    writeCatalogTemplate(config.catalogModulesDir, 'image-gallery');

    registry = new ModuleRegistry(config.modulesJsonPath);
    registry.load();
    layoutRegistry = new SiteLayoutRegistry(config.siteLayoutJsonPath);
    layoutRegistry.load();
    const validator = new ManifestValidator();
    catalogService = new CatalogService(config);
    catalogInstanceService = new CatalogInstanceService(
      config,
      registry,
      layoutRegistry,
      validator,
    );

    const dockerManager = new DockerManager('unix:///var/run/docker.sock');
    const proxyManager = new ReverseProxyManager(registry);
    const settingsService = new ModuleSettingsService(
      registry,
      layoutRegistry,
      validator,
      dockerManager,
      proxyManager,
    );

    const app = express();
    app.use(express.json());
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
      }),
    );
    app.use((req, _res, next) => {
      req.session.authenticated = true;
      req.session.role = 'admin';
      next();
    });

    mountStandaloneHostFiles(app, registry);
    app.use(
      '/api',
      createAdminRouter({
        config,
        registry,
        installer: new ModuleInstaller(config, registry, validator, layoutRegistry),
        dockerManager,
        proxyManager,
        layoutRegistry,
        catalogService,
        catalogInstanceService,
        settingsService,
      }),
    );

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        const port = typeof address === 'object' && address ? address.port : 0;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('GET /api/catalog lists templates', async () => {
    const res = await fetch(`${baseUrl}/api/catalog`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { templates: Array<{ templateId: string }> };
    expect(body.templates.some((template) => template.templateId === 'image-gallery')).toBe(true);
  });

  it('POST /api/instances creates instance and serves index.html', async () => {
    const createRes = await fetch(`${baseUrl}/api/instances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: 'image-gallery',
        instanceId: 'api-gallery',
        cardTitle: 'API Gallery',
        cardDescription: 'Created via API',
        folderId: 'root',
      }),
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as { instanceId: string };
    expect(created.instanceId).toBe('api-gallery');

    const pageRes = await fetch(`${baseUrl}/modules/api-gallery/`);
    expect(pageRes.status).toBe(200);
    const html = await pageRes.text();
    expect(html).toContain('Catalog instance served');
  });

  it('POST /api/instances returns 409 on duplicate id', async () => {
    const payload = {
      templateId: 'image-gallery',
      instanceId: 'dup-gallery',
      cardTitle: 'Dup',
    };
    const first = await fetch(`${baseUrl}/api/instances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(first.status).toBe(201);

    const second = await fetch(`${baseUrl}/api/instances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(second.status).toBe(409);
  });
});
