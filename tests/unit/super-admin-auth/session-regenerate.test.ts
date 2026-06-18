import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import request from 'supertest';
import validFixture from '../../fixtures/site-layout-valid.json';
import { hashPassword } from '../../../core/src/modules/admin-auth/bcrypt-verify';
import { resetCmsLoggerForTests } from '../../../core/src/modules/logger';

function extractSessionCookie(response: request.Response): string {
  const setCookie = response.headers['set-cookie'];
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
  const sessionCookie = cookies.find((cookie) => cookie?.startsWith('modulehub.sid='));
  if (!sessionCookie) {
    throw new Error('Missing modulehub.sid cookie');
  }
  return sessionCookie.split(';')[0];
}

describe('session regeneration after authentication', () => {
  let tempRoot: string;
  let adminPasswordHash: string;
  let modulePasswordHash: string;
  const previousAppRoot = process.env.MODULEHUB_APP_ROOT;
  const previousDevFlag = process.env.MODULEHUB_DEV_SUPER_ADMIN;
  const previousAdminHash = process.env.ADMIN_PASSWORD_HASH;
  const previousAdminUsername = process.env.ADMIN_USERNAME;
  const previousNodeEnv = process.env.NODE_ENV;

  jest.setTimeout(30_000);

  beforeAll(async () => {
    adminPasswordHash = await hashPassword('admin-pass-123');
    modulePasswordHash = await hashPassword('module-pass-123');
  });

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'modulehub-session-regen-'));
    process.env.MODULEHUB_APP_ROOT = tempRoot;
    process.env.MODULEHUB_DEV_SUPER_ADMIN = '';
    process.env.ADMIN_USERNAME = 'admin';
    process.env.ADMIN_PASSWORD_HASH = adminPasswordHash;
    process.env.NODE_ENV = 'test';

    await fs.ensureDir(path.join(tempRoot, 'storage'));
    const exampleSettings = await fs.readJson(
      path.join(process.cwd(), 'docs', 'system-settings.example.json'),
    );
    await fs.writeJson(path.join(tempRoot, 'storage', 'system-settings.json'), exampleSettings);
    await fs.writeJson(path.join(tempRoot, 'storage', 'site-layout.json'), {
      ...validFixture,
      modules: {
        ...validFixture.modules,
        'mod-regen': {
          name: 'Regenerate test',
          status: 'stopped',
          version: '1.0.0',
          docker: false,
          port: 0,
          permissions: 'network',
          resources: {
            cpu_limit: 0.5,
            ram_limit_mb: 512,
            swap_limit_mb: 128,
            disk_iops: 100,
            net_mbps: 10,
          },
          icon: 'fas fa-lock',
          thumbnail: '',
          managementPasswordHash: modulePasswordHash,
        },
      },
    });

    jest.resetModules();
    resetCmsLoggerForTests();
  });

  afterEach(async () => {
    process.env.MODULEHUB_APP_ROOT = previousAppRoot;
    process.env.MODULEHUB_DEV_SUPER_ADMIN = previousDevFlag;
    process.env.ADMIN_PASSWORD_HASH = previousAdminHash;
    process.env.ADMIN_USERNAME = previousAdminUsername;
    process.env.NODE_ENV = previousNodeEnv;
    await fs.remove(tempRoot);
  });

  async function createTestApp() {
    const { createApp } = await import('../../../core/src/server/index');
    return createApp();
  }

  it('regenerates the Super Admin session id after login', async () => {
    const app = await createTestApp();
    const agent = request.agent(app);

    const csrfResponse = await agent.get('/api/auth/csrf-token');
    const beforeLoginCookie = extractSessionCookie(csrfResponse);

    const loginResponse = await agent
      .post('/admin/login')
      .send({ username: 'admin', password: 'admin-pass-123' });

    expect(loginResponse.status).toBe(200);
    expect(extractSessionCookie(loginResponse)).not.toBe(beforeLoginCookie);
  });

  it('regenerates the Module Manager session id after module auth', async () => {
    const app = await createTestApp();
    const agent = request.agent(app);

    const csrfResponse = await agent.get('/api/auth/csrf-token');
    const beforeLoginCookie = extractSessionCookie(csrfResponse);
    const csrfToken = csrfResponse.body.csrfToken as string;

    const authResponse = await agent
      .post('/admin/module/mod-regen/auth')
      .set('X-CSRF-Token', csrfToken)
      .send({ password: 'module-pass-123' });

    expect(authResponse.status).toBe(200);
    expect(extractSessionCookie(authResponse)).not.toBe(beforeLoginCookie);
  });
});
