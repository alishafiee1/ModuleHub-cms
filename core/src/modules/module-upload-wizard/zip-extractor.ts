import AdmZip from 'adm-zip';
import fs from 'fs-extra';
import path from 'path';

/**
 * Rejects ZIP entries that attempt path traversal.
 * @param entryName - Path inside the archive
 * @returns True when entry is safe to extract
 */
export function isSafeZipEntry(entryName: string): boolean {
  const normalized = path.normalize(entryName).replace(/^(\.\.(\/|\\|$))+/, '');
  return !normalized.startsWith('..') && !path.isAbsolute(entryName);
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

  for (const entry of entries) {
    if (!isSafeZipEntry(entry.entryName)) {
      throw new Error(`Unsafe path in ZIP: ${entry.entryName}`);
    }
  }

  await fs.ensureDir(targetDirectory);
  zip.extractAllTo(targetDirectory, true);
}
