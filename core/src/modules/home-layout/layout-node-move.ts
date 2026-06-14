import { assignCardGridForNewChild } from './grid-slot';
import {
  findParentFolder,
  isDescendantOf,
  patchVirtualFolder,
} from './folder-management';
import { findNodeById } from './layout-tree';
import type { LayoutTreeNode, SiteLayoutDocument } from './types';

/** PATCH body for /admin/layout-node/:nodeId */
export interface MoveLayoutNodeInput {
  parentId: string;
}

/**
 * removeLayoutNodeFromTree --- detach any direct child node by id ---
 */
function removeLayoutNodeFromTree(root: LayoutTreeNode, nodeId: string): LayoutTreeNode | null {
  if (!root.children) {
    return null;
  }
  const directIndex = root.children.findIndex((child) => child.id === nodeId);
  if (directIndex >= 0) {
    const [removed] = root.children.splice(directIndex, 1);
    return removed;
  }
  for (const child of root.children) {
    if (child.type === 'folder') {
      const removed = removeLayoutNodeFromTree(child, nodeId);
      if (removed) {
        return removed;
      }
    }
  }
  return null;
}

/**
 * moveModuleLayoutNode --- reparent module node to another folder ---
 */
function moveModuleLayoutNode(
  layout: SiteLayoutDocument,
  nodeId: string,
  newParentId: string,
): LayoutTreeNode {
  const node = findNodeById(layout.tree, nodeId);
  if (!node || node.type !== 'module') {
    throw new Error(`Module node "${nodeId}" not found`);
  }

  const trimmedParentId = newParentId.trim();
  if (!trimmedParentId) {
    throw new Error('parentId is required');
  }

  const newParent = findNodeById(layout.tree, trimmedParentId);
  if (!newParent || newParent.type !== 'folder') {
    throw new Error(`Parent folder "${trimmedParentId}" not found`);
  }

  const currentParent = findParentFolder(layout.tree, nodeId);
  if (!currentParent) {
    throw new Error('Current parent folder not found');
  }
  if (currentParent.id === trimmedParentId) {
    return node;
  }

  const removed = removeLayoutNodeFromTree(layout.tree, nodeId);
  if (!removed) {
    throw new Error(`Module node "${nodeId}" could not be removed from tree`);
  }

  removed.parentId = trimmedParentId;
  removed.cardGrid = assignCardGridForNewChild(newParent, trimmedParentId);
  if (!newParent.children) {
    newParent.children = [];
  }
  newParent.children.push(removed);
  return removed;
}

/**
 * moveLayoutNode --- reparent folder or module layout node to another folder ---
 */
export function moveLayoutNode(
  layout: SiteLayoutDocument,
  nodeId: string,
  input: MoveLayoutNodeInput,
): LayoutTreeNode {
  const trimmedParentId = input.parentId?.trim();
  if (!trimmedParentId) {
    throw new Error('parentId is required');
  }

  if (nodeId === 'root') {
    throw new Error('Root folder cannot be moved');
  }

  const node = findNodeById(layout.tree, nodeId);
  if (!node) {
    throw new Error(`Node "${nodeId}" not found`);
  }

  if (node.type === 'folder') {
    return patchVirtualFolder(layout, nodeId, { parentId: trimmedParentId });
  }

  if (node.type === 'module') {
    return moveModuleLayoutNode(layout, nodeId, trimmedParentId);
  }

  throw new Error(`Unsupported node type for move: ${String(node.type)}`);
}

export { isDescendantOf };
