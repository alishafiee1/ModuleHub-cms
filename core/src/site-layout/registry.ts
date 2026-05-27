import fs from 'fs';
import path from 'path';
import {
  DEFAULT_ROOT_FOLDER_ID,
  SiteLayoutData,
  SiteLayoutFolder,
  SiteLayoutItem,
  SiteLayoutModuleItem,
  SiteLayoutSchema,
  createDefaultRootFolder,
} from './types';
import { parseSiteLayout, isFlatV2Layout } from './migration';
import { ModuleEntry } from '../modules/types';
import { logger } from '../server/logger';

/**
 * Persistent site layout registry for public homepage presentation.
 */
export class SiteLayoutRegistry {
  private data: SiteLayoutData = {
    siteTitle: 'ModuleHub CMS',
    siteSubtitle: 'ماژول‌ها و صفحات سایت',
    rootFolderId: DEFAULT_ROOT_FOLDER_ID,
    folders: [createDefaultRootFolder()],
    items: [],
  };

  constructor(private readonly layoutPath: string) {}

  /**
   * Load layout from disk; migrate v2 flat layouts automatically.
   */
  load(): void {
    const dir = path.dirname(this.layoutPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.layoutPath)) {
      return;
    }
    const raw = JSON.parse(fs.readFileSync(this.layoutPath, 'utf-8')) as unknown;
    const needsMigration =
      typeof raw === 'object' && raw !== null && isFlatV2Layout(raw as Record<string, unknown>);
    try {
      this.data = parseSiteLayout(raw);
      if (needsMigration) {
        this.save();
      }
    } catch (error) {
      logger.error('Invalid site-layout.json', error);
    }
  }

  /**
   * Get current layout data with sorted items.
   */
  getData(): SiteLayoutData {
    return {
      ...this.data,
      folders: [...this.data.folders],
      items: [...this.data.items].sort((left, right) => left.sortOrder - right.sortOrder),
    };
  }

  /**
   * Replace layout data after validation.
   */
  setData(data: SiteLayoutData): { success: boolean; errors: string[] } {
    const parsed = SiteLayoutSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        errors: parsed.error.errors.map((error) => `${error.path.join('.')}: ${error.message}`),
      };
    }
    this.data = parsed.data;
    this.save();
    return { success: true, errors: [] };
  }

  /**
   * Create a virtual folder under a parent.
   */
  addFolder(
    parentId: string,
    title: string,
    folderId?: string,
  ): { success: boolean; folder?: SiteLayoutFolder; errors: string[] } {
    const parentExists = this.data.folders.some((folder) => folder.id === parentId);
    if (!parentExists) {
      return { success: false, errors: [`Unknown parent folder: ${parentId}`] };
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48);
    const id = folderId ?? (slug || `folder-${Date.now()}`);

    if (this.data.folders.some((folder) => folder.id === id)) {
      return { success: false, errors: [`Folder id already exists: ${id}`] };
    }

    const folder: SiteLayoutFolder = { id, title, parentId };
    this.data.folders.push(folder);
    this.save();
    return { success: true, folder, errors: [] };
  }

  /**
   * Append catalog instance tile if not present.
   */
  addInstanceItem(
    module: ModuleEntry,
    options: { folderId?: string; iconClass?: string },
  ): void {
    if (this.data.items.some((item) => item.id === module.id)) {
      return;
    }
    const maxOrder = this.data.items.reduce(
      (max, item) => Math.max(max, item.sortOrder),
      0,
    );
    this.data.items.push({
      id: module.id,
      folderId: options.folderId ?? DEFAULT_ROOT_FOLDER_ID,
      kind: 'module',
      title: module.name,
      subtitle: module.description,
      iconClass: options.iconClass ?? 'fas fa-images',
      pageType: 'standalone',
      route: module.proxyPrefix ?? `/modules/${module.id}/`,
      sortOrder: maxOrder + 1,
    });
    this.save();
  }

  /**
   * Update homepage card icon fields for a module item.
   */
  updateModuleItemAppearance(
    moduleId: string,
    updates: { icon?: string; iconClass?: string },
  ): void {
    const item = this.data.items.find((entry) => entry.id === moduleId && entry.kind === 'module');
    if (!item || item.kind !== 'module') {
      return;
    }
    if (updates.icon !== undefined) {
      item.icon = updates.icon || undefined;
    }
    if (updates.iconClass !== undefined) {
      item.iconClass = updates.iconClass || undefined;
    }
    this.save();
  }

  /**
   * Append standalone module tile if not present.
   */
  addStandaloneItem(module: ModuleEntry, iconClass = 'fas fa-cube'): void {
    if (this.data.items.some((item) => item.id === module.id)) {
      return;
    }
    const maxOrder = this.data.items.reduce(
      (max, item) => Math.max(max, item.sortOrder),
      0,
    );
    const item: SiteLayoutModuleItem = {
      id: module.id,
      folderId: DEFAULT_ROOT_FOLDER_ID,
      kind: 'module',
      title: module.name,
      subtitle: module.description,
      iconClass,
      pageType: 'standalone',
      route: module.proxyPrefix ?? `/modules/${module.id}/`,
      sortOrder: maxOrder + 1,
    };
    this.data.items.push(item);
    this.save();
  }

  /**
   * Remove layout item by module id.
   */
  removeItem(moduleId: string): void {
    const before = this.data.items.length;
    this.data.items = this.data.items.filter((item) => item.id !== moduleId);
    if (this.data.items.length < before) {
      this.save();
    }
  }

  /**
   * Bootstrap default layout from registered modules when file is empty.
   */
  bootstrapFromModules(modules: ModuleEntry[]): void {
    if (this.data.items.length > 0) {
      return;
    }
    const defaults: Record<string, string> = {
      'sample-gallery': 'fas fa-images',
      'markdown-viewer': 'fas fa-book-open',
      'demo-api': 'fas fa-plug',
      thankio: 'fas fa-gamepad',
    };
    this.data = {
      siteTitle: 'ModuleHub CMS',
      siteSubtitle: 'ماژول‌ها و صفحات سایت',
      rootFolderId: DEFAULT_ROOT_FOLDER_ID,
      folders: [createDefaultRootFolder()],
      items: modules.map((mod, index) => ({
        id: mod.id,
        folderId: DEFAULT_ROOT_FOLDER_ID,
        kind: 'module' as const,
        title: mod.name,
        subtitle: mod.description,
        iconClass: defaults[mod.id] ?? 'fas fa-puzzle-piece',
        pageType: mod.type === 'standalone' ? ('standalone' as const) : ('builtin' as const),
        route:
          mod.type === 'standalone'
            ? (mod.proxyPrefix ?? `/modules/${mod.id}/`)
            : `/pages/${mod.id}/`,
        sortOrder: index + 1,
      })),
    };
    this.save();
  }

  /**
   * Persist layout atomically.
   */
  save(): void {
    const dir = path.dirname(this.layoutPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempPath = `${this.layoutPath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
    fs.renameSync(tempPath, this.layoutPath);
    logger.info('Site layout saved', { path: this.layoutPath });
  }
}
