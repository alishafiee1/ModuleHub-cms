import path from 'path';
import fs from 'fs-extra';
import { getLinkTargetName } from './manifest-scanner';
import type { DependencyKind, ScannedManifest } from './types';

/**
 * Returns absolute cache entry directory for a manifest hash.
 * @param packageCacheRoot - Root cache directory
 * @param hash - SHA256 hex digest
 * @returns Cache entry path
 */
export function getCacheEntryDirectory(packageCacheRoot: string, hash: string): string {
  return path.join(packageCacheRoot, hash);
}

/**
 * Checks whether cache entry exists and contains expected artifact directory.
 * @param packageCacheRoot - Root cache directory
 * @param hash - Manifest hash
 * @param kind - Dependency kind to validate
 * @returns True when cached artifact directory exists
 */
export async function isCacheHit(
  packageCacheRoot: string,
  hash: string,
  kind: DependencyKind,
): Promise<boolean> {
  const entryDirectory = getCacheEntryDirectory(packageCacheRoot, hash);
  const artifactPath = path.join(entryDirectory, getLinkTargetName(kind));
  return fs.pathExists(artifactPath);
}

/**
 * Creates or replaces a symlink from module directory to cached artifact.
 * @param moduleDirectory - Module root directory
 * @param packageCacheRoot - Root cache directory
 * @param hash - Manifest hash
 * @param kind - Dependency kind
 */
export async function linkModuleToCachedArtifact(
  moduleDirectory: string,
  packageCacheRoot: string,
  hash: string,
  kind: DependencyKind,
): Promise<void> {
  const linkName = getLinkTargetName(kind);
  const moduleLinkPath = path.join(moduleDirectory, linkName);
  const cacheArtifactPath = path.join(getCacheEntryDirectory(packageCacheRoot, hash), linkName);

  if (await fs.pathExists(moduleLinkPath)) {
    const stats = await fs.lstat(moduleLinkPath);
    if (stats.isSymbolicLink() || stats.isDirectory()) {
      await fs.remove(moduleLinkPath);
    }
  }

  await fs.ensureSymlink(cacheArtifactPath, moduleLinkPath, process.platform === 'win32' ? 'junction' : 'dir');
}

/**
 * Copies manifest-related lock files into cache entry before install.
 * @param moduleDirectory - Module root
 * @param cacheEntryDirectory - Cache entry directory
 * @param manifest - Primary manifest being installed
 */
export async function copyManifestFilesForInstall(
  moduleDirectory: string,
  cacheEntryDirectory: string,
  manifest: ScannedManifest,
): Promise<void> {
  await fs.ensureDir(cacheEntryDirectory);
  await fs.copy(manifest.absolutePath, path.join(cacheEntryDirectory, manifest.fileName));

  const lockFiles: Record<string, string[]> = {
    'package.json': ['package-lock.json', 'npm-shrinkwrap.json'],
    'composer.json': ['composer.lock'],
    'requirements.txt': [],
  };

  for (const lockFileName of lockFiles[manifest.fileName]) {
    const sourcePath = path.join(moduleDirectory, lockFileName);
    if (await fs.pathExists(sourcePath)) {
      await fs.copy(sourcePath, path.join(cacheEntryDirectory, lockFileName));
    }
  }
}

/**
 * Returns unique dependency kinds present in scanned manifests.
 * @param manifests - Scanned manifests
 * @returns Unique kinds in scan order
 */
export function getUniqueDependencyKinds(manifests: ScannedManifest[]): DependencyKind[] {
  const kinds = manifests.map((manifest) => manifest.kind);
  return [...new Set(kinds)];
}
