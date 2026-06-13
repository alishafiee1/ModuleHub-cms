import { execFile } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { promisify } from 'util';
import { getAppRoot } from '../../config/paths';
import type { ModuleEntry } from '../home-layout/types';
import { buildDockerResourceFlags } from '../resource-limiter';
import { appendModuleLog } from './module-file-logger';
import type { ModuleRuntimeHandle } from './types';

const execFileAsync = promisify(execFile);

/**
 * Builds Docker container name for a module.
 * @param moduleId - Module identifier
 * @returns Container name
 */
export function buildDockerContainerName(moduleId: string): string {
  const safeId = moduleId.replace(/[^a-zA-Z0-9_-]/g, '-');
  return `module-${safeId}`;
}

/**
 * Returns whether Docker CLI is available on this host.
 * @returns True when docker command succeeds
 */
export async function isDockerAvailable(): Promise<boolean> {
  try {
    await execFileAsync('docker', ['info'], { timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Starts a Docker module using docker build + run with resource limits.
 * @param moduleId - Module identifier
 * @param moduleDirectory - Module files directory
 * @param entry - Module metadata
 * @returns Runtime handle
 */
export async function startDockerModule(
  moduleId: string,
  moduleDirectory: string,
  entry: ModuleEntry,
): Promise<ModuleRuntimeHandle> {
  if (!(await isDockerAvailable())) {
    throw new Error('Docker is not available on this host');
  }

  const dockerfilePath = path.join(moduleDirectory, 'Dockerfile');
  if (!(await fs.pathExists(dockerfilePath))) {
    throw new Error('Docker module requires Dockerfile in module directory');
  }

  const containerName = buildDockerContainerName(moduleId);
  const limits = buildDockerResourceFlags(entry.resources);
  const imageTag = `modulehub-${moduleId.replace(/[^a-zA-Z0-9_-]/g, '-')}:latest`;

  await stopDockerContainerIfExists(containerName);
  await execFileAsync('docker', ['build', '-t', imageTag, moduleDirectory], { timeout: 600_000 });

  const dockerArgs = [
    'run',
    '-d',
    '--name',
    containerName,
    '--cpus',
    String(limits.cpus),
    '--memory',
    `${limits.memoryMb}m`,
    '--memory-swap',
    `${limits.memorySwapMb}m`,
    '--blkio-weight',
    String(limits.blkioWeight),
    '--cap-drop',
    'ALL',
    '-p',
    `${entry.port}:${entry.port}`,
    '-v',
    `${moduleDirectory}:/app:ro`,
    '-w',
    '/app',
    imageTag,
  ];

  await execFileAsync('docker', dockerArgs, { timeout: 120_000 });

  if (limits.netMbps) {
    await applyDockerNetworkLimit(moduleId, containerName, limits.netMbps);
  }

  await appendModuleLog(moduleId, 'info', `Docker container ${containerName} started on port ${entry.port}`);

  return {
    moduleId,
    kind: 'docker',
    startedAt: new Date().toISOString(),
    containerName,
  };
}

/**
 * Stops and removes a Docker module container.
 * @param containerName - Docker container name
 * @param moduleId - Module id for logging
 * @returns Promise resolved after stop
 */
export async function stopDockerModule(containerName: string, moduleId: string): Promise<void> {
  await stopDockerContainerIfExists(containerName);
  await appendModuleLog(moduleId, 'info', `Docker container ${containerName} stopped`);
}

async function stopDockerContainerIfExists(containerName: string): Promise<void> {
  try {
    await execFileAsync('docker', ['rm', '-f', containerName], { timeout: 30_000 });
  } catch {
    // Container may not exist
  }
}

async function applyDockerNetworkLimit(
  moduleId: string,
  containerName: string,
  netMbps: number,
): Promise<void> {
  const scriptsDir = path.join(getAppRoot(), 'scripts');
  const scriptPath = path.join(scriptsDir, 'setup-net-limit.sh');
  if (!(await fs.pathExists(scriptPath))) {
    return;
  }
  try {
    await execFileAsync('bash', [scriptPath, containerName, String(netMbps)], { timeout: 30_000 });
  } catch {
    await appendModuleLog(moduleId, 'debug', `Network limit script skipped for ${containerName}`);
  }
}

/**
 * Checks whether a Docker container is running.
 * @param containerName - Container name
 * @returns True when running
 */
export async function isDockerContainerRunning(containerName: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync(
      'docker',
      ['inspect', '-f', '{{.State.Running}}', containerName],
      { timeout: 5000 },
    );
    return stdout.trim() === 'true';
  } catch {
    return false;
  }
}
