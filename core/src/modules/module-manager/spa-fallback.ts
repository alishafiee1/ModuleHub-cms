import fs from 'fs-extra';
import path from 'path';

/**
 * Resolves the directory that should be served for static/SPAs.
 * @param moduleDirectory - Module root directory
 * @returns Module root, or dist/ when only dist/index.html exists
 */
export async function resolveModuleContentRoot(moduleDirectory: string): Promise<string> {
  const rootIndexPath = path.join(moduleDirectory, 'index.html');
  if (await fs.pathExists(rootIndexPath)) {
    return moduleDirectory;
  }

  const distDirectory = path.join(moduleDirectory, 'dist');
  const distIndexPath = path.join(distDirectory, 'index.html');
  if (await fs.pathExists(distIndexPath)) {
    return distDirectory;
  }

  return moduleDirectory;
}

/**
 * Resolves SPA index.html path when a deep link has no matching file.
 * @param moduleDirectory - Module root or resolved content root directory
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
