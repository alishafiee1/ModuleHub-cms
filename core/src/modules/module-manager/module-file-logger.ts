import fs from 'fs-extra';
import path from 'path';
import { getModuleLogFilePath } from '../../config/paths';

/**
 * Appends a timestamped line to the module log file.
 * @param moduleId - Module identifier
 * @param level - Log level label
 * @param message - Log message
 * @returns Promise resolved after append
 */
export async function appendModuleLog(
  moduleId: string,
  level: 'info' | 'error' | 'debug',
  message: string,
): Promise<void> {
  const logPath = getModuleLogFilePath(moduleId);
  await fs.ensureDir(path.dirname(logPath));
  const line = `${new Date().toISOString()} [${level}] ${message}\n`;
  await fs.appendFile(logPath, line, 'utf8');
}
