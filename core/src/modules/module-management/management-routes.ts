import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import { requireSuperAdminMiddleware } from '../admin-auth';
import { readSiteLayout, writeSiteLayout } from '../home-layout/layout-store';
import { startModuleById, stopModuleById } from '../module-manager/module-manager-service';
import { loadSystemSettings } from '../system-settings';
import { applyModuleEdit, type ModuleEditInput } from './module-edit';
import { buildModuleBackupZip } from './module-backup';
import { deleteModuleCompletely } from './module-delete';
import { syncModuleFromGitHub } from './github-sync';
import { readModuleLogFull, readModuleLogTail } from './log-viewer';
import { assertValidModuleId } from './module-id-validator';

/**
 * Resolves module id route param or sends 400.
 * @param request - Express request
 * @param response - Express response
 * @returns Module id string or null when invalid
 */
function getModuleIdParam(request: Request, response: Response): string | null {
  const raw = request.params.id;
  const moduleId = Array.isArray(raw) ? raw[0] : raw;
  if (!moduleId) {
    response.status(400).json({ error: 'Module id is required' });
    return null;
  }
  try {
    assertValidModuleId(moduleId);
    return moduleId;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Invalid module id';
    response.status(400).json({ error: message });
    return null;
  }
}

/**
 * Handles POST /admin/module/:id/start.
 * @param request - Express request
 * @param response - Express response
 */
export async function postModuleStartHandler(request: Request, response: Response): Promise<void> {
  const moduleId = getModuleIdParam(request, response);
  if (!moduleId) {
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
  const moduleId = getModuleIdParam(request, response);
  if (!moduleId) {
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
 * Handles POST /admin/module/:id/restart.
 * @param request - Express request
 * @param response - Express response
 */
export async function postModuleRestartHandler(request: Request, response: Response): Promise<void> {
  const moduleId = getModuleIdParam(request, response);
  if (!moduleId) {
    return;
  }

  try {
    const layout = await readSiteLayout();
    const entry = layout.modules[moduleId];
    if (!entry) {
      response.status(404).json({ error: `Module "${moduleId}" not found` });
      return;
    }
    if (entry.status === 'running') {
      await stopModuleById(moduleId);
    }
    const result = await startModuleById(moduleId);
    response.status(200).json({ ...result, message: 'Module restarted' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Restart failed';
    response.status(400).json({ error: message });
  }
}

/**
 * Handles GET /admin/module/:id/logs.
 * @param request - Express request
 * @param response - Express response
 */
export async function getModuleLogsHandler(request: Request, response: Response): Promise<void> {
  const moduleId = getModuleIdParam(request, response);
  if (!moduleId) {
    return;
  }

  const settings = await loadSystemSettings();
  const content = await readModuleLogTail(moduleId, settings.logViewerMaxLines);
  response.status(200).json({
    moduleId,
    maxLines: settings.logViewerMaxLines,
    content,
  });
}

/**
 * Handles GET /admin/module/:id/logs/download.
 * @param request - Express request
 * @param response - Express response
 */
export async function getModuleLogsDownloadHandler(
  request: Request,
  response: Response,
): Promise<void> {
  const moduleId = getModuleIdParam(request, response);
  if (!moduleId) {
    return;
  }

  const content = await readModuleLogFull(moduleId);
  response.setHeader('Content-Type', 'text/plain; charset=utf-8');
  response.setHeader(
    'Content-Disposition',
    `attachment; filename="${moduleId}.log"`,
  );
  response.status(200).send(content);
}

/**
 * Handles PATCH /admin/module/:id — update module settings.
 * @param request - Express request
 * @param response - Express response
 */
export async function patchModuleHandler(request: Request, response: Response): Promise<void> {
  const moduleId = getModuleIdParam(request, response);
  if (!moduleId) {
    return;
  }

  try {
    const layout = await readSiteLayout();
    const body = request.body as ModuleEditInput;
    const updated = await applyModuleEdit(layout, moduleId, body);
    await writeSiteLayout(updated);
    response.status(200).json({
      moduleId,
      entry: updated.modules[moduleId],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Update failed';
    response.status(400).json({ error: message });
  }
}

/**
 * Handles DELETE /admin/module/:id.
 * @param request - Express request
 * @param response - Express response
 */
export async function deleteModuleHandler(request: Request, response: Response): Promise<void> {
  const moduleId = getModuleIdParam(request, response);
  if (!moduleId) {
    return;
  }

  try {
    await deleteModuleCompletely(moduleId);
    response.status(200).json({ moduleId, deleted: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Delete failed';
    const status = message.includes('not found') ? 404 : 400;
    response.status(status).json({ error: message });
  }
}

/**
 * Handles GET /admin/module/:id/backup — ZIP download.
 * @param request - Express request
 * @param response - Express response
 */
export async function getModuleBackupHandler(request: Request, response: Response): Promise<void> {
  const moduleId = getModuleIdParam(request, response);
  if (!moduleId) {
    return;
  }

  try {
    const layout = await readSiteLayout();
    const entry = layout.modules[moduleId];
    if (!entry) {
      response.status(404).json({ error: `Module "${moduleId}" not found` });
      return;
    }
    const zipBuffer = await buildModuleBackupZip(moduleId, entry);
    response.setHeader('Content-Type', 'application/zip');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${moduleId}-backup.zip"`,
    );
    response.status(200).send(zipBuffer);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Backup failed';
    response.status(400).json({ error: message });
  }
}

/**
 * Handles POST /admin/module/:id/github-sync.
 * @param request - Express request
 * @param response - Express response
 */
export async function postModuleGitHubSyncHandler(
  request: Request,
  response: Response,
): Promise<void> {
  const moduleId = getModuleIdParam(request, response);
  if (!moduleId) {
    return;
  }

  try {
    const layout = await readSiteLayout();
    const entry = layout.modules[moduleId];
    if (!entry) {
      response.status(404).json({ error: `Module "${moduleId}" not found` });
      return;
    }
    const result = await syncModuleFromGitHub(moduleId, entry.gitRepo);
    response.status(200).json({
      moduleId,
      gitOutput: result.gitOutput,
      dependencies: result.dependencies,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'GitHub sync failed';
    response.status(400).json({ error: message });
  }
}

/**
 * Registers module management admin routes (start/stop/logs/edit/backup/delete/github).
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
  router.post('/:id/restart', (request, response) => {
    void postModuleRestartHandler(request, response);
  });
  router.get('/:id/logs/download', (request, response) => {
    void getModuleLogsDownloadHandler(request, response);
  });
  router.get('/:id/logs', (request, response) => {
    void getModuleLogsHandler(request, response);
  });
  router.get('/:id/backup', (request, response) => {
    void getModuleBackupHandler(request, response);
  });
  router.post('/:id/github-sync', (request, response) => {
    void postModuleGitHubSyncHandler(request, response);
  });
  router.patch('/:id', (request, response) => {
    void patchModuleHandler(request, response);
  });
  router.delete('/:id', (request, response) => {
    void deleteModuleHandler(request, response);
  });

  return router;
}
