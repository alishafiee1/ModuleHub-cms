import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { DockerManager } from '../docker/manager';
import { ReverseProxyManager } from '../proxy/reverse-proxy-manager';
import { SiteLayoutRegistry } from '../site-layout/registry';
import { ManifestValidator } from './manifest-validator';
import { ModuleEntry, ModuleManifest } from './types';
import { ModuleRegistry } from './registry';
import { logger } from '../server/logger';

export const ModuleSettingsInputSchema = z.object({
  ports: z.array(z.number().int().min(1024).max(65535)).min(1),
  internalPort: z.number().int().min(1).max(65535),
  proxyPrefix: z.string().min(1),
  proxyPaths: z.array(z.string().min(1)).optional(),
  memory: z.string().optional(),
  cpus: z.string().optional(),
  github: z
    .object({
      repo: z.string().url(),
      branch: z.string().optional(),
    })
    .optional(),
  entryHtml: z.string().min(1).optional(),
  layoutIcon: z.string().optional(),
  layoutIconClass: z.string().optional(),
});

export type ModuleSettingsInput = z.infer<typeof ModuleSettingsInputSchema>;

export interface ModuleSettingsView {
  moduleId: string;
  status: ModuleEntry['status'];
  ports: number[];
  internalPort: number;
  proxyPrefix: string;
  proxyPaths: string[];
  memory?: string;
  cpus?: string;
  github?: { repo: string; branch?: string };
  entryHtml: string;
  layoutIcon?: string;
  layoutIconClass?: string;
  warnings: string[];
}

export interface SaveSettingsResult {
  success: boolean;
  module?: ModuleEntry;
  errors: string[];
  warnings: string[];
}

/**
 * Read and persist standalone module settings (manifest + layout card).
 */
export class ModuleSettingsService {
  constructor(
    private readonly registry: ModuleRegistry,
    private readonly layoutRegistry: SiteLayoutRegistry,
    private readonly validator: ManifestValidator,
    private readonly dockerManager: DockerManager,
    private readonly proxyManager: ReverseProxyManager,
  ) {}

  /**
   * Load settings form fields from manifest and site layout.
   */
  getSettings(moduleId: string): ModuleSettingsView | null {
    const mod = this.registry.getById(moduleId);
    if (!mod || mod.type !== 'standalone') {
      return null;
    }

    const manifest = this.readManifest(mod.installPath);
    if (!manifest) {
      return null;
    }

    const layoutItem = this.layoutRegistry
      .getData()
      .items.find((item) => item.id === moduleId && item.kind === 'module');

    const composePath = path.join(
      mod.installPath,
      manifest.docker?.composeFile ?? 'docker-compose.yml',
    );
    const composeContent = fs.existsSync(composePath)
      ? fs.readFileSync(composePath, 'utf-8')
      : undefined;
    const validation = this.validator.validate(manifest, composeContent);

    return {
      moduleId,
      status: mod.status,
      ports: manifest.docker?.ports ?? [],
      internalPort: manifest.proxy?.internalPort ?? mod.internalPort ?? 3000,
      proxyPrefix: manifest.proxy?.prefix ?? mod.proxyPrefix ?? `/modules/${moduleId}/`,
      proxyPaths: manifest.proxy?.paths ?? mod.proxyPaths ?? ['api'],
      memory: manifest.docker?.resources?.memory,
      cpus: manifest.docker?.resources?.cpus,
      github: manifest.github,
      entryHtml: manifest.entryHtml ?? 'index.html',
      layoutIcon: layoutItem?.kind === 'module' ? layoutItem.icon : undefined,
      layoutIconClass: layoutItem?.kind === 'module' ? layoutItem.iconClass : undefined,
      warnings: validation.warnings,
    };
  }

  /**
   * Validate and save settings; transition module to running when complete.
   */
  async saveSettings(moduleId: string, rawInput: unknown): Promise<SaveSettingsResult> {
    const mod = this.registry.getById(moduleId);
    if (!mod || mod.type !== 'standalone') {
      return { success: false, errors: ['Standalone module not found'], warnings: [] };
    }

    const parsed = ModuleSettingsInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        errors: parsed.error.errors.map((error) => `${error.path.join('.')}: ${error.message}`),
        warnings: [],
      };
    }

    const input = parsed.data;
    const manifest = this.readManifest(mod.installPath);
    if (!manifest) {
      return { success: false, errors: ['manifest.json not found'], warnings: [] };
    }

    const updatedManifest: ModuleManifest = {
      ...manifest,
      docker: {
        ...manifest.docker,
        composeFile: manifest.docker?.composeFile ?? 'docker-compose.yml',
        ports: input.ports,
        resources: {
          memory: input.memory,
          cpus: input.cpus,
        },
      },
      proxy: {
        prefix: input.proxyPrefix,
        internalPort: input.internalPort,
        paths: input.proxyPaths ?? ['api'],
      },
      github: input.github,
      entryHtml: input.entryHtml ?? manifest.entryHtml ?? 'index.html',
    };

    const composePath = path.join(
      mod.installPath,
      updatedManifest.docker?.composeFile ?? 'docker-compose.yml',
    );
    const composeContent = fs.existsSync(composePath)
      ? fs.readFileSync(composePath, 'utf-8')
      : undefined;
    const validation = this.validator.validate(updatedManifest, composeContent);
    if (!validation.valid || !validation.manifest) {
      return { success: false, errors: validation.errors, warnings: validation.warnings };
    }

    fs.writeFileSync(
      path.join(mod.installPath, 'manifest.json'),
      JSON.stringify(updatedManifest, null, 2),
      'utf-8',
    );

    mod.proxyPrefix = updatedManifest.proxy?.prefix;
    mod.proxyPaths = updatedManifest.proxy?.paths ?? ['api'];
    mod.internalPort = updatedManifest.proxy?.internalPort;
    mod.permissionsApproved = true;
    mod.updatedAt = new Date().toISOString();

    this.layoutRegistry.updateModuleItemAppearance(moduleId, {
      icon: input.layoutIcon,
      iconClass: input.layoutIconClass,
    });

    if (!mod.hostPort || mod.status === 'settings_pending' || mod.status === 'stopped') {
      const startResult = await this.dockerManager.startModule(mod);
      if (!startResult.success) {
        mod.status = 'error';
        this.registry.upsert(mod);
        return {
          success: false,
          errors: [startResult.error ?? 'Docker start failed'],
          warnings: validation.warnings,
        };
      }
      mod.hostPort = startResult.hostPort;
      mod.containerId = startResult.containerId;
    }

    mod.status = 'running';
    this.registry.upsert(mod);

    if (mod.proxyPrefix && mod.hostPort) {
      this.proxyManager.registerRoute(
        mod.id,
        mod.proxyPrefix,
        mod.hostPort,
        mod.proxyPaths ?? ['api'],
      );
    }

    logger.info('Module settings saved', { moduleId });
    return { success: true, module: mod, errors: [], warnings: validation.warnings };
  }

  private readManifest(installPath: string): ModuleManifest | null {
    const manifestPath = path.join(installPath, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as ModuleManifest;
  }
}
