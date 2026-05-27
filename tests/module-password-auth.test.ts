import express from 'express';
import session from 'express-session';
import fs from 'fs';
import os from 'os';
import path from 'path';
import bcrypt from 'bcrypt';
import { createAdminRouter } from '../core/src/admin/routes';
import { ModuleUnlockService } from '../core/src/auth/module-unlock-service';
import { ModuleUnlockRateLimiter } from '../core/src/auth/module-unlock-rate-limiter';
import { hashModulePassword } from '../core/src/auth/module-password';
import { DockerManager } from '../core/src/docker/manager';
import { ManifestValidator } from '../core/src/modules/manifest-validator';
import { ModuleInstaller } from '../core/src/modules/installer';
import { ModuleRegistry } from '../core/src/modules/registry';
import { ModuleSettingsService } from '../core/src/modules/module-settings-service';
import { PartialUploadService } from '../core/src/modules/partial-upload-service';
import { ReverseProxyManager } from '../core/src/proxy/reverse-proxy-manager';
import { AppConfig } from '../core/src/server/config';
import { SiteLayoutRegistry } from '../core/src/site-layout/registry';
import { CatalogService } from '../core/src/catalog/catalog-service';
import { CatalogInstanceService } from '../core/src/catalog/catalog-instance-service';
import { GitSyncService } from '../core/src/sync/git-sync-service';

function writeStandaloneModule(
  tmpDir: string,
  moduleId: string,
  passwordHash?: string,
): string {
  const moduleDir = path.join(tmpDir, 'standalone-modules', moduleId);
  fs.mkdirSync(moduleDir, { recursive: true });
  fs.writeFileSync(
    path.join(moduleDir, 'manifest.json'),
    JSON.stringify({
      name: moduleId,
      type: 'standalone',
      version: '1.0.0',
      icon: 'a.png',
      description: 'Test module',
      modulePasswordHash: passwordHash ?? null,
      docker: { composeFile: 'docker-compose.yml', ports: [3000] },
      proxy: { prefix: `/modules/${moduleId}/`, internalPort: 3000, paths: ['api'] },
    }),
  );
  fs.writeFileSync(path.join(moduleDir, 'index.html'), '<html></html>');
  fs.writeFileSync(
    path.join(moduleDir, 'docker-compose.yml'),
    'services:\n  app:\n    cap_drop:\n      - ALL\n    read_only: true',
  );
  return moduleDir;
}

