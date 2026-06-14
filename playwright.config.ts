import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { defineConfig } from '@playwright/test';

const projectRoot = path.resolve(__dirname);

function prepareE2eAppRoot(): string {
  if (process.env.MODULEHUB_E2E_ROOT) {
    return process.env.MODULEHUB_E2E_ROOT;
  }

  const desktopOnlyLayout = {
    version: '1.0',
    tree: {
      id: 'root',
      name: 'خانه',
      type: 'folder',
      parentId: null,
      children: [
        {
          id: 'node-mod-1',
          name: 'ماژول ۱',
          type: 'module',
          moduleId: 'mod-1',
          parentId: 'root',
          cardGrid: { col: 0, row: 0, colSpan: 15, rowSpan: 3 },
        },
      ],
    },
    modules: {
      'mod-1': {
        name: 'گالری',
        status: 'running',
        version: '1.0.0',
        docker: false,
        port: 4100,
        permissions: 'network',
        resources: { cpu_limit: 0.5, ram_limit_mb: 512, swap_limit_mb: 128 },
        icon: 'fas fa-images',
        thumbnail: '',
      },
    },
  };

  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'modulehub-e2e-'));
  fs.ensureDirSync(path.join(root, 'storage'));

  for (const dirName of ['public', 'docs', 'thumbnails', 'standalone-modules']) {
    const source = path.join(projectRoot, dirName);
    const target = path.join(root, dirName);
    if (fs.existsSync(source) && !fs.existsSync(target)) {
      fs.symlinkSync(source, target, 'junction');
    }
  }

  fs.writeJsonSync(path.join(root, 'storage', 'site-layout.json'), desktopOnlyLayout);
  return root;
}

const e2eAppRoot = prepareE2eAppRoot();
const e2ePort = process.env.MODULEHUB_E2E_PORT ?? '4010';
const e2eBaseUrl = `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: 'tests/e2e',
  /** Uses MODULEHUB_DEV_SUPER_ADMIN=0 — run via playwright.module-manager.config.ts */
  testIgnore: '**/module-manager-flow.spec.ts',
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
    /** Use system Chrome when Playwright CDN browser download is blocked */
    channel: 'chrome',
  },
  webServer: {
    command: 'npx tsx core/src/server/index.ts',
    url: `${e2eBaseUrl}/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      MODULEHUB_DEV_SUPER_ADMIN: '1',
      MODULEHUB_APP_ROOT: e2eAppRoot,
      MODULEHUB_PORT: e2ePort,
      MODULEHUB_HOST: '127.0.0.1',
    },
  },
});
