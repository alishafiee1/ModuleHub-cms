/** Manifest file name inside full backup ZIP archives */
export const FULL_BACKUP_MANIFEST_FILENAME = 'backup-manifest.json';

/** Current full-backup archive format version */
export const FULL_BACKUP_FORMAT_VERSION = 1;

/** Top-level files that must exist in every full backup ZIP */
export const REQUIRED_BACKUP_FILE_ENTRIES = [
  'site-layout.json',
  'system-settings.json',
] as const;

/** Directory prefixes that must contain at least one entry in the ZIP */
export const REQUIRED_BACKUP_DIRECTORY_PREFIXES = [
  'standalone-modules/',
  'thumbnails/',
] as const;

/** Payload written into backup-manifest.json */
export interface FullBackupManifestPayload {
  formatVersion: number;
  createdAt: string;
  requiredEntries: readonly string[];
  requiredDirectoryPrefixes: readonly string[];
}

/**
 * Builds manifest metadata stored at the root of a full backup ZIP.
 * @param createdAt - ISO timestamp for backup creation
 * @returns Manifest object serialized into the ZIP
 */
export function buildFullBackupManifestPayload(createdAt: string): FullBackupManifestPayload {
  return {
    formatVersion: FULL_BACKUP_FORMAT_VERSION,
    createdAt,
    requiredEntries: [...REQUIRED_BACKUP_FILE_ENTRIES],
    requiredDirectoryPrefixes: [...REQUIRED_BACKUP_DIRECTORY_PREFIXES],
  };
}

/**
 * Normalizes ZIP entry paths to forward slashes without leading slash.
 * @param entryName - Raw ZIP entry path
 * @returns Normalized relative path
 */
export function normalizeZipEntryName(entryName: string): string {
  return entryName.replace(/\\/g, '/').replace(/^\/+/, '');
}

/**
 * Returns true when the entry name is safe (no path traversal).
 * @param entryName - ZIP entry path
 * @returns Whether the path is allowed
 */
export function isSafeZipEntryName(entryName: string): boolean {
  const normalized = normalizeZipEntryName(entryName);
  if (!normalized || normalized.includes('..')) {
    return false;
  }
  return true;
}

/**
 * Validates ZIP entry list against manifest requirements.
 * @param entryNames - All entry paths inside the ZIP
 * @returns Error message when invalid, otherwise null
 */
export function validateFullBackupZipEntries(entryNames: string[]): string | null {
  const normalizedEntries = entryNames.map(normalizeZipEntryName).filter((name) => name.length > 0);

  for (const entryName of normalizedEntries) {
    if (!isSafeZipEntryName(entryName)) {
      return `Unsafe ZIP entry: ${entryName}`;
    }
  }

  const entrySet = new Set(normalizedEntries);

  if (!entrySet.has(FULL_BACKUP_MANIFEST_FILENAME)) {
    return `Missing required file: ${FULL_BACKUP_MANIFEST_FILENAME}`;
  }

  for (const requiredFile of REQUIRED_BACKUP_FILE_ENTRIES) {
    if (!entrySet.has(requiredFile)) {
      return `Missing required file: ${requiredFile}`;
    }
  }

  for (const directoryPrefix of REQUIRED_BACKUP_DIRECTORY_PREFIXES) {
    const hasDirectoryContent = normalizedEntries.some(
      (entryName) => entryName.startsWith(directoryPrefix) && entryName.length > directoryPrefix.length,
    );
    if (!hasDirectoryContent) {
      return `Missing directory content for prefix: ${directoryPrefix}`;
    }
  }

  return null;
}

/**
 * Parses and validates backup-manifest.json content from a restore ZIP.
 * @param manifestText - Raw JSON text
 * @returns Parsed manifest or error message
 */
export function parseFullBackupManifest(
  manifestText: string,
): { manifest: FullBackupManifestPayload } | { error: string } {
  let parsed: unknown;

  try {
    parsed = JSON.parse(manifestText) as unknown;
  } catch {
    return { error: 'backup-manifest.json is not valid JSON' };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { error: 'backup-manifest.json must be an object' };
  }

  const record = parsed as Record<string, unknown>;
  if (record.formatVersion !== FULL_BACKUP_FORMAT_VERSION) {
    return { error: `Unsupported backup format version: ${String(record.formatVersion)}` };
  }

  if (typeof record.createdAt !== 'string' || record.createdAt.trim().length === 0) {
    return { error: 'backup-manifest.json missing createdAt' };
  }

  return {
    manifest: {
      formatVersion: FULL_BACKUP_FORMAT_VERSION,
      createdAt: record.createdAt,
      requiredEntries: REQUIRED_BACKUP_FILE_ENTRIES,
      requiredDirectoryPrefixes: REQUIRED_BACKUP_DIRECTORY_PREFIXES,
    },
  };
}
