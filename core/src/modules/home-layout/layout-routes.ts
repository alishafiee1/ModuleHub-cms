import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import { getCmsLogger } from '../logger';
import { LayoutParseError } from './layout-parser';
import { loadLayoutForApi } from './layout-store';

/**
 * Handles GET /api/layout — returns site tree and public module metadata.
 * @param request - Express request
 * @param response - Express response
 */
export async function getLayoutHandler(request: Request, response: Response): Promise<void> {
  void request;
  try {
    const layout = await loadLayoutForApi();
    response.status(200).json(layout);
  } catch (error: unknown) {
    const logger = getCmsLogger();
    if (error instanceof LayoutParseError) {
      logger.error('Layout parse failed', { error: error.message });
      response.status(500).json({ error: 'Invalid site layout configuration' });
      return;
    }

    logger.error('Failed to load layout', { error });
    response.status(500).json({ error: 'Failed to load layout' });
  }
}

/**
 * Stub auth status until phase 8 — reports no active admin session.
 * @param request - Express request
 * @param response - Express response
 */
export function getAuthStatusHandler(request: Request, response: Response): void {
  void request;
  response.status(200).json({
    isSuperAdmin: false,
    managedModuleIds: [] as string[],
  });
}

/**
 * Registers home layout and auth status routes.
 * @returns Express router mounted at /api
 */
export function createLayoutRouter(): Router {
  const router = createRouter();
  router.get('/layout', (request, response) => {
    void getLayoutHandler(request, response);
  });
  router.get('/auth/status', getAuthStatusHandler);
  return router;
}
