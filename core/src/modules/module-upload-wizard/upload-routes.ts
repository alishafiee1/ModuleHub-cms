import crypto from 'crypto';
import { open } from 'fs/promises';
import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import fs from 'fs-extra';
import multer from 'multer';
import { PATHS, assertModuleDirectoryInsideRoot } from '../../config/paths';
import { requireSuperAdminMiddleware } from '../admin-auth';
import { sendLayoutMutationError } from '../home-layout/layout-api-errors';
import { readSiteLayout, writeSiteLayout } from '../home-layout/layout-store';
import type { ModuleResources } from '../home-layout/types';
import { getCmsLogger } from '../logger';
import { installModuleDependencies } from '../package-cache';
import { loadSystemSettings, createDynamicUploadMiddleware } from '../system-settings';
import { hasZipMagicHeader, isZipUpload, validateUploadSize } from '../upload-validator';
import { createVirtualFolder } from '../virtual-folder';
import { assertValidModuleId } from '../module-management/module-id-validator';
import { extractZipToModuleDirectory } from './zip-extractor';
import { generateModuleId, registerModuleInLayout, type WizardSaveInput } from './wizard-save';

/**
 * Creates multer storage for ZIP uploads under storage/upload-temp.
 * @param maxBytes - Maximum upload size in bytes from system settings
 * @returns Configured multer middleware for a single zipFile field
 */
function createUploadMiddleware(maxBytes: number) {
  return multer({
    storage: multer.diskStorage({
      destination: async (_request, _file, callback) => {
        await fs.ensureDir(PATHS.uploadTempDirectory);
        callback(null, PATHS.uploadTempDirectory);
      },
      filename: (_request, _file, callback) => {
        const safeName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.zip`;
        callback(null, safeName);
      },
    }),
    limits: { fileSize: maxBytes },
  }).single('zipFile');
}

/**
 * Reads the first bytes of an uploaded file for signature validation.
 * @param filePath - Temporary upload path
 * @returns Header bytes
 */
async function readUploadHeader(filePath: string): Promise<Buffer> {
  const handle = await open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(4);
    const result = await handle.read(buffer, 0, buffer.length, 0);
    return buffer.subarray(0, result.bytesRead);
  } finally {
    await handle.close();
  }
}

/**
 * Handles POST /admin/upload — validates ZIP and extracts to standalone-modules.
 * @param request - Express request with multer file
 * @param response - Express response
 */
export async function postUploadHandler(request: Request, response: Response): Promise<void> {
  const file = request.file;
  if (!file) {
    response.status(400).json({ error: 'ZIP file is required' });
    return;
  }

  try {
    const settings = await loadSystemSettings();
    const sizeError = validateUploadSize(file.size, settings.maxZipUploadMb);
    if (sizeError) {
      await fs.remove(file.path);
      response.status(413).json({ error: sizeError });
      return;
    }

    if (!isZipUpload(file.originalname, file.mimetype)) {
      await fs.remove(file.path);
      response.status(400).json({ error: 'Only ZIP archives are allowed' });
      return;
    }
    const header = await readUploadHeader(file.path);
    if (!hasZipMagicHeader(header)) {
      await fs.remove(file.path);
      response.status(400).json({ error: 'Uploaded file is not a valid ZIP archive' });
      return;
    }

    const moduleId = generateModuleId();
    const moduleDirectory = assertModuleDirectoryInsideRoot(moduleId);
    await extractZipToModuleDirectory(file.path, moduleDirectory);
    await fs.remove(file.path);

    const dependencyResult = await installModuleDependencies(moduleDirectory, settings);
    const logger = getCmsLogger();
    logger.info('Module dependencies resolved after upload', {
      moduleId,
      hash: dependencyResult.hash,
      installed: dependencyResult.installed,
      linkedTargets: dependencyResult.linkedTargets,
    });

    response.status(201).json({
      moduleId,
      message: 'ZIP extracted successfully. Complete the wizard to register the module.',
      dependencies: dependencyResult,
    });
  } catch (error: unknown) {
    const logger = getCmsLogger();
    logger.error('Upload failed', { error });
    if (request.file?.path) {
      await fs.remove(request.file.path).catch(() => undefined);
    }
    const message = error instanceof Error ? error.message : 'Upload failed';
    response.status(500).json({ error: message });
  }
}

/**
 * Handles POST /admin/wizard/save — registers module metadata in site-layout.
 * @param request - Express request with wizard JSON body
 * @param response - Express response
 */
export async function postWizardSaveHandler(request: Request, response: Response): Promise<void> {
  try {
    const body = request.body as Partial<WizardSaveInput>;
    const moduleId = typeof body.moduleId === 'string' ? body.moduleId : '';
    const parentId = typeof body.parentId === 'string' ? body.parentId : 'root';
    const name = typeof body.name === 'string' ? body.name : '';

    if (!moduleId || !name.trim()) {
      response.status(400).json({ error: 'moduleId and name are required' });
      return;
    }

    assertValidModuleId(moduleId);
    const moduleDirectory = assertModuleDirectoryInsideRoot(moduleId);
    if (!(await fs.pathExists(moduleDirectory))) {
      response.status(400).json({ error: 'Module files not found. Upload ZIP first.' });
      return;
    }

    const settings = await loadSystemSettings();
    const layout = await readSiteLayout();
    const resources = (body.resources ?? settings.defaultModuleResources) as ModuleResources;

    const result = registerModuleInLayout(layout, settings, {
      moduleId,
      parentId,
      name,
      changelog: typeof body.changelog === 'string' ? body.changelog : undefined,
      docker: Boolean(body.docker),
      port: typeof body.port === 'number' ? body.port : null,
      permissions: typeof body.permissions === 'string' ? body.permissions : 'network',
      resources,
      icon: typeof body.icon === 'string' ? body.icon : 'fas fa-cube',
      thumbnail: typeof body.thumbnail === 'string' ? body.thumbnail : '',
      needsProcess: Boolean(body.needsProcess),
    });

    await writeSiteLayout(result.layout);
    response.status(201).json({
      moduleId: result.moduleId,
      entry: result.entry,
    });
  } catch (error: unknown) {
    sendLayoutMutationError(response, error, 'Wizard save failed');
  }
}

/**
 * Handles POST /admin/folder — creates a virtual folder in site-layout.
 * @param request - Express request
 * @param response - Express response
 */
export async function postFolderHandler(request: Request, response: Response): Promise<void> {
  try {
    const parentId = typeof request.body?.parentId === 'string' ? request.body.parentId : 'root';
    const name = typeof request.body?.name === 'string' ? request.body.name : '';

    const layout = await readSiteLayout();
    const result = createVirtualFolder(layout, { parentId, name });
    await writeSiteLayout(result.layout);

    response.status(201).json({
      folderId: result.folderId,
      node: result.node,
    });
  } catch (error: unknown) {
    sendLayoutMutationError(response, error, 'Failed to create folder');
  }
}

/**
 * Registers module upload wizard and virtual folder admin routes.
 * @returns Express router mounted at /admin
 */
export function createUploadWizardRouter(): Router {
  const router = createRouter();
  const uploadWithLimit = createDynamicUploadMiddleware(createUploadMiddleware);

  router.post('/upload', requireSuperAdminMiddleware, uploadWithLimit, (request, response) => {
    void postUploadHandler(request, response);
  });
  router.post('/wizard/save', requireSuperAdminMiddleware, (request, response) => {
    void postWizardSaveHandler(request, response);
  });
  router.post('/folder', requireSuperAdminMiddleware, (request, response) => {
    void postFolderHandler(request, response);
  });

  return router;
}
