import {
  DEFAULT_ROOT_FOLDER_ID,
  SiteLayoutData,
  SiteLayoutItem,
  SiteLayoutSchema,
  createDefaultRootFolder,
} from './types';

/**
 * Detect flat v2 layout (no folders / rootFolderId).
 */
export function isFlatV2Layout(raw: Record<string, unknown>): boolean {
  return !Array.isArray(raw.folders) || typeof raw.rootFolderId !== 'string';
}

/**
 * Migrate flat v2 layout JSON to v3 shape with root folder and item metadata.
 */
export function migrateV2LayoutToV3(raw: Record<string, unknown>): SiteLayoutData {
  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
  const items: SiteLayoutItem[] = itemsRaw.map((entry) => {
    const item = entry as Record<string, unknown>;
    const kind = item.kind as SiteLayoutItem['kind'] | undefined;
    if (kind === 'admin-add') {
      return {
        id: String(item.id),
        folderId: String(item.folderId ?? DEFAULT_ROOT_FOLDER_ID),
        title: String(item.title ?? '+'),
        sortOrder: Number(item.sortOrder ?? 0),
        kind: 'admin-add' as const,
        subtitle: item.subtitle ? String(item.subtitle) : undefined,
      };
    }
    if (kind === 'folder') {
      return {
        id: String(item.id),
        folderId: String(item.folderId ?? DEFAULT_ROOT_FOLDER_ID),
        title: String(item.title),
        sortOrder: Number(item.sortOrder ?? 0),
        kind: 'folder' as const,
        targetFolderId: String(item.targetFolderId),
        subtitle: item.subtitle ? String(item.subtitle) : undefined,
        iconClass: item.iconClass ? String(item.iconClass) : undefined,
      };
    }
    return {
      id: String(item.id),
      folderId: String(item.folderId ?? DEFAULT_ROOT_FOLDER_ID),
      title: String(item.title),
      subtitle: String(item.subtitle ?? ''),
      sortOrder: Number(item.sortOrder ?? 0),
      kind: 'module' as const,
      iconClass: item.iconClass ? String(item.iconClass) : undefined,
      icon: item.icon ? String(item.icon) : undefined,
      pageType: item.pageType as 'builtin' | 'standalone',
      route: String(item.route),
    };
  });

  const migrated: SiteLayoutData = {
    siteTitle: String(raw.siteTitle ?? 'ModuleHub CMS'),
    siteSubtitle: String(raw.siteSubtitle ?? 'ماژول‌ها و صفحات سایت'),
    rootFolderId: DEFAULT_ROOT_FOLDER_ID,
    folders: [createDefaultRootFolder()],
    items,
  };

  const parsed = SiteLayoutSchema.safeParse(migrated);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((error) => error.message).join('; '));
  }
  return parsed.data;
}

/**
 * Parse layout JSON, migrating v2 when needed.
 */
export function parseSiteLayout(raw: unknown): SiteLayoutData {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('site-layout.json must be an object');
  }
  const record = raw as Record<string, unknown>;
  const normalized = isFlatV2Layout(record) ? migrateV2LayoutToV3(record) : record;
  const parsed = SiteLayoutSchema.safeParse(normalized);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((error) => error.message).join('; '));
  }
  return parsed.data;
}
