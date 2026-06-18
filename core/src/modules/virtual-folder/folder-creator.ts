import crypto from 'crypto';
import { assignCardGridForNewChild } from '../home-layout/grid-slot';
import { findNodeById } from '../home-layout/layout-tree';
import type { LayoutTreeNode, SiteLayoutDocument } from '../home-layout/types';

/** Input for creating a virtual folder */
export interface CreateVirtualFolderInput {
  parentId: string;
  name: string;
}

/** Result after adding a virtual folder to the layout tree */
export interface CreateVirtualFolderResult {
  folderId: string;
  node: LayoutTreeNode;
  layout: SiteLayoutDocument;
}

/**
 * Generates a unique folder node id.
 * @returns New folder id string
 */
export function generateFolderId(): string {
  return `folder-${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Adds a virtual folder under parentId in the layout tree (no disk directory).
 * @param layout - Current site layout
 * @param input - Parent folder id and display name
 * @returns Updated layout and new folder node
 */
export function createVirtualFolder(
  layout: SiteLayoutDocument,
  input: CreateVirtualFolderInput,
): CreateVirtualFolderResult {
  const trimmedName = input.name.trim();
  if (!trimmedName) {
    throw new Error('Folder name is required');
  }

  const parent = findNodeById(layout.tree, input.parentId);
  if (!parent || parent.type !== 'folder') {
    throw new Error(`Parent folder "${input.parentId}" not found`);
  }
  if (parent.children?.some((child) => child.type === 'folder' && child.name === trimmedName)) {
    throw new Error(`Folder "${trimmedName}" already exists in this parent`);
  }

  const folderId = generateFolderId();
  const newNode: LayoutTreeNode = {
    id: folderId,
    name: trimmedName,
    type: 'folder',
    parentId: input.parentId,
    children: [],
    cardGrid: assignCardGridForNewChild(parent, input.parentId),
  };

  if (!parent.children) {
    parent.children = [];
  }
  parent.children.push(newNode);

  return { folderId, node: newNode, layout };
}
