import fs from 'fs-extra';
import { getModuleDirectory, getModuleLogFilePath } from '../../config/paths';
import { stopModuleById } from '../module-manager/module-manager-service';
import { assignCardGridForNewChild } from './grid-slot';
import { findNodeById } from './layout-tree';
import type { LayoutTreeNode, SiteLayoutDocument } from './types';

/** Folder delete content handling policy */
export type FolderDeleteContentPolicy =
  | 'reject-if-not-empty'
  | 'move-to-parent'
  | 'move-to-folder'
  | 'cascade-delete';

/** PATCH body for /admin/folder/:folderId */
export interface PatchFolderInput {
  name?: string;
  cardDescription?: string | null;
  parentId?: string;
}

/** DELETE body for /admin/folder/:folderId */
export interface DeleteFolderInput {
  contentPolicy: FolderDeleteContentPolicy;
  targetFolderId?: string;
  confirmName?: string;
}

export interface DeleteFolderResult {
  deletedId: string;
  movedChildren?: number;
  deletedModules?: string[];
}

const MAX_CARD_DESCRIPTION_LENGTH = 200;

/**
 * normalizeCardDescription --- trim and cap subtitle length ---
 * @param value - Raw card description
 */
export function normalizeCardDescription(value: string | null | undefined): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.slice(0, MAX_CARD_DESCRIPTION_LENGTH);
}

/**
 * isDescendantOf --- true when nodeId is inside ancestor folder subtree (including self) ---
 */
export function isDescendantOf(
  root: LayoutTreeNode,
  ancestorId: string,
  nodeId: string,
): boolean {
  if (ancestorId === nodeId) {
    return true;
  }
  const ancestor = findNodeById(root, ancestorId);
  if (!ancestor || ancestor.type !== 'folder') {
    return false;
  }
  return findNodeById(ancestor, nodeId) !== null;
}

/**
 * findParentFolder --- parent folder node of a child id ---
 */
export function findParentFolder(root: LayoutTreeNode, childId: string): LayoutTreeNode | null {
  if (!root.children) {
    return null;
  }
  for (const child of root.children) {
    if (child.id === childId) {
      return root;
    }
    if (child.type === 'folder') {
      const nested = findParentFolder(child, childId);
      if (nested) {
        return nested;
      }
    }
  }
  return null;
}

function collectModuleIdsInSubtree(node: LayoutTreeNode): string[] {
  const ids: string[] = [];
  if (node.type === 'module' && node.moduleId) {
    ids.push(node.moduleId);
  }
  for (const child of node.children ?? []) {
    ids.push(...collectModuleIdsInSubtree(child));
  }
  return ids;
}

function removeFolderNodeFromTree(root: LayoutTreeNode, folderId: string): LayoutTreeNode | null {
  if (!root.children) {
    return null;
  }
  const directIndex = root.children.findIndex((child) => child.id === folderId);
  if (directIndex >= 0) {
    const [removed] = root.children.splice(directIndex, 1);
    return removed;
  }
  for (const child of root.children) {
    if (child.type === 'folder') {
      const removed = removeFolderNodeFromTree(child, folderId);
      if (removed) {
        return removed;
      }
    }
  }
  return null;
}

function reparentDirectChildren(folder: LayoutTreeNode, newParent: LayoutTreeNode): number {
  const children = folder.children ?? [];
  if (children.length === 0) {
    return 0;
  }
  if (!newParent.children) {
    newParent.children = [];
  }
  for (const child of children) {
    child.parentId = newParent.id;
    newParent.children.push(child);
  }
  folder.children = [];
  return children.length;
}

async function purgeModuleAssets(moduleId: string): Promise<void> {
  try {
    await stopModuleById(moduleId);
  } catch {
    // Module may already be stopped
  }

  const moduleDirectory = getModuleDirectory(moduleId);
  if (await fs.pathExists(moduleDirectory)) {
    await fs.remove(moduleDirectory);
  }

  const logPath = getModuleLogFilePath(moduleId);
  if (await fs.pathExists(logPath)) {
    await fs.remove(logPath);
  }
}

/**
 * patchVirtualFolder --- rename, subtitle, or move folder in layout (in-memory) ---
 */
