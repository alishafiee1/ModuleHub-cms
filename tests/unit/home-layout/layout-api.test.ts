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
