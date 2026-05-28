import type { Request, Response, NextFunction } from 'express';
import { getCmsLogger } from './create-logger';
import type { HttpRequestLogFields } from './types';

/**
 * Logs every HTTP request with method, path, and response status when the response finishes.
 * @param request - Express request
 * @param response - Express response
 * @param next - Express next callback
 */
export function requestLoggingMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  response.on('finish', () => {
    const fields: HttpRequestLogFields = {
      method: request.method,
      path: request.originalUrl || request.url,
      status: response.statusCode,
    };
    getCmsLogger().info('http_request', fields);
  });
  next();
}
