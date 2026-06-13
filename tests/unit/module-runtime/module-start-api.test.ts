import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { resetCmsLoggerForTests } from '../../../core/src/modules/logger';
import { clearAllRuntimeHandlesForTests } from '../../../core/src/modules/module-manager/process-registry';
import { createAgentWithCsrf } from '../../helpers/admin-test-agent';

describe('POST /admin/module/:id/start', () => {
  let tempRoot: string;
  const previousAppRoot = process.env.MODULEHUB_APP_ROOT;
  const previousDevAdmin = process.env.MODULEHUB_DEV_SUPER_ADMIN;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'modulehub-start-api-'));
    process.env.MODULEHUB_APP_ROOT = tempRoot;
    process.env.MODULEHUB_DEV_SUPER_ADMIN = '1';
    await fs.ensureDir(path.join(tempRoot, 'storage'));
    await fs.writeJson(path.join(tempRoot, 'storage', 'site-layout.json'), {
      version: '1.0',
      tree: {
        id: 'root',
        name: 'خانه',
        type: 'folder',
        parentId: null,
        children: [
          {
            id: 'node-static',
            name: 'Static',
            type: 'module',
            moduleId: 'mod-static',
            parentId: 'root',
          },
        ],
      },
      modules: {
        'mod-static': {
          name: 'Static demo',
          status: 'stopped',
          version: '1.0.0',
          docker: false,
          port: 0,
          permissions: 'network',
          resources: { cpu_limit: 0.5, ram_limit_mb: 512, swap_limit_mb: 128 },
          icon: 'fas fa-file',
          thumbnail: '',
        },
      },
    });
    const moduleDir = path.join(tempRoot, 'standalone-modules', 'mod-static');
    await fs.ensureDir(moduleDir);
    await fs.writeFile(path.join(moduleDir, 'index.html'), '<html>ok</html>');
    jest.resetModules();
    resetCmsLoggerForTests();
    clearAllRuntimeHandlesForTests();
  });

  afterEach(async () => {
    process.env.MODULEHUB_APP_ROOT = previousAppRoot;
    process.env.MODULEHUB_DEV_SUPER_ADMIN = previousDevAdmin;
    clearAllRuntimeHandlesForTests();
    await fs.remove(tempRoot);
  });

  it('starts static module and returns running status', async () => {
    const { createApp: createFreshApp } = await import('../../../core/src/server/index');
    const app = createFreshApp();
    const { agent, csrfToken } = await createAgentWithCsrf(app);
    const response = await agent
      .post('/admin/module/mod-static/start')
      .set('X-CSRF-Token', csrfToken);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('running');

    const layout = await fs.readJson(path.join(tempRoot, 'storage', 'site-layout.json'));
    expect(layout.modules['mod-static'].status).toBe('running');
  });

  it('returns 409 when concurrent limit reached', async () => {
    await fs.writeJson(path.join(tempRoot, 'storage', 'system-settings.json'), {
      maxZipUploadMb: 200,
      portRangeStart: 4100,
      portRangeEnd: 4999,
      defaultModuleResources: {
        cpu_limit: 0.5,
        ram_limit_mb: 512,
        swap_limit_mb: 128,
        disk_iops: 100,
        net_mbps: 10,
      },
      maxConcurrentRunningModules: 0,
      logRetentionDays: 14,
      maxPackageCacheGb: 5,
      dependencyInstallTimeoutSec: 600,
      autoRestartOnCrash: false,
      autoRestartMaxAttemptsPerHour: 3,
      uploadTempCleanupHours: 24,
      logViewerMaxLines: 50,
      sessionTtlHours: 8,
      loginRateLimitPerMinute: 5,
      moduleManagerSessionTtlHours: 4,
      modulePasswordMaxAttempts: 5,
      modulePasswordLockoutMinutes: 15,
    });

    const { createApp: createFreshApp } = await import('../../../core/src/server/index');
    const app = createFreshApp();
    const { agent, csrfToken } = await createAgentWithCsrf(app);
    const response = await agent
      .post('/admin/module/mod-static/start')
      .set('X-CSRF-Token', csrfToken);
    expect(response.status).toBe(409);
  });
});
