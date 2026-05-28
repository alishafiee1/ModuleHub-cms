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
  get siteLayout(): string {
    return path.join(getAppRoot(), 'storage', 'site-layout.json');
  },
  get siteLayoutSeed(): string {
    return path.join(getAppRoot(), 'docs', 'site-layout.json');
  },
  get publicDirectory(): string {
    return path.join(getAppRoot(), 'public');
  },
  get thumbnailsDirectory(): string {
    return path.join(getAppRoot(), 'thumbnails');
  },
  get systemSettings(): string {
    return path.join(getAppRoot(), 'storage', 'system-settings.json');
  },
  get systemSettingsSeed(): string {
    return path.join(getAppRoot(), 'docs', 'system-settings.example.json');
  },
  get uploadTempDirectory(): string {
    return path.join(getAppRoot(), 'storage', 'upload-temp');
  },
  get cmsLogDirectory(): string {
    return path.join(getAppRoot(), 'storage', 'logs');
  },
  get moduleLogDirectory(): string {
    if (process.env.MODULEHUB_MODULE_LOG_DIR) {
      return process.env.MODULEHUB_MODULE_LOG_DIR;
    }
    return path.join(getAppRoot(), 'storage', 'logs', 'modules');
  },
  cmsLogFileName: 'cms-%DATE%.log',
} as const;

/**
 * Returns absolute path to a standalone module directory.
 * @param moduleId - Module identifier
 * @returns Path under standalone-modules
 */
export function getModuleDirectory(moduleId: string): string {
  return path.join(PATHS.standaloneModules, moduleId);
}

/**
 * Returns per-module log file path.
 * @param moduleId - Module identifier
 * @returns Log file path
 */
export function getModuleLogFilePath(moduleId: string): string {
  return path.join(PATHS.moduleLogDirectory, `${moduleId}.log`);
}
