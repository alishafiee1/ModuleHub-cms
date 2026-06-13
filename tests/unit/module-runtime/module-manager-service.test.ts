import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { resetCmsLoggerForTests } from '../../../core/src/modules/logger';
import { clearAllRuntimeHandlesForTests } from '../../../core/src/modules/module-manager/process-registry';

let releaseBlockedBackendStart: (() => void) | undefined;
const blockedBackendStart = new Promise<void>((resolve) => {
  releaseBlockedBackendStart = resolve;
});

jest.mock('../../../core/src/modules/module-manager/backend-runner', () => {
  const actual = jest.requireActual<typeof import('../../../core/src/modules/module-manager/backend-runner')>(
    '../../../core/src/modules/module-manager/backend-runner',
  );
  return {
    ...actual,
    startBackendModule: jest.fn(async (moduleId: string) => {
      await blockedBackendStart;
      return {
        moduleId,
        kind: 'backend' as const,
        startedAt: new Date().toISOString(),
        processId: 12_345,
      };
    }),
    isBackendProcessRunning: jest.fn(async () => true),
    stopBackendModule: jest.fn(async () => undefined),
  };
});

describe('startModuleById concurrent start lock', () => {
  let tempRoot: string;
  const previousAppRoot = process.env.MODULEHUB_APP_ROOT;

  beforeAll(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'modulehub-start-lock-'));
    process.env.MODULEHUB_APP_ROOT = tempRoot;

    const exampleSettings = await fs.readJson(
      path.join(process.cwd(), 'docs', 'system-settings.example.json'),
    );

    await fs.ensureDir(path.join(tempRoot, 'storage'));
    await fs.writeJson(path.join(tempRoot, 'storage', 'system-settings.json'), exampleSettings);
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
        'mod-backend': {
          name: 'Backend demo',
          status: 'stopped',
          version: '1.0.0',
          docker: false,
          port: 4111,
          permissions: 'network',
          resources: {
            cpu_limit: 0.5,
            ram_limit_mb: 512,
            swap_limit_mb: 128,
            disk_iops: 100,
            net_mbps: 10,
          },
          icon: 'fas fa-server',
          thumbnail: '',
        },
      },
    });

    const moduleDir = path.join(tempRoot, 'standalone-modules', 'mod-backend');
    await fs.ensureDir(moduleDir);
    await fs.writeJson(path.join(moduleDir, 'package.json'), {
      name: 'backend-demo',
      main: 'server.js',
    });
    await fs.writeFile(path.join(moduleDir, 'server.js'), 'console.log("ok");');
    resetCmsLoggerForTests();
    clearAllRuntimeHandlesForTests();
  });

  afterAll(async () => {
    process.env.MODULEHUB_APP_ROOT = previousAppRoot;
    clearAllRuntimeHandlesForTests();
    await fs.remove(tempRoot);
  });

  it('rejects a second concurrent start for the same module', async () => {
    const backendRunner = await import('../../../core/src/modules/module-manager/backend-runner');
    const { startModuleById, clearStartingModuleIdsForTests } = await import(
      '../../../core/src/modules/module-manager/module-manager-service'
    );
    clearStartingModuleIdsForTests();
    jest.mocked(backendRunner.startBackendModule).mockClear();

    const firstStart = startModuleById('mod-backend');
    const secondResult = await startModuleById('mod-backend');

    expect(secondResult.message).toBe('Module is already starting');
    expect(secondResult.status).toBe('stopped');
    expect(backendRunner.startBackendModule).not.toHaveBeenCalled();

    releaseBlockedBackendStart?.();
    const firstResult = await firstStart;
    expect(firstResult.status).toBe('running');
    expect(backendRunner.startBackendModule).toHaveBeenCalledTimes(1);
  });
});
