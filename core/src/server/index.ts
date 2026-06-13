import express, { type Application } from 'express';
import http from 'http';
import path from 'path';
import { ensureRequiredDirectories } from '../bootstrap/ensure-directories';
import { PATHS } from '../config/paths';
import {
  createAdminLoginRouter,
  createAdminProtectedRouter,
  createModuleAuthRouter,
  getCsrfTokenHandler,
  isDevSuperAdminEnabled,
  registerSessionMiddleware,
  requireCsrfMiddleware,
  requireSuperAdminMiddleware,
} from '../modules/admin-auth';
import { createLayoutRouter, createFolderCardsRouter, createCardBackgroundRouter } from '../modules/home-layout';
import { requestLoggingMiddleware } from '../modules/logger';
import { createModuleManagementRouter } from '../modules/module-management';
import { createModuleServingRouter } from '../modules/module-manager';
import { createBackupRestoreRouter, createRestoreRouter } from '../modules/backup-restore';
import { createUploadWizardRouter } from '../modules/module-upload-wizard';
import { createSystemSettingsRouter } from '../modules/system-settings';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 4000;

/**
 * Applies CSRF protection to mutating /admin requests (except login POST handled separately).
 * @returns Express middleware
 */
function createAdminCsrfProtectionMiddleware() {
  return (request: express.Request, response: express.Response, next: express.NextFunction) => {
    const method = request.method.toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      next();
      return;
    }
    requireCsrfMiddleware(request, response, next);
  };
}

/**
 * Builds the Express application with health check and request logging.
 * @returns Configured Express app (not listening)
 */
export function createApp(): Application {
  const app = express();
  // purpose --- Nginx terminates TLS; trust X-Forwarded-Proto so Secure session cookies work ------
  app.set('trust proxy', 1);
  registerSessionMiddleware(app);
  app.use(requestLoggingMiddleware);
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.get('/health', (_request, response) => {
    response.status(200).json({ status: 'ok' });
  });

  app.get('/api/auth/csrf-token', getCsrfTokenHandler);

  app.use('/api', createLayoutRouter());
  app.use('/modules', createModuleServingRouter());

  app.use('/admin', createAdminLoginRouter());
  app.use('/admin', createAdminCsrfProtectionMiddleware());
  app.use('/admin', createAdminProtectedRouter());
  app.use('/admin/folder', createFolderCardsRouter());
  app.use('/admin/card-background', createCardBackgroundRouter());
  app.use('/card-backgrounds', express.static(PATHS.cardBackgroundsDirectory));
  app.use('/admin/module', createModuleAuthRouter());
  app.use('/admin/module', createModuleManagementRouter());
  app.use('/admin/backup', createBackupRestoreRouter());
  app.use('/admin', createRestoreRouter());
  app.use('/admin', createUploadWizardRouter());
  app.use('/admin', createSystemSettingsRouter());
  // Protect unmatched /admin static assets (settings.html, settings.js) while keeping login public
  app.use('/admin', (request, response, next) => {
    const filePath = request.path;
    if (filePath === '/login.html' || filePath === '/login.js') {
      next();
      return;
    }
    requireSuperAdminMiddleware(request, response, next);
  });
  app.use('/thumbnails', express.static(PATHS.thumbnailsDirectory));
  app.use(express.static(PATHS.publicDirectory));

  app.get('/', (_request, response) => {
    response.sendFile(path.join(PATHS.publicDirectory, 'index.html'));
  });

  return app;
}

/**
 * Ensures directories exist and starts the HTTP server on localhost.
 * @returns Node HTTP server instance
 */
export async function startServer(): Promise<http.Server> {
  await ensureRequiredDirectories();
  if (isDevSuperAdminEnabled()) {
    // eslint-disable-next-line no-console -- security warning at bootstrap
    console.warn(
      'WARNING: MODULEHUB_DEV_SUPER_ADMIN=1 is active — all admin routes bypass real login. Disable before production go-live (phase 8).',
    );
  }
  const app = createApp();
  const host = process.env.MODULEHUB_HOST ?? DEFAULT_HOST;
  const port = Number(process.env.MODULEHUB_PORT ?? DEFAULT_PORT);

  return new Promise((resolve, reject) => {
    const server = app.listen(port, host, () => resolve(server));
    server.on('error', reject);
  });
}

if (require.main === module) {
  startServer()
    .then((server) => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : DEFAULT_PORT;
      const host = process.env.MODULEHUB_HOST ?? DEFAULT_HOST;
      // eslint-disable-next-line no-console -- bootstrap only
      console.log(`ModuleHub CMS listening on ${host}:${port}`);
    })
    .catch((error: unknown) => {
      console.error('Failed to start ModuleHub CMS', error);
      process.exit(1);
    });
}
