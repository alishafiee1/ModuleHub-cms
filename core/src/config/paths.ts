import path from 'path';

/**
 * Returns application root directory (cwd or MODULEHUB_APP_ROOT).
 * @returns Absolute path to app root
 */
export function getAppRoot(): string {
  return process.env.MODULEHUB_APP_ROOT ?? process.cwd();
}

/** Resolved paths for CMS storage and modules (evaluated at access time) */
export const PATHS = {
  get storageLogs(): string {
    return path.join(getAppRoot(), 'storage', 'logs');
  },
  get storageBackups(): string {
    return path.join(getAppRoot(), 'storage', 'backups');
  },
  get standaloneModules(): string {
    return path.join(getAppRoot(), 'standalone-modules');
  },
  get cmsLogDirectory(): string {
    return path.join(getAppRoot(), 'storage', 'logs');
  },
  cmsLogFileName: 'cms-%DATE%.log',
} as const;
