import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { resolveSpaFallbackIndexPath } from '../../../core/src/modules/module-manager/spa-fallback';

describe('spa-fallback', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'modulehub-spa-'));
    await fs.writeFile(path.join(tempDir, 'index.html'), '<html></html>');
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('returns index.html for extensionless deep routes', async () => {
    const resolved = await resolveSpaFallbackIndexPath(tempDir, '/app/dashboard');
    expect(resolved).toBe(path.join(tempDir, 'index.html'));
  });

  it('returns null for paths that look like static assets', async () => {
    const resolved = await resolveSpaFallbackIndexPath(tempDir, '/assets/app.js');
    expect(resolved).toBeNull();
  });
});
