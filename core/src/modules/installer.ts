import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { AppConfig } from '../server/config';
import { DockerManager } from '../docker/manager';
import { ModuleRegistry } from './registry';
import { ManifestValidator } from './manifest-validator';
import { ModuleEntry } from './types';
import { logger } from '../server/logger';
import { isZipEntryNameSafe, resolveSafeModulePath } from './path-safety';
import { SiteLayoutRegistry } from '../site-layout/registry';
import { analyzeZipManifest, validateZipIndexAtRoot } from './zip-manifest-analysis';

export interface InstallResult {
  success: boolean;
  moduleId?: string;
  warnings: string[];
  errors: string[];
  needsSettings?: boolean;
}

/**
 * Handles ZIP upload, extraction, and module registration.
 */
export class ModuleInstaller {
  constructor(
    private readonly config: AppConfig,
    private readonly registry: ModuleRegistry,
    private readonly validator: ManifestValidator,
    private readonly layoutRegistry?: SiteLayoutRegistry,
    private readonly dockerManager?: DockerManager,
  ) {}

  /**
   * Install module from uploaded ZIP buffer and start Docker in settings mode.
   */
  async installFromZip(zipBuffer: Buffer): Promise<InstallResult> {
    const extractResult = this.extractAndRegister(zipBuffer);
    if (!extractResult.success || !extractResult.moduleId) {
      return extractResult;
    }

    const mod = this.registry.getById(extractResult.moduleId);
    if (!mod) {
      return { ...extractResult, success: false, errors: ['Module registration failed'] };
    }

    if (!this.dockerManager) {
      mod.status = 'settings_pending';
      mod.permissionsApproved = true;
      mod.updatedAt = new Date().toISOString();
      this.registry.upsert(mod);
      return { ...extractResult, needsSettings: true };
    }

    mod.status = 'installing';
    mod.updatedAt = new Date().toISOString();
    this.registry.upsert(mod);

    const dockerResult = await this.dockerManager.startModule(mod);
    if (!dockerResult.success) {
      mod.status = 'settings_pending';
      mod.updatedAt = new Date().toISOString();
      this.registry.upsert(mod);
      return {
        ...extractResult,
        needsSettings: true,
        warnings: [
          ...extractResult.warnings,
          dockerResult.error ?? 'Docker start failed — complete settings and retry Save',
        ],
      };
    }

    mod.status = 'settings_pending';
    mod.permissionsApproved = true;
    mod.hostPort = dockerResult.hostPort;
    mod.containerId = dockerResult.containerId;
    mod.updatedAt = new Date().toISOString();
    this.registry.upsert(mod);

    logger.info('Module installed in settings mode', { moduleId: mod.id });
    return { ...extractResult, needsSettings: true };
  }

  /**
   * Extract ZIP, validate, and register module without Docker.
   */
  private extractAndRegister(zipBuffer: Buffer): InstallResult {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();

    for (const entry of entries) {
      if (entry.isDirectory) continue;
      if (!isZipEntryNameSafe(entry.entryName)) {
        return { success: false, errors: ['path traversal detected in archive'], warnings: [] };
      }
    }

    const manifestAnalysis = analyzeZipManifest(entries);
    if (!manifestAnalysis.manifestEntry) {
      return { success: false, errors: manifestAnalysis.errors, warnings: [] };
    }
    if (manifestAnalysis.errors.length > 0) {
      return { success: false, errors: manifestAnalysis.errors, warnings: [] };
    }
    const manifestEntry = manifestAnalysis.manifestEntry;

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
    if (manifest.type !== 'standalone') {
      return {
        success: false,
        errors: ['only standalone modules can be uploaded; built-in pages are part of core'],
        warnings: validation.warnings,
      };
    }

    const indexErrors = validateZipIndexAtRoot(entries, manifestAnalysis.rootPrefix);
    if (indexErrors.length > 0) {
      return {
        success: false,
        errors: indexErrors,
        warnings: validation.warnings,
      };
    }

    const targetDir = path.join(this.config.standaloneModulesDir, moduleId);

    if (fs.existsSync(targetDir)) {
      return {
        success: false,
        errors: [`module "${moduleId}" already exists`],
        warnings: validation.warnings,
      };
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

    const fileValidation = this.validator.validateStandaloneFiles(targetDir);
    if (!fileValidation.valid) {
      fs.rmSync(targetDir, { recursive: true, force: true });
      return { success: false, errors: fileValidation.errors, warnings: fileValidation.warnings };
    }

    const now = new Date().toISOString();
    const entry: ModuleEntry = {
      id: moduleId,
      name: manifest.name,
      type: manifest.type,
      version: manifest.version,
      icon: manifest.icon,
      description: manifest.description,
      status: 'settings_pending',
      installPath: targetDir,
      adminRole: manifest.admin_role,
      proxyPrefix: manifest.proxy?.prefix,
      proxyPaths: manifest.proxy?.paths ?? ['api'],
      internalPort: manifest.proxy?.internalPort,
      permissionsApproved: true,
      createdAt: now,
      updatedAt: now,
    };

    this.registry.upsert(entry);
    this.layoutRegistry?.addStandaloneItem(entry);
    logger.info('Module extracted', { moduleId, type: manifest.type });

    return {
      success: true,
      moduleId,
      warnings: validation.warnings,
      errors: [],
      needsSettings: true,
    };
  }

  /**
   * Remove module from disk and registry.
   */
  uninstall(moduleId: string): boolean {
    const mod = this.registry.getById(moduleId);
    if (!mod) return false;
    if (mod.type === 'builtin') {
      return false;
    }
    if (fs.existsSync(mod.installPath)) {
      fs.rmSync(mod.installPath, { recursive: true, force: true });
    }
    this.registry.remove(moduleId);
    this.layoutRegistry?.removeItem(moduleId);
    logger.info('Module uninstalled', { moduleId });
    return true;
  }
}
