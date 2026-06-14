import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import { requireSuperAdminOnlyMiddleware } from '../admin-auth';
import { sendLayoutMutationError } from './layout-api-errors';
import { moveLayoutNode, type MoveLayoutNodeInput } from './layout-node-move';
import { readSiteLayout, writeSiteLayout } from './layout-store';

function getNodeIdParam(request: Request, response: Response): string | null {
  const nodeId = request.params.nodeId;
  if (typeof nodeId !== 'string' || !nodeId.trim()) {
    response.status(400).json({ error: 'nodeId is required' });
    return null;
  }
  return nodeId;
}

/**
 * PATCH /admin/layout-node/:nodeId — reparent folder or module in layout tree.
 */
export async function patchLayoutNodeHandler(request: Request, response: Response): Promise<void> {
  const nodeId = getNodeIdParam(request, response);
  if (!nodeId) {
    return;
  }

  try {
    const body = request.body as MoveLayoutNodeInput;
    if (!body?.parentId || typeof body.parentId !== 'string') {
      response.status(400).json({ error: 'parentId is required' });
      return;
    }

    const layout = await readSiteLayout();
    const node = moveLayoutNode(layout, nodeId, body);
    await writeSiteLayout(layout);
    response.status(200).json({ node });
  } catch (error: unknown) {
    sendLayoutMutationError(response, error, 'Failed to move layout node');
  }
}

/**
 * Registers PATCH /admin/layout-node/:nodeId.
 */
export function createLayoutNodeMoveRouter(): Router {
  const router = createRouter({ mergeParams: true });
  router.patch('/:nodeId', requireSuperAdminOnlyMiddleware, (request, response) => {
    void patchLayoutNodeHandler(request, response);
  });
  return router;
}
