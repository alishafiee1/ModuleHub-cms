import crypto from 'crypto';
import { findNodeById } from '../home-layout/layout-tree';
import { resolveModulePort } from '../port-allocator';
import type { ModuleEntry, ModuleResources, SiteLayoutDocument } from '../home-layout/types';
import type { SystemSettings } from '../system-settings/types';

/** Payload from wizard step 3 to register a new module */
export interface WizardSaveInput {
  moduleId: string;
  parentId: string;
  name: string;
  changelog?: string;
  docker: boolean;
  port: number | null;
  permissions: string;
  resources: ModuleResources;
  icon: string;
  thumbnail: string;
  needsProcess: boolean;
}

/** Result of registering a module in site-layout */
export interface WizardSaveResult {
  moduleId: string;
  entry: ModuleEntry;
  layout: SiteLayoutDocument;
}

/**
 * Generates a unique module id for a new upload.
 * @returns Module id string
 */
export function generateModuleId(): string {
  return `mod-${crypto.randomBytes(6).toString('hex')}`;
}

/**
 * Registers a new module in layout with version 1.0.0 and status stopped.
 * @param layout - Current site layout
 * @param settings - System settings for port range and defaults
 * @param input - Wizard completion payload
 * @returns Updated layout and module entry
 */
export function registerModuleInLayout(
  layout: SiteLayoutDocument,
  settings: SystemSettings,
  input: WizardSaveInput,
): WizardSaveResult {
  const parent = findNodeById(layout.tree, input.parentId);
  if (!parent || parent.type !== 'folder') {
    throw new Error(`Parent folder "${input.parentId}" not found`);
  }

  if (layout.modules[input.moduleId]) {
    throw new Error(`Module id "${input.moduleId}" already exists`);
  }

  const port = resolveModulePort(
    input.port,
    input.needsProcess,
    layout,
    settings.portRangeStart,
    settings.portRangeEnd,
  );

  const now = new Date().toISOString();
  const entry: ModuleEntry = {
    name: input.name.trim(),
    status: 'stopped',
    version: '1.0.0',
    docker: input.docker,
    port,
    permissions: input.permissions,
    resources: input.resources,
    icon: input.icon || 'fas fa-cube',
    thumbnail: input.thumbnail || '',
    changelog: input.changelog || 'نسخه اولیه',
    createdAt: now,
    updatedAt: now,
    managementPasswordHash: '',
    managementPermissions: ['start', 'stop', 'logs', 'edit'],
  };

  layout.modules[input.moduleId] = entry;

  const treeNodeId = `node-${input.moduleId}`;
  if (!parent.children) {
    parent.children = [];
  }
  parent.children.push({
    id: treeNodeId,
    name: entry.name,
    type: 'module',
    parentId: input.parentId,
    moduleId: input.moduleId,
  });

  return { moduleId: input.moduleId, entry, layout };
}
