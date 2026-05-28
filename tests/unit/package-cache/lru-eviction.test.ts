import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import {
  evictLeastRecentlyUsedEntries,
  writeCacheEntryMeta,
} from '../../../core/src/modules/package-cache/lru-eviction';

describe('package-cache lru eviction', () => {
  let cacheRoot: string;

  beforeEach(async () => {
    cacheRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'modulehub-lru-'));
  });

  afterEach(async () => {
    await fs.remove(cacheRoot);
  });

  async function seedEntry(hash: string, sizeBytes: number, lastAccessedAt: string): Promise<void> {
    const entryDirectory = path.join(cacheRoot, hash);
    await fs.ensureDir(entryDirectory);
    await fs.writeFile(path.join(entryDirectory, 'blob.bin'), Buffer.alloc(sizeBytes));
    await writeCacheEntryMeta(entryDirectory, {
      hash,
      sizeBytes,
      lastAccessedAt,
      manifestFiles: ['package.json'],
    });
  }

  it('removes oldest cache entries when total size exceeds max bytes', async () => {
    await seedEntry('hash-old', 200, '2026-05-28T08:00:00.000Z');
    await seedEntry('hash-middle', 200, '2026-05-28T09:00:00.000Z');
    await seedEntry('hash-new', 200, '2026-05-28T10:00:00.000Z');

    await evictLeastRecentlyUsedEntries(cacheRoot, 500);

    expect(await fs.pathExists(path.join(cacheRoot, 'hash-old'))).toBe(false);
    expect(await fs.pathExists(path.join(cacheRoot, 'hash-middle'))).toBe(true);
    expect(await fs.pathExists(path.join(cacheRoot, 'hash-new'))).toBe(true);
  });

  it('keeps all entries when total size is under limit', async () => {
    await seedEntry('hash-a', 100, '2026-05-28T08:00:00.000Z');
    await seedEntry('hash-b', 100, '2026-05-28T09:00:00.000Z');

    await evictLeastRecentlyUsedEntries(cacheRoot, 500);

    expect(await fs.pathExists(path.join(cacheRoot, 'hash-a'))).toBe(true);
    expect(await fs.pathExists(path.join(cacheRoot, 'hash-b'))).toBe(true);
  });
});
