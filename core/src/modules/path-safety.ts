import path from 'path';

/**
 * Resolve safe relative path inside a module directory from ZIP entry name.
 */
export function resolveSafeModulePath(targetDir: string, entryName: string): string | null {
  const normalized = entryName.replace(/\\/g, '/');
  if (normalized.includes('..') || path.isAbsolute(normalized)) {
    return null;
  }
  const destPath = path.resolve(targetDir, normalized);
  const relative = path.relative(path.resolve(targetDir), destPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return null;
  }
  return destPath;
}

/**
 * Check whether archive entry names are safe (no traversal).
 */
export function isZipEntryNameSafe(entryName: string): boolean {
  const normalized = entryName.replace(/\\/g, '/');
  return !normalized.includes('..') && !path.isAbsolute(normalized);
}
