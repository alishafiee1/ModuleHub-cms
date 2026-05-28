import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import request from 'supertest';
import validFixture from '../../fixtures/site-layout-valid.json';
import { hashPassword } from '../../../core/src/modules/admin-auth/bcrypt-verify';
import { resetCmsLoggerForTests } from '../../../core/src/modules/logger';

describe('super-admin-auth session middleware', () => {
  let tempRoot: string;
  const previousAppRoot = process.env.MODULEHUB_APP_ROOT;
  const previousDevFlag = process.env.MODULEHUB_DEV_SUPER_ADMIN;
  const previousAdminHash = process.env.ADMIN_PASSWORD_HASH;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'modulehub-auth-session-'));
    process.env.MODULEHUB_APP_ROOT = tempRoot;
    process.env.MODULEHUB_DEV_SUPER_ADMIN = '';
    process.env.ADMIN_PASSWORD_HASH = await hashPassword('admin-pass-123');
    await fs.ensureDir(path.join(tempRoot, 'storage'));
    await fs.writeJson(path.join(tempRoot, 'storage', 'site-layout.json'), validFixture);
    jest.resetModules();
    resetCmsLoggerForTests();
  });

  afterEach(async () => {
    process.env.MODULEHUB_APP_ROOT = previousAppRoot;
    process.env.MODULEHUB_DEV_SUPER_ADMIN = previousDevFlag;
    process.env.ADMIN_PASSWORD_HASH = previousAdminHash;
    await fs.remove(tempRoot);
  });

  async function createTestApp() {
    const exampleSettings = await fs.readJson(
      path.join(process.cwd(), 'docs', 'system-settings.example.json'),
    );
    await fs.writeJson(path.join(tempRoot, 'storage', 'system-settings.json'), exampleSettings);
    const { createApp } = await import('../../../core/src/server/index');
    return createApp();
  }

  it('returns 403 for protected admin POST without CSRF token', async () => {
    const app = await createTestApp();
    const response = await request(app).post('/admin/folder').send({ parentId: 'root', name: 'x' });
    expect(response.status).toBe(403);
  });

  it('allows Super Admin session to access protected route with CSRF', async () => {
    const app = await createTestApp();
    const agent = request.agent(app);
    const csrfResponse = await agent.get('/api/auth/csrf-token');
    const csrfToken = csrfResponse.body.csrfToken as string;

    const loginResponse = await agent
      .post('/admin/login')
      .set('X-CSRF-Token', csrfToken)
      .send({ username: 'admin', password: 'admin-pass-123' });
    expect(loginResponse.status).toBe(200);

    const folderResponse = await agent
      .post('/admin/folder')
      .set('X-CSRF-Token', csrfToken)
      .send({ parentId: 'root', name: 'Auth Folder' });
    expect(folderResponse.status).toBe(201);
  });
});
