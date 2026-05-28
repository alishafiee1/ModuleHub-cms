import AdmZip from 'adm-zip';
import fs from 'fs-extra';
import path from 'path';
import { PATHS } from '../../config/paths';
import {
  buildFullBackupManifestPayload,
  FULL_BACKUP_MANIFEST_FILENAME,
} from './backup-manifest';
import { addDirectoryTreeToZip } from './backup-zip-helpers';

export type FullBackupLabel = 'full' | 'pre-restore';

/** Result of creating a full backup on disk */
export interface CreateFullBackupResult {
  fileName: string;
  filePath: string;
  createdAt: string;
}

/**
 * Formats a timestamp for backup filenames (filesystem-safe).
 * @param date - Backup creation time
 * @returns Timestamp segment such as 2026-05-28T14-30-00
 */
export function formatBackupTimestamp(date: Date): string {
  return date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

/**
 * Builds a backup ZIP file name from label and timestamp.
 * @param label - Backup kind (full or pre-restore safety copy)
 * @param timestampSegment - Filesystem-safe timestamp
 * @returns ZIP file name
 */
export function buildFullBackupFileName(label: FullBackupLabel, timestampSegment: string): string {
  const prefix = label === 'pre-restore' ? 'modulehub-pre-restore' : 'modulehub-full';
  return `${prefix}-${timestampSegment}.zip`;
}

/**
 * Asserts a backup file name is safe for read/write under storage/backups.
 * @param fileName - Requested backup file name
 */
export function assertSafeBackupFileName(fileName: string): void {
  if (
    !fileName.endsWith('.zip')
    || fileName.includes('..')
    || fileName.includes('/')
    || fileName.includes('\\')
    || path.isAbsolute(fileName)
  ) {
    throw new Error('Invalid backup file name');
  }
}

/**
 * Creates a full CMS backup ZIP and writes it to storage/backups.
 * @param options - Optional label for filename prefix
 * @returns Written backup metadata
 */
export async function createFullBackup(
  options: { label?: FullBackupLabel } = {},
): Promise<CreateFullBackupResult> {
  const label = options.label ?? 'full';
  const createdAtDate = new Date();
  const createdAt = createdAtDate.toISOString();
  const timestampSegment = formatBackupTimestamp(createdAtDate);
  const fileName = buildFullBackupFileName(label, timestampSegment);

  await fs.ensureDir(PATHS.storageBackups);
  const filePath = path.join(PATHS.storageBackups, fileName);

  const zip = new AdmZip();
  const manifest = buildFullBackupManifestPayload(createdAt);
  zip.addFile(FULL_BACKUP_MANIFEST_FILENAME, Buffer.from(JSON.stringify(manifest, null, 2), 'utf8'));

  if (!(await fs.pathExists(PATHS.siteLayout))) {
    throw new Error(`Missing ${PATHS.siteLayout} — cannot create backup`);
  }
  if (!(await fs.pathExists(PATHS.systemSettings))) {
    throw new Error(`Missing ${PATHS.systemSettings} — cannot create backup`);
  }

  const siteLayoutBytes = await fs.readFile(PATHS.siteLayout);
  const systemSettingsBytes = await fs.readFile(PATHS.systemSettings);
  zip.addFile('site-layout.json', siteLayoutBytes);
  zip.addFile('system-settings.json', systemSettingsBytes);

  await addDirectoryTreeToZip(zip, PATHS.standaloneModules, 'standalone-modules');
  await addDirectoryTreeToZip(zip, PATHS.thumbnailsDirectory, 'thumbnails');

  zip.writeZip(filePath);

  return { fileName, filePath, createdAt };
}

/**
 * Lists full backup ZIP files in storage/backups sorted newest first.
 * @returns Backup file names
 */
export async function listFullBackupFileNames(): Promise<string[]> {
  await fs.ensureDir(PATHS.storageBackups);
  const entries = await fs.readdir(PATHS.storageBackups);
  const zipFiles = entries.filter((name) => name.endsWith('.zip'));
  const withStats = await Promise.all(
    zipFiles.map(async (fileName) => {
      const stats = await fs.stat(path.join(PATHS.storageBackups, fileName));
      return { fileName, mtimeMs: stats.mtimeMs };
    }),
  );
  withStats.sort((left, right) => right.mtimeMs - left.mtimeMs);
  return withStats.map((item) => item.fileName);
}

/**
 * Reads a backup ZIP from storage/backups.
 * @param fileName - Backup file name
 * @returns ZIP bytes
 */
export async function readFullBackupFile(fileName: string): Promise<Buffer> {
  assertSafeBackupFileName(fileName);
  const filePath = path.join(PATHS.storageBackups, fileName);
  if (!(await fs.pathExists(filePath))) {
    throw new Error(`Backup not found: ${fileName}`);
  }
  return fs.readFile(filePath);
}

/**
 * Builds a full backup ZIP in memory (used by download without persisting).
 * @returns ZIP buffer
 */
export async function buildFullBackupZipBuffer(): Promise<Buffer> {
  const result = await createFullBackup();
  return readFullBackupFile(result.fileName);
}
