import type { Request } from 'express';
import { loadSystemSettings } from '../system-settings';
import type { ModuleAuthTimes } from './session-types';

/**
 * Returns whether dev Super Admin bypass is enabled.
 * @returns True when MODULEHUB_DEV_SUPER_ADMIN is set to a truthy value
 */
export function isDevSuperAdminEnabled(): boolean {
  const flag = process.env.MODULEHUB_DEV_SUPER_ADMIN ?? '';
  return flag === '1' || flag.toLowerCase() === 'true';
}

/**
 * Returns whether the request has an active Super Admin session or dev bypass.
 * @param request - Express request
 * @returns True for Super Admin access
 */
export function isSuperAdminSession(request: Request): boolean {
  if (isDevSuperAdminEnabled()) {
    return true;
  }
  return request.session.authScope === 'super-admin';
}

/**
 * Filters module ids whose Module Manager auth is still within TTL.
 * @param moduleAuthTimes - Map of module id to auth timestamp
 * @param ttlHours - Module Manager session TTL in hours
 * @returns Module ids with non-expired auth
 */
export function getActiveManagedModuleIds(
  moduleAuthTimes: ModuleAuthTimes | undefined,
  ttlHours: number,
): string[] {
  if (!moduleAuthTimes) {
    return [];
  }
  const maxAgeMs = ttlHours * 60 * 60 * 1000;
  const now = Date.now();
  return Object.entries(moduleAuthTimes)
    .filter(([, authenticatedAt]) => now - authenticatedAt <= maxAgeMs)
    .map(([moduleId]) => moduleId);
}

/**
 * Returns whether the request can manage a specific module.
 * @param request - Express request
 * @param moduleId - Target module id
 * @returns True when Super Admin or scoped Module Manager
 */
export async function canAccessModule(request: Request, moduleId: string): Promise<boolean> {
  if (isSuperAdminSession(request)) {
    return true;
  }

  const settings = await loadSystemSettings();
  const activeIds = getActiveManagedModuleIds(request.session.moduleAuthTimes, settings.moduleManagerSessionTtlHours);
  return activeIds.includes(moduleId);
}

/**
 * Returns whether a module id is in the active Module Manager scope.
 * @param managedModuleIds - Module ids from session status
 * @param moduleId - Target module id
 * @returns True when module id is managed
 */
export function isModuleInManagerScope(managedModuleIds: string[], moduleId: string): boolean {
  return managedModuleIds.includes(moduleId);
}
