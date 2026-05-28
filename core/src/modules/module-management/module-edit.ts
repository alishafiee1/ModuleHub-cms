import bcrypt from 'bcrypt';
import type { ModuleResources, SiteLayoutDocument } from '../home-layout/types';
import { assertValidSemver, normalizeChangelog } from '../home-layout/version-validator';
import { renameModuleTreeNode } from './layout-tree-removal';

const BCRYPT_COST = 12;

/** Fields Super Admin may update via PATCH /admin/module/:id */
export interface ModuleEditInput {
  name?: string;
  changelog?: string;
  version?: string;
  gitRepo?: string;
  icon?: string;
  thumbnail?: string;
  port?: number;
  permissions?: string;
  resources?: Partial<ModuleResources>;
  managementPasswordPlain?: string | null;
  clearManagementPassword?: boolean;
}

/**
 * Hashes a module management password with bcrypt.
 * @param plainPassword - Plaintext password
 * @returns bcrypt hash string
 */
export async function hashManagementPassword(plainPassword: string): Promise<string> {
  const trimmed = plainPassword.trim();
  if (trimmed.length < 4) {
    throw new Error('Management password must be at least 4 characters');
  }
  return bcrypt.hash(trimmed, BCRYPT_COST);
}

/**
 * Applies module metadata updates to layout (in-memory).
 * @param layout - Current site layout
 * @param moduleId - Target module id
 * @param input - Edit payload
 * @returns Updated layout document
 */
export async function applyModuleEdit(
  layout: SiteLayoutDocument,
  moduleId: string,
  input: ModuleEditInput,
): Promise<SiteLayoutDocument> {
  const entry = layout.modules[moduleId];
  if (!entry) {
    throw new Error(`Module "${moduleId}" not found`);
  }

  if (input.name !== undefined) {
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new Error('Module name is required');
    }
    entry.name = trimmedName;
    renameModuleTreeNode(layout.tree, moduleId, trimmedName);
  }

  if (input.changelog !== undefined) {
    entry.changelog = normalizeChangelog(input.changelog);
  }

  if (input.version !== undefined) {
    entry.version = assertValidSemver(input.version);
  }

  if (input.gitRepo !== undefined) {
    entry.gitRepo = input.gitRepo.trim() || undefined;
  }

  if (input.icon !== undefined) {
    entry.icon = input.icon.trim() || 'fas fa-cube';
  }

  if (input.thumbnail !== undefined) {
    entry.thumbnail = input.thumbnail;
  }

  if (input.port !== undefined) {
    if (!Number.isInteger(input.port) || input.port < 1 || input.port > 65535) {
      throw new Error('Port must be an integer between 1 and 65535');
    }
    entry.port = input.port;
  }

  if (input.permissions !== undefined) {
    entry.permissions = input.permissions;
  }

  if (input.resources) {
    entry.resources = { ...entry.resources, ...input.resources };
  }

  if (input.clearManagementPassword) {
    delete entry.managementPasswordHash;
  } else if (input.managementPasswordPlain) {
    entry.managementPasswordHash = await hashManagementPassword(input.managementPasswordPlain);
  }

  entry.updatedAt = new Date().toISOString();

  return layout;
}
