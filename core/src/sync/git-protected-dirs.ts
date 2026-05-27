/**
 * User content directories preserved during git pull.
 */
export const GIT_PROTECTED_DIRS = ['images', 'markdown', 'uploads'] as const;

export type GitProtectedDir = (typeof GIT_PROTECTED_DIRS)[number];

/**
 * Check whether a relative path is under a protected directory.
 */
export function isProtectedRelativePath(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  return GIT_PROTECTED_DIRS.some(
    (dir) => normalized === dir || normalized.startsWith(`${dir}/`),
  );
}
