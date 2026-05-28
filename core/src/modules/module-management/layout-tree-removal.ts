import type { LayoutTreeNode } from '../home-layout/types';

/**
 * Removes a module tree node by moduleId (depth-first search).
 * @param root - Layout tree root folder
 * @param moduleId - Module id referenced by tree node
 * @returns True when a node was removed
 */
export function removeModuleNodeFromTree(root: LayoutTreeNode, moduleId: string): boolean {
  if (!root.children || root.children.length === 0) {
    return false;
  }

  const directIndex = root.children.findIndex(
    (child) => child.type === 'module' && child.moduleId === moduleId,
  );
  if (directIndex >= 0) {
    root.children.splice(directIndex, 1);
    return true;
  }

  for (const child of root.children) {
    if (child.type === 'folder' && removeModuleNodeFromTree(child, moduleId)) {
      return true;
    }
  }

  return false;
}

/**
 * Updates display name on the tree node that references moduleId.
 * @param root - Layout tree root
 * @param moduleId - Module id
 * @param displayName - New card title
 * @returns True when a matching node was updated
 */
export function renameModuleTreeNode(
  root: LayoutTreeNode,
  moduleId: string,
  displayName: string,
): boolean {
  if (root.type === 'module' && root.moduleId === moduleId) {
    root.name = displayName;
    return true;
  }

  if (!root.children) {
    return false;
  }

  for (const child of root.children) {
    if (renameModuleTreeNode(child, moduleId, displayName)) {
      return true;
    }
  }

  return false;
}
