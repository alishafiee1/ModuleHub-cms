import type { SystemSettings } from './types';

/** Thrown when persisted settings fail schema validation */
export class SystemSettingsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SystemSettingsValidationError';
  }
}

/**
 * Returns true when value is a finite number.
 * @param value - Candidate value
 * @returns Whether value is a number
 */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Validates default module resource sliders.
 * @param resources - Nested resource object
 * @param errors - Mutable error list
 */
function validateDefaultModuleResources(
  resources: unknown,
  errors: string[],
): void {
  if (typeof resources !== 'object' || resources === null) {
    errors.push('defaultModuleResources must be an object');
    return;
  }

  const record = resources as Record<string, unknown>;
  const fields: Array<{ key: keyof SystemSettings['defaultModuleResources']; min: number }> = [
    { key: 'cpu_limit', min: 0.1 },
    { key: 'ram_limit_mb', min: 64 },
    { key: 'swap_limit_mb', min: 0 },
    { key: 'disk_iops', min: 1 },
    { key: 'net_mbps', min: 1 },
  ];

  for (const field of fields) {
    const value = record[field.key];
    if (!isFiniteNumber(value) || value < field.min) {
      errors.push(`defaultModuleResources.${field.key} must be a number >= ${field.min}`);
    }
  }
}

/**
 * Validates a candidate settings object against the CMS schema.
 * @param candidate - Raw JSON object from disk or API
 * @returns Validation result with error messages
 */
export function validateSystemSettingsSchema(
  candidate: unknown,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof candidate !== 'object' || candidate === null) {
    return { valid: false, errors: ['Settings must be a JSON object'] };
  }

  const settings = candidate as Record<string, unknown>;

  if (!isFiniteNumber(settings.maxZipUploadMb) || settings.maxZipUploadMb < 1 || settings.maxZipUploadMb > 2048) {
    errors.push('maxZipUploadMb must be between 1 and 2048');
  }

  if (!isFiniteNumber(settings.portRangeStart) || settings.portRangeStart < 1024 || settings.portRangeStart > 65535) {
    errors.push('portRangeStart must be between 1024 and 65535');
  }

  if (!isFiniteNumber(settings.portRangeEnd) || settings.portRangeEnd < 1024 || settings.portRangeEnd > 65535) {
    errors.push('portRangeEnd must be between 1024 and 65535');
  }

  if (
    isFiniteNumber(settings.portRangeStart)
    && isFiniteNumber(settings.portRangeEnd)
    && settings.portRangeStart >= settings.portRangeEnd
  ) {
    errors.push('portRangeStart must be less than portRangeEnd');
  }

  validateDefaultModuleResources(settings.defaultModuleResources, errors);

  const positiveIntFields: Array<keyof SystemSettings> = [
    'maxConcurrentRunningModules',
    'logRetentionDays',
    'dependencyInstallTimeoutSec',
    'autoRestartMaxAttemptsPerHour',
    'uploadTempCleanupHours',
    'logViewerMaxLines',
    'sessionTtlHours',
    'loginRateLimitPerMinute',
    'moduleManagerSessionTtlHours',
    'modulePasswordMaxAttempts',
    'modulePasswordLockoutMinutes',
  ];

  for (const field of positiveIntFields) {
    const value = settings[field];
    if (!isFiniteNumber(value) || value < 1 || !Number.isInteger(value)) {
      errors.push(`${field} must be a positive integer`);
    }
  }

  if (!isFiniteNumber(settings.maxPackageCacheGb) || settings.maxPackageCacheGb < 0.1) {
    errors.push('maxPackageCacheGb must be at least 0.1');
  }

  if (typeof settings.autoRestartOnCrash !== 'boolean') {
    errors.push('autoRestartOnCrash must be a boolean');
  }

  if (typeof settings.packageInstallInterface !== 'string' || !settings.packageInstallInterface.trim()) {
    errors.push('packageInstallInterface must be a non-empty string');
  }

  const backgroundModes = ['none', 'floating-icons'];
  if (
    typeof settings.homePageBackgroundMode !== 'string'
    || !backgroundModes.includes(settings.homePageBackgroundMode)
  ) {
    errors.push('homePageBackgroundMode must be one of: none, floating-icons');
  }

  const iconThemes = ['nature', 'technology', 'tools', 'vehicles', 'mixed'];
  if (
    typeof settings.homePageIconTheme !== 'string'
    || !iconThemes.includes(settings.homePageIconTheme)
  ) {
    errors.push('homePageIconTheme must be one of: nature, technology, tools, vehicles, mixed');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates settings or throws SystemSettingsValidationError.
 * @param candidate - Raw settings object
 * @returns Validated settings cast
 */
export function assertValidSystemSettings(candidate: unknown): SystemSettings {
  const result = validateSystemSettingsSchema(candidate);
  if (!result.valid) {
    throw new SystemSettingsValidationError(result.errors.join('; '));
  }
  return candidate as SystemSettings;
}
