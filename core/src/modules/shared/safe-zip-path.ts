import path from 'path';

/**
 * Normalizes ZIP entry paths to forward slashes.
 * @param entryName - Raw ZIP entry path
 * @returns Normalized path for validation and extraction
 */
export function normalizeZipEntryName(entryName: string): string {
  return path.posix.normalize(entryName.replace(/\\/g, '/')).replace(/^\.\//, '');
}

/**
 * Returns true when the ZIP entry is relative and does not traverse upward.
 * @param entryName - Raw ZIP entry path
 * @returns Whether the path is safe to extract under a target directory
 */
export function isSafeZipEntryName(entryName: string): boolean {
  const slashNormalized = entryName.replace(/\\/g, '/');
  if (
    !slashNormalized
    || path.isAbsolute(entryName)
    || path.posix.isAbsolute(slashNormalized)
    || /^[a-zA-Z]:/.test(slashNormalized)
  ) {
    return false;
  }

  const normalized = normalizeZipEntryName(entryName);
  if (!normalized || normalized === '.') {
    return false;
  }

  return !normalized.split('/').includes('..');
}

/**
 * Resolves a ZIP entry target and asserts it stays under the extraction root.
 * @param targetDirectory - Directory where the archive is extracted
 * @param entryName - Raw ZIP entry path
 * @returns Absolute filesystem path for the entry
 */
export function resolveSafeZipEntryTarget(targetDirectory: string, entryName: string): string {
  if (!isSafeZipEntryName(entryName)) {
    throw new Error(`Unsafe path in ZIP: ${entryName}`);
  }

  const targetRoot = path.resolve(targetDirectory);
  const resolved = path.resolve(targetRoot, normalizeZipEntryName(entryName));
  const relative = path.relative(targetRoot, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Unsafe path in ZIP: ${entryName}`);
  }
  return resolved;
}
