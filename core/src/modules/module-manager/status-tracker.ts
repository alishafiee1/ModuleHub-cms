import type { ModuleEntry, ModuleStatus, SiteLayoutDocument } from '../home-layout/types';
import { isValidStatusTransition } from './concurrent-limit';

/**
 * Updates module status in layout and timestamps the change.
 * @param layout - Site layout document (mutated)
 * @param moduleId - Module identifier
 * @param status - New status value
 * @returns Updated module entry
 */
export function setModuleStatusInLayout(
  layout: SiteLayoutDocument,
  moduleId: string,
  status: ModuleStatus,
): ModuleEntry {
  const entry = layout.modules[moduleId];
  if (!entry) {
    throw new Error(`Module "${moduleId}" not found`);
  }

  if (!isValidStatusTransition(entry.status, status)) {
    throw new Error(`Invalid status transition ${entry.status} → ${status}`);
  }

  entry.status = status;
  entry.updatedAt = new Date().toISOString();
  return entry;
}

/**
 * Marks a module as crashed in layout (e.g. after OOM).
 * @param layout - Site layout document
 * @param moduleId - Module identifier
 * @returns Updated entry
 */
export function markModuleCrashed(layout: SiteLayoutDocument, moduleId: string): ModuleEntry {
  return setModuleStatusInLayout(layout, moduleId, 'crashed');
}
