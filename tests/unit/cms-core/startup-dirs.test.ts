import fs from 'fs-extra';
import os from 'os';
import path from 'path';

describe('ensureRequiredDirectories', () => {
  let tempRoot: string;
  const previousAppRoot = process.env.MODULEHUB_APP_ROOT;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'modulehub-dirs-'));
    process.env.MODULEHUB_APP_ROOT = tempRoot;
    jest.resetModules();
  });

  afterEach(async () => {
    process.env.MODULEHUB_APP_ROOT = previousAppRoot;
    await fs.remove(tempRoot);
  });

  it('creates storage/logs, storage/backups, and standalone-modules', async () => {
    const { ensureRequiredDirectories } = await import(
      '../../../core/src/bootstrap/ensure-directories'
    );
    await ensureRequiredDirectories();

    expect(await fs.pathExists(path.join(tempRoot, 'storage', 'logs'))).toBe(true);
    expect(await fs.pathExists(path.join(tempRoot, 'storage', 'backups'))).toBe(true);
    expect(await fs.pathExists(path.join(tempRoot, 'standalone-modules'))).toBe(true);
  });
});
