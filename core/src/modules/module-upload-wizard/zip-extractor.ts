import AdmZip from 'adm-zip';
import fs from 'fs-extra';
import path from 'path';
import {
  isSafeZipEntryName,
  resolveSafeZipEntryTarget,
} from '../shared/safe-zip-path';

/**
 * Rejects ZIP entries that attempt path traversal.
 * @param entryName - Path inside the archive
 * @returns True when entry is safe to extract
 */
export function isSafeZipEntry(entryName: string): boolean {
  return isSafeZipEntryName(entryName);
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
}
