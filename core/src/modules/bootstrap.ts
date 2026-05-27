import fs from 'fs';
import path from 'path';
import { AppConfig } from '../server/config';
import { ModuleRegistry } from './registry';
import { ManifestValidator } from './manifest-validator';
import { ModuleEntry } from './types';
import { logger } from '../server/logger';

/**
 * Register modules already present on disk (built-in and standalone samples).
 */
export function bootstrapExistingModules(
  config: AppConfig,
  registry: ModuleRegistry,
  validator: ManifestValidator,
): void {
  const scan = (baseDir: string, forceType?: 'builtin' | 'standalone'): void => {
    if (!fs.existsSync(baseDir)) return;
    for (const entry of fs.readdirSync(baseDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const moduleDir = path.join(baseDir, entry.name);
      const manifestPath = path.join(moduleDir, 'manifest.json');
      if (!fs.existsSync(manifestPath)) continue;

      const manifestRaw = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as { type?: string };
      const validation =
        manifestRaw.type === 'instance'
          ? validator.validateInstanceFiles(moduleDir)
          : forceType === 'standalone' || manifestRaw.type === 'standalone'
            ? validator.validateStandaloneFiles(moduleDir)
            : validator.validateFromPath(moduleDir);

      if (!validation.valid || !validation.manifest || !validation.moduleId) continue;

      const manifest = validation.manifest;
      const moduleType: ModuleEntry['type'] =
        manifest.type === 'instance'
          ? 'instance'
          : forceType ?? (manifest.type as ModuleEntry['type']);
      if (moduleType === 'static') {
        continue;
      }

      const existing = registry.getById(entry.name);
      const now = new Date().toISOString();
      const mod: ModuleEntry = {
        id: entry.name,
        name: manifest.name,
        type: moduleType,
        version: manifest.version,
        icon: manifest.icon,
        description: manifest.description,
        status: moduleType === 'standalone' ? 'stopped' : 'static',
        installPath: moduleDir,
        adminRole: manifest.admin_role,
        proxyPrefix:
          moduleType === 'standalone' || moduleType === 'instance'
            ? (manifest.proxy?.prefix ?? `/modules/${entry.name}/`)
            : undefined,
        proxyPaths: manifest.proxy?.paths ?? ['api'],
        internalPort: manifest.proxy?.internalPort,
        permissionsApproved: moduleType !== 'standalone',
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      registry.upsert(mod);
      logger.info('Bootstrapped module from disk', { id: mod.id, type: mod.type });
    }
  };

  scan(config.builtinModulesDir, 'builtin');
  scan(config.standaloneModulesDir, 'standalone');
}

/**
 * Migrate legacy static registry entry to builtin if present.
 */
export function migrateLegacyStaticGallery(registry: ModuleRegistry, config: AppConfig): void {
  const legacy = registry.getById('sample-gallery');
  if (!legacy || legacy.type !== 'static') {
    return;
  }
  const builtinPath = path.join(config.builtinModulesDir, 'sample-gallery');
  if (!fs.existsSync(builtinPath)) {
    return;
  }
  const now = new Date().toISOString();
  registry.upsert({
    ...legacy,
    type: 'builtin',
    status: 'static',
    installPath: builtinPath,
    permissionsApproved: true,
    updatedAt: now,
  });
  logger.info('Migrated sample-gallery from static to builtin');
}
