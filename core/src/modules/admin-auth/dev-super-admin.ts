/**
 * Returns whether dev Super Admin bypass is enabled (phase 8 replaces with real session).
 * @returns True when MODULEHUB_DEV_SUPER_ADMIN is set to a truthy value
 */
export function isDevSuperAdminEnabled(): boolean {
  const flag = process.env.MODULEHUB_DEV_SUPER_ADMIN ?? '';
  return flag === '1' || flag.toLowerCase() === 'true';
}

/**
 * Builds auth status payload for GET /api/auth/status.
 * @returns Super Admin and managed module ids for frontend
 */
export function getAuthStatusPayload(): { isSuperAdmin: boolean; managedModuleIds: string[] } {
  return {
    isSuperAdmin: isDevSuperAdminEnabled(),
    managedModuleIds: [],
  };
}
