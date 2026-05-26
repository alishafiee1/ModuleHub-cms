import fs from 'fs';
import path from 'path';
import { AppConfig } from '../server/config';
import { ModuleRegistry } from './registry';
import { ManifestValidator } from './manifest-validator';
import { ModuleEntry } from './types';
import { logger } from '../server/logger';

/**
 * Register modules already present on disk (sample modules, manual installs).
 */
export function bootstrapExistingModules(
  config: AppConfig,
  registry: ModuleRegistry,
  validator: ManifestValidator,
): void {
  const scan = (baseDir: string): void => {
    if (!fs.existsSync(baseDir)) return;
    for (const entry of fs.readdirSync(baseDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const moduleDir = path.join(baseDir, entry.name);
      const validation = validator.validateFromPath(moduleDir);
      if (!validation.valid || !validation.manifest || !validation.moduleId) continue;

      const existing = registry.getById(entry.name);
      if (existing) continue;

      const now = new Date().toISOString();
      const mod: ModuleEntry = {
        id: entry.name,
        name: validation.manifest.name,
        type: validation.manifest.type,
        version: validation.manifest.version,
        icon: validation.manifest.icon,
        description: validation.manifest.description,
        status: validation.manifest.type === 'static' ? 'static' : 'stopped',
        installPath: moduleDir,
        adminRole: validation.manifest.admin_role,
        proxyPrefix: validation.manifest.proxy?.prefix,
        internalPort: validation.manifest.proxy?.internalPort,
        permissionsApproved: validation.manifest.type === 'static',
        createdAt: now,
        updatedAt: now,
      };
      registry.upsert(mod);
      logger.info('Bootstrapped module from disk', { id: mod.id });
    }
  };

  scan(config.staticModulesDir);
  scan(config.standaloneModulesDir);
}
