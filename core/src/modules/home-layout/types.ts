/** Module runtime status stored in site-layout */
export type ModuleStatus = 'running' | 'stopped' | 'crashed';

/** Node type inside the virtual folder tree */
export type LayoutNodeType = 'folder' | 'module';

/** Resource limits attached to a module entry */
export interface ModuleResources {
  cpu_limit: number;
  ram_limit_mb: number;
  swap_limit_mb: number;
  disk_iops?: number;
  net_mbps?: number;
}

/** Full module metadata keyed by module id in site-layout */
export interface ModuleEntry {
  name: string;
  status: ModuleStatus;
  version: string;
  docker: boolean;
  port: number;
  permissions: string;
  resources: ModuleResources;
  icon: string;
  thumbnail: string;
  gitRepo?: string;
  createdAt?: string;
  updatedAt?: string;
  changelog?: string;
  managementPasswordHash?: string;
  managementPermissions?: string[];
}

/** @deprecated Legacy card width — migrated to cardGrid on read */
export type CardSpan = 1 | 2 | 4;

/**
 * Absolute position on the 30×9 card canvas.
 * purpose --- source of truth for card layout (cart view pattern) ---
 */
export interface CardGridPosition {
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
}

/** Background source type for a card */
export type CardBackgroundType = 'none' | 'color' | 'image';

/**
 * Custom background for a card — stored on LayoutTreeNode.
 * purpose --- independent of module thumbnail; applies to folders and module nodes alike ---
 */
export interface CardBackground {
  type: CardBackgroundType;
  /** CSS hex color e.g. #3b82f6 — used when type=color */
  color?: string;
  /** Server-relative path e.g. /card-backgrounds/abc.webp — used when type=image */
  imageUrl?: string;
  /** Background layer opacity 0–100; default 100 */
  backgroundOpacity?: number;
  /** Dark overlay opacity 0–100; default 45 (light) / 60 (dark, via CSS) */
  overlayOpacity?: number;
}

/** Tree node — folders contain children; modules reference modules map */
export interface LayoutTreeNode {
  id: string;
  name: string;
  type: LayoutNodeType;
  parentId: string | null;
  children?: LayoutTreeNode[];
  moduleId?: string;
  /** @deprecated Migrated to cardGrid — may appear briefly before lazy migration */
  cardSpan?: CardSpan;
  /** Position and size on the 30×9 canvas */
  cardGrid?: CardGridPosition;
  /** Custom card background (color or image + opacity); omitted means default glass style */
  cardBackground?: CardBackground;
}

/** Payload for PATCH /admin/folder/:folderId/cards */
export interface FolderCardsUpdatePayload {
  /** Ordered list of nodes; order + cardGrid + cardBackground */
  cards: Array<{ nodeId: string; cardGrid?: CardGridPosition; cardBackground?: CardBackground | null }>;
}

/** Parsed site-layout document */
export interface SiteLayoutDocument {
  version: string;
  tree: LayoutTreeNode;
  modules: Record<string, ModuleEntry>;
}

/** Module entry exposed to the public layout API (no password hash) */
export interface PublicModuleEntry {
  name: string;
  status: ModuleStatus;
  version: string;
  docker: boolean;
  port: number;
  permissions: string;
  resources: ModuleResources;
  icon: string;
  thumbnail: string;
  changelog?: string;
  gitRepo?: string;
  hasManagementPassword: boolean;
}

/** Home page visual appearance from system settings */
export interface HomePageAppearance {
  backgroundMode: 'none' | 'floating-icons';
  iconTheme: 'nature' | 'technology' | 'tools' | 'vehicles' | 'mixed';
}

/** Layout tree payload without appearance (internal mapper output) */
export interface LayoutApiCore {
  version: string;
  tree: LayoutTreeNode;
  modules: Record<string, PublicModuleEntry>;
}

/** API payload for GET /api/layout */
export interface LayoutApiResponse extends LayoutApiCore {
  appearance: HomePageAppearance;
}

/** Breadcrumb segment for folder navigation */
export interface BreadcrumbSegment {
  id: string;
  name: string;
}

/** Result of parsing layout JSON */
export interface LayoutParseResult {
  layout: SiteLayoutDocument;
  breadcrumb?: BreadcrumbSegment[];
}
