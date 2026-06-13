import fs from 'fs-extra';
import path from 'path';
import { PATHS } from '../../config/paths';
import { loadSystemSettings } from '../system-settings/settings-loader';
import { toHomePageAppearance } from '../system-settings/home-appearance';
import { LayoutParseError, parseSiteLayout } from './layout-parser';
import { ensureDeviceBreakpointLayouts } from './derive-breakpoint-layout';
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

export interface ReadSiteLayoutResult {
  layout: SiteLayoutDocument;
  derivedLayoutsSaved: boolean;
}

interface CachedSiteLayout {
  layout: SiteLayoutDocument;
  mtimeMs: number;
}

let cachedSiteLayout: CachedSiteLayout | null = null;

/**
 * Clears in-memory layout cache (used in tests).
 */
export function clearSiteLayoutCacheForTests(): void {
  cachedSiteLayout = null;
}

/**
 * Reads and validates site-layout.json from storage.
 * @returns Parsed layout and whether device breakpoint layouts were derived this read
 */
export async function readSiteLayoutWithMeta(): Promise<ReadSiteLayoutResult> {
  await seedSiteLayoutIfMissing();
  const layoutStat = await fs.stat(PATHS.siteLayout);
  if (cachedSiteLayout && cachedSiteLayout.mtimeMs === layoutStat.mtimeMs) {
    return { layout: cachedSiteLayout.layout, derivedLayoutsSaved: false };
  }

  const rawText = await fs.readFile(PATHS.siteLayout, 'utf8');
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawText) as unknown;
  } catch {
    throw new LayoutParseError('site-layout.json is not valid JSON');
  }

  const layout = parseSiteLayout(parsed);
  const { layout: migratedLayout, migrated } = migrateSiteLayoutCardGrid(layout);
  let resultLayout = migratedLayout;

  const { layout: withDevices, changed: devicesChanged } = ensureDeviceBreakpointLayouts(resultLayout);
  if (devicesChanged) {
    resultLayout = withDevices;
  }

  if (migrated || devicesChanged) {
    await writeSiteLayout(resultLayout);
  }

  const finalMtimeMs = migrated || devicesChanged
    ? (await fs.stat(PATHS.siteLayout)).mtimeMs
    : layoutStat.mtimeMs;
  cachedSiteLayout = { layout: resultLayout, mtimeMs: finalMtimeMs };

  return { layout: resultLayout, derivedLayoutsSaved: devicesChanged };
}

/**
 * Reads and validates site-layout.json from storage.
 * @returns Parsed layout document
 */
export async function readSiteLayout(): Promise<SiteLayoutDocument> {
  const { layout } = await readSiteLayoutWithMeta();
  return layout;
}

/**
 * Loads layout formatted for the public API.
 * @returns Layout API response
 */
export async function loadLayoutForApi(): Promise<LayoutApiResponse> {
  const [{ layout, derivedLayoutsSaved }, settings] = await Promise.all([
    readSiteLayoutWithMeta(),
    loadSystemSettings(),
  ]);
  return {
    ...toLayoutApiResponse(layout),
    appearance: toHomePageAppearance(settings),
    ...(derivedLayoutsSaved ? { derivedLayoutsSaved: true } : {}),
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
  cachedSiteLayout = null;
}
