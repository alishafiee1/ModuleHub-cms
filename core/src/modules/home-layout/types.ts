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

/** Tree node — folders contain children; modules reference modules map */
export interface LayoutTreeNode {
  id: string;
  name: string;
  type: LayoutNodeType;
  parentId: string | null;
  children?: LayoutTreeNode[];
  moduleId?: string;
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
