import fs from 'fs';
import os from 'os';
import path from 'path';
import http from 'http';
import express from 'express';
import { ModuleRegistry } from '../core/src/modules/registry';
import { mountBuiltinModules } from '../core/src/public/routes';

/**
 * Perform HTTP GET against ephemeral Express app.
 */
function getFromApp(app: express.Express, urlPath: string): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('invalid server address'));
        return;
      }
      http.get(`http://127.0.0.1:${address.port}${urlPath}`, (res) => {
        let text = '';
        res.on('data', (chunk) => {
          text += chunk.toString();
        });
        res.on('end', () => {
          server.close();
          resolve({ status: res.statusCode ?? 0, text });
        });
      }).on('error', (err) => {
        server.close();
        reject(err);
      });
    });
  });
}

describe('mountBuiltinModules', () => {
  let tmpDir: string;
  let app: express.Express;
  let registry: ModuleRegistry;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-builtin-'));
    const moduleDir = path.join(tmpDir, 'sample-gallery');
    fs.mkdirSync(moduleDir, { recursive: true });
    fs.writeFileSync(path.join(moduleDir, 'index.html'), '<html><body>gallery</body></html>');

    registry = new ModuleRegistry(path.join(tmpDir, 'modules.json'));
    registry.load();
    registry.upsert({
      id: 'sample-gallery',
      name: 'Gallery',
      type: 'builtin',
      version: '1.0.0',
      icon: 'g.png',
      description: 'Gallery',
      status: 'static',
      installPath: moduleDir,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    app = express();
    mountBuiltinModules(app, registry);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('serves built-in index.html', async () => {
    const res = await getFromApp(app, '/pages/sample-gallery/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('gallery');
  });

  it('returns 404 for missing built-in module', async () => {
    const res = await getFromApp(app, '/pages/missing/');
    expect(res.status).toBe(404);
  });
});
