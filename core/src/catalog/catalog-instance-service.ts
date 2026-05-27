import fs from 'fs';
import path from 'path';
import { AppConfig } from '../server/config';
import { CatalogService } from './catalog-service';
import { ModuleRegistry } from '../modules/registry';
import { SiteLayoutRegistry } from '../site-layout/registry';
import { ManifestValidator, sanitizeModuleId } from '../modules/manifest-validator';
import { ModuleEntry } from '../modules/types';
import { DEFAULT_ROOT_FOLDER_ID } from '../site-layout/types';
import { logger } from '../server/logger';

export interface CreateInstanceOptions {
  templateId: string;
  instanceId: string;
  cardTitle: string;
  cardDescription?: string;
  iconClass?: string;
  folderId?: string;
}

export interface CreateInstanceResult {
  success: boolean;
  instanceId?: string;
  module?: ModuleEntry;
  errors: string[];
}

/**
 * Copy catalog template to standalone-modules and register instance.
 */
export class CatalogInstanceService {
  private readonly catalogService: CatalogService;

  constructor(
    private readonly config: AppConfig,
    private readonly registry: ModuleRegistry,
    private readonly layoutRegistry: SiteLayoutRegistry,
    private readonly validator: ManifestValidator,
  ) {
    this.catalogService = new CatalogService(config);
  }

  /**
   * Create a new instance from a catalog template.
   */
  create(options: CreateInstanceOptions): CreateInstanceResult {
    const errors: string[] = [];
    const instanceId = sanitizeModuleId(options.instanceId || options.cardTitle);

    if (!instanceId) {
      return { success: false, errors: ['Invalid instance id'] };
    }

    const templateDir = this.catalogService.getTemplatePath(options.templateId);
    if (!templateDir) {
      return { success: false, errors: [`Unknown template: ${options.templateId}`] };
    }

    if (this.registry.getById(instanceId)) {
      return { success: false, errors: [`Instance id already registered: ${instanceId}`] };
    }

    const targetDir = path.join(this.config.standaloneModulesDir, instanceId);
    if (fs.existsSync(targetDir)) {
      return { success: false, errors: [`Instance directory already exists: ${instanceId}`] };
    }

    fs.mkdirSync(path.dirname(targetDir), { recursive: true });
    fs.cpSync(templateDir, targetDir, { recursive: true });

    const manifestTemplatePath = path.join(targetDir, 'manifest.template.json');
    if (!fs.existsSync(manifestTemplatePath)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
      return { success: false, errors: ['Template missing manifest.template.json'] };
    }

    const templateRaw = fs.readFileSync(manifestTemplatePath, 'utf-8');
    const cardDescription =
      options.cardDescription?.trim() ||
      options.cardTitle.trim() ||
      `Instance ${instanceId}`;

    const tokens = {
      instanceId,
      cardTitle: options.cardTitle.trim(),
      cardDescription,
    };

    const manifestContent = this.applyTokens(templateRaw, tokens);

    fs.writeFileSync(path.join(targetDir, 'manifest.json'), manifestContent, 'utf-8');
    fs.unlinkSync(manifestTemplatePath);

    const indexPath = path.join(targetDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      const indexHtml = fs.readFileSync(indexPath, 'utf-8');
      fs.writeFileSync(indexPath, this.applyTokens(indexHtml, tokens), 'utf-8');
    }

    const validation = this.validator.validateInstanceFiles(targetDir);
    if (!validation.valid || !validation.manifest) {
      fs.rmSync(targetDir, { recursive: true, force: true });
      return { success: false, errors: validation.errors };
    }

    const now = new Date().toISOString();
    const module: ModuleEntry = {
      id: instanceId,
      name: options.cardTitle.trim(),
      type: 'instance',
      version: validation.manifest.version,
      icon: validation.manifest.icon,
      description: cardDescription,
      status: 'static',
      installPath: targetDir,
      adminRole: validation.manifest.admin_role,
      proxyPrefix: `/modules/${instanceId}/`,
      permissionsApproved: true,
      createdAt: now,
      updatedAt: now,
    };

    this.registry.upsert(module);
    this.layoutRegistry.addInstanceItem(module, {
      folderId: options.folderId ?? DEFAULT_ROOT_FOLDER_ID,
      iconClass: options.iconClass,
    });

    logger.info('Catalog instance created', {
      instanceId,
      templateId: options.templateId,
    });

    return { success: true, instanceId, module, errors: [] };
  }

  private applyTokens(
    templateRaw: string,
    tokens: { instanceId: string; cardTitle: string; cardDescription: string },
  ): string {
    return templateRaw
      .replace(/\{\{instanceId\}\}/g, tokens.instanceId)
      .replace(/\{\{cardTitle\}\}/g, tokens.cardTitle)
      .replace(/\{\{cardDescription\}\}/g, tokens.cardDescription);
  }
}
