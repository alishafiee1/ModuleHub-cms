import type { BreadcrumbSegment, LayoutTreeNode, ModuleEntry } from './types';

/**
 * Finds a tree node by id using depth-first search.
 * @param root - Layout tree root folder
 * @param nodeId - Target node id
 * @returns Matching node or null
 */
export function findNodeById(root: LayoutTreeNode, nodeId: string): LayoutTreeNode | null {
  if (root.id === nodeId) {
    return root;
  }

  if (!root.children) {
    return null;
  }

  for (const child of root.children) {
    const match = findNodeById(child, nodeId);
    if (match) {
      return match;
    }
  }

  return null;
}

/**
 * Returns direct children of a folder node.
 * @param folderNode - Folder node from layout tree
 * @returns Child nodes (empty if not a folder)
 */
export function getFolderChildren(folderNode: LayoutTreeNode): LayoutTreeNode[] {
  if (folderNode.type !== 'folder') {
    return [];
  }
  return folderNode.children ?? [];
}

/**
 * Builds breadcrumb path from root to the given folder.
 * @param root - Layout tree root
 * @param folderId - Current folder id (root id for home)
 * @returns Ordered breadcrumb segments excluding root when folder is root
 */
export function buildBreadcrumbPath(root: LayoutTreeNode, folderId: string): BreadcrumbSegment[] {
  const path: BreadcrumbSegment[] = [];

  function walk(node: LayoutTreeNode, trail: BreadcrumbSegment[]): boolean {
    const nextTrail = [...trail, { id: node.id, name: node.name }];
    if (node.id === folderId) {
      path.push(...nextTrail);
      return true;
    }

    if (!node.children) {
      return false;
    }

    for (const child of node.children) {
      if (walk(child, nextTrail)) {
        return true;
      }
    }

    return false;
  }

  walk(root, []);
  return path;
}

/** Card view model for a folder child */
export interface LayoutChildView {
  id: string;
  name: string;
  type: LayoutTreeNode['type'];
  moduleId?: string;
  module?: ModuleEntry;
}

/**
 * Resolves folder children merged with module metadata.
 * @param folderNode - Current folder node
 * @param modules - Module metadata map
 * @returns Children enriched with module entries
 */
export function resolveFolderChildren(
  folderNode: LayoutTreeNode,
  modules: Record<string, ModuleEntry>,
): LayoutChildView[] {
  return getFolderChildren(folderNode).map((child) => {
    if (child.type === 'module' && child.moduleId) {
      return {
        id: child.id,
        name: child.name,
        type: child.type,
        moduleId: child.moduleId,
        module: modules[child.moduleId],
      };
    }

    return {
      id: child.id,
      name: child.name,
      type: child.type,
    };
  });
}
