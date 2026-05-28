import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import { isDevSuperAdminEnabled } from './dev-super-admin';

/**
 * Handles GET /admin/login — redirect when dev admin is on; stub until phase 8.
 * @param request - Express request
 * @param response - Express response
 */
export function getAdminLoginHandler(request: Request, response: Response): void {
  void request;
  if (isDevSuperAdminEnabled()) {
    response.redirect('/');
    return;
  }
  response.status(501).json({
    error: 'Login page not implemented yet (phase 8). Set MODULEHUB_DEV_SUPER_ADMIN=1 for dev.',
  });
}

/**
 * Public admin login route (no auth middleware).
 * @returns Router for GET /admin/login
 */
export function createAdminLoginRouter(): Router {
  const router = createRouter();
  router.get('/login', getAdminLoginHandler);
  return router;
}
