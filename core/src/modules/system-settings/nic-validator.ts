import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/**
 * Parses interface names from `ip -o link show up` output lines.
 * @param commandOutput - Raw stdout from ip command
 * @returns Sorted unique interface names
 */
export function parseNetworkInterfaceList(commandOutput: string): string[] {
  const interfaces = new Set<string>();

  for (const line of commandOutput.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    const match = trimmed.match(/^\d+:\s+([^:@\s]+):/);
    if (match?.[1]) {
      interfaces.add(match[1]);
    }
  }

  return [...interfaces].sort();
}

/**
 * Lists active network interfaces using `ip -o link show up` on Linux.
 * Returns mock list from MODULEHUB_MOCK_NICS (comma-separated) when set.
 * @returns Interface names reported as UP
 */
export async function listUpNetworkInterfaces(): Promise<string[]> {
  const mockList = process.env.MODULEHUB_MOCK_NICS;
  if (mockList) {
    return mockList.split(',').map((name) => name.trim()).filter(Boolean).sort();
  }

  if (process.platform === 'win32') {
    return [];
  }

  try {
    const { stdout } = await execFileAsync('ip', ['-o', 'link', 'show', 'up']);
    return parseNetworkInterfaceList(stdout);
  } catch {
    return [];
  }
}

/**
 * Validates packageInstallInterface against known UP interfaces when ≥2 NICs exist.
 * @param interfaceName - Selected interface from settings
 * @param availableInterfaces - Interfaces from listUpNetworkInterfaces
 * @returns Error message or null when valid
 */
export function validatePackageInstallInterface(
  interfaceName: string,
  availableInterfaces: string[],
): string | null {
  const trimmed = interfaceName.trim();
  if (!trimmed) {
    return 'packageInstallInterface is required';
  }

  if (availableInterfaces.length < 2) {
    return null;
  }

  if (!availableInterfaces.includes(trimmed)) {
    return `Network interface "${trimmed}" is not available. Choose one of: ${availableInterfaces.join(', ')}`;
  }

  return null;
}
