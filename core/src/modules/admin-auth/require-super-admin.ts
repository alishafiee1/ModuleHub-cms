import type { NextFunction, Request, Response } from 'express';
import { isDevSuperAdminEnabled } from './dev-super-admin';

/**
 * Middleware stub until phase 8 — allows requests when dev Super Admin flag is set.
 * @param request - Express request
 * @param response - Express response
 * @param next - Next handler
 */
export function requireSuperAdminMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  void request;
  if (isDevSuperAdminEnabled()) {
    next();
    return;
  }
  response.status(403).json({
    error: 'Super Admin session required. Set MODULEHUB_DEV_SUPER_ADMIN=1 for local dev until phase 8.',
  });
}
