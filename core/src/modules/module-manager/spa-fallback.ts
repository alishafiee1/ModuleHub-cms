import fs from 'fs-extra';
import path from 'path';

/**
 * Resolves SPA index.html path when a deep link has no matching file.
 * @param moduleDirectory - Module root directory
 * @param requestPath - URL path after module prefix (e.g. /app/route)
 * @returns Absolute path to index.html or null when not applicable
 */
export async function resolveSpaFallbackIndexPath(
  moduleDirectory: string,
  requestPath: string,
): Promise<string | null> {
  const normalized = requestPath.split('?')[0] ?? '/';
  if (normalized.includes('.')) {
    return null;
  }

  const indexPath = path.join(moduleDirectory, 'index.html');
  if (await fs.pathExists(indexPath)) {
    return indexPath;
  }

  return null;
}
