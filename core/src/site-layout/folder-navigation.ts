import { SiteLayoutData, SiteLayoutFolder } from './types';

export interface BreadcrumbEntry {
  folderId: string;
  title: string;
  href: string;
}

/**
 * Resolve folder id from URL path segments under /browse/.
 */
export function resolveFolderPath(
  layout: SiteLayoutData,
  pathSegments: string[],
): string | null {
  if (pathSegments.length === 0) {
    return layout.rootFolderId;
  }

  let parentId: string | null = layout.rootFolderId;
  for (const segment of pathSegments) {
    const folder = layout.folders.find(
      (entry) => entry.id === segment && entry.parentId === parentId,
    );
    if (!folder) {
      return null;
    }
    parentId = folder.id;
  }
  return parentId;
}

/**
 * Build breadcrumb trail from root to target folder.
 */
export function buildBreadcrumb(
  layout: SiteLayoutData,
  folderId: string,
): BreadcrumbEntry[] {
  const byId = new Map(layout.folders.map((folder) => [folder.id, folder]));
  const chain: SiteLayoutFolder[] = [];
  let current: SiteLayoutFolder | undefined = byId.get(folderId);

  while (current) {
    chain.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  const segments: string[] = [];
  const crumbs: BreadcrumbEntry[] = [{ folderId: layout.rootFolderId, title: 'خانه', href: '/' }];

  for (let index = 1; index < chain.length; index += 1) {
    const folder = chain[index];
    segments.push(folder.id);
    crumbs.push({
      folderId: folder.id,
      title: folder.title,
      href: `/browse/${segments.join('/')}/`,
    });
  }

  return crumbs;
}

/**
 * Child folders displayed on a browse page.
 */
export function getChildFolders(
  layout: SiteLayoutData,
  folderId: string,
): SiteLayoutFolder[] {
  return layout.folders
    .filter((folder) => folder.parentId === folderId)
    .sort((left, right) => left.title.localeCompare(right.title, 'fa'));
}

/**
 * Layout items belonging to a folder (modules and folder shortcuts).
 */
export function getItemsForFolder(
  layout: SiteLayoutData,
  folderId: string,
): SiteLayoutData['items'] {
  return layout.items
    .filter((item) => item.folderId === folderId && item.kind !== 'admin-add')
    .sort((left, right) => left.sortOrder - right.sortOrder);
}
