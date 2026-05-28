import type { SystemSettings } from './types';

/**
 * Deep-merges partial settings into a base document (defaults or current file).
 * @param base - Existing or default settings
 * @param partial - Partial update from API or disk overlay
 * @returns Merged settings object (not yet schema-validated)
 */
export function mergeSystemSettings(
  base: SystemSettings,
  partial: Partial<SystemSettings>,
): SystemSettings {
  const merged: SystemSettings = {
    ...base,
    ...partial,
    defaultModuleResources: {
      ...base.defaultModuleResources,
      ...(partial.defaultModuleResources ?? {}),
    },
  };

  return merged;
}
