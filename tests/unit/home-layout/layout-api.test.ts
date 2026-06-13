import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import request from 'supertest';
import validFixture from '../../fixtures/site-layout-valid.json';
import { resetCmsLoggerForTests } from '../../../core/src/modules/logger';

describe('GET /api/layout', () => {
  let tempRoot: string;
  const previousAppRoot = process.env.MODULEHUB_APP_ROOT;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'modulehub-layout-api-'));
    process.env.MODULEHUB_APP_ROOT = tempRoot;
    await fs.ensureDir(path.join(tempRoot, 'storage'));
    await fs.writeJson(path.join(tempRoot, 'storage', 'site-layout.json'), validFixture);
    jest.resetModules();
    resetCmsLoggerForTests();
  });

  afterEach(async () => {
    process.env.MODULEHUB_APP_ROOT = previousAppRoot;
    await fs.remove(tempRoot);
  });

  it('returns layout tree and modules without password hash', async () => {
    const { createApp: createFreshApp } = await import('../../../core/src/server/index');
    const app = createFreshApp();
    const response = await request(app).get('/api/layout');

    expect(response.status).toBe(200);
    expect(response.body.version).toBe('1.0');
    expect(response.body.tree.id).toBe('root');
    expect(response.body.modules['mod-1'].hasManagementPassword).toBe(true);
    expect(response.body.modules['mod-1'].managementPasswordHash).toBeUndefined();
    expect(response.body.modules['mod-2'].status).toBe('stopped');
    expect(response.body.appearance).toEqual({
      backgroundMode: 'none',
      iconTheme: 'mixed',
    });
  });

  it('returns derivedLayoutsSaved when tablet/mobile grids are derived on first read', async () => {
    const desktopOnlyLayout = {
      version: '1.0',
      tree: {
        id: 'root',
        name: 'خانه',
        type: 'folder',
        parentId: null,
        children: [
          {
            id: 'node-mod-1',
            name: 'ماژول ۱',
            type: 'module',
            moduleId: 'mod-1',
            parentId: 'root',
            cardGrid: { col: 0, row: 0, colSpan: 15, rowSpan: 3 },
          },
        ],
      },
      modules: {
        'mod-1': {
          name: 'گالری',
          status: 'running',
          version: '1.0.0',
          docker: false,
          port: 4100,
          permissions: 'network',
          resources: { cpu_limit: 0.5, ram_limit_mb: 512, swap_limit_mb: 128 },
          icon: 'fas fa-images',
          thumbnail: '',
        },
      },
    };
    await fs.writeJson(path.join(tempRoot, 'storage', 'site-layout.json'), desktopOnlyLayout);

    const { createApp: createFreshApp } = await import('../../../core/src/server/index');
    const app = createFreshApp();
    const response = await request(app).get('/api/layout');

    expect(response.status).toBe(200);
    expect(response.body.derivedLayoutsSaved).toBe(true);
    const child = response.body.tree.children[0];
    expect(child.cardGridTablet).toBeDefined();
    expect(child.cardGridMobile).toBeDefined();
  });

  it('returns auth status with csrf token', async () => {
    const { createApp: createFreshApp } = await import('../../../core/src/server/index');
    const app = createFreshApp();
    const response = await request(app).get('/api/auth/status');

    expect(response.status).toBe(200);
    expect(response.body.isSuperAdmin).toBe(false);
    expect(response.body.managedModuleIds).toEqual([]);
    expect(typeof response.body.csrfToken).toBe('string');
  });
});
