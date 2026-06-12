import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import request from 'supertest';
import validFixture from '../../fixtures/site-layout-valid.json';
import { hashPassword } from '../../../core/src/modules/admin-auth/bcrypt-verify';
import { PATHS } from '../../../core/src/config/paths';
import { resetCmsLoggerForTests } from '../../../core/src/modules/logger';
import { createAgentWithCsrf, loginSuperAdminOnAgent } from '../../helpers/admin-test-agent';

describe('super-admin-auth logout and change-password', () => {
  let tempRoot: string;
  let adminPasswordHash: string;
  const previousAppRoot = process.env.MODULEHUB_APP_ROOT;
  const previousDevFlag = process.env.MODULEHUB_DEV_SUPER_ADMIN;
  const previousAdminHash = process.env.ADMIN_PASSWORD_HASH;
  const previousAdminUsername = process.env.ADMIN_USERNAME;

  jest.setTimeout(30_000);

  beforeAll(async () => {
    adminPasswordHash = await hashPassword('admin-pass-123');
  });

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'modulehub-auth-logout-'));
    process.env.MODULEHUB_APP_ROOT = tempRoot;
    process.env.MODULEHUB_DEV_SUPER_ADMIN = '';
    process.env.ADMIN_USERNAME = 'admin';
    process.env.ADMIN_PASSWORD_HASH = adminPasswordHash;
    await fs.ensureDir(path.join(tempRoot, 'storage'));
    await fs.writeJson(path.join(tempRoot, 'storage', 'site-layout.json'), validFixture);
    jest.resetModules();
    resetCmsLoggerForTests();
  });

  afterEach(async () => {
    process.env.MODULEHUB_APP_ROOT = previousAppRoot;
    process.env.MODULEHUB_DEV_SUPER_ADMIN = previousDevFlag;
    process.env.ADMIN_PASSWORD_HASH = previousAdminHash;
    process.env.ADMIN_USERNAME = previousAdminUsername;
    await fs.remove(tempRoot);
  });

  async function createTestApp(settingsOverride: Record<string, unknown> = {}) {
    const exampleSettings = await fs.readJson(
      path.join(process.cwd(), 'docs', 'system-settings.example.json'),
    );
    await fs.writeJson(path.join(tempRoot, 'storage', 'system-settings.json'), {
      ...exampleSettings,
      ...settingsOverride,
    });
    const { createApp } = await import('../../../core/src/server/index');
    return createApp();
  }

  async function loginAsSuperAdmin(app: Awaited<ReturnType<typeof createTestApp>>) {
    const { agent, csrfToken } = await createAgentWithCsrf(app);
    await loginSuperAdminOnAgent(agent, csrfToken, 'admin', 'admin-pass-123');
    return { agent, csrfToken };
  }

  it('logs out with valid CSRF and clears Super Admin session', async () => {
    const app = await createTestApp();
    const { agent, csrfToken } = await loginAsSuperAdmin(app);

    const logoutResponse = await agent
      .post('/admin/logout')
      .set('X-CSRF-Token', csrfToken);
    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body.message).toBe('Logged out');

    const statusResponse = await agent.get('/api/auth/status');
    expect(statusResponse.body.isSuperAdmin).toBe(false);
  });

  it('returns 403 for logout without CSRF token', async () => {
    const app = await createTestApp();
    const { agent } = await loginAsSuperAdmin(app);

    const logoutResponse = await agent.post('/admin/logout');
    expect(logoutResponse.status).toBe(403);
  });

  it('returns 429 when logout rate limit is exceeded', async () => {
    const app = await createTestApp({ loginRateLimitPerMinute: 2 });
    const { agent, csrfToken } = await loginAsSuperAdmin(app);

    const first = await agent.post('/admin/logout').set('X-CSRF-Token', csrfToken);
    expect(first.status).toBe(200);

    const csrfAgain = await agent.get('/api/auth/csrf-token');
    const secondToken = csrfAgain.body.csrfToken as string;
    const second = await agent.post('/admin/logout').set('X-CSRF-Token', secondToken);
    expect(second.status).toBe(200);

    const csrfThird = await agent.get('/api/auth/csrf-token');
    const thirdToken = csrfThird.body.csrfToken as string;
    const third = await agent.post('/admin/logout').set('X-CSRF-Token', thirdToken);
    expect(third.status).toBe(429);
  });

  it('changes password successfully and allows login with new password', async () => {
    const app = await createTestApp();
    const { agent, csrfToken } = await loginAsSuperAdmin(app);

    const changeResponse = await agent
      .post('/admin/change-password')
      .set('X-CSRF-Token', csrfToken)
      .send({
        currentPassword: 'admin-pass-123',
        newPassword: 'new-pass-456',
        confirmPassword: 'new-pass-456',
      });
    expect(changeResponse.status).toBe(200);
    expect(changeResponse.body.message).toBe('Password changed');

    const statusAfterChange = await agent.get('/api/auth/status');
    expect(statusAfterChange.body.isSuperAdmin).toBe(false);

    const freshAgent = request.agent(app);
    await freshAgent.get('/api/auth/csrf-token');
    const loginOld = await freshAgent
      .post('/admin/login')
      .send({ username: 'admin', password: 'admin-pass-123' });
    expect(loginOld.status).toBe(401);

    const loginNew = await freshAgent
      .post('/admin/login')
      .send({ username: 'admin', password: 'new-pass-456' });
    expect(loginNew.status).toBe(200);
  });

  it('returns 401 when current password is incorrect', async () => {
    const app = await createTestApp();
    const { agent, csrfToken } = await loginAsSuperAdmin(app);

    const response = await agent
      .post('/admin/change-password')
      .set('X-CSRF-Token', csrfToken)
      .send({
        currentPassword: 'wrong-password',
        newPassword: 'new-pass-456',
        confirmPassword: 'new-pass-456',
      });
    expect(response.status).toBe(401);
  });

  it('returns 400 for weak new password or mismatched confirmation', async () => {
    const app = await createTestApp();
    const { agent, csrfToken } = await loginAsSuperAdmin(app);

    const weakResponse = await agent
      .post('/admin/change-password')
      .set('X-CSRF-Token', csrfToken)
      .send({
        currentPassword: 'admin-pass-123',
        newPassword: 'short1',
        confirmPassword: 'short1',
      });
    expect(weakResponse.status).toBe(400);

    const mismatchResponse = await agent
      .post('/admin/change-password')
      .set('X-CSRF-Token', csrfToken)
      .send({
        currentPassword: 'admin-pass-123',
        newPassword: 'valid-pass-99',
        confirmPassword: 'other-pass-99',
      });
    expect(mismatchResponse.status).toBe(400);
  });

  it('returns 403 for change-password without CSRF token', async () => {
    const app = await createTestApp();
    const { agent } = await loginAsSuperAdmin(app);

    const response = await agent.post('/admin/change-password').send({
      currentPassword: 'admin-pass-123',
      newPassword: 'new-pass-456',
      confirmPassword: 'new-pass-456',
    });
    expect(response.status).toBe(403);
  });

  it('migrates env-only credentials to admin-users.json on password change', async () => {
    const app = await createTestApp();
    const adminUsersPath = path.join(tempRoot, 'storage', 'admin-users.json');
    await fs.remove(adminUsersPath).catch(() => undefined);

    const { agent, csrfToken } = await loginAsSuperAdmin(app);
    const changeResponse = await agent
      .post('/admin/change-password')
      .set('X-CSRF-Token', csrfToken)
      .send({
        currentPassword: 'admin-pass-123',
        newPassword: 'migrated-pass-88',
        confirmPassword: 'migrated-pass-88',
      });
    expect(changeResponse.status).toBe(200);
    expect(await fs.pathExists(adminUsersPath)).toBe(true);

    const usersFile = await fs.readJson(adminUsersPath) as {
      users: Array<{ username: string; passwordHash: string }>;
    };
    expect(usersFile.users).toHaveLength(1);
    expect(usersFile.users[0].username).toBe('admin');
    expect(usersFile.users[0].passwordHash).not.toBe(adminPasswordHash);

    jest.resetModules();
    process.env.MODULEHUB_APP_ROOT = tempRoot;
    const { verifyPassword } = await import('../../../core/src/modules/admin-auth/bcrypt-verify');
    const matchesNew = await verifyPassword('migrated-pass-88', usersFile.users[0].passwordHash);
    expect(matchesNew).toBe(true);
    expect(PATHS.adminUsers).toContain('admin-users.json');
  });
});
