import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import path from 'path';
import { PATHS } from '../../config/paths';
import { readSiteLayout } from '../home-layout/layout-store';
import { loadSystemSettings } from '../system-settings';
import {
  clearAuthSession,
  createLoginRateLimiter,
  establishSuperAdminSession,
  establishModuleManagerSession,
  regenerateSession,
} from './auth-session';
import { findAdminUser, updateAdminPassword } from './admin-users-loader';
import { hashPassword, verifyPassword } from './bcrypt-verify';
import { validateNewPassword } from './password-validation';
import { SESSION_COOKIE_NAME } from './session-config';
import { ensureSessionCsrfToken } from './csrf';
import { assertValidModuleId } from '../module-management/module-id-validator';
import {
  clearModuleAuthLockout,
  getModuleLockoutRemainingMs,
  isModuleAuthLocked,
  recordFailedModuleAuthAttempt,
} from './module-lockout';
import { isDevSuperAdminEnabled, isSuperAdminSession } from './scope-check';

/**
 * Handles GET /admin/login — serves login HTML or redirects when already authenticated.
 * @param request - Express request
 * @param response - Express response
 */
export function getAdminLoginHandler(request: Request, response: Response): void {
  if (isDevSuperAdminEnabled() || request.session.authScope === 'super-admin') {
    response.redirect('/');
    return;
  }
  ensureSessionCsrfToken(request);
  response.sendFile(path.join(PATHS.publicDirectory, 'admin', 'login.html'));
}

/**
 * Handles POST /admin/login — verifies Super Admin credentials and creates session.
 * @param request - Express request
 * @param response - Express response
 */
