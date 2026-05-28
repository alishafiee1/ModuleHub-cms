import path from 'path';
import fs from 'fs-extra';
import type { CacheEntryMeta } from './types';

const CACHE_META_FILE = '.cache-meta.json';

/**
 * Returns metadata file path inside a cache entry directory.
 * @param cacheEntryDirectory - Absolute path to `/var/cache/modulehub/pkg/<hash>/`
 * @returns Path to metadata JSON file
 */
export function getCacheMetaFilePath(cacheEntryDirectory: string): string {
  return path.join(cacheEntryDirectory, CACHE_META_FILE);
}

/**
 * Reads cache entry metadata when present.
 * @param cacheEntryDirectory - Cache entry directory
 * @returns Parsed metadata or null
 */
export async function readCacheEntryMeta(cacheEntryDirectory: string): Promise<CacheEntryMeta | null> {
  const metaPath = getCacheMetaFilePath(cacheEntryDirectory);
  if (!(await fs.pathExists(metaPath))) {
    return null;
  }
  return fs.readJson(metaPath) as Promise<CacheEntryMeta>;
}

/**
 * Writes cache entry metadata atomically.
 * @param cacheEntryDirectory - Cache entry directory
 * @param meta - Metadata payload
 */
export async function writeCacheEntryMeta(
  cacheEntryDirectory: string,
  meta: CacheEntryMeta,
): Promise<void> {
  await fs.ensureDir(cacheEntryDirectory);
  await fs.writeJson(getCacheMetaFilePath(cacheEntryDirectory), meta, { spaces: 2 });
}

/**
 * Computes recursive byte size of a directory tree.
 * @param directoryPath - Root directory
 * @returns Total size in bytes
 */
export async function computeDirectorySizeBytes(directoryPath: string): Promise<number> {
  if (!(await fs.pathExists(directoryPath))) {
    return 0;
  }
  const stats = await fs.stat(directoryPath);
  if (!stats.isDirectory()) {
    return stats.size;
  }

  let total = 0;
  const entries = await fs.readdir(directoryPath);
  for (const entryName of entries) {
    const entryPath = path.join(directoryPath, entryName);
    const entryStats = await fs.stat(entryPath);
    if (entryStats.isDirectory()) {
      total += await computeDirectorySizeBytes(entryPath);
    } else {
      total += entryStats.size;
    }
  }
  return total;
}

/**
 * Lists cache entry directories that contain metadata.
 * @param packageCacheRoot - Root cache directory
 * @returns Array of entry paths with metadata
 */
export async function listCacheEntries(packageCacheRoot: string): Promise<CacheEntryMeta[]> {
  if (!(await fs.pathExists(packageCacheRoot))) {
    return [];
  }

  const entries = await fs.readdir(packageCacheRoot);
  const metas: CacheEntryMeta[] = [];

  for (const entryName of entries) {
    const entryPath = path.join(packageCacheRoot, entryName);
    const entryStats = await fs.stat(entryPath);
    if (!entryStats.isDirectory()) {
      continue;
    }
    const meta = await readCacheEntryMeta(entryPath);
    if (meta) {
      metas.push(meta);
    }
  }

  return metas;
}

/**
 * Removes oldest cache entries until total size is under the byte limit.
 * @param packageCacheRoot - Root cache directory
 * @param maxBytes - Maximum allowed total cache size
 */
export async function evictLeastRecentlyUsedEntries(
  packageCacheRoot: string,
  maxBytes: number,
): Promise<void> {
  const metas = await listCacheEntries(packageCacheRoot);
  let totalBytes = metas.reduce((sum, meta) => sum + meta.sizeBytes, 0);
  const remaining = [...metas];

  while (totalBytes > maxBytes && remaining.length > 0) {
    remaining.sort((left, right) => left.lastAccessedAt.localeCompare(right.lastAccessedAt));
    const oldest = remaining.shift();
    if (!oldest) {
      break;
    }
    const entryPath = path.join(packageCacheRoot, oldest.hash);
    await fs.remove(entryPath);
    totalBytes -= oldest.sizeBytes;
  }
}

/**
 * Updates last-access timestamp for a cache entry and persists metadata.
 * @param cacheEntryDirectory - Cache entry directory
 * @param meta - Existing metadata
 */
export async function touchCacheEntryMeta(
  cacheEntryDirectory: string,
  meta: CacheEntryMeta,
): Promise<void> {
  const updated: CacheEntryMeta = {
    ...meta,
    lastAccessedAt: new Date().toISOString(),
  };
  await writeCacheEntryMeta(cacheEntryDirectory, updated);
}
