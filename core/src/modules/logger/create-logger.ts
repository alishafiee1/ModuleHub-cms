import path from 'path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { PATHS } from '../../config/paths';

const LOG_RETENTION_DAYS = '14d';

let cmsLoggerInstance: winston.Logger | null = null;

/**
 * Creates or returns the singleton CMS Winston logger with daily rotation.
 * @returns Configured Winston logger writing to storage/logs/
 */
export function getCmsLogger(): winston.Logger {
  if (cmsLoggerInstance) {
    return cmsLoggerInstance;
  }

  const transport = new DailyRotateFile({
    dirname: PATHS.cmsLogDirectory,
    filename: PATHS.cmsLogFileName,
    datePattern: 'YYYY-MM-DD',
    maxFiles: LOG_RETENTION_DAYS,
    zippedArchive: false,
  });

  cmsLoggerInstance = winston.createLogger({
    level: process.env.LOG_LEVEL ?? 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
    transports: [transport],
  });

  return cmsLoggerInstance;
}

/**
 * Resets the logger singleton — for tests only.
 */
export function resetCmsLoggerForTests(): void {
  cmsLoggerInstance = null;
}

/**
 * Resolves the active log file path pattern base (directory only).
 * @returns Absolute path to the logs directory
 */
export function getCmsLogDirectory(): string {
  return path.resolve(PATHS.cmsLogDirectory);
}
