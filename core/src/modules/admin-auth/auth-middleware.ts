import type { NextFunction, Request, Response } from 'express';
import { isValidCsrfRequest } from './csrf';
import { canAccessModule, isDevSuperAdminEnabled, isSuperAdminSession } from './scope-check';

/**
 * Requires an active Super Admin session (or dev bypass).
 * @param request - Express request
 * @param response - Express response
 * @param next - Next handler
 */
export function requireSuperAdminMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  if (isSuperAdminSession(request)) {
    next();
    return;
  }
  if (request.session.authScope === 'module-manager') {
    response.status(403).json({ error: 'Super Admin session required' });
    return;
  }
  response.status(401).json({ error: 'Super Admin session required' });
}

/**
 * Requires Super Admin session and returns 403 for Module Manager-only sessions.
 * @param request - Express request
 * @param response - Express response
 * @param next - Next handler
 */
export function requireSuperAdminOnlyMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  if (isDevSuperAdminEnabled() || request.session.authScope === 'super-admin') {
    next();
    return;
  }
  response.status(403).json({ error: 'Super Admin access required' });
}

/**
 * Requires auth for mutating admin requests via CSRF token.
 * @param request - Express request
 * @param response - Express response
 * @param next - Next handler
 */
export function requireCsrfMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  if (isValidCsrfRequest(request)) {
    next();
    return;
  }
  response.status(403).json({ error: 'Invalid or missing CSRF token' });
}

/**
 * Requires Super Admin or Module Manager access to the route module id param.
 * @param request - Express request
 * @param response - Express response
 * @param next - Next handler
 */
export async function requireModuleAccessMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const raw = request.params.id;
  const moduleId = Array.isArray(raw) ? raw[0] : raw;
  if (!moduleId) {
    response.status(400).json({ error: 'Module id is required' });
    return;
  }

  const allowed = await canAccessModule(request, moduleId);
  if (!allowed) {
    response.status(403).json({ error: 'Authentication required for this module' });
    return;
  }
  next();
}
