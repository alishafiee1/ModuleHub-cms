import type { LayoutTreeNode, ModuleEntry, SiteLayoutDocument } from './types';
import { assertValidSemver } from './version-validator';

/** Thrown when site-layout JSON fails validation */
export class LayoutParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LayoutParseError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new LayoutParseError(`Missing or invalid string field: ${fieldName}`);
  }
  return value;
}

function parseModuleEntry(moduleId: string, raw: unknown): ModuleEntry {
  if (!isRecord(raw)) {
    throw new LayoutParseError(`Module "${moduleId}" must be an object`);
  }

  const status = raw.status;
  if (status !== 'running' && status !== 'stopped' && status !== 'crashed') {
    throw new LayoutParseError(`Module "${moduleId}" has invalid status`);
  }

  if (!isRecord(raw.resources)) {
    throw new LayoutParseError(`Module "${moduleId}" must include resources`);
  }

  const versionRaw = assertString(raw.version, `modules.${moduleId}.version`);
  let version: string;
  try {
    version = assertValidSemver(versionRaw);
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : 'invalid version';
    throw new LayoutParseError(`Module "${moduleId}" ${detail}`);
  }

  return {
    name: assertString(raw.name, `modules.${moduleId}.name`),
    status,
    version,
    docker: Boolean(raw.docker),
    port: typeof raw.port === 'number' ? raw.port : Number(raw.port),
    permissions: assertString(raw.permissions, `modules.${moduleId}.permissions`),
    resources: {
      cpu_limit: Number(raw.resources.cpu_limit),
      ram_limit_mb: Number(raw.resources.ram_limit_mb),
      swap_limit_mb: Number(raw.resources.swap_limit_mb),
      disk_iops: raw.resources.disk_iops !== undefined ? Number(raw.resources.disk_iops) : undefined,
      net_mbps: raw.resources.net_mbps !== undefined ? Number(raw.resources.net_mbps) : undefined,
    },
    icon: typeof raw.icon === 'string' ? raw.icon : 'fas fa-cube',
    thumbnail: typeof raw.thumbnail === 'string' ? raw.thumbnail : '',
    gitRepo: typeof raw.gitRepo === 'string' ? raw.gitRepo : undefined,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
    changelog: typeof raw.changelog === 'string' ? raw.changelog : undefined,
    managementPasswordHash:
      typeof raw.managementPasswordHash === 'string' ? raw.managementPasswordHash : undefined,
    managementPermissions: Array.isArray(raw.managementPermissions)
      ? raw.managementPermissions.filter((item): item is string => typeof item === 'string')
      : undefined,
  };
}

function parseTreeNode(raw: unknown, modules: Record<string, ModuleEntry>): LayoutTreeNode {
  if (!isRecord(raw)) {
    throw new LayoutParseError('Tree node must be an object');
  }

  const type = raw.type;
  if (type !== 'folder' && type !== 'module') {
    throw new LayoutParseError(`Invalid node type for "${String(raw.id)}"`);
  }

  const node: LayoutTreeNode = {
    id: assertString(raw.id, 'tree.id'),
    name: assertString(raw.name, `tree node ${String(raw.id)}.name`),
    type,
    parentId: raw.parentId === null ? null : assertString(raw.parentId, `node ${String(raw.id)}.parentId`),
  };

  if (type === 'folder') {
    if (!Array.isArray(raw.children)) {
      throw new LayoutParseError(`Folder "${node.id}" must include children array`);
    }
    node.children = raw.children.map((child) => parseTreeNode(child, modules));
    return node;
  }

  const moduleId = assertString(raw.moduleId, `module node ${node.id}.moduleId`);
  if (!modules[moduleId]) {
    throw new LayoutParseError(`Module node "${node.id}" references unknown moduleId "${moduleId}"`);
  }
  node.moduleId = moduleId;
  return node;
}

/**
 * Parses and validates site-layout JSON.
 * @param raw - Parsed JSON value from site-layout file
 * @returns Validated layout document
 */
export function parseSiteLayout(raw: unknown): SiteLayoutDocument {
  if (!isRecord(raw)) {
    throw new LayoutParseError('Layout root must be an object');
  }

  const version = assertString(raw.version, 'version');
  if (!isRecord(raw.modules)) {
    throw new LayoutParseError('Layout must include modules object');
  }

  const modules: Record<string, ModuleEntry> = {};
  for (const [moduleId, moduleRaw] of Object.entries(raw.modules)) {
    modules[moduleId] = parseModuleEntry(moduleId, moduleRaw);
  }

  if (!isRecord(raw.tree)) {
    throw new LayoutParseError('Layout must include tree object');
  }

  const tree = parseTreeNode(raw.tree, modules);
  if (tree.type !== 'folder') {
    throw new LayoutParseError('Root tree node must be a folder');
  }

  return { version, tree, modules };
}
