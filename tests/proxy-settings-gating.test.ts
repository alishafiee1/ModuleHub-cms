import express from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { ReverseProxyManager } from '../core/src/proxy/reverse-proxy-manager';
import { ModuleRegistry } from '../core/src/modules/registry';

describe('proxy settings gating', () => {
  let tmpDir: string;
  let registry: ModuleRegistry;
  let proxyManager: ReverseProxyManager;
  let server: ReturnType<express.Application['listen']>;
  let baseUrl: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-proxy-gate-'));
    registry = new ModuleRegistry(path.join(tmpDir, 'modules.json'));
    registry.load();
    proxyManager = new ReverseProxyManager(registry);

    const app = express();
    proxyManager.registerRoute('demo-api', '/modules/demo-api/', 32775, ['api']);
    proxyManager.mount(app);
    app.get('/health-check', (_req, res) => res.json({ ok: true }));

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        const port = typeof address === 'object' && address ? address.port : 0;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function registerModule(status: 'settings_pending' | 'running' | 'stopped'): void {
    registry.upsert({
      id: 'demo-api',
      name: 'Demo API',
      type: 'standalone',
      version: '1.0.0',
      icon: 'a.png',
      description: 'API',
      status,
      installPath: '/tmp/demo-api',
      proxyPrefix: '/modules/demo-api/',
      proxyPaths: ['api'],
      internalPort: 3000,
      hostPort: status === 'running' ? 32775 : undefined,
      createdAt: '',
      updatedAt: '',
    });
  }

  it('returns 503 with settings message when settings_pending', async () => {
    registerModule('settings_pending');
    const res = await fetch(`${baseUrl}/modules/demo-api/api/health`);
    expect(res.status).toBe(503);
    const body = (await res.json()) as { settingsPending?: boolean; message?: string };
    expect(body.settingsPending).toBe(true);
    expect(body.message).toMatch(/settings/i);
  });

  it('allows proxy attempt when running', async () => {
    registerModule('running');
    const res = await fetch(`${baseUrl}/modules/demo-api/api/health`);
    expect(res.status).not.toBe(503);
  });
});
