import AdmZip from 'adm-zip';
import fs from 'fs-extra';
import path from 'path';
import {
  isSafeZipEntryName,
  normalizeZipEntryName,
  resolveSafeZipEntryTarget,
} from '../shared/safe-zip-path';

const RESERVED_CONTENT_ROOTS = new Set(['assets', 'dist', 'public', 'src', 'static']);

/**
 * Rejects ZIP entries that attempt path traversal.
 * @param entryName - Path inside the archive
 * @returns True when entry is safe to extract
 */
export function isSafeZipEntry(entryName: string): boolean {
  return isSafeZipEntryName(entryName);
}

function resolveSingleRootFolder(entries: AdmZip.IZipEntry[]): string | null {
  const fileRoots = entries
    .filter((entry) => !entry.isDirectory)
    .map((entry) => normalizeZipEntryName(entry.entryName).split('/'))
    .filter((segments) => segments.length > 1)
    .map((segments) => segments[0]);

  if (fileRoots.length === 0) {
    return null;
  }

  const hasRootFile = entries
    .filter((entry) => !entry.isDirectory)
    .some((entry) => !normalizeZipEntryName(entry.entryName).includes('/'));

  if (hasRootFile) {
    return null;
  }

  const uniqueRoots = new Set(fileRoots);
  if (uniqueRoots.size !== 1) {
    return null;
  }

  const rootFolder = fileRoots[0];
  return RESERVED_CONTENT_ROOTS.has(rootFolder) ? null : rootFolder;
}

async function flattenSingleRootFolder(targetDirectory: string, rootFolder: string): Promise<void> {
  const rootDirectory = path.join(targetDirectory, rootFolder);
  if (!(await fs.pathExists(rootDirectory))) {
    return;
  }

  const children = await fs.readdir(rootDirectory);
  for (const child of children) {
    const sourcePath = path.join(rootDirectory, child);
    const targetPath = path.join(targetDirectory, child);
    await fs.move(sourcePath, targetPath, { overwrite: false });
  }

  await fs.remove(rootDirectory);
}

/**
 * Extracts a ZIP file into standalone-modules/<moduleId>/.
 * @param zipFilePath - Path to uploaded ZIP on disk
 * @param targetDirectory - Module root directory
 * @returns Promise resolved when extraction completes
 */
export async function extractZipToModuleDirectory(
  zipFilePath: string,
  targetDirectory: string,
): Promise<void> {
  const zip = new AdmZip(zipFilePath);
  const entries = zip.getEntries();
  const rootFolder = resolveSingleRootFolder(entries);

  await fs.ensureDir(targetDirectory);
  for (const entry of entries) {
    const targetPath = resolveSafeZipEntryTarget(targetDirectory, entry.entryName);
    if (entry.isDirectory) {
      await fs.ensureDir(targetPath);
      continue;
    }

    await fs.ensureDir(path.dirname(targetPath));
    await fs.writeFile(targetPath, entry.getData());
  }

  if (rootFolder) {
    await flattenSingleRootFolder(targetDirectory, rootFolder);
  }
}
