import type { ModuleEntry } from '../home-layout/types';

/** Module hosting kind resolved from layout metadata */
export type ModuleHostingKind = 'static' | 'backend' | 'docker';

/** Tracked runtime handle for a started module */
export interface ModuleRuntimeHandle {
  moduleId: string;
  kind: ModuleHostingKind;
  startedAt: string;
  scopeUnit?: string;
  containerName?: string;
  processId?: number;
}

/** Result of start/stop operations */
export interface ModuleOperationResult {
  moduleId: string;
  status: ModuleEntry['status'];
  message: string;
}
