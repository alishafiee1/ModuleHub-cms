import express from 'express';
import session from 'express-session';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { SiteLayoutRegistry } from '../core/src/site-layout/registry';
import { ModuleRegistry } from '../core/src/modules/registry';
import { mountPublicRoutes } from '../core/src/public/routes';
import { AppConfig } from '../core/src/server/config';

describe('browse routes', () => {
  let tmpDir: string;
  let layoutRegistry: SiteLayoutRegistry;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-browse-'));
    layoutRegistry = new SiteLayoutRegistry(path.join(tmpDir, 'site-layout.json'));
    layoutRegistry.setData({
      siteTitle: 'ModuleHub CMS',
      siteSubtitle: 'Browse test',
      rootFolderId: 'root',
      folders: [
        { id: 'root', title: 'خانه', parentId: null },
        { id: 'portfolio', title: 'نمونه‌کارها', parentId: 'root' },
      ],
      items: [
        {
          id: 'gallery',
          folderId: 'portfolio',
          kind: 'module',
          title: 'گالری تست',
          subtitle: 'توضیح',
          pageType: 'builtin',
          route: '/pages/gallery/',
          sortOrder: 1,
        },
      ],
    });

    const registry = new ModuleRegistry(path.join(tmpDir, 'modules.json'));
    registry.load();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  async function get(pathname: string, authenticated = false): Promise<{ status: number; body: string }> {
    const agent = express();
    agent.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
      }),
    );
    agent.use((req, _res, next) => {
      if (authenticated) {
        req.session.authenticated = true;
        req.session.role = 'admin';
      }
      next();
    });
    const config = { projectRoot: tmpDir } as AppConfig;
    const registry = new ModuleRegistry(path.join(tmpDir, 'modules.json'));
    registry.load();
    mountPublicRoutes(agent, config, registry, layoutRegistry);

    return new Promise((resolve, reject) => {
      const server = agent.listen(0, () => {
        const address = server.address();
        const port = typeof address === 'object' && address ? address.port : 0;
        fetch(`http://127.0.0.1:${port}${pathname}`, { redirect: 'manual' })
          .then(async (res) => {
            const body = await res.text();
            server.close();
            resolve({ status: res.status, body });
          })
          .catch((error) => {
            server.close();
            reject(error);
          });
      });
    });
  }

  it('returns 200 for /browse/portfolio/ with module title', async () => {
    const { status, body } = await get('/browse/portfolio/');
    expect(status).toBe(200);
    expect(body).toContain('گالری تست');
    expect(body).toContain('نمونه‌کارها');
  });

  it('returns 404 for unknown folder path', async () => {
    const { status } = await get('/browse/unknown/');
    expect(status).toBe(404);
  });

  it('hides add card for anonymous users', async () => {
    const { body } = await get('/');
    expect(body).not.toContain('class="card-add"');
  });

  it('shows add card for authenticated admin', async () => {
    const { body } = await get('/', true);
    expect(body).toContain('class="card-add"');
  });
});
