import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import { requireSuperAdminOnlyMiddleware } from '../admin-auth';
import { getCmsLogger } from '../logger';
import {
  deleteVirtualFolder,
  patchVirtualFolder,
  type DeleteFolderInput,
  type PatchFolderInput,
} from './folder-management';
import { readSiteLayout, writeSiteLayout } from './layout-store';

function getFolderIdParam(request: Request, response: Response): string | null {
  const folderId = request.params.folderId;
  if (typeof folderId !== 'string' || !folderId.trim()) {
    response.status(400).json({ error: 'folderId is required' });
    return null;
  }
  return folderId;
}

/**
 * PATCH /admin/folder/:folderId — rename, card description, or move folder.
 */
export async function patchFolderHandler(request: Request, response: Response): Promise<void> {
  const folderId = getFolderIdParam(request, response);
  if (!folderId) {
    return;
  }

  try {
    const body = request.body as PatchFolderInput;
    const layout = await readSiteLayout();
    const node = patchVirtualFolder(layout, folderId, body);
    await writeSiteLayout(layout);
    response.status(200).json({ node });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update folder';
    const status = message.includes('not found') ? 404 : 400;
    response.status(status).json({ error: message });
  }
}

/**
 * DELETE /admin/folder/:folderId — delete folder with content policy.
 */
export async function deleteFolderHandler(request: Request, response: Response): Promise<void> {
  const folderId = getFolderIdParam(request, response);
  if (!folderId) {
    return;
  }

  try {
    const body = request.body as DeleteFolderInput;
    if (!body?.contentPolicy) {
      response.status(400).json({ error: 'contentPolicy is required' });
      return;
    }

    const layout = await readSiteLayout();
    const result = await deleteVirtualFolder(layout, folderId, body);
    await writeSiteLayout(layout);

    if (body.contentPolicy === 'cascade-delete' && result.deletedModules?.length) {
      getCmsLogger().warn('Folder cascade delete completed', {
        folderId,
        deletedModules: result.deletedModules,
      });
    }

    response.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete folder';
    if (message === 'FOLDER_NOT_EMPTY') {
      response.status(409).json({ error: message });
      return;
    }
    const status = message.includes('not found') ? 404 : 400;
    response.status(status).json({ error: message });
  }
}

/**
 * Registers PATCH/DELETE /admin/folder/:folderId (metadata and lifecycle).
 */
export function createFolderManagementRouter(): Router {
  const router = createRouter({ mergeParams: true });
  router.patch('/:folderId', requireSuperAdminOnlyMiddleware, (request, response) => {
    void patchFolderHandler(request, response);
  });
  router.delete('/:folderId', requireSuperAdminOnlyMiddleware, (request, response) => {
    void deleteFolderHandler(request, response);
  });
  return router;
}
