import type { NextFunction, Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import fs from 'fs-extra';
import path from 'path';
import { getModuleDirectory } from '../../config/paths';
import { classifyModuleHosting } from './module-classifier';
import { getModuleEntryForServing } from './module-manager-service';
import { resolveSpaFallbackIndexPath } from './spa-fallback';

/**
 * Strips /modules/<id> prefix from request URL for static file serving.
 * @param originalUrl - Full request URL path
 * @param moduleId - Module identifier
 * @returns Path relative to module root
 */
export function stripModuleUrlPrefix(originalUrl: string, moduleId: string): string {
  const modulePrefix = `/${moduleId}`;
  const fullPrefix = `/modules/${moduleId}`;

  if (originalUrl.startsWith(fullPrefix)) {
    const remainder = originalUrl.slice(fullPrefix.length);
    return remainder.length > 0 ? remainder : '/';
  }
  if (originalUrl.startsWith(modulePrefix)) {
    const remainder = originalUrl.slice(modulePrefix.length);
    return remainder.length > 0 ? remainder : '/';
  }
  return originalUrl;
}

/**
 * Creates reverse proxy middleware for a running backend/docker module.
 * @param moduleId - Module identifier
 * @param port - Local listen port
 * @returns Express middleware
 */
export function createModuleProxyMiddleware(moduleId: string, port: number) {
  return createProxyMiddleware({
    target: `http://127.0.0.1:${port}`,
    changeOrigin: true,
    pathRewrite: (requestPath) => stripModuleUrlPrefix(requestPath, moduleId),
    ws: true,
  });
}

/**
 * Registers public module serving at /modules/:moduleId/*.
 * @returns Express router
 */
export function createModuleServingRouter(): Router {
  const router = createRouter({ mergeParams: true });

  router.use('/:moduleId', (request, response, next) => {
    void handleModuleRequest(request, response, next);
  });

  return router;
}

async function handleModuleRequest(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const moduleId = request.params.moduleId;
  if (!moduleId || Array.isArray(moduleId)) {
    response.status(400).json({ error: 'Invalid module id' });
    return;
  }

  const entry = await getModuleEntryForServing(moduleId);
  if (!entry) {
    response.status(404).json({ error: 'Module not found' });
    return;
  }

  const moduleDirectory = getModuleDirectory(moduleId);
  if (!(await fs.pathExists(moduleDirectory))) {
    response.status(404).json({ error: 'Module files not found' });
    return;
  }

  const hostingKind = classifyModuleHosting(entry);

  if (hostingKind !== 'static' && entry.status === 'running' && entry.port > 0) {
    const proxy = createModuleProxyMiddleware(moduleId, entry.port);
    return proxy(request, response, next);
  }

  if (entry.status !== 'running') {
    response.status(503).send('Module is not running');
    return;
  }

  const relativePath = stripModuleUrlPrefix(request.url, moduleId);
  const filePath = path.join(moduleDirectory, relativePath);

  if (relativePath !== '/' && await fs.pathExists(filePath)) {
    const stat = await fs.stat(filePath);
    if (stat.isFile()) {
      response.sendFile(filePath);
      return;
    }
  }

  const indexPath = path.join(moduleDirectory, 'index.html');
  if (await fs.pathExists(indexPath)) {
    response.sendFile(indexPath);
    return;
  }

  const spaFallback = await resolveSpaFallbackIndexPath(moduleDirectory, relativePath);
  if (spaFallback) {
    response.sendFile(spaFallback);
    return;
  }

  response.status(404).send('Not found');
}
