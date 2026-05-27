import fs from 'fs';
import path from 'path';
import { ModuleEntry, ModuleRegistryData, ModuleRegistrySchema } from './types';
import { logger } from '../server/logger';

/**
 * Persistent JSON registry with atomic writes and backup.
 */
export class ModuleRegistry {
  private data: ModuleRegistryData = { modules: [] };

  constructor(private readonly registryPath: string) {}

  /**
   * Load registry from disk; create empty file if missing.
   */
  load(): void {
    const dir = path.dirname(this.registryPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.registryPath)) {
      this.save();
      return;
    }
    const raw = fs.readFileSync(this.registryPath, 'utf-8');
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      logger.error('Invalid modules.json — not valid JSON', error);
      return;
    }
    const validated = ModuleRegistrySchema.safeParse(parsed);
    if (!validated.success) {
      logger.error('Invalid modules.json schema', {
        errors: validated.error.errors.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
      });
      return;
    }
    this.data = validated.data;
  }

  /**
   * Get all registered modules.
   */
  getAll(): ModuleEntry[] {
    return [...this.data.modules];
  }

  /**
   * Find module by id.
   */
  getById(id: string): ModuleEntry | undefined {
    return this.data.modules.find((m) => m.id === id);
  }

  /**
   * Add or update a module entry.
   */
  upsert(entry: ModuleEntry): void {
    const idx = this.data.modules.findIndex((m) => m.id === entry.id);
    if (idx >= 0) {
      this.data.modules[idx] = entry;
    } else {
      this.data.modules.push(entry);
    }
    this.save();
  }

  /**
   * Remove module from registry.
   */
  remove(id: string): boolean {
    const before = this.data.modules.length;
    this.data.modules = this.data.modules.filter((m) => m.id !== id);
    if (this.data.modules.length < before) {
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Persist registry atomically with backup.
   */
  save(): void {
    const dir = path.dirname(this.registryPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (fs.existsSync(this.registryPath)) {
      fs.copyFileSync(this.registryPath, `${this.registryPath}.bak`);
    }
    const tempPath = `${this.registryPath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
    fs.renameSync(tempPath, this.registryPath);
    logger.info('Registry saved', { path: this.registryPath });
  }
}
