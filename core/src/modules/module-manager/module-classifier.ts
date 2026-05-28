import type { ModuleEntry } from '../home-layout/types';
import type { ModuleHostingKind } from './types';

/**
 * Classifies how a module should be hosted based on layout metadata.
 * @param entry - Module entry from site-layout
 * @returns static | backend | docker
 */
export function classifyModuleHosting(entry: ModuleEntry): ModuleHostingKind {
  if (entry.docker) {
    return 'docker';
  }
  if (entry.port > 0) {
    return 'backend';
  }
  return 'static';
}

/**
 * Returns whether the module needs a background process to serve traffic.
 * @param entry - Module entry from site-layout
 * @returns True for backend and docker modules
 */
export function moduleNeedsProcess(entry: ModuleEntry): boolean {
  return classifyModuleHosting(entry) !== 'static';
}
