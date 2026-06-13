import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import request from 'supertest';
import { hashPassword } from '../../../core/src/modules/admin-auth/bcrypt-verify';
import { resetCmsLoggerForTests } from '../../../core/src/modules/logger';
import { clearAllRuntimeHandlesForTests } from '../../../core/src/modules/module-manager/process-registry';
import { resetModuleLockoutStoreForTests } from '../../../core/src/modules/admin-auth/module-lockout';
import {
  authenticateModuleOnAgent,
  createModuleManagerTestAgent,
} from '../../helpers/module-manager-test-agent';
import { createAgentWithCsrf, loginSuperAdminOnAgent } from '../../helpers/admin-test-agent';

describe('module-manager-auth HTTP routes', () => {
  let tempRoot: string;
  let modulePasswordHash: string;
  const previousAppRoot = process.env.MODULEHUB_APP_ROOT;
  const previousDevFlag = process.env.MODULEHUB_DEV_SUPER_ADMIN;
  const previousNodeEnv = process.env.NODE_ENV;

  jest.setTimeout(30_000);

  beforeAll(async () => {
    modulePasswordHash = await hashPassword('module-pass-123');
  });

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'modulehub-mm-auth-'));
    process.env.MODULEHUB_APP_ROOT = tempRoot;
    process.env.MODULEHUB_DEV_SUPER_ADMIN = '0';
    process.env.NODE_ENV = 'test';

    await fs.ensureDir(path.join(tempRoot, 'storage'));
    await fs.writeJson(path.join(tempRoot, 'storage', 'site-layout.json'), {
      version: '1.0',
      tree: {
        id: 'root',
        name: 'Home',
        type: 'folder',
        parentId: null,
        children: [
          {
            id: 'node-mod-1',
            name: 'Protected',
            type: 'module',
            moduleId: 'mod-1',
            parentId: 'root',
          },
          {
            id: 'node-mod-2',
            name: 'Open',
            type: 'module',
            moduleId: 'mod-2',
            parentId: 'root',
          },
        ],
      },
      modules: {
        'mod-1': {
          name: 'Protected module',
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
        'mod-2': {
          name: 'Open module',
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
          icon: 'fas fa-cube',
          thumbnail: '',
        },
      },
    });

    const staticDir = path.join(tempRoot, 'standalone-modules', 'mod-1');
    await fs.ensureDir(staticDir);
    await fs.writeFile(path.join(staticDir, 'index.html'), '<html>ok</html>');
    const staticDir2 = path.join(tempRoot, 'standalone-modules', 'mod-2');
    await fs.ensureDir(staticDir2);
    await fs.writeFile(path.join(staticDir2, 'index.html'), '<html>ok</html>');

    resetModuleLockoutStoreForTests();
    clearAllRuntimeHandlesForTests();
    jest.resetModules();
    resetCmsLoggerForTests();
  });

  afterEach(async () => {
    process.env.MODULEHUB_APP_ROOT = previousAppRoot;
    process.env.MODULEHUB_DEV_SUPER_ADMIN = previousDevFlag;
    process.env.NODE_ENV = previousNodeEnv;
    clearAllRuntimeHandlesForTests();
    await fs.remove(tempRoot);
  });

  async function createTestApp(settingsOverride: Record<string, unknown> = {}) {
    const exampleSettings = await fs.readJson(
      path.join(process.cwd(), 'docs', 'system-settings.example.json'),
    );
    await fs.writeJson(path.join(tempRoot, 'storage', 'system-settings.json'), {
      ...exampleSettings,
      modulePasswordMaxAttempts: 3,
      modulePasswordLockoutMinutes: 15,
      ...settingsOverride,
    });
    const { createApp } = await import('../../../core/src/server/index');
    return createApp();
  }

  async function loginModuleManager(app: Awaited<ReturnType<typeof createTestApp>>, moduleId = 'mod-1') {
    const { agent, csrfToken } = await createModuleManagerTestAgent(app);
    await authenticateModuleOnAgent(agent, csrfToken, moduleId, 'module-pass-123');
    return { agent, csrfToken };
  }

  it('authenticates module password and exposes managedModuleIds in auth status', async () => {
    const app = await createTestApp();
    const { agent } = await loginModuleManager(app);

    const statusResponse = await agent.get('/api/auth/status');
    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.isSuperAdmin).toBe(false);
    expect(statusResponse.body.managedModuleIds).toContain('mod-1');
  });

  it('returns 401 for wrong module password', async () => {
    const app = await createTestApp();
    const { agent, csrfToken } = await createModuleManagerTestAgent(app);

    const response = await agent
      .post('/admin/module/mod-1/auth')
      .set('X-CSRF-Token', csrfToken)
      .send({ password: 'wrong-password' });

    expect(response.status).toBe(401);
    expect(response.body.error).toContain('Invalid module password');
  });

  it('returns 429 after too many failed module auth attempts', async () => {
    const app = await createTestApp();
    const { agent, csrfToken } = await createModuleManagerTestAgent(app);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await agent
        .post('/admin/module/mod-1/auth')
        .set('X-CSRF-Token', csrfToken)
        .send({ password: 'wrong' });
    }

    const locked = await agent
      .post('/admin/module/mod-1/auth')
      .set('X-CSRF-Token', csrfToken)
      .send({ password: 'wrong' });

    expect(locked.status).toBe(429);
    expect(locked.body.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('allows Module Manager to start own module', async () => {
    const app = await createTestApp();
    const { agent, csrfToken } = await loginModuleManager(app);

    const response = await agent
      .post('/admin/module/mod-1/start')
      .set('X-CSRF-Token', csrfToken);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('running');
  });

  it('returns 403 when Module Manager starts another module', async () => {
    const app = await createTestApp();
    const { agent, csrfToken } = await loginModuleManager(app);

    const response = await agent
      .post('/admin/module/mod-2/start')
      .set('X-CSRF-Token', csrfToken);

    expect(response.status).toBe(403);
  });

  it('returns 403 when Module Manager deletes a module', async () => {
    const app = await createTestApp();
    const { agent, csrfToken } = await loginModuleManager(app);

    const response = await agent
      .delete('/admin/module/mod-1')
      .set('X-CSRF-Token', csrfToken);

    expect(response.status).toBe(403);
  });

  it('returns 403 when Module Manager opens global settings data', async () => {
    const app = await createTestApp();
    const { agent } = await loginModuleManager(app);

    const response = await agent.get('/admin/settings/data');
    expect(response.status).toBe(403);
  });

  it('returns 403 when Module Manager requests full backup', async () => {
    const app = await createTestApp();
    const { agent, csrfToken } = await loginModuleManager(app);

    const response = await agent
      .post('/admin/backup')
      .set('X-CSRF-Token', csrfToken);

    expect(response.status).toBe(403);
  });

  it('allows Super Admin to start module without module password', async () => {
    process.env.ADMIN_USERNAME = 'admin';
    process.env.ADMIN_PASSWORD_HASH = await hashPassword('admin-pass-123');
    jest.resetModules();
    resetCmsLoggerForTests();
    const freshApp = await createTestApp();

    const { agent, csrfToken } = await createAgentWithCsrf(freshApp);
    await loginSuperAdminOnAgent(agent, csrfToken, 'admin', 'admin-pass-123');

    const response = await agent
      .post('/admin/module/mod-1/start')
      .set('X-CSRF-Token', csrfToken);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('running');
  });

  it('returns 401 for admin settings page without session', async () => {
    const app = await createTestApp();
    const response = await request(app).get('/admin/settings.html');
    expect(response.status).toBe(401);
  });
});
