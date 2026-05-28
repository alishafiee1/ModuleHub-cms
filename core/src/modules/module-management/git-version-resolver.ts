import { runShellCommand } from '../package-cache/network-install';
import { assertValidSemver } from '../home-layout/version-validator';

/**
 * Strips a leading "v" prefix from a git tag name.
 * @param tagName - Raw git tag (e.g. v1.2.3)
 * @returns Tag without leading v
 */
export function stripGitTagVersionPrefix(tagName: string): string {
  const trimmed = tagName.trim();
  return trimmed.startsWith('v') || trimmed.startsWith('V')
    ? trimmed.slice(1)
    : trimmed;
}

/**
 * Reads the latest semver-compatible git tag from a module directory.
 * @param moduleDirectory - Absolute module root path
 * @param timeoutSec - Command timeout in seconds
 * @returns Valid SemVer string or null when no suitable tag exists
 */
export async function resolveLatestGitTagVersion(
  moduleDirectory: string,
  timeoutSec: number,
): Promise<string | null> {
  const result = await runShellCommand(
    'git tag -l --sort=-v:refname',
    moduleDirectory,
    timeoutSec,
  );

  if (result.exitCode !== 0) {
    return null;
  }

  const tags = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const tag of tags) {
    const candidate = stripGitTagVersionPrefix(tag);
    try {
      return assertValidSemver(candidate);
    } catch {
      continue;
    }
  }

  return null;
}
