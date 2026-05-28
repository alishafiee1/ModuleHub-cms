/** Thrown when a module version string fails SemVer validation */
export class VersionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VersionValidationError';
  }
}

/**
 * SemVer 2.0.0 pattern — numeric core with optional pre-release and build metadata.
 * @see https://semver.org/
 */
const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/**
 * Returns true when version matches Semantic Versioning 2.0.0.
 * @param version - Version string to validate
 * @returns Whether the string is valid SemVer
 */
export function isValidSemver(version: string): boolean {
  const trimmed = version.trim();
  if (!trimmed) {
    return false;
  }
  return SEMVER_PATTERN.test(trimmed);
}

/**
 * Validates a module version string or throws VersionValidationError.
 * @param version - Version string to validate
 * @returns Trimmed valid SemVer string
 */
export function assertValidSemver(version: string): string {
  const trimmed = version.trim();
  if (!trimmed) {
    throw new VersionValidationError('Version is required');
  }
  if (!isValidSemver(trimmed)) {
    throw new VersionValidationError(
      `Invalid version "${trimmed}" — expected SemVer 2.0.0 (e.g. 1.0.0, 2.1.3-beta.1)`,
    );
  }
  return trimmed;
}

/**
 * Normalizes an optional changelog — empty string becomes undefined.
 * @param changelog - Raw changelog text
 * @returns Trimmed changelog or undefined when empty
 */
export function normalizeChangelog(changelog: string | undefined): string | undefined {
  if (changelog === undefined) {
    return undefined;
  }
  const trimmed = changelog.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
