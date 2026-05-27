import fs from 'fs';
import path from 'path';
import { AppConfig } from '../server/config';

export interface CatalogTemplateMeta {
  title: string;
  description: string;
  defaultIconClass?: string;
}

export interface CatalogTemplateSummary {
  templateId: string;
  title: string;
  description: string;
  defaultIconClass: string;
  templateVersion: string;
}

/**
 * List read-only module templates from core/catalog-modules/.
 */
export class CatalogService {
  constructor(private readonly config: AppConfig) {}

  /**
   * Return all catalog templates with manifest.template.json.
   */
  listTemplates(): CatalogTemplateSummary[] {
    const catalogDir = this.config.catalogModulesDir;
    if (!fs.existsSync(catalogDir)) {
      return [];
    }

    const templates: CatalogTemplateSummary[] = [];
    for (const entry of fs.readdirSync(catalogDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const templateDir = path.join(catalogDir, entry.name);
      const manifestTemplatePath = path.join(templateDir, 'manifest.template.json');
      if (!fs.existsSync(manifestTemplatePath)) continue;

      const meta = this.readMeta(templateDir, entry.name);
      const raw = JSON.parse(fs.readFileSync(manifestTemplatePath, 'utf-8')) as {
        templateVersion?: string;
      };

      templates.push({
        templateId: entry.name,
        title: meta.title,
        description: meta.description,
        defaultIconClass: meta.defaultIconClass ?? 'fas fa-puzzle-piece',
        templateVersion: raw.templateVersion ?? '1.0.0',
      });
    }

    return templates.sort((left, right) => left.title.localeCompare(right.title, 'fa'));
  }

  /**
   * Resolve absolute path to a catalog template directory.
   */
  getTemplatePath(templateId: string): string | null {
    const templateDir = path.join(this.config.catalogModulesDir, templateId);
    const manifestTemplatePath = path.join(templateDir, 'manifest.template.json');
    if (!fs.existsSync(manifestTemplatePath)) {
      return null;
    }
    return templateDir;
  }

  private readMeta(templateDir: string, templateId: string): CatalogTemplateMeta {
    const metaPath = path.join(templateDir, 'catalog.meta.json');
    if (fs.existsSync(metaPath)) {
      return JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as CatalogTemplateMeta;
    }
    return {
      title: templateId,
      description: `Catalog template ${templateId}`,
      defaultIconClass: 'fas fa-puzzle-piece',
    };
  }
}
