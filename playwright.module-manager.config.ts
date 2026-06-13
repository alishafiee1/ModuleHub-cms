import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { defineConfig } from '@playwright/test';

const projectRoot = path.resolve(__dirname);
const modulePasswordHash = '$2b$10$lcJ0IScIDphuAd57ZN9DEOdCmgQ5MSQ48LpVIrxWBSZj7RzfRqfb.';

function prepareModuleManagerE2eRoot(): string {
  if (process.env.MODULEHUB_E2E_MM_ROOT) {
    return process.env.MODULEHUB_E2E_MM_ROOT;
  }

  const layout = {
    version: '1.0',
    tree: {
      id: 'root',
      name: 'Home',
      type: 'folder',
      parentId: null,
      children: [
        {
          id: 'node-mod-mm',
          name: 'E2E Module',
          type: 'module',
          moduleId: 'mod-mm',
          parentId: 'root',
          cardGrid: { col: 0, row: 0, colSpan: 15, rowSpan: 3 },
        },
      ],
    },
    modules: {
      'mod-mm': {
        name: 'E2E Protected',
        status: 'stopped',
        version: '1.0.0',
        docker: false,
        port: 0,
        permissions: 'network',
        resources: { cpu_limit: 0.5, ram_limit_mb: 512, swap_limit_mb: 128 },
        icon: 'fas fa-cube',
        thumbnail: '',
        managementPasswordHash: modulePasswordHash,
      },
    },
  };

  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'modulehub-e2e-mm-'));
  fs.ensureDirSync(path.join(root, 'storage'));
  fs.ensureDirSync(path.join(root, 'standalone-modules', 'mod-mm'));
  fs.writeFileSync(path.join(root, 'standalone-modules', 'mod-mm', 'index.html'), '<html>ok</html>');

  for (const dirName of ['public', 'docs', 'thumbnails']) {
    const source = path.join(projectRoot, dirName);
    const target = path.join(root, dirName);
    if (fs.existsSync(source) && !fs.existsSync(target)) {
      fs.symlinkSync(source, target, 'junction');
    }
  }

  fs.writeJsonSync(path.join(root, 'storage', 'site-layout.json'), layout);
  return root;
}

const e2eAppRoot = prepareModuleManagerE2eRoot();
const e2ePort = process.env.MODULEHUB_E2E_MM_PORT ?? '4012';
const e2eBaseUrl = `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: 'module-manager-flow.spec.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: e2eBaseUrl,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    locale: 'fa-IR',
    channel: 'chrome',
  },
  webServer: {
    command: 'npx tsx core/src/server/index.ts',
    url: `${e2eBaseUrl}/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      MODULEHUB_DEV_SUPER_ADMIN: '0',
      NODE_ENV: 'test',
      MODULEHUB_APP_ROOT: e2eAppRoot,
      MODULEHUB_PORT: e2ePort,
      MODULEHUB_HOST: '127.0.0.1',
    },
  },
});
