import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { installModuleDependencies } from '../../../core/src/modules/package-cache/cache-manager';
import { computeManifestHash } from '../../../core/src/modules/package-cache/hash';
import { writeCacheEntryMeta } from '../../../core/src/modules/package-cache/lru-eviction';
import { scanDependencyManifests } from '../../../core/src/modules/package-cache/manifest-scanner';
import { DEFAULT_SYSTEM_SETTINGS } from '../../../core/src/modules/system-settings';
import type { CommandRunner } from '../../../core/src/modules/package-cache/types';

describe('package-cache cache lookup', () => {
  let tempRoot: string;
  let moduleDirectory: string;
  let cacheRoot: string;
  const previousAppRoot = process.env.MODULEHUB_APP_ROOT;
  const previousCacheDir = process.env.MODULEHUB_PACKAGE_CACHE_DIR;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'modulehub-cache-'));
    moduleDirectory = path.join(tempRoot, 'module');
    cacheRoot = path.join(tempRoot, 'cache');
    process.env.MODULEHUB_APP_ROOT = tempRoot;
    process.env.MODULEHUB_PACKAGE_CACHE_DIR = cacheRoot;
    await fs.ensureDir(moduleDirectory);
    await fs.writeFile(
      path.join(moduleDirectory, 'package.json'),
      '{"name":"cache-test","dependencies":{"left-pad":"1.0.1"}}',
    );
    jest.resetModules();
  });

  afterEach(async () => {
    process.env.MODULEHUB_APP_ROOT = previousAppRoot;
    process.env.MODULEHUB_PACKAGE_CACHE_DIR = previousCacheDir;
    await fs.remove(tempRoot);
  });

  it('creates symlink on cache hit without running install', async () => {
    const manifests = await scanDependencyManifests(moduleDirectory);
    const hash = computeManifestHash(manifests);
    expect(hash).not.toBeNull();

    const cacheEntryDirectory = path.join(cacheRoot, hash as string);
    const cachedNodeModules = path.join(cacheEntryDirectory, 'node_modules');
    await fs.ensureDir(cachedNodeModules);
    await fs.writeFile(path.join(cachedNodeModules, 'marker.txt'), 'cached');
    await writeCacheEntryMeta(cacheEntryDirectory, {
      hash: hash as string,
      lastAccessedAt: new Date().toISOString(),
      sizeBytes: 128,
      manifestFiles: ['package.json'],
    });

    const runner: CommandRunner = {
      run: jest.fn().mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' }),
    };

    const result = await installModuleDependencies(
      moduleDirectory,
      DEFAULT_SYSTEM_SETTINGS,
      runner,
    );

    expect(result.installed).toBe(false);
    expect(result.linkedTargets).toContain('node_modules');
    expect(runner.run).not.toHaveBeenCalled();
    expect(await fs.pathExists(path.join(moduleDirectory, 'node_modules', 'marker.txt'))).toBe(true);
  });

  it('runs install on cache miss and links node_modules', async () => {
    const runner: CommandRunner = {
      run: jest.fn().mockImplementation(async (command: string, cwd: string) => {
        if (command.includes(' install ') && command.includes('npm')) {
          await fs.ensureDir(path.join(cwd, 'node_modules'));
          await fs.writeFile(path.join(cwd, 'node_modules', 'installed.txt'), 'ok');
        }
        return { exitCode: 0, stdout: 'ok', stderr: '' };
      }),
    };

    const result = await installModuleDependencies(
      moduleDirectory,
      DEFAULT_SYSTEM_SETTINGS,
      runner,
    );

    expect(result.installed).toBe(true);
    expect(result.linkedTargets).toContain('node_modules');
    expect(runner.run).toHaveBeenCalled();
    expect(await fs.pathExists(path.join(moduleDirectory, 'node_modules', 'installed.txt'))).toBe(true);
  });
});
