import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { AppConfig } from '../server/config';
import { ModuleRegistry } from './registry';
import { ManifestValidator } from './manifest-validator';
import { ModuleEntry } from './types';
import { logger } from '../server/logger';
import { isZipEntryNameSafe, resolveSafeModulePath } from './path-safety';

export interface InstallResult {
  success: boolean;
  moduleId?: string;
  warnings: string[];
  errors: string[];
  needsPermissionApproval?: boolean;
}

/**
 * Handles ZIP upload, extraction, and module registration.
 */
export class ModuleInstaller {
  constructor(
    private readonly config: AppConfig,
    private readonly registry: ModuleRegistry,
    private readonly validator: ManifestValidator,
  ) {}

  /**
   * Install module from uploaded ZIP buffer.
   */
  installFromZip(zipBuffer: Buffer, approvePermissions = false): InstallResult {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();

    for (const entry of entries) {
      if (entry.isDirectory) continue;
      if (!isZipEntryNameSafe(entry.entryName)) {
        return { success: false, errors: ['path traversal detected in archive'], warnings: [] };
      }
    }

    const manifestEntry = entries.find((e) => e.entryName.endsWith('manifest.json'));
    if (!manifestEntry) {
      return { success: false, errors: ['manifest.json not found in archive'], warnings: [] };
    }

    let rawManifest: unknown;
    try {
      rawManifest = JSON.parse(manifestEntry.getData().toString('utf-8'));
    } catch {
      return { success: false, errors: ['manifest.json is not valid JSON'], warnings: [] };
    }

    const composeEntry = entries.find((e) => e.entryName.endsWith('docker-compose.yml'));
    const composeContent = composeEntry?.getData().toString('utf-8');
    const validation = this.validator.validate(rawManifest, composeContent);
    if (!validation.valid || !validation.manifest || !validation.moduleId) {
      return { success: false, errors: validation.errors, warnings: validation.warnings };
    }

    const { manifest, moduleId } = validation;
    const baseDir =
      manifest.type === 'static'
        ? this.config.staticModulesDir
        : this.config.standaloneModulesDir;
    const targetDir = path.join(baseDir, moduleId);

    if (fs.existsSync(targetDir)) {
      return { success: false, errors: [`module "${moduleId}" already exists`], warnings: validation.warnings };
    }

    fs.mkdirSync(targetDir, { recursive: true });

    for (const entry of entries) {
      if (entry.isDirectory) continue;
      if (!isZipEntryNameSafe(entry.entryName)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
        return { success: false, errors: ['path traversal detected in archive'], warnings: [] };
      }
      const destPath = resolveSafeModulePath(targetDir, entry.entryName);
      if (!destPath) {
        fs.rmSync(targetDir, { recursive: true, force: true });
        return { success: false, errors: ['invalid path in archive'], warnings: [] };
      }
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.writeFileSync(destPath, entry.getData());
    }

    const now = new Date().toISOString();
    const entry: ModuleEntry = {
      id: moduleId,
      name: manifest.name,
      type: manifest.type,
      version: manifest.version,
      icon: manifest.icon,
      description: manifest.description,
      status: manifest.type === 'static' ? 'static' : 'stopped',
      installPath: targetDir,
      adminRole: manifest.admin_role,
      proxyPrefix: manifest.proxy?.prefix,
      internalPort: manifest.proxy?.internalPort,
      permissionsApproved: manifest.type === 'static' ? true : approvePermissions,
      createdAt: now,
      updatedAt: now,
    };

    this.registry.upsert(entry);
    logger.info('Module installed', { moduleId, type: manifest.type });

    return {
      success: true,
      moduleId,
      warnings: validation.warnings,
      errors: [],
      needsPermissionApproval: manifest.type === 'standalone' && !approvePermissions,
    };
  }

  /**
   * Remove module from disk and registry.
   */
  uninstall(moduleId: string): boolean {
    const mod = this.registry.getById(moduleId);
    if (!mod) return false;
    if (fs.existsSync(mod.installPath)) {
      fs.rmSync(mod.installPath, { recursive: true, force: true });
    }
    this.registry.remove(moduleId);
    logger.info('Module uninstalled', { moduleId });
    return true;
  }
}
