import AdmZip from 'adm-zip';
import fs from 'fs-extra';
import path from 'path';

/**
 * Collects absolute file paths under a directory recursively.
 * @param directoryPath - Root directory to scan
 * @returns Absolute paths of all files
 */
export async function collectFilesRecursive(directoryPath: string): Promise<string[]> {
  if (!(await fs.pathExists(directoryPath))) {
    return [];
  }

  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  const result: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectFilesRecursive(fullPath);
      result.push(...nested);
    } else if (entry.isFile()) {
      result.push(fullPath);
    }
  }

  return result;
}

/**
 * Adds a directory tree into a ZIP under a prefix path.
 * @param zip - Target ZIP archive
 * @param sourceDirectory - Absolute directory on disk
 * @param zipPrefix - Prefix inside the ZIP (with trailing slash)
 */
export async function addDirectoryTreeToZip(
  zip: AdmZip,
  sourceDirectory: string,
  zipPrefix: string,
): Promise<void> {
  const normalizedPrefix = zipPrefix.endsWith('/') ? zipPrefix : `${zipPrefix}/`;

  if (!(await fs.pathExists(sourceDirectory))) {
    zip.addFile(`${normalizedPrefix}.keep`, Buffer.alloc(0));
    return;
  }

  const files = await collectFilesRecursive(sourceDirectory);
  if (files.length === 0) {
    zip.addFile(`${normalizedPrefix}.keep`, Buffer.alloc(0));
    return;
  }

  for (const absolutePath of files) {
    const relativePath = path.relative(sourceDirectory, absolutePath);
    const zipEntryPath = path.posix.join(normalizedPrefix, relativePath.split(path.sep).join('/'));
    const fileBuffer = await fs.readFile(absolutePath);
    zip.addFile(zipEntryPath, fileBuffer);
  }
}

/**
 * Returns normalized entry names from a ZIP buffer.
 * @param zipBuffer - ZIP file bytes
 * @returns List of entry paths
 */
export function listZipEntryNames(zipBuffer: Buffer): string[] {
  const zip = new AdmZip(zipBuffer);
  return zip.getEntries().map((entry) => entry.entryName);
}
