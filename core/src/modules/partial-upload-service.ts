import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { ModuleRegistry } from './registry';
import { isZipEntryNameSafe, resolveSafeModulePath } from './path-safety';
import { logger } from '../server/logger';

const MAX_PARTIAL_FILES = 50;

export interface PartialUploadResult {
  success: boolean;
  replacedFiles: string[];
  errors: string[];
}

/**
 * Apply selective ZIP updates to an installed module directory.
 */
export class PartialUploadService {
  constructor(private readonly registry: ModuleRegistry) {}

  /**
   * Extract allowed ZIP entries into module install path.
   */
  applyZip(moduleId: string, zipBuffer: Buffer): PartialUploadResult {
    const mod = this.registry.getById(moduleId);
    if (!mod || (mod.type !== 'standalone' && mod.type !== 'instance')) {
      return { success: false, replacedFiles: [], errors: ['Module not found or not updatable'] };
    }

    const zip = new AdmZip(zipBuffer);
    const fileEntries = zip.getEntries().filter((entry) => !entry.isDirectory);
    if (fileEntries.length === 0) {
      return { success: false, replacedFiles: [], errors: ['ZIP contains no files'] };
    }
    if (fileEntries.length > MAX_PARTIAL_FILES) {
      return {
        success: false,
        replacedFiles: [],
        errors: [`Maximum ${MAX_PARTIAL_FILES} files allowed per partial upload`],
      };
    }

    const replacedFiles: string[] = [];
    for (const entry of fileEntries) {
      if (!isZipEntryNameSafe(entry.entryName)) {
        return {
          success: false,
          replacedFiles,
          errors: ['path traversal detected in archive'],
        };
      }
      const destPath = resolveSafeModulePath(mod.installPath, entry.entryName);
      if (!destPath) {
        return {
          success: false,
          replacedFiles,
          errors: [`invalid path in archive: ${entry.entryName}`],
        };
      }
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.writeFileSync(destPath, entry.getData());
      replacedFiles.push(entry.entryName.replace(/\\/g, '/'));
    }

    mod.updatedAt = new Date().toISOString();
    this.registry.upsert(mod);
    logger.info('Partial ZIP applied', { moduleId, fileCount: replacedFiles.length });
    return { success: true, replacedFiles, errors: [] };
  }
}
