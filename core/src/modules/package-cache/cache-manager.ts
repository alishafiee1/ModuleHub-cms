import path from 'path';
import fs from 'fs-extra';
import { PATHS } from '../../config/paths';
import { getCmsLogger } from '../logger';
import type { SystemSettings } from '../system-settings/types';
import {
  copyManifestFilesForInstall,
  getCacheEntryDirectory,
  isCacheHit,
  linkModuleToCachedArtifact,
} from './cache-lookup';
import { computeManifestHash } from './hash';
import {
  computeDirectorySizeBytes,
  evictLeastRecentlyUsedEntries,
  readCacheEntryMeta,
  touchCacheEntryMeta,
  writeCacheEntryMeta,
} from './lru-eviction';
import { getLinkTargetName, scanDependencyManifests } from './manifest-scanner';
import {
  buildComposerInstallCommand,
  buildNpmInstallCommand,
  buildPipInstallCommand,
  runInstallWithNetworkToggle,
  runShellCommand,
} from './network-install';
import type {
  CacheEntryMeta,
  CommandRunner,
  DependencyInstallResult,
  DependencyKind,
  ScannedManifest,
} from './types';

/**
 * Resolves install command for a dependency kind.
 * @param kind - Dependency ecosystem
 * @returns Shell command executed inside cache entry directory
 */
function getInstallCommandForKind(kind: DependencyKind): string {
  if (kind === 'npm') {
    return buildNpmInstallCommand();
  }
  if (kind === 'pip') {
    return buildPipInstallCommand();
  }
  return buildComposerInstallCommand();
}

/**
 * Finds scanned manifest for a dependency kind.
 * @param manifests - All scanned manifests
 * @param kind - Target dependency kind
 * @returns Matching manifest or undefined
 */
function findManifestForKind(
  manifests: ScannedManifest[],
  kind: DependencyKind,
): ScannedManifest | undefined {
  return manifests.find((manifest) => manifest.kind === kind);
}

/**
 * Installs one dependency kind into cache entry directory on cache miss.
 * @param moduleDirectory - Module root directory
 * @param cacheEntryDirectory - Target cache entry path
 * @param manifest - Manifest for this kind
 * @param settings - System settings
 * @param runner - Injectable command runner
 */
async function installKindIntoCache(
  moduleDirectory: string,
  cacheEntryDirectory: string,
  manifest: ScannedManifest,
  settings: SystemSettings,
  runner: CommandRunner,
): Promise<void> {
  await copyManifestFilesForInstall(moduleDirectory, cacheEntryDirectory, manifest);
  const command = getInstallCommandForKind(manifest.kind);
  const result = await runInstallWithNetworkToggle(command, cacheEntryDirectory, settings, runner);

  if (result.exitCode !== 0) {
    throw new Error(
      `${manifest.kind} install failed (exit ${result.exitCode}): ${result.stderr || result.stdout}`,
    );
  }

  const artifactPath = path.join(cacheEntryDirectory, getLinkTargetName(manifest.kind));
  if (!(await fs.pathExists(artifactPath))) {
    throw new Error(`${manifest.kind} install completed but ${getLinkTargetName(manifest.kind)} missing`);
  }
}

/**
 * Persists cache metadata and runs LRU eviction when over limit.
 * @param cacheEntryDirectory - Cache entry directory
 * @param hash - Manifest hash
 * @param manifests - Scanned manifests
 * @param settings - System settings
 */
async function finalizeCacheEntry(
  cacheEntryDirectory: string,
  hash: string,
  manifests: ScannedManifest[],
  settings: SystemSettings,
): Promise<void> {
  const sizeBytes = await computeDirectorySizeBytes(cacheEntryDirectory);
  const meta: CacheEntryMeta = {
    hash,
    lastAccessedAt: new Date().toISOString(),
    sizeBytes,
    manifestFiles: manifests.map((manifest) => manifest.fileName),
  };
  await writeCacheEntryMeta(cacheEntryDirectory, meta);

  const maxBytes = settings.maxPackageCacheGb * 1024 * 1024 * 1024;
  await evictLeastRecentlyUsedEntries(PATHS.packageCacheDirectory, maxBytes);
}

/**
 * Links all dependency kinds for a module from cache and updates metadata access time.
 * @param moduleDirectory - Module root
 * @param hash - Manifest hash
 * @param kinds - Dependency kinds to link
 * @param packageCacheRoot - Cache root directory
 */
async function linkAllKindsFromCache(
  moduleDirectory: string,
  hash: string,
  kinds: DependencyKind[],
  packageCacheRoot: string,
): Promise<string[]> {
  const linkedTargets: string[] = [];
  for (const kind of kinds) {
    await linkModuleToCachedArtifact(moduleDirectory, packageCacheRoot, hash, kind);
    linkedTargets.push(getLinkTargetName(kind));
  }

  const cacheEntryDirectory = getCacheEntryDirectory(packageCacheRoot, hash);
  const meta = await readCacheEntryMeta(cacheEntryDirectory);
  if (meta) {
    await touchCacheEntryMeta(cacheEntryDirectory, meta);
  }

  return linkedTargets;
}

/**
 * Installs or links module dependencies using centralized package cache.
 * @param moduleDirectory - Absolute path to module root
 * @param settings - System settings (cache size, network interface, timeout)
 * @param runner - Optional injectable command runner for tests
 * @returns Install/link result summary
 */
export async function installModuleDependencies(
  moduleDirectory: string,
  settings: SystemSettings,
  runner: CommandRunner = { run: runShellCommand },
): Promise<DependencyInstallResult> {
  const logger = getCmsLogger();
  const manifests = await scanDependencyManifests(moduleDirectory);
  const hash = computeManifestHash(manifests);

  if (!hash) {
    return {
      hash: null,
      linkedTargets: [],
      installed: false,
      skipped: true,
      message: 'No dependency manifests found',
    };
  }

  const packageCacheRoot = PATHS.packageCacheDirectory;
  await fs.ensureDir(packageCacheRoot);

  const kinds = [...new Set(manifests.map((manifest) => manifest.kind))];
  const allKindsCached = await Promise.all(
    kinds.map((kind) => isCacheHit(packageCacheRoot, hash, kind)),
  );
  const isFullHit = allKindsCached.every(Boolean);

  if (isFullHit) {
    const linkedTargets = await linkAllKindsFromCache(
      moduleDirectory,
      hash,
      kinds,
      packageCacheRoot,
    );
    logger.info('Package cache hit', { hash, linkedTargets });
    return {
      hash,
      linkedTargets,
      installed: false,
      skipped: false,
      message: 'Linked from package cache',
    };
  }

  const cacheEntryDirectory = getCacheEntryDirectory(packageCacheRoot, hash);
  await fs.ensureDir(cacheEntryDirectory);

  for (const kind of kinds) {
    const manifest = findManifestForKind(manifests, kind);
    if (!manifest) {
      continue;
    }
    const cached = await isCacheHit(packageCacheRoot, hash, kind);
    if (cached) {
      continue;
    }
    await installKindIntoCache(
      moduleDirectory,
      cacheEntryDirectory,
      manifest,
      settings,
      runner,
    );
  }

  await finalizeCacheEntry(cacheEntryDirectory, hash, manifests, settings);
  const linkedTargets = await linkAllKindsFromCache(
    moduleDirectory,
    hash,
    kinds,
    packageCacheRoot,
  );

  logger.info('Package cache miss — installed and linked', { hash, linkedTargets });
  return {
    hash,
    linkedTargets,
    installed: true,
    skipped: false,
    message: 'Installed into package cache and linked',
  };
}
