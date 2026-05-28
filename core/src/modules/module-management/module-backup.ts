import AdmZip from 'adm-zip';
import fs from 'fs-extra';
import path from 'path';
import { getModuleDirectory } from '../../config/paths';
import type { ModuleEntry } from '../home-layout/types';

const LAYOUT_SNAPSHOT_FILE = 'module-layout-entry.json';

/**
 * Builds a ZIP buffer containing module files and layout metadata snapshot.
 * @param moduleId - Module identifier
 * @param entry - Module metadata from site-layout
 * @returns ZIP file as Buffer
 */
export async function buildModuleBackupZip(
  moduleId: string,
  entry: ModuleEntry,
): Promise<Buffer> {
  const moduleDirectory = getModuleDirectory(moduleId);
  if (!(await fs.pathExists(moduleDirectory))) {
    throw new Error(`Module files missing at ${moduleDirectory}`);
  }

  const zip = new AdmZip();
  zip.addFile(
    LAYOUT_SNAPSHOT_FILE,
    Buffer.from(JSON.stringify({ moduleId, entry }, null, 2), 'utf8'),
  );

  const files = await collectFilesRecursive(moduleDirectory);
  for (const absolutePath of files) {
    const relativePath = path.relative(moduleDirectory, absolutePath);
    const fileBuffer = await fs.readFile(absolutePath);
    zip.addFile(path.join(moduleId, relativePath), fileBuffer);
  }

  return zip.toBuffer();
}

/**
 * Collects all file paths under a directory recursively.
 * @param directoryPath - Root directory
 * @returns Absolute file paths
 */
async function collectFilesRecursive(directoryPath: string): Promise<string[]> {
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
