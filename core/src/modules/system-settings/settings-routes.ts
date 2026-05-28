import type { NextFunction, Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import path from 'path';
import { PATHS } from '../../config/paths';
import { requireSuperAdminMiddleware } from '../admin-auth';
import { listUpNetworkInterfaces } from './nic-validator';
import { loadSystemSettings } from './settings-loader';
import { saveSystemSettingsUpdate } from './settings-store';
import { SystemSettingsValidationError } from './schema-validator';
import type { SystemSettings } from './types';

/**
 * Handles GET /admin/settings — serves the Super Admin settings HTML page.
 * @param request - Express request
 * @param response - Express response
 */
export function getSettingsPageHandler(request: Request, response: Response): void {
  void request;
  response.sendFile(path.join(PATHS.publicDirectory, 'admin', 'settings.html'));
}

/**
 * Handles GET /admin/settings/data — returns current settings and NIC options.
 * @param request - Express request
 * @param response - Express response
 */
export async function getSettingsDataHandler(request: Request, response: Response): Promise<void> {
  void request;
  try {
    const [settings, networkInterfaces] = await Promise.all([
      loadSystemSettings(),
      listUpNetworkInterfaces(),
    ]);

    response.status(200).json({
      settings,
      networkInterfaces,
      showNicSelector: networkInterfaces.length >= 2,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load settings';
    response.status(500).json({ error: message });
  }
}

/**
 * Handles POST /admin/settings — saves validated settings from the form.
 * @param request - Express request with partial settings body
 * @param response - Express response
 */
export async function postSettingsHandler(request: Request, response: Response): Promise<void> {
  try {
    const body = request.body as Partial<SystemSettings>;
    const saved = await saveSystemSettingsUpdate(body);
    response.status(200).json({ settings: saved, message: 'Settings saved' });
  } catch (error: unknown) {
    if (error instanceof SystemSettingsValidationError) {
      response.status(400).json({ error: error.message });
      return;
    }
    const message = error instanceof Error ? error.message : 'Failed to save settings';
    response.status(500).json({ error: message });
  }
}

/**
 * Wraps multer upload with a limit read from system settings per request.
 * @param createUpload - Factory that builds multer middleware for a byte limit
 * @returns Express middleware
 */
export function createDynamicUploadMiddleware(
  createUpload: (maxBytes: number) => (request: Request, response: Response, next: NextFunction) => void,
): (request: Request, response: Response, next: NextFunction) => void {
  return (request, response, next) => {
    void loadSystemSettings()
      .then((settings) => {
        const maxBytes = settings.maxZipUploadMb * 1024 * 1024;
        createUpload(maxBytes)(request, response, next);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Failed to load upload limits';
        response.status(500).json({ error: message });
      });
  };
}

/**
 * Registers Super Admin system settings page and API routes.
 * @returns Express router mounted at /admin
 */
export function createSystemSettingsRouter(): Router {
  const router = createRouter();

  router.get('/settings', requireSuperAdminMiddleware, getSettingsPageHandler);
  router.get('/settings/data', requireSuperAdminMiddleware, (request, response) => {
    void getSettingsDataHandler(request, response);
  });
  router.post('/settings', requireSuperAdminMiddleware, (request, response) => {
    void postSettingsHandler(request, response);
  });

  return router;
}
