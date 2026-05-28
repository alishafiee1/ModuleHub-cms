/** Allows wizard ids (mod-<hex>) and legacy ids (mod-static, mod-1). */
const MODULE_ID_PATTERN = /^mod-[a-zA-Z0-9][a-zA-Z0-9-]{0,63}$/;

/**
 * Validates a module identifier format used in site-layout.
 * @param moduleId - Candidate module id
 * @returns True when id matches expected pattern
 */
export function isValidModuleId(moduleId: string): boolean {
  return MODULE_ID_PATTERN.test(moduleId);
}

/**
 * Asserts module id is valid or throws.
 * @param moduleId - Candidate module id
 */
export function assertValidModuleId(moduleId: string): void {
  if (!isValidModuleId(moduleId)) {
    throw new Error(`Invalid module id: "${moduleId}"`);
  }
}
