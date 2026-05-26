/**
 * Structured logger — never logs secrets.
 */
export class Logger {
  /**
   * Log informational message.
   */
  info(message: string, meta?: Record<string, unknown>): void {
    console.log(JSON.stringify({ level: 'info', message, ...meta, ts: new Date().toISOString() }));
  }

  /**
   * Log error message.
   */
  error(message: string, error?: unknown, meta?: Record<string, unknown>): void {
    const errMsg = error instanceof Error ? error.message : String(error ?? '');
    console.error(JSON.stringify({ level: 'error', message, error: errMsg, ...meta, ts: new Date().toISOString() }));
  }

  /**
   * Log warning message.
   */
  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(JSON.stringify({ level: 'warn', message, ...meta, ts: new Date().toISOString() }));
  }
}

export const logger = new Logger();
