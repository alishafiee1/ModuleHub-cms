import fs from 'fs';
import path from 'path';
import { SiteLayoutData, SiteLayoutItem, SiteLayoutSchema } from './types';
import { ModuleEntry } from '../modules/types';
import { logger } from '../server/logger';

/**
 * Persistent site layout registry for public homepage presentation.
 */
export class SiteLayoutRegistry {
  private data: SiteLayoutData = { siteTitle: 'ModuleHub CMS', siteSubtitle: 'ماژول‌ها و صفحات سایت', items: [] };

  constructor(private readonly layoutPath: string) {}

  /**
   * Load layout from disk; create empty structure if missing.
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
    const parsed = SiteLayoutSchema.safeParse(raw);
    if (!parsed.success) {
      logger.error('Invalid site-layout.json', parsed.error);
      return;
    }
    this.data = parsed.data;
  }

  /**
   * Get current layout data sorted by sortOrder.
   */
  getData(): SiteLayoutData {
    return {
      ...this.data,
      items: [...this.data.items].sort((a, b) => a.sortOrder - b.sortOrder),
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
        errors: parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      };
    }
    this.data = parsed.data;
    this.save();
    return { success: true, errors: [] };
  }

  /**
   * Append standalone module tile if not present.
   */
  addStandaloneItem(module: ModuleEntry, iconClass = 'fas fa-cube'): void {
    if (this.data.items.some((item) => item.id === module.id)) {
      return;
    }
    const maxOrder = this.data.items.reduce((max, item) => Math.max(max, item.sortOrder), 0);
    const item: SiteLayoutItem = {
      id: module.id,
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
      'thankio': 'fas fa-gamepad',
    };
    this.data = {
      siteTitle: 'ModuleHub CMS',
      siteSubtitle: 'ماژول‌ها و صفحات سایت',
      items: modules.map((mod, index) => ({
        id: mod.id,
        title: mod.name,
        subtitle: mod.description,
        iconClass: defaults[mod.id] ?? 'fas fa-puzzle-piece',
        pageType: mod.type === 'standalone' ? 'standalone' : 'builtin',
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
