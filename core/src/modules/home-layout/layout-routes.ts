import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import { requireSuperAdminOnlyMiddleware, getAuthStatusPayload } from '../admin-auth';
import { getCmsLogger } from '../logger';
import { LayoutParseError } from './layout-parser';
import { loadLayoutForApi } from './layout-store';
import { patchFolderCardsHandler } from './folder-cards-update';

/**
 * Handles GET /api/layout — returns site tree and public module metadata.
 * @param request - Express request
 * @param response - Express response
 */
export async function getLayoutHandler(_request: Request, response: Response): Promise<void> {
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
 * Returns auth status from the current session.
 * @param request - Express request
 * @param response - Express response
 */
export async function getAuthStatusHandler(request: Request, response: Response): Promise<void> {
  const payload = await getAuthStatusPayload(request);
  response.status(200).json(payload);
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
  router.get('/auth/status', (request, response) => {
    void getAuthStatusHandler(request, response);
  });
  return router;
}

/**
 * Registers admin folder layout routes — PATCH /admin/folder/:folderId/cards.
 * purpose --- requires Super Admin session + CSRF (enforced by server.ts middleware) ---
 * @returns Express router mounted at /admin/folder
 */
export function createFolderCardsRouter(): Router {
  const router = createRouter({ mergeParams: true });
  router.patch('/:folderId/cards', requireSuperAdminOnlyMiddleware, (request, response) => {
    void patchFolderCardsHandler(request, response);
  });
  return router;
}
