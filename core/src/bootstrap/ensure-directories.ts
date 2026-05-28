import fs from 'fs-extra';
import { PATHS } from '../config/paths';

/**
 * Ensures required runtime directories exist before the server accepts traffic.
 * @returns Promise that resolves when all directories are present
 */
export async function ensureRequiredDirectories(): Promise<void> {
  await fs.ensureDir(PATHS.storageLogs);
  await fs.ensureDir(PATHS.storageBackups);
  await fs.ensureDir(PATHS.standaloneModules);
}
