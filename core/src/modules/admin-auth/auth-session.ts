import type { Request } from 'express';
import rateLimit from 'express-rate-limit';
import { loadSystemSettings } from '../system-settings';
import type { AuthStatusPayload } from './session-types';
import { ensureSessionCsrfToken } from './csrf';
import {
  getActiveManagedModuleIds,
  isDevSuperAdminEnabled,
  isSuperAdminSession,
} from './scope-check';

/**
 * Builds auth status payload for GET /api/auth/status from the current session.
 * @param request - Express request
 * @returns Super Admin flag, managed module ids, and CSRF token
 */
export async function getAuthStatusPayload(request: Request): Promise<AuthStatusPayload> {
  if (isDevSuperAdminEnabled()) {
    return {
      isSuperAdmin: true,
      managedModuleIds: [],
      csrfToken: ensureSessionCsrfToken(request),
      isDevSuperAdmin: true,
    };
  }

  const settings = await loadSystemSettings();
  const managedModuleIds = getActiveManagedModuleIds(
    request.session.moduleAuthTimes,
    settings.moduleManagerSessionTtlHours,
  );
  request.session.managedModuleIds = managedModuleIds;

  return {
    isSuperAdmin: isSuperAdminSession(request),
    managedModuleIds,
    csrfToken: ensureSessionCsrfToken(request),
    isDevSuperAdmin: false,
  };
}

/**
 * Creates rate limiter for Super Admin login POST requests.
 * @returns Express middleware limiting attempts per IP per minute
 */
export function createLoginRateLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    limit: async () => {
      const settings = await loadSystemSettings();
      return settings.loginRateLimitPerMinute;
    },
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Try again later.' },
  });
}

/**
 * Stores Super Admin authentication in the session.
 * @param request - Express request
 * @param username - Authenticated username
 */
export function establishSuperAdminSession(request: Request, username: string): void {
  request.session.authScope = 'super-admin';
  request.session.username = username;
  request.session.superAdminAuthenticatedAt = Date.now();
  request.session.managedModuleIds = [];
  request.session.moduleAuthTimes = {};
}

/**
 * Adds Module Manager scope for a module in the session.
 * @param request - Express request
 * @param moduleId - Authenticated module id
 */
export function establishModuleManagerSession(request: Request, moduleId: string): void {
  const moduleAuthTimes = { ...(request.session.moduleAuthTimes ?? {}) };
  moduleAuthTimes[moduleId] = Date.now();
  request.session.moduleAuthTimes = moduleAuthTimes;
  if (!request.session.managedModuleIds) {
    request.session.managedModuleIds = [];
  }
  if (!request.session.managedModuleIds.includes(moduleId)) {
    request.session.managedModuleIds.push(moduleId);
  }
  if (!request.session.authScope) {
    request.session.authScope = 'module-manager';
  }
}

/**
 * Clears all authentication data from the session while keeping CSRF token.
 * @param request - Express request
 */
export function clearAuthSession(request: Request): void {
  const csrfToken = request.session.csrfToken;
  request.session.authScope = undefined;
  request.session.username = undefined;
  request.session.superAdminAuthenticatedAt = undefined;
  request.session.managedModuleIds = [];
  request.session.moduleAuthTimes = {};
  request.session.csrfToken = csrfToken ?? ensureSessionCsrfToken(request);
}
