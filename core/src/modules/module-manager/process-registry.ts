import type { ModuleRuntimeHandle } from './types';

const runtimeHandles = new Map<string, ModuleRuntimeHandle>();

/**
 * Stores a runtime handle for a started module.
 * @param handle - Runtime tracking data
 */
export function registerRuntimeHandle(handle: ModuleRuntimeHandle): void {
  runtimeHandles.set(handle.moduleId, handle);
}

/**
 * Returns the runtime handle for a module if present.
 * @param moduleId - Module identifier
 * @returns Handle or undefined
 */
export function getRuntimeHandle(moduleId: string): ModuleRuntimeHandle | undefined {
  return runtimeHandles.get(moduleId);
}

/**
 * Removes runtime tracking for a module.
 * @param moduleId - Module identifier
 */
export function clearRuntimeHandle(moduleId: string): void {
  runtimeHandles.delete(moduleId);
}

/**
 * Clears all runtime handles (used in tests).
 */
export function clearAllRuntimeHandlesForTests(): void {
  runtimeHandles.clear();
}

/**
 * Lists all tracked runtime handles.
 * @returns Array of handles
 */
export function listRuntimeHandles(): ModuleRuntimeHandle[] {
  return [...runtimeHandles.values()];
}