export function patchVirtualFolder(
  layout: SiteLayoutDocument,
  folderId: string,
  input: PatchFolderInput,
): LayoutTreeNode {
  const folder = findNodeById(layout.tree, folderId);
  if (!folder || folder.type !== 'folder') {
    throw new Error(`Folder "${folderId}" not found`);
  }

  if (input.name !== undefined) {
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new Error('Folder name is required');
    }
    folder.name = trimmedName;
  }

  if (input.cardDescription !== undefined) {
    folder.cardDescription = normalizeCardDescription(input.cardDescription);
  }

  if (input.parentId !== undefined) {
    if (folderId === 'root') {
      throw new Error('Root folder cannot be moved');
    }
    const newParentId = input.parentId.trim();
    if (!newParentId) {
      throw new Error('parentId is required');
    }
    if (newParentId === folderId || isDescendantOf(layout.tree, folderId, newParentId)) {
      throw new Error('Cannot move folder into itself or a descendant');
    }
    const newParent = findNodeById(layout.tree, newParentId);
    if (!newParent || newParent.type !== 'folder') {
      throw new Error(`Parent folder "${newParentId}" not found`);
    }
    const currentParent = findParentFolder(layout.tree, folderId);
    if (!currentParent) {
      throw new Error('Current parent folder not found');
    }
    if (currentParent.id === newParentId) {
      return folder;
    }

    const removed = removeFolderNodeFromTree(layout.tree, folderId);
    if (!removed) {
      throw new Error(`Folder "${folderId}" could not be removed from tree`);
    }

    removed.parentId = newParentId;
    removed.cardGrid = assignCardGridForNewChild(newParent, newParentId);
    if (!newParent.children) {
      newParent.children = [];
    }
    newParent.children.push(removed);
  }

  return folder;
}

/**
 * deleteVirtualFolder --- remove folder with content policy (in-memory tree; cascade purges module files) ---
 */
export async function deleteVirtualFolder(
  layout: SiteLayoutDocument,
  folderId: string,
  input: DeleteFolderInput,
): Promise<DeleteFolderResult> {
  if (folderId === 'root') {
    throw new Error('Root folder cannot be deleted');
  }

  const folder = findNodeById(layout.tree, folderId);
  if (!folder || folder.type !== 'folder') {
    throw new Error(`Folder "${folderId}" not found`);
  }

  const childCount = folder.children?.length ?? 0;
  const parent = findParentFolder(layout.tree, folderId);
  if (!parent) {
    throw new Error('Parent folder not found');
  }

  if (input.contentPolicy === 'reject-if-not-empty' && childCount > 0) {
    const error = new Error('FOLDER_NOT_EMPTY');
    throw error;
  }

  if (input.contentPolicy === 'move-to-folder') {
    const targetId = input.targetFolderId?.trim();
    if (!targetId) {
      throw new Error('targetFolderId is required');
    }
    if (targetId === folderId || isDescendantOf(layout.tree, folderId, targetId)) {
      throw new Error('Invalid target folder');
    }
    const target = findNodeById(layout.tree, targetId);
    if (!target || target.type !== 'folder') {
      throw new Error(`Target folder "${targetId}" not found`);
    }
    const moved = reparentDirectChildren(folder, target);
    removeFolderNodeFromTree(layout.tree, folderId);
    return { deletedId: folderId, movedChildren: moved };
  }

  if (input.contentPolicy === 'move-to-parent') {
    const moved = reparentDirectChildren(folder, parent);
    removeFolderNodeFromTree(layout.tree, folderId);
    return { deletedId: folderId, movedChildren: moved };
  }

  if (input.contentPolicy === 'cascade-delete') {
    if (input.confirmName?.trim() !== folder.name) {
      throw new Error('Folder name confirmation does not match');
    }
    const moduleIds = collectModuleIdsInSubtree(folder);
    for (const moduleId of moduleIds) {
      await purgeModuleAssets(moduleId);
      delete layout.modules[moduleId];
    }
    removeFolderNodeFromTree(layout.tree, folderId);
    return { deletedId: folderId, deletedModules: moduleIds };
  }

  if (childCount > 0) {
    const error = new Error('FOLDER_NOT_EMPTY');
    throw error;
  }

  removeFolderNodeFromTree(layout.tree, folderId);
  return { deletedId: folderId };
}

/**
 * findTreeNodeByModuleId --- first placement node for a module ---
 */
export function findTreeNodeByModuleId(
  root: LayoutTreeNode,
  moduleId: string,
): LayoutTreeNode | null {
  if (root.type === 'module' && root.moduleId === moduleId) {
    return root;
  }
  for (const child of root.children ?? []) {
    const match = findTreeNodeByModuleId(child, moduleId);
    if (match) {
      return match;
    }
  }
  return null;
}
