import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { hashPassword, verifyPassword } from '../../../core/src/modules/admin-auth/bcrypt-verify';
import { resetCmsLoggerForTests } from '../../../core/src/modules/logger';
import {
  authenticateModuleOnAgent,
  createModuleManagerTestAgent,
} from '../../helpers/module-manager-test-agent';
import { createAgentWithCsrf, loginSuperAdminOnAgent } from '../../helpers/admin-test-agent';

describe('PATCH /admin/module/:id management password', () => {
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
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'modulehub-mm-password-'));
    process.env.MODULEHUB_APP_ROOT = tempRoot;
    process.env.MODULEHUB_DEV_SUPER_ADMIN = '0';
    process.env.ADMIN_USERNAME = 'admin';
    process.env.ADMIN_PASSWORD_HASH = adminPasswordHash;

    await fs.ensureDir(path.join(tempRoot, 'storage'));
    await fs.writeJson(path.join(tempRoot, 'storage', 'site-layout.json'), {
      version: '1.0',
      tree: {
        id: 'root',
        name: 'Home',
        type: 'folder',
        parentId: null,
        children: [],
      },
      modules: {
        'mod-pass': {
          name: 'Password test module',
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

  async function createTestApp() {
    const exampleSettings = await fs.readJson(
      path.join(process.cwd(), 'docs', 'system-settings.example.json'),
    );
    await fs.writeJson(path.join(tempRoot, 'storage', 'system-settings.json'), exampleSettings);
    const { createApp } = await import('../../../core/src/server/index');
    return createApp();
  }

  async function loginSuperAdmin(app: Awaited<ReturnType<typeof createTestApp>>) {
    const { agent, csrfToken } = await createAgentWithCsrf(app);
    await loginSuperAdminOnAgent(agent, csrfToken, 'admin', 'admin-pass-123');
    return { agent, csrfToken };
  }

  it('stores managementPasswordHash when Super Admin patches managementPasswordPlain', async () => {
    const app = await createTestApp();
    const { agent, csrfToken } = await loginSuperAdmin(app);

    const response = await agent
      .patch('/admin/module/mod-pass')
      .set('X-CSRF-Token', csrfToken)
      .send({ managementPasswordPlain: 'new-module-pass' });

    expect(response.status).toBe(200);

    const layout = await fs.readJson(path.join(tempRoot, 'storage', 'site-layout.json'));
    const storedHash = layout.modules['mod-pass'].managementPasswordHash as string;
    expect(storedHash).toBeTruthy();
    expect(await verifyPassword('new-module-pass', storedHash)).toBe(true);
  });

  it('clears managementPasswordHash when clearManagementPassword is true', async () => {
    const layoutPath = path.join(tempRoot, 'storage', 'site-layout.json');
    const existingHash = await hashPassword('old-pass');
    const layout = await fs.readJson(layoutPath);
    layout.modules['mod-pass'].managementPasswordHash = existingHash;
    await fs.writeJson(layoutPath, layout);

    const app = await createTestApp();
    const { agent, csrfToken } = await loginSuperAdmin(app);

    const response = await agent
      .patch('/admin/module/mod-pass')
      .set('X-CSRF-Token', csrfToken)
      .send({ clearManagementPassword: true });

    expect(response.status).toBe(200);

    const updated = await fs.readJson(layoutPath);
    expect(updated.modules['mod-pass'].managementPasswordHash).toBeUndefined();
  });

  it('returns 403 when Module Manager patches management password', async () => {
    const layoutPath = path.join(tempRoot, 'storage', 'site-layout.json');
    const layout = await fs.readJson(layoutPath);
    layout.modules['mod-pass'].managementPasswordHash = await hashPassword('module-pass-123');
    await fs.writeJson(layoutPath, layout);

    const app = await createTestApp();
    const { agent, csrfToken } = await createModuleManagerTestAgent(app);
    await authenticateModuleOnAgent(agent, csrfToken, 'mod-pass', 'module-pass-123');

    const response = await agent
      .patch('/admin/module/mod-pass')
      .set('X-CSRF-Token', csrfToken)
      .send({ managementPasswordPlain: 'hacker-pass' });

    expect(response.status).toBe(403);
  });
});
