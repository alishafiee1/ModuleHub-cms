import crypto from 'crypto';
import fs from 'fs-extra';
import multer from 'multer';
import path from 'path';
import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import { PATHS } from '../../config/paths';
import { requireSuperAdminOnlyMiddleware } from '../admin-auth';

/**
 * purpose --- card background image upload handler and router ---
 * Accepts jpeg/png/webp up to 2 MB, saves with a random uuid filename.
 * Served publicly at /card-backgrounds/<file>.
 */

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME: ReadonlySet<string> = new Set(['image/jpeg', 'image/png', 'image/webp']);
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

function createCardBgUploadMiddleware() {
  return multer({
    storage: multer.diskStorage({
      destination: async (_req, _file, callback) => {
        await fs.ensureDir(PATHS.cardBackgroundsDirectory);
        callback(null, PATHS.cardBackgroundsDirectory);
      },
      filename: (_req, file, callback) => {
        const ext = EXT_BY_MIME[file.mimetype] ?? path.extname(file.originalname);
        const uuid = crypto.randomUUID();
        callback(null, `${uuid}${ext}`);
      },
    }),
    limits: { fileSize: MAX_SIZE_BYTES },
    fileFilter: (_req, file, callback) => {
      if (ALLOWED_MIME.has(file.mimetype)) {
        callback(null, true);
      } else {
        callback(new Error('Only jpeg, png, or webp images are allowed'));
      }
    },
  }).single('image');
}

/**
 * purpose --- handles POST /admin/card-background/upload ---
 * Returns the server-relative URL of the saved image.
 * @param request - Express request (multer attaches file)
 * @param response - Express response
 */
export async function postCardBackgroundUploadHandler(request: Request, response: Response): Promise<void> {
  if (!request.file) {
    response.status(400).json({ error: 'Image file is required (field: image)' });
    return;
  }
  const imageUrl = `/card-backgrounds/${request.file.filename}`;
  response.status(200).json({ imageUrl });
}

/**
 * purpose --- registers POST /admin/card-background/upload route ---
 * @returns Express router mounted under /admin/card-background
 */
export function createCardBackgroundRouter(): Router {
  const router = createRouter();
  const upload = createCardBgUploadMiddleware();
  router.post(
    '/upload',
    requireSuperAdminOnlyMiddleware,
    (request, response, next) => {
      upload(request, response, (err) => {
        if (err instanceof multer.MulterError || err instanceof Error) {
          response.status(400).json({ error: err.message });
          return;
        }
        next();
      });
    },
    (request, response) => {
      void postCardBackgroundUploadHandler(request, response);
    },
  );
  return router;
}
