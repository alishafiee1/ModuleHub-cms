import type { ModuleStatus, SiteLayoutDocument } from '../home-layout/types';

/**
 * Counts modules with running status in site-layout.
 * @param layout - Current site layout
 * @returns Number of modules marked running
 */
export function countRunningModules(layout: SiteLayoutDocument): number {
  return Object.values(layout.modules).filter((entry) => entry.status === 'running').length;
}

/**
 * Checks whether another module can be started without exceeding the global limit.
 * @param layout - Current site layout
 * @param maxConcurrentRunningModules - Limit from system settings
 * @param moduleId - Module being started (excluded if already running)
 * @returns Error message or null when start is allowed
 */
export function validateConcurrentStartLimit(
  layout: SiteLayoutDocument,
  maxConcurrentRunningModules: number,
  moduleId: string,
): string | null {
  const current = layout.modules[moduleId];
  if (current?.status === 'running') {
    return null;
  }

  const runningCount = countRunningModules(layout);
  if (runningCount >= maxConcurrentRunningModules) {
    return `Maximum concurrent running modules (${maxConcurrentRunningModules}) reached`;
  }

  return null;
}

/**
 * Returns whether a status transition is valid for admin operations.
 * @param fromStatus - Current status
 * @param toStatus - Target status
 * @returns True when transition is allowed
 */
export function isValidStatusTransition(fromStatus: ModuleStatus, toStatus: ModuleStatus): boolean {
  if (fromStatus === toStatus) {
    return true;
  }
  const allowed: Record<ModuleStatus, ModuleStatus[]> = {
    stopped: ['running', 'crashed'],
    running: ['stopped', 'crashed'],
    crashed: ['running', 'stopped'],
  };
  return allowed[fromStatus].includes(toStatus);
}
