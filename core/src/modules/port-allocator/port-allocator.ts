import type { SiteLayoutDocument } from '../home-layout/types';

/**
 * Collects all assigned module ports from site-layout.
 * @param layout - Parsed site layout
 * @returns List of ports in use (excludes 0)
 */
export function collectUsedPorts(layout: SiteLayoutDocument): number[] {
  return Object.values(layout.modules)
    .map((entry) => entry.port)
    .filter((port) => typeof port === 'number' && port > 0);
}

/**
 * Returns the next free port in the configured range.
 * @param usedPorts - Ports already assigned in site-layout
 * @param rangeStart - Inclusive range start
 * @param rangeEnd - Inclusive range end
 * @returns First available port number
 */
export function assignNextPort(usedPorts: number[], rangeStart: number, rangeEnd: number): number {
  const usedSet = new Set(usedPorts);
  for (let port = rangeStart; port <= rangeEnd; port += 1) {
    if (!usedSet.has(port)) {
      return port;
    }
  }
  throw new Error(`No free port in range ${rangeStart}-${rangeEnd}`);
}

/**
 * Validates a manual port assignment against range and collisions.
 * @param port - Requested port (0 = static/no process)
 * @param usedPorts - Already assigned ports
 * @param rangeStart - Inclusive range start
 * @param rangeEnd - Inclusive range end
 * @returns Error message or null when valid
 */
export function validateManualPort(
  port: number,
  usedPorts: number[],
  rangeStart: number,
  rangeEnd: number,
): string | null {
  if (port === 0) {
    return null;
  }
  if (!Number.isInteger(port) || port < rangeStart || port > rangeEnd) {
    return `Port must be between ${rangeStart} and ${rangeEnd}, or 0 for static modules`;
  }
  if (usedPorts.includes(port)) {
    return `Port ${port} is already in use`;
  }
  return null;
}

/**
 * Resolves module port from wizard input (empty = auto-assign for backend/docker).
 * @param requestedPort - User port or null/0 for static
 * @param needsPort - Whether module runs a separate process
 * @param layout - Current layout for used ports
 * @param rangeStart - Port range start
 * @param rangeEnd - Port range end
 * @returns Assigned port (0 when static)
 */
export function resolveModulePort(
  requestedPort: number | null | undefined,
  needsPort: boolean,
  layout: SiteLayoutDocument,
  rangeStart: number,
  rangeEnd: number,
): number {
  const usedPorts = collectUsedPorts(layout);
  if (!needsPort) {
    return 0;
  }
  const port = requestedPort ?? 0;
  if (port === 0) {
    return assignNextPort(usedPorts, rangeStart, rangeEnd);
  }
  const validationError = validateManualPort(port, usedPorts, rangeStart, rangeEnd);
  if (validationError) {
    throw new Error(validationError);
  }
  return port;
}
