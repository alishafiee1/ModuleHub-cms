import fs from 'fs-extra';
import { getModuleLogFilePath } from '../../config/paths';

/**
 * Returns the last N lines from multiline log text.
 * @param logText - Full log file content
 * @param maxLines - Maximum lines to return from the end
 * @returns Trimmed tail text joined by newlines
 */
export function readLogTailFromText(logText: string, maxLines: number): string {
  const safeMax = Math.max(1, Math.floor(maxLines));
  const lines = logText.split(/\r?\n/);
  const nonEmptyTrimmed = lines.length === 1 && lines[0] === '' ? [] : lines;
  const tail = nonEmptyTrimmed.slice(-safeMax);
  return tail.join('\n');
}

/**
 * Reads the last N lines of a module log file.
 * @param moduleId - Module identifier
 * @param maxLines - Maximum lines (from system-settings logViewerMaxLines)
 * @returns Log tail text or empty string when file is missing
 */
export async function readModuleLogTail(moduleId: string, maxLines: number): Promise<string> {
  const logPath = getModuleLogFilePath(moduleId);
  const exists = await fs.pathExists(logPath);
  if (!exists) {
    return '';
  }
  const content = await fs.readFile(logPath, 'utf8');
  return readLogTailFromText(content, maxLines);
}

/**
 * Reads full module log file content.
 * @param moduleId - Module identifier
 * @returns Full log text or empty string when missing
 */
export async function readModuleLogFull(moduleId: string): Promise<string> {
  const logPath = getModuleLogFilePath(moduleId);
  const exists = await fs.pathExists(logPath);
  if (!exists) {
    return '';
  }
  return fs.readFile(logPath, 'utf8');
}
