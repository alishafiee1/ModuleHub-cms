import fs from 'fs';
import { ManifestSchema, ModuleManifest, ValidationResult } from './types';

const MAX_PORTS = 5;
const MIN_PORT = 1024;
const MAX_PORT = 65535;

/**
 * Convert display name to filesystem-safe kebab-case module id.
 */
export function sanitizeModuleId(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'module';
}

/**
 * Validate manifest.json content and security constraints.
 */
export class ManifestValidator {
  /**
   * Parse and validate manifest object.
   */
  validate(raw: unknown, composeContent?: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const parsed = ManifestSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        valid: false,
        errors: parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
        warnings,
      };
    }

    const manifest = parsed.data;

    if (manifest.type === 'standalone') {
      if (!manifest.docker) {
        errors.push('standalone modules require docker section');
      }
      if (!manifest.proxy) {
        errors.push('standalone modules require proxy section');
      }
      if (manifest.docker?.ports) {
        if (manifest.docker.ports.length > MAX_PORTS) {
          errors.push(`maximum ${MAX_PORTS} ports allowed`);
        }
        for (const port of manifest.docker.ports) {
          if (port < MIN_PORT || port > MAX_PORT) {
            errors.push(`port ${port} out of allowed range ${MIN_PORT}-${MAX_PORT}`);
          }
        }
      }
      if (composeContent && !composeContent.includes('cap_drop')) {
        warnings.push('docker-compose.yml missing cap_drop — security risk');
      }
      if (composeContent && !composeContent.includes('read_only')) {
        warnings.push('docker-compose.yml missing read_only — consider enabling');
      }
    }

    const moduleId = sanitizeModuleId(manifest.name);

    return {
      valid: errors.length === 0,
      manifest,
      moduleId,
      errors,
      warnings,
    };
  }

  /**
   * Read and validate manifest from module directory.
   */
  validateFromPath(moduleDir: string): ValidationResult {
    const manifestPath = `${moduleDir}/manifest.json`;
    if (!fs.existsSync(manifestPath)) {
      return { valid: false, errors: ['manifest.json not found'], warnings: [] };
    }
    const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as unknown;
    const composePath = `${moduleDir}/docker-compose.yml`;
    const composeContent = fs.existsSync(composePath)
      ? fs.readFileSync(composePath, 'utf-8')
      : undefined;
    return this.validate(raw, composeContent);
  }
}

export type { ModuleManifest };
