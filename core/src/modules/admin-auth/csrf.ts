import crypto from 'crypto';
import type { Request } from 'express';

export const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generates a new random CSRF token string.
 * @returns Hex-encoded CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Ensures the session has a CSRF token, creating one when missing.
 * @param request - Express request with session
 * @returns Active CSRF token for the session
 */
export function ensureSessionCsrfToken(request: Request): string {
  if (!request.session.csrfToken) {
    request.session.csrfToken = generateCsrfToken();
  }
  return request.session.csrfToken;
}

/**
 * Validates the CSRF token from header or body against the session token.
 * @param request - Express request
 * @returns True when the submitted token matches the session
 */
export function isValidCsrfRequest(request: Request): boolean {
  const sessionToken = request.session.csrfToken;
  if (!sessionToken) {
    return false;
  }

  const headerToken = request.get(CSRF_HEADER_NAME);
  const bodyToken = typeof request.body?.csrfToken === 'string' ? request.body.csrfToken : null;
  const submitted = headerToken || bodyToken;
  if (!submitted) {
    return false;
  }

  const submittedBuffer = Buffer.from(submitted);
  const sessionBuffer = Buffer.from(sessionToken);
  if (submittedBuffer.length !== sessionBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(submittedBuffer, sessionBuffer);
}
