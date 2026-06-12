import type { CardBackground, CardBackgroundType, CardGridPosition, CardSpan, LayoutTreeNode, ModuleEntry, SiteLayoutDocument } from './types';
import { assertValidCardGrid } from './migrate-card-grid';
import { assertValidSemver } from './version-validator';

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const CARD_BG_IMAGE_PREFIX = '/card-backgrounds/';
const VALID_BG_TYPES: ReadonlySet<string> = new Set(['none', 'color', 'image']);

/**
 * purpose --- validates and parses a cardBackground object from raw JSON ---
 * @param raw - Unvalidated object from JSON
 * @param nodeId - Node id for error messages
 * @returns Parsed CardBackground or undefined when absent
 */
function parseCardBackground(raw: unknown, nodeId: string): CardBackground | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }

  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw new LayoutParseError(`Node "${nodeId}" cardBackground must be an object`);
  }

  const obj = raw as Record<string, unknown>;
  const type = obj.type;
  if (typeof type !== 'string' || !VALID_BG_TYPES.has(type)) {
    throw new LayoutParseError(`Node "${nodeId}" cardBackground.type must be none|color|image`);
  }

  const bg: CardBackground = { type: type as CardBackgroundType };

  if (type === 'color') {
    if (typeof obj.color !== 'string' || !HEX_COLOR_RE.test(obj.color)) {
      throw new LayoutParseError(`Node "${nodeId}" cardBackground.color must be a 6-digit hex e.g. #3b82f6`);
    }
    bg.color = obj.color;
  }

  if (type === 'image') {
    if (typeof obj.imageUrl !== 'string' || !obj.imageUrl.startsWith(CARD_BG_IMAGE_PREFIX)) {
      throw new LayoutParseError(`Node "${nodeId}" cardBackground.imageUrl must start with ${CARD_BG_IMAGE_PREFIX}`);
    }
    bg.imageUrl = obj.imageUrl;
  }

  if (obj.backgroundOpacity !== undefined) {
    const v = Number(obj.backgroundOpacity);
    if (!Number.isFinite(v) || v < 0 || v > 100) {
      throw new LayoutParseError(`Node "${nodeId}" cardBackground.backgroundOpacity must be 0–100`);
    }
    bg.backgroundOpacity = v;
  }

  if (obj.overlayOpacity !== undefined) {
    const v = Number(obj.overlayOpacity);
    if (!Number.isFinite(v) || v < 0 || v > 100) {
      throw new LayoutParseError(`Node "${nodeId}" cardBackground.overlayOpacity must be 0–100`);
    }
    bg.overlayOpacity = v;
  }

  return bg;
}

/**
 * purpose --- validates and parses cardGrid from raw JSON ---
 * @param raw - Unvalidated object from JSON
 * @param nodeId - Node id for error messages
 */
function parseCardGrid(raw: unknown, nodeId: string): CardGridPosition | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }

  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw new LayoutParseError(`Node "${nodeId}" cardGrid must be an object`);
  }

  const obj = raw as Record<string, unknown>;
  const grid: CardGridPosition = {
    col: Number(obj.col),
    row: Number(obj.row),
    colSpan: Number(obj.colSpan),
    rowSpan: Number(obj.rowSpan),
  };

  try {
    assertValidCardGrid(grid, nodeId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'invalid cardGrid';
    throw new LayoutParseError(message);
  }

  return grid;
}

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

  const cardSpanRaw = raw.cardSpan;
  if (cardSpanRaw !== undefined) {
    if (cardSpanRaw !== 1 && cardSpanRaw !== 2 && cardSpanRaw !== 4) {
      throw new LayoutParseError(`Node "${node.id}" has invalid cardSpan — must be 1, 2, or 4`);
    }
    node.cardSpan = cardSpanRaw as CardSpan;
  }

  const cardGrid = parseCardGrid(raw.cardGrid, node.id);
  if (cardGrid !== undefined) {
    node.cardGrid = cardGrid;
  }

  const cardBg = parseCardBackground(raw.cardBackground, node.id);
  if (cardBg !== undefined) {
    node.cardBackground = cardBg;
  }

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
