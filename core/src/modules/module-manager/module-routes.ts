import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import { requireSuperAdminMiddleware } from '../admin-auth';
import { startModuleById, stopModuleById } from './module-manager-service';

/**
 * Handles POST /admin/module/:id/start.
 * @param request - Express request
 * @param response - Express response
 */
export async function postModuleStartHandler(request: Request, response: Response): Promise<void> {
  const moduleId = request.params.id;
  if (!moduleId || Array.isArray(moduleId)) {
    response.status(400).json({ error: 'Module id is required' });
    return;
  }

  try {
    const result = await startModuleById(moduleId);
    response.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Start failed';
    const status = message.includes('Maximum concurrent') ? 409 : 400;
    response.status(status).json({ error: message });
  }
}

/**
 * Handles POST /admin/module/:id/stop.
 * @param request - Express request
 * @param response - Express response
 */
export async function postModuleStopHandler(request: Request, response: Response): Promise<void> {
  const moduleId = request.params.id;
  if (!moduleId || Array.isArray(moduleId)) {
    response.status(400).json({ error: 'Module id is required' });
    return;
  }

  try {
    const result = await stopModuleById(moduleId);
    response.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Stop failed';
    response.status(400).json({ error: message });
  }
}

/**
 * Registers module start/stop admin routes.
 * @returns Express router mounted under /admin/module
 */
export function createModuleManagementRouter(): Router {
  const router = createRouter({ mergeParams: true });

  router.use(requireSuperAdminMiddleware);

  router.post('/:id/start', (request, response) => {
    void postModuleStartHandler(request, response);
  });
  router.post('/:id/stop', (request, response) => {
    void postModuleStopHandler(request, response);
  });

  return router;
}
