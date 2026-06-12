import AdmZip from 'adm-zip';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { PATHS } from '../../config/paths';
import { readSiteLayout } from '../home-layout/layout-store';
import { stopModuleById } from '../module-manager/module-manager-service';
import {
  FULL_BACKUP_MANIFEST_FILENAME,
  normalizeZipEntryName,
  parseFullBackupManifest,
  validateFullBackupZipEntries,
} from './backup-manifest';
import { createFullBackup } from './backup-service';
import { collectFilesRecursive } from './backup-zip-helpers';

/** Thrown when a restore ZIP fails validation */
export class RestoreValidationError extends Error {
  /**
   * @param message - Human-readable validation failure
   */
  constructor(message: string) {
    super(message);
    this.name = 'RestoreValidationError';
  }
}

/** Result of a successful full restore operation */
export interface RestoreFullBackupResult {
  restoredAt: string;
  preRestoreBackupFileName?: string;
}

/**
 * Stops every module marked as running in site-layout.
 * @returns Promise resolved when stop attempts finish
 */
export async function stopAllRunningModulesBeforeRestore(): Promise<void> {
  const layout = await readSiteLayout();
  const runningModuleIds = Object.entries(layout.modules)
    .filter(([, entry]) => entry.status === 'running')
    .map(([moduleId]) => moduleId);

  for (const moduleId of runningModuleIds) {
    try {
      await stopModuleById(moduleId);
    } catch {
      // Continue stopping other modules even if one fails
    }
  }
}

/**
 * Validates a full backup ZIP buffer before restore.
 * @param zipBuffer - Uploaded or stored backup ZIP
 */
export function validateRestoreZipBuffer(zipBuffer: Buffer): void {
  let zip: AdmZip;
  try {
    zip = new AdmZip(zipBuffer);
  } catch {
    throw new RestoreValidationError('Invalid or corrupt ZIP backup file');
  }

  const entryNames = zip.getEntries().map((entry) => entry.entryName);
  const structureError = validateFullBackupZipEntries(entryNames);
  if (structureError) {
    throw new RestoreValidationError(structureError);
  }

  const manifestEntry = zip.getEntry(FULL_BACKUP_MANIFEST_FILENAME);
  if (!manifestEntry) {
    throw new RestoreValidationError(`Missing ${FULL_BACKUP_MANIFEST_FILENAME}`);
  }

  const manifestText = manifestEntry.getData().toString('utf8');
  const manifestResult = parseFullBackupManifest(manifestText);
  if ('error' in manifestResult) {
    throw new RestoreValidationError(manifestResult.error);
  }
}

/**
 * Replaces a directory with contents extracted from a ZIP prefix.
 * @param extractRoot - Temp directory containing extracted ZIP
 * @param zipPrefix - Prefix folder inside extract root
 * @param targetDirectory - Live directory to overwrite
 */
async function replaceDirectoryFromExtractedZip(
  extractRoot: string,
  zipPrefix: string,
  targetDirectory: string,
): Promise<void> {
  const sourceDirectory = path.join(extractRoot, zipPrefix);
  await fs.emptyDir(targetDirectory);
  if (!(await fs.pathExists(sourceDirectory))) {
    return;
  }

  const files = await collectFilesRecursive(sourceDirectory);
  for (const absoluteSourcePath of files) {
    const relativePath = path.relative(sourceDirectory, absoluteSourcePath);
    if (relativePath === '.keep' || relativePath.endsWith('/.keep')) {
      continue;
    }
    const targetPath = path.join(targetDirectory, relativePath);
    await fs.ensureDir(path.dirname(targetPath));
    await fs.copy(absoluteSourcePath, targetPath);
  }
}

/**
 * Copies a single file from extracted ZIP root into live storage.
 * @param extractRoot - Temp extraction directory
 * @param zipFileName - File name at ZIP root
 * @param targetPath - Destination absolute path
 */
async function copyExtractedRootFile(
  extractRoot: string,
  zipFileName: string,
  targetPath: string,
): Promise<void> {
  const sourcePath = path.join(extractRoot, zipFileName);
  if (!(await fs.pathExists(sourcePath))) {
    throw new RestoreValidationError(`Missing extracted file: ${zipFileName}`);
  }
  await fs.ensureDir(path.dirname(targetPath));
  await fs.copy(sourcePath, targetPath);
}

/**
 * Restores CMS state from a full backup ZIP buffer.
 * @param zipBuffer - Valid full backup archive
 * @param options - Restore options
 * @returns Restore metadata including optional pre-restore backup name
 */
export async function restoreFullBackupFromZipBuffer(
  zipBuffer: Buffer,
  options: { createPreRestoreBackup?: boolean } = {},
): Promise<RestoreFullBackupResult> {
  validateRestoreZipBuffer(zipBuffer);

  const createPreRestoreBackup = options.createPreRestoreBackup ?? true;
  let preRestoreBackupFileName: string | undefined;

  await stopAllRunningModulesBeforeRestore();

  if (createPreRestoreBackup) {
    const preBackup = await createFullBackup({ label: 'pre-restore' });
    preRestoreBackupFileName = preBackup.fileName;
  }

  const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'modulehub-restore-'));

  try {
    const zip = new AdmZip(zipBuffer);
    zip.extractAllTo(tempDirectory, true);

    await copyExtractedRootFile(tempDirectory, 'site-layout.json', PATHS.siteLayout);
    await copyExtractedRootFile(tempDirectory, 'system-settings.json', PATHS.systemSettings);
    await replaceDirectoryFromExtractedZip(
      tempDirectory,
      'standalone-modules',
      PATHS.standaloneModules,
    );
    await replaceDirectoryFromExtractedZip(
      tempDirectory,
      'thumbnails',
      PATHS.thumbnailsDirectory,
    );
    const cardBgExtracted = path.join(tempDirectory, 'card-backgrounds');
    if (await fs.pathExists(cardBgExtracted)) {
      await replaceDirectoryFromExtractedZip(
        tempDirectory,
        'card-backgrounds',
        PATHS.cardBackgroundsDirectory,
      );
    }
  } finally {
    await fs.remove(tempDirectory);
  }

  return {
    restoredAt: new Date().toISOString(),
    preRestoreBackupFileName,
  };
}

/**
 * Returns entry names from a ZIP buffer (helper for tests).
 * @param zipBuffer - ZIP archive bytes
 * @returns Normalized entry paths
 */
export function listNormalizedZipEntryNames(zipBuffer: Buffer): string[] {
  const zip = new AdmZip(zipBuffer);
  return zip.getEntries().map((entry) => normalizeZipEntryName(entry.entryName));
}
