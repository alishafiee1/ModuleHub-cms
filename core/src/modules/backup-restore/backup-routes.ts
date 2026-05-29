import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import fs from 'fs-extra';
import multer from 'multer';
import { PATHS } from '../../config/paths';
import { requireSuperAdminMiddleware } from '../admin-auth';
import { loadSystemSettings, createDynamicUploadMiddleware } from '../system-settings';
import { isZipUpload, validateUploadSize } from '../upload-validator';
import {
  assertSafeBackupFileName,
  createFullBackup,
  listFullBackupFileNames,
  readFullBackupFile,
} from './backup-service';
import { RestoreValidationError, restoreFullBackupFromZipBuffer } from './restore-service';

/**
 * Creates multer storage for restore ZIP uploads.
 * @param maxBytes - Maximum upload size in bytes from system settings
 * @returns Configured multer middleware for backup field
 */
function createRestoreUploadMiddleware(maxBytes: number) {
  return multer({
    storage: multer.diskStorage({
      destination: async (_request, _file, callback) => {
        await fs.ensureDir(PATHS.uploadTempDirectory);
        callback(null, PATHS.uploadTempDirectory);
      },
      filename: (_request, _file, callback) => {
        callback(null, `restore-${Date.now()}.zip`);
      },
    }),
    limits: { fileSize: maxBytes },
  }).single('backup');
}

/**
 * Handles POST /admin/backup — creates a full backup ZIP on disk.
 * @param request - Express request
 * @param response - Express response
 */
export async function postFullBackupHandler(request: Request, response: Response): Promise<void> {
  void request;
  try {
    const result = await createFullBackup();
    response.status(201).json({
      fileName: result.fileName,
      createdAt: result.createdAt,
      downloadPath: `/admin/backup/download/${encodeURIComponent(result.fileName)}`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Backup failed';
    response.status(500).json({ error: message });
  }
}

/**
 * Handles GET /admin/backup/list — lists backup ZIP files.
 * @param request - Express request
 * @param response - Express response
 */
export async function getBackupListHandler(request: Request, response: Response): Promise<void> {
  void request;
  try {
    const fileNames = await listFullBackupFileNames();
    response.status(200).json({ backups: fileNames });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list backups';
    response.status(500).json({ error: message });
  }
}

/**
 * Handles GET /admin/backup/download/:fileName — downloads a backup ZIP.
 * @param request - Express request
 * @param response - Express response
 */
export async function getBackupDownloadHandler(request: Request, response: Response): Promise<void> {
  const rawName = request.params.fileName;
  const fileName = Array.isArray(rawName) ? rawName[0] : rawName;
  if (!fileName) {
    response.status(400).json({ error: 'Backup file name is required' });
    return;
  }

  try {
    assertSafeBackupFileName(fileName);
    const zipBuffer = await readFullBackupFile(fileName);
    response.setHeader('Content-Type', 'application/zip');
    response.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    response.status(200).send(zipBuffer);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Download failed';
    const status = message.includes('not found') ? 404 : 400;
    response.status(status).json({ error: message });
  }
}

/**
 * Handles POST /admin/restore — restores from uploaded backup ZIP when confirmed.
 * @param request - Express request with multer file
 * @param response - Express response
 */
export async function postRestoreHandler(request: Request, response: Response): Promise<void> {
  const confirmed = request.body?.confirm === true || request.body?.confirm === 'true';
  if (!confirmed) {
    response.status(400).json({
      error: 'Restore requires explicit confirmation. Send confirm=true in the request body.',
    });
    return;
  }

  const file = request.file;
  if (!file) {
    response.status(400).json({ error: 'Backup ZIP file is required (field name: backup)' });
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
      response.status(400).json({ error: 'Only ZIP backup files are allowed' });
      return;
    }

    const zipBuffer = await fs.readFile(file.path);
    const result = await restoreFullBackupFromZipBuffer(zipBuffer);
    response.status(200).json({
      restoredAt: result.restoredAt,
      preRestoreBackupFileName: result.preRestoreBackupFileName,
      message: 'Restore completed. Restart the CMS process if modules do not reflect changes.',
    });
  } catch (error: unknown) {
    if (error instanceof RestoreValidationError) {
      response.status(400).json({ error: error.message });
      return;
    }
    const message = error instanceof Error ? error.message : 'Restore failed';
    response.status(500).json({ error: message });
  } finally {
    if (file?.path) {
      await fs.remove(file.path).catch(() => undefined);
    }
  }
}

/**
 * Registers full backup and restore admin routes under /admin/backup and /admin/restore.
 * @returns Express router
 */
export function createBackupRestoreRouter(): Router {
  const router = createRouter();

  router.use(requireSuperAdminMiddleware);

  router.post('/', (request, response) => {
    void postFullBackupHandler(request, response);
  });
  router.get('/list', (request, response) => {
    void getBackupListHandler(request, response);
  });
  router.get('/download/:fileName', (request, response) => {
    void getBackupDownloadHandler(request, response);
  });

  return router;
}

/**
 * Registers POST /admin/restore on a dedicated router.
 * @returns Express router mounted at /admin
 */
export function createRestoreRouter(): Router {
  const router = createRouter();
  const restoreUpload = createDynamicUploadMiddleware(createRestoreUploadMiddleware);

  router.post('/restore', requireSuperAdminMiddleware, restoreUpload, (request, response) => {
    void postRestoreHandler(request, response);
  });

  return router;
}
