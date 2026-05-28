import {
  assertValidSemver,
  isValidSemver,
  normalizeChangelog,
  VersionValidationError,
} from '../../../core/src/modules/home-layout/version-validator';

describe('version-validator', () => {
  it('accepts valid semver strings', () => {
    expect(isValidSemver('1.0.0')).toBe(true);
    expect(isValidSemver('2.1.3')).toBe(true);
    expect(isValidSemver('0.0.1')).toBe(true);
    expect(isValidSemver('10.20.30')).toBe(true);
    expect(isValidSemver('1.0.0-alpha')).toBe(true);
    expect(isValidSemver('1.0.0-beta.1')).toBe(true);
    expect(isValidSemver('1.0.0+build.1')).toBe(true);
  });

  it('rejects invalid semver strings', () => {
    expect(isValidSemver('')).toBe(false);
    expect(isValidSemver('1.0')).toBe(false);
    expect(isValidSemver('v1.0.0')).toBe(false);
    expect(isValidSemver('1.0.0.0')).toBe(false);
    expect(isValidSemver('latest')).toBe(false);
    expect(isValidSemver('01.0.0')).toBe(false);
  });

  it('assertValidSemver returns trimmed valid version', () => {
    expect(assertValidSemver('  1.2.3  ')).toBe('1.2.3');
  });

  it('assertValidSemver throws VersionValidationError for invalid input', () => {
    expect(() => assertValidSemver('bad-version')).toThrow(VersionValidationError);
    expect(() => assertValidSemver('')).toThrow('Version is required');
  });

  it('normalizeChangelog trims and drops empty values', () => {
    expect(normalizeChangelog('  fix bug  ')).toBe('fix bug');
    expect(normalizeChangelog('   ')).toBeUndefined();
    expect(normalizeChangelog(undefined)).toBeUndefined();
  });
});
