import express, { type Application } from 'express';
import http from 'http';
import path from 'path';
import { ensureRequiredDirectories } from '../bootstrap/ensure-directories';
import { PATHS } from '../config/paths';
import { createLayoutRouter } from '../modules/home-layout';
import { requestLoggingMiddleware } from '../modules/logger';
import { createModuleManagementRouter, createModuleServingRouter } from '../modules/module-manager';
import { createUploadWizardRouter } from '../modules/module-upload-wizard';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 4000;

/**
 * Builds the Express application with health check and request logging.
 * @returns Configured Express app (not listening)
 */
export function createApp(): Application {
  const app = express();
  app.use(requestLoggingMiddleware);
  app.use(express.json());

  app.get('/health', (_request, response) => {
    response.status(200).json({ status: 'ok' });
  });

  app.use('/api', createLayoutRouter());
  app.use('/modules', createModuleServingRouter());
  app.use('/admin/module', createModuleManagementRouter());
  app.use('/admin', createUploadWizardRouter());
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
      // eslint-disable-next-line no-console -- bootstrap only
      console.log(`ModuleHub CMS listening on ${DEFAULT_HOST}:${port}`);
    })
    .catch((error: unknown) => {
      console.error('Failed to start ModuleHub CMS', error);
      process.exit(1);
    });
}
