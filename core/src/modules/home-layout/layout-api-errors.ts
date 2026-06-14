import type { Response } from 'express';
import { CanvasFullError } from './grid-slot';

/**
 * purpose --- maps layout mutation errors to HTTP responses ---
 * Maps layout mutation errors (including canvas full) to HTTP responses.
 */
export function sendLayoutMutationError(
  response: Response,
  error: unknown,
  fallbackMessage: string,
): void {
  if (error instanceof CanvasFullError) {
    response.status(409).json({ error: 'CANVAS_FULL', message: error.message });
    return;
  }

  const message = error instanceof Error ? error.message : fallbackMessage;
  const status = message.includes('not found') ? 404 : 400;
  response.status(status).json({ error: message });
}
