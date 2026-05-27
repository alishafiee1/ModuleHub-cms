import express from 'express';
import session from 'express-session';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { SiteLayoutRegistry } from '../core/src/site-layout/registry';
import { ModuleRegistry } from '../core/src/modules/registry';
import { mountPublicRoutes } from '../core/src/public/routes';
import { AppConfig } from '../core/src/server/config';

describe('homepage gear integration', () => {
  let tmpDir: string;
  let layoutRegistry: SiteLayoutRegistry;
  let registry: ModuleRegistry;
  let server: ReturnType<express.Application['listen']>;
  let baseUrl: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-gear-int-'));
    layoutRegistry = new SiteLayoutRegistry(path.join(tmpDir, 'site-layout.json'));
    layoutRegistry.setData({
      siteTitle: 'ModuleHub CMS',
      siteSubtitle: 'Gear test',
      rootFolderId: 'root',
      folders: [{ id: 'root', title: 'خانه', parentId: null }],
      items: [
        {
          id: 'demo-api',
          folderId: 'root',
          kind: 'module',
          title: 'Demo API',
          subtitle: 'API module',
          iconClass: 'fas fa-plug',
          pageType: 'standalone',
          route: '/modules/demo-api/',
          sortOrder: 1,
        },
      ],
    });

    registry = new ModuleRegistry(path.join(tmpDir, 'modules.json'));
    registry.upsert({
      id: 'demo-api',
      name: 'Demo API',
      type: 'standalone',
      version: '1.0.0',
      icon: 'a.png',
      description: 'API',
      status: 'stopped',
      installPath: path.join(tmpDir, 'demo-api'),
      createdAt: '',
      updatedAt: '',
    });

    const app = express();
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

    const config = { projectRoot: tmpDir } as AppConfig;
    mountPublicRoutes(app, config, registry, layoutRegistry);

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

  it('authenticated GET / includes gear button and modal skeleton', async () => {
    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('class="card-gear"');
    expect(body).toContain('id="gear-modal"');
    expect(body).toContain('gearStartModule');
    expect(body).toContain('gearSaveSettings');
  });

  it('anonymous GET / omits gear controls', async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    const app = express();
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
      }),
    );
    const config = { projectRoot: tmpDir } as AppConfig;
    mountPublicRoutes(app, config, registry, layoutRegistry);
    server = app.listen(0);
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    const res = await fetch(`http://127.0.0.1:${port}/`);
    const body = await res.text();
    expect(body).not.toContain('class="card-gear"');
    expect(body).not.toContain('id="gear-modal"');
  });
});
