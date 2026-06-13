import fs from 'fs-extra';
import path from 'path';
import { PATHS } from '../../config/paths';
import { mergeSystemSettings } from './settings-merge';
import type { SystemSettings } from './types';

/** Default settings when file is missing (mirrors docs/system-settings.example.json) */
export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  maxZipUploadMb: 200,
  portRangeStart: 4100,
  portRangeEnd: 4999,
  defaultModuleResources: {
    cpu_limit: 0.5,
    ram_limit_mb: 512,
    swap_limit_mb: 128,
    disk_iops: 100,
    net_mbps: 10,
  },
  maxConcurrentRunningModules: 10,
  logRetentionDays: 14,
  maxPackageCacheGb: 5,
  dependencyInstallTimeoutSec: 600,
  autoRestartOnCrash: false,
  autoRestartMaxAttemptsPerHour: 3,
  uploadTempCleanupHours: 24,
  logViewerMaxLines: 50,
  sessionTtlHours: 8,
  loginRateLimitPerMinute: 5,
  moduleManagerSessionTtlHours: 4,
  modulePasswordMaxAttempts: 5,
  modulePasswordLockoutMinutes: 15,
  homePageBackgroundMode: 'none',
  homePageIconTheme: 'mixed',
};

/**
 * Seeds system-settings.json from docs example when missing.
 * @returns Promise resolved after seed check
 */
export async function seedSystemSettingsIfMissing(): Promise<void> {
  await fs.ensureDir(path.dirname(PATHS.systemSettings));
  const exists = await fs.pathExists(PATHS.systemSettings);
  if (exists) {
    return;
  }
  const seedExists = await fs.pathExists(PATHS.systemSettingsSeed);
  if (seedExists) {
    await fs.copy(PATHS.systemSettingsSeed, PATHS.systemSettings);
    return;
  }
  await fs.writeJson(PATHS.systemSettings, DEFAULT_SYSTEM_SETTINGS, { spaces: 2 });
}

/**
 * Loads system settings merged with defaults for missing keys.
 * @returns Resolved system settings
 */
export async function loadSystemSettings(): Promise<SystemSettings> {
  await seedSystemSettingsIfMissing();
  const raw = await fs.readJson(PATHS.systemSettings);
  return mergeSystemSettings(DEFAULT_SYSTEM_SETTINGS, raw as Partial<SystemSettings>);
}
