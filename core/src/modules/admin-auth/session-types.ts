import 'express-session';

/** Auth scope stored in the CMS session */
export type AuthScope = 'super-admin' | 'module-manager';

/** Per-module Module Manager authentication timestamp (ms) */
export type ModuleAuthTimes = Record<string, number>;

declare module 'express-session' {
  interface SessionData {
    authScope?: AuthScope;
    username?: string;
    superAdminAuthenticatedAt?: number;
    managedModuleIds?: string[];
    moduleAuthTimes?: ModuleAuthTimes;
    csrfToken?: string;
  }
}

/** Payload returned by GET /api/auth/status */
export interface AuthStatusPayload {
  isSuperAdmin: boolean;
  managedModuleIds: string[];
  csrfToken: string | null;
  isDevSuperAdmin?: boolean;
}
