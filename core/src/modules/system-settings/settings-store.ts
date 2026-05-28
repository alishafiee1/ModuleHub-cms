import fs from 'fs-extra';
import path from 'path';
import { PATHS } from '../../config/paths';
import { listUpNetworkInterfaces, validatePackageInstallInterface } from './nic-validator';
import { mergeSystemSettings } from './settings-merge';
import { DEFAULT_SYSTEM_SETTINGS, seedSystemSettingsIfMissing } from './settings-loader';
import { assertValidSystemSettings, SystemSettingsValidationError } from './schema-validator';
import type { SystemSettings } from './types';

/**
 * Persists validated system settings to storage/system-settings.json.
 * @param settings - Fully validated settings document
 * @returns Promise resolved after write
 */
export async function writeSystemSettings(settings: SystemSettings): Promise<void> {
  await fs.ensureDir(path.dirname(PATHS.systemSettings));
  await fs.writeJson(PATHS.systemSettings, settings, { spaces: 2 });
}

/**
 * Applies a partial update with merge, schema validation, and NIC checks.
 * @param partialUpdate - Fields to change from the settings form
 * @returns Saved settings after validation
 */
export async function saveSystemSettingsUpdate(
  partialUpdate: Partial<SystemSettings>,
): Promise<SystemSettings> {
  await seedSystemSettingsIfMissing();
  const current = await fs.readJson(PATHS.systemSettings);
  const merged = mergeSystemSettings(
    { ...DEFAULT_SYSTEM_SETTINGS, ...(current as Partial<SystemSettings>) },
    partialUpdate,
  );

  let validated: SystemSettings;
  try {
    validated = assertValidSystemSettings(merged);
  } catch (error: unknown) {
    if (error instanceof SystemSettingsValidationError) {
      throw error;
    }
    throw new SystemSettingsValidationError('Invalid system settings');
  }

  const interfaces = await listUpNetworkInterfaces();
  const nicError = validatePackageInstallInterface(validated.packageInstallInterface, interfaces);
  if (nicError) {
    throw new SystemSettingsValidationError(nicError);
  }

  await writeSystemSettings(validated);
  return validated;
}
