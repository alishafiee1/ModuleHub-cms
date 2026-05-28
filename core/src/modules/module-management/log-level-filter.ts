/** Supported log level labels for module log files */
export type ModuleLogLevel = 'debug' | 'info' | 'error';

const MODULE_LOG_LEVEL_PATTERN = /\[(debug|info|error)\]/i;

/**
 * Parses a module log line level from the `[level]` prefix format.
 * @param line - Single log line
 * @returns Parsed level or null when no level marker is found
 */
export function parseModuleLogLineLevel(line: string): ModuleLogLevel | null {
  const match = MODULE_LOG_LEVEL_PATTERN.exec(line);
  if (!match) {
    return null;
  }
  return match[1].toLowerCase() as ModuleLogLevel;
}

/**
 * Filters log lines by level when level markers are present.
 * Lines without a level marker are kept (backward compatible).
 * @param logText - Full log file content
 * @param levelFilter - Optional level to keep; null returns all lines
 * @returns Filtered log text joined by newlines
 */
export function filterLogLinesByLevel(
  logText: string,
  levelFilter: ModuleLogLevel | null,
): string {
  if (!levelFilter) {
    return logText;
  }

  const lines = logText.split(/\r?\n/);
  const filtered = lines.filter((line) => {
    if (line.trim() === '') {
      return false;
    }
    const parsedLevel = parseModuleLogLineLevel(line);
    if (!parsedLevel) {
      return true;
    }
    return parsedLevel === levelFilter;
  });

  return filtered.join('\n');
}
