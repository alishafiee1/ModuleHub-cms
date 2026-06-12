import fs from 'fs-extra';
import path from 'path';
import { PATHS } from '../../config/paths';
import { loadSystemSettings } from '../system-settings/settings-loader';
import { toHomePageAppearance } from '../system-settings/home-appearance';
import { LayoutParseError, parseSiteLayout } from './layout-parser';
import { migrateSiteLayoutCardGrid } from './migrate-card-grid';
import type { LayoutApiCore, LayoutApiResponse, ModuleEntry, PublicModuleEntry, SiteLayoutDocument } from './types';

/**
 * Maps internal module entry to public API shape (strips password hash).
 * @param entry - Stored module metadata
 * @returns Public-safe module payload
 */
export function toPublicModuleEntry(entry: ModuleEntry): PublicModuleEntry {
  const hasManagementPassword = Boolean(
    entry.managementPasswordHash && entry.managementPasswordHash.trim().length > 0,
  );

  return {
    name: entry.name,
    status: entry.status,
    version: entry.version,
    docker: entry.docker,
    port: entry.port,
    permissions: entry.permissions,
    resources: entry.resources,
    icon: entry.icon,
    thumbnail: entry.thumbnail,
    changelog: entry.changelog,
    gitRepo: entry.gitRepo,
    hasManagementPassword,
  };
}

/**
 * Builds API response from a validated layout document.
 * @param layout - Parsed site layout
 * @returns Layout payload for GET /api/layout
 */
export function toLayoutApiResponse(layout: SiteLayoutDocument): LayoutApiCore {
  const modules: Record<string, PublicModuleEntry> = {};
  for (const [moduleId, entry] of Object.entries(layout.modules)) {
    modules[moduleId] = toPublicModuleEntry(entry);
  }

  return {
    version: layout.version,
    tree: layout.tree,
    modules,
  };
}

/**
 * Seeds storage/site-layout.json from docs template when missing.
 * @returns Promise resolved after seed check
 */
export async function seedSiteLayoutIfMissing(): Promise<void> {
  await fs.ensureDir(path.dirname(PATHS.siteLayout));
  const exists = await fs.pathExists(PATHS.siteLayout);
  if (exists) {
    return;
  }

  const seedExists = await fs.pathExists(PATHS.siteLayoutSeed);
  if (!seedExists) {
    throw new Error(`Site layout seed not found at ${PATHS.siteLayoutSeed}`);
  }

  await fs.copy(PATHS.siteLayoutSeed, PATHS.siteLayout);
}

/**
 * Reads and validates site-layout.json from storage.
 * @returns Parsed layout document
 */
export async function readSiteLayout(): Promise<SiteLayoutDocument> {
  await seedSiteLayoutIfMissing();
  const rawText = await fs.readFile(PATHS.siteLayout, 'utf8');
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawText) as unknown;
  } catch {
    throw new LayoutParseError('site-layout.json is not valid JSON');
  }

  const layout = parseSiteLayout(parsed);
  const { layout: migratedLayout, migrated } = migrateSiteLayoutCardGrid(layout);
  if (migrated) {
    await writeSiteLayout(migratedLayout);
  }
  return migratedLayout;
}

/**
 * Loads layout formatted for the public API.
 * @returns Layout API response
 */
export async function loadLayoutForApi(): Promise<LayoutApiResponse> {
  const [layout, settings] = await Promise.all([
    readSiteLayout(),
    loadSystemSettings(),
  ]);
  return {
    ...toLayoutApiResponse(layout),
    appearance: toHomePageAppearance(settings),
  };
}

/**
 * Persists site-layout.json to storage.
 * @param layout - Validated layout document
 * @returns Promise resolved after write
 */
export async function writeSiteLayout(layout: SiteLayoutDocument): Promise<void> {
  await fs.ensureDir(path.dirname(PATHS.siteLayout));
  await fs.writeJson(PATHS.siteLayout, layout, { spaces: 2 });
}
