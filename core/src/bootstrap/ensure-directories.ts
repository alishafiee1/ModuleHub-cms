import fs from 'fs-extra';
import path from 'path';
import { PATHS } from '../config/paths';
import { seedSiteLayoutIfMissing } from '../modules/home-layout';
import { seedSystemSettingsIfMissing } from '../modules/system-settings';

/**
 * Ensures required runtime directories exist before the server accepts traffic.
 * @returns Promise that resolves when all directories are present
 */
export async function ensureRequiredDirectories(): Promise<void> {
  await fs.ensureDir(PATHS.storageLogs);
  await fs.ensureDir(PATHS.storageBackups);
  await fs.ensureDir(PATHS.standaloneModules);
  await fs.ensureDir(path.dirname(PATHS.siteLayout));
  await fs.ensureDir(PATHS.thumbnailsDirectory);
  await fs.ensureDir(PATHS.uploadTempDirectory);
  await seedSiteLayoutIfMissing();
  await seedSystemSettingsIfMissing();
}