describe('module password auth (P4)', () => {
  let tmpDir: string;
  let config: AppConfig;
  let registry: ModuleRegistry;
  let layoutRegistry: SiteLayoutRegistry;
  let rateLimiter: ModuleUnlockRateLimiter;
  let openModuleDir: string;
  let server: ReturnType<express.Application['listen']>;
  let baseUrl: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-unlock-'));
    config = {
      projectRoot: tmpDir,
      catalogModulesDir: path.join(tmpDir, 'catalog-modules'),
      standaloneModulesDir: path.join(tmpDir, 'standalone-modules'),
      modulesJsonPath: path.join(tmpDir, 'modules.json'),
      siteLayoutJsonPath: path.join(tmpDir, 'site-layout.json'),
      adminPassword: 'secret',
      adminRole: 'admin',
      sessionSecret: 'test-session-secret',
    } as AppConfig;

    registry = new ModuleRegistry(config.modulesJsonPath);
    registry.load();
    layoutRegistry = new SiteLayoutRegistry(config.siteLayoutJsonPath);
    layoutRegistry.load();

    const moduleDir = writeStandaloneModule(tmpDir, 'locked-api', await hashModulePassword('gallery123'));
    registry.upsert({
      id: 'locked-api',
      name: 'Locked API',
      type: 'standalone',
      version: '1.0.0',
      icon: 'a.png',
      description: 'Locked',
      status: 'stopped',
      installPath: moduleDir,
      createdAt: '',
      updatedAt: '',
    });

    const openDir = writeStandaloneModule(tmpDir, 'open-api');
    openModuleDir = openDir;
    registry.upsert({
      id: 'open-api',
      name: 'Open API',
      type: 'standalone',
      version: '1.0.0',
      icon: 'a.png',
      description: 'Open',
      status: 'stopped',
      installPath: openDir,
      createdAt: '',
      updatedAt: '',
    });

    const validator = new ManifestValidator();
    const dockerManager = new DockerManager('unix:///var/run/docker.sock');
    const proxyManager = new ReverseProxyManager(registry);
    const settingsService = new ModuleSettingsService(
      registry,
      layoutRegistry,
      validator,
      dockerManager,
      proxyManager,
    );
    rateLimiter = new ModuleUnlockRateLimiter();
    const moduleUnlockService = new ModuleUnlockService(registry, config.sessionSecret, rateLimiter);

    const app = express();
    app.use(express.json());
    app.use(
      session({
        secret: config.sessionSecret,
        resave: false,
        saveUninitialized: false,
      }),
    );

    app.use(
      '/api',
      createAdminRouter({
        config,
        registry,
        installer: new ModuleInstaller(config, registry, validator, layoutRegistry),
        dockerManager,
        proxyManager,
        layoutRegistry,
        catalogService: new CatalogService(config),
        catalogInstanceService: new CatalogInstanceService(
          config,
          registry,
          layoutRegistry,
          validator,
        ),
        settingsService,
        gitSyncService: new GitSyncService(registry),
        partialUploadService: new PartialUploadService(registry),
        moduleUnlockService,
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

  it('unlock success sets cookie and allows stats', async () => {
    const unlockRes = await fetch(`${baseUrl}/api/modules/locked-api/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'gallery123' }),
    });
    expect(unlockRes.status).toBe(200);
    const cookie = unlockRes.headers.get('set-cookie');
    expect(cookie).toContain('modulehub_module_locked-api');

    const statsRes = await fetch(`${baseUrl}/api/modules/locked-api/stats`, {
      headers: { Cookie: cookie ?? '' },
    });
    expect(statsRes.status).toBe(200);
  });

  it('wrong password returns 401 and rate limit returns 429', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const res = await fetch(`${baseUrl}/api/modules/locked-api/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'wrong' }),
      });
      expect(res.status).toBe(401);
    }
    const blocked = await fetch(`${baseUrl}/api/modules/locked-api/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'gallery123' }),
    });
    expect(blocked.status).toBe(429);
  });

  it('scoped session cannot access another module', async () => {
    const unlockRes = await fetch(`${baseUrl}/api/modules/locked-api/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'gallery123' }),
    });
    const cookie = unlockRes.headers.get('set-cookie') ?? '';

    const crossRes = await fetch(`${baseUrl}/api/modules/open-api/stats`, {
      headers: { Cookie: cookie },
    });
    expect(crossRes.status).toBe(401);
  });

  it('scoped session cannot delete module', async () => {
    const unlockRes = await fetch(`${baseUrl}/api/modules/locked-api/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'gallery123' }),
    });
    const cookie = unlockRes.headers.get('set-cookie') ?? '';

    const deleteRes = await fetch(`${baseUrl}/api/modules/locked-api`, {
      method: 'DELETE',
      headers: { Cookie: cookie },
    });
    expect(deleteRes.status).toBe(401);
  });

  it('GET settings returns hasModulePassword without hash', async () => {
    const unlockRes = await fetch(`${baseUrl}/api/modules/locked-api/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'gallery123' }),
    });
    const cookie = unlockRes.headers.get('set-cookie') ?? '';

    const settingsRes = await fetch(`${baseUrl}/api/modules/locked-api/settings`, {
      headers: { Cookie: cookie },
    });
    expect(settingsRes.status).toBe(200);
    const body = (await settingsRes.json()) as { settings: { hasModulePassword: boolean; modulePasswordHash?: string } };
    expect(body.settings.hasModulePassword).toBe(true);
    expect(body.settings.modulePasswordHash).toBeUndefined();
  });

  it('PUT settings stores bcrypt hash only', async () => {
    const app = express();
    app.use(express.json());
    app.use(
      session({
        secret: config.sessionSecret,
        resave: false,
        saveUninitialized: false,
      }),
    );
    app.use((req, _res, next) => {
      req.session.authenticated = true;
      req.session.role = 'admin';
      next();
    });

    const validator = new ManifestValidator();
    const dockerManager = {
      startModule: jest.fn().mockResolvedValue({
        success: true,
        hostPort: 32775,
        containerId: 'c1',
      }),
    };
    const proxyManager = new ReverseProxyManager(registry);
    const settingsService = new ModuleSettingsService(
      registry,
      layoutRegistry,
      validator,
      dockerManager as unknown as DockerManager,
      proxyManager,
    );

    app.use(
      '/api',
      createAdminRouter({
        config,
        registry,
        installer: new ModuleInstaller(config, registry, validator, layoutRegistry),
        dockerManager: dockerManager as unknown as DockerManager,
        proxyManager,
        layoutRegistry,
        catalogService: new CatalogService(config),
        catalogInstanceService: new CatalogInstanceService(
          config,
          registry,
          layoutRegistry,
          validator,
        ),
        settingsService,
        gitSyncService: new GitSyncService(registry),
        partialUploadService: new PartialUploadService(registry),
        moduleUnlockService: new ModuleUnlockService(registry, config.sessionSecret),
      }),
    );

    let settingsServer: ReturnType<express.Application['listen']>;
    let settingsUrl = '';
    await new Promise<void>((resolve) => {
      settingsServer = app.listen(0, () => {
        const address = settingsServer.address();
        const port = typeof address === 'object' && address ? address.port : 0;
        settingsUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    const putRes = await fetch(`${settingsUrl}/api/modules/open-api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ports: [3000],
        internalPort: 3000,
        proxyPrefix: '/modules/open-api/',
        modulePassword: 'secret-pass',
      }),
    });
    expect(putRes.status).toBe(200);

    const manifest = JSON.parse(
      fs.readFileSync(path.join(openModuleDir, 'manifest.json'), 'utf-8'),
    ) as { modulePasswordHash?: string };
    expect(manifest.modulePasswordHash).toBeDefined();
    expect(manifest.modulePasswordHash).not.toBe('secret-pass');
    expect(await bcrypt.compare('secret-pass', manifest.modulePasswordHash!)).toBe(true);

    await new Promise<void>((resolve) => settingsServer.close(() => resolve()));
  });
});
