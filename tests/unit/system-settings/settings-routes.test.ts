import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import request from 'supertest';
import exampleSettings from '../../../docs/system-settings.example.json';
import { resetCmsLoggerForTests } from '../../../core/src/modules/logger';

describe('system-settings admin routes', () => {
  let tempRoot: string;
  const previousAppRoot = process.env.MODULEHUB_APP_ROOT;
  const previousDevAdmin = process.env.MODULEHUB_DEV_SUPER_ADMIN;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'modulehub-settings-api-'));
    process.env.MODULEHUB_APP_ROOT = tempRoot;
    process.env.MODULEHUB_DEV_SUPER_ADMIN = '1';
    await fs.ensureDir(path.join(tempRoot, 'storage'));
    await fs.ensureDir(path.join(tempRoot, 'public', 'admin'));
    await fs.writeJson(path.join(tempRoot, 'storage', 'system-settings.json'), exampleSettings);
    await fs.writeFile(path.join(tempRoot, 'public', 'admin', 'settings.html'), '<html>settings</html>');
    jest.resetModules();
    resetCmsLoggerForTests();
  });

  afterEach(async () => {
    process.env.MODULEHUB_APP_ROOT = previousAppRoot;
    process.env.MODULEHUB_DEV_SUPER_ADMIN = previousDevAdmin;
    await fs.remove(tempRoot);
  });

  it('GET /admin/settings/data returns current settings', async () => {
    const { createApp } = await import('../../../core/src/server/index');
    const app = createApp();
    const response = await request(app).get('/admin/settings/data');

    expect(response.status).toBe(200);
    expect(response.body.settings.maxZipUploadMb).toBe(200);
    expect(Array.isArray(response.body.networkInterfaces)).toBe(true);
  });

  it('POST /admin/settings persists validated partial update', async () => {
    const { createApp } = await import('../../../core/src/server/index');
    const app = createApp();
    const response = await request(app)
      .post('/admin/settings')
      .send({ maxZipUploadMb: 100, sessionTtlHours: 4 });

    expect(response.status).toBe(200);
    expect(response.body.settings.maxZipUploadMb).toBe(100);
    expect(response.body.settings.sessionTtlHours).toBe(4);

    const saved = await fs.readJson(path.join(tempRoot, 'storage', 'system-settings.json'));
    expect(saved.maxZipUploadMb).toBe(100);
    expect(saved.sessionTtlHours).toBe(4);
  });

  it('returns 403 without dev Super Admin flag', async () => {
    process.env.MODULEHUB_DEV_SUPER_ADMIN = '0';
    jest.resetModules();
    resetCmsLoggerForTests();
    const { createApp } = await import('../../../core/src/server/index');
    const app = createApp();
    const response = await request(app).get('/admin/settings/data');
    expect(response.status).toBe(403);
  });
});