export async function postAdminLoginHandler(request: Request, response: Response): Promise<void> {
  if (isDevSuperAdminEnabled()) {
    response.status(200).json({ redirect: '/', message: 'Dev Super Admin active' });
    return;
  }

  const username = String(request.body?.username ?? '').trim();
  const password = String(request.body?.password ?? '');

  if (!username || !password) {
    response.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const adminUser = await findAdminUser(username);
  if (!adminUser) {
    response.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  const passwordMatches = await verifyPassword(password, adminUser.passwordHash);
  if (!passwordMatches) {
    response.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  await regenerateSession(request);
  establishSuperAdminSession(request, adminUser.username);
  response.status(200).json({ redirect: '/', message: 'Login successful' });
}

/**
 * Handles POST /admin/logout — destroys Super Admin / Module Manager session data.
 * @param request - Express request
 * @param response - Express response
 */
export function postAdminLogoutHandler(request: Request, response: Response): void {
  clearAuthSession(request);
  const isProduction = process.env.NODE_ENV === 'production';
  response.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
  });

  request.session.destroy((error) => {
    if (error) {
      response.status(500).json({ error: 'Failed to destroy session' });
      return;
    }
    response.status(200).json({ message: 'Logged out' });
  });
}

/**
 * Handles GET /api/auth/csrf-token — returns CSRF token for the current session.
 * @param request - Express request
 * @param response - Express response
 */
export function getCsrfTokenHandler(request: Request, response: Response): void {
  const csrfToken = ensureSessionCsrfToken(request);
  response.status(200).json({ csrfToken });
}

/**
 * Handles POST /admin/change-password — allows authenticated Super Admin to change password.
 * @param request - Express request
 * @param response - Express response
 */
export async function postAdminChangePasswordHandler(request: Request, response: Response): Promise<void> {
  if (!isSuperAdminSession(request)) {
    response.status(401).json({ error: 'Authentication required' });
    return;
  }

  const currentPassword = String(request.body?.currentPassword ?? '');
  const newPassword = String(request.body?.newPassword ?? '');
  const confirmPassword = String(request.body?.confirmPassword ?? '');

  if (!currentPassword || !newPassword || !confirmPassword) {
    response.status(400).json({ error: 'Current password, new password, and confirmation are required' });
    return;
  }

  if (newPassword !== confirmPassword) {
    response.status(400).json({ error: 'New password and confirmation do not match' });
    return;
  }

  const passwordValidationError = validateNewPassword(newPassword);
  if (passwordValidationError) {
    response.status(400).json({ error: passwordValidationError });
    return;
  }

  const username = request.session.username ?? 'admin';
  const adminUser = await findAdminUser(username);
  if (!adminUser) {
    response.status(401).json({ error: 'Admin user not found' });
    return;
  }

  const passwordMatches = await verifyPassword(currentPassword, adminUser.passwordHash);
  if (!passwordMatches) {
    response.status(401).json({ error: 'Current password is incorrect' });
    return;
  }

  const newHash = await hashPassword(newPassword);
  await updateAdminPassword(username, newHash);
  clearAuthSession(request);

  response.status(200).json({
    message: 'Password changed',
    redirect: '/admin/login',
  });
}

/**
 * Public admin login routes (no CSRF — user is not authenticated yet).
 * @returns Router for GET/POST /login only
 */
export function createAdminLoginRouter(): Router {
  const router = createRouter();
  const loginRateLimiter = createLoginRateLimiter();

  router.get('/login', getAdminLoginHandler);
  router.post('/login', loginRateLimiter, (request, response) => {
    void postAdminLoginHandler(request, response);
  });

  return router;
}

/**
 * Authenticated admin routes that require CSRF (registered after CSRF middleware).
 * @returns Router for logout and change-password
 */
export function createAdminProtectedRouter(): Router {
  const router = createRouter();
  const rateLimiter = createLoginRateLimiter();

  router.post('/logout', rateLimiter, (request, response) => {
    postAdminLogoutHandler(request, response);
  });
  router.post('/change-password', rateLimiter, (request, response) => {
    void postAdminChangePasswordHandler(request, response);
  });

  return router;
}

/**
 * Handles POST /admin/module/:id/auth — Module Manager password authentication.
 * @param request - Express request
 * @param response - Express response
 */
export async function postModuleAuthHandler(request: Request, response: Response): Promise<void> {
  const raw = request.params.id;
  const moduleId = Array.isArray(raw) ? raw[0] : raw;
  if (!moduleId) {
    response.status(400).json({ error: 'Module id is required' });
    return;
  }
  try {
    assertValidModuleId(moduleId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Invalid module id';
    response.status(400).json({ error: message });
    return;
  }

  if (request.session.authScope === 'super-admin' || isDevSuperAdminEnabled()) {
    response.status(200).json({ moduleId, message: 'Super Admin already authenticated' });
    return;
  }

  const settings = await loadSystemSettings();
  if (isModuleAuthLocked(moduleId)) {
    const remainingMs = getModuleLockoutRemainingMs(moduleId);
    response.status(429).json({
      error: 'Module auth locked due to too many failed attempts',
      retryAfterSeconds: Math.ceil(remainingMs / 1000),
    });
    return;
  }

  const layout = await readSiteLayout();
  const entry = layout.modules[moduleId];
  if (!entry) {
    response.status(404).json({ error: `Module "${moduleId}" not found` });
    return;
  }

  if (!entry.managementPasswordHash) {
    response.status(403).json({ error: 'Module has no management password. Super Admin login required.' });
    return;
  }

  const password = String(request.body?.password ?? '');
  if (!password) {
    response.status(400).json({ error: 'Password is required' });
    return;
  }

  const passwordMatches = await verifyPassword(password, entry.managementPasswordHash);
  if (!passwordMatches) {
    recordFailedModuleAuthAttempt(
      moduleId,
      settings.modulePasswordMaxAttempts,
      settings.modulePasswordLockoutMinutes,
    );
    response.status(401).json({ error: 'Invalid module password' });
    return;
  }

  await regenerateSession(request);
  clearModuleAuthLockout(moduleId);
  establishModuleManagerSession(request, moduleId);
  response.status(200).json({ moduleId, message: 'Module Manager authenticated' });
}

/**
 * Registers Module Manager auth route under /admin/module.
 * @returns Router with POST /:id/auth
 */
export function createModuleAuthRouter(): Router {
  const router = createRouter({ mergeParams: true });
  router.post('/:id/auth', (request, response) => {
    void postModuleAuthHandler(request, response);
  });
  return router;
}
