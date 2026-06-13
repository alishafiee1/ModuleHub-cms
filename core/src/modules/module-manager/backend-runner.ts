import { execFile } from 'child_process';
import { promisify } from 'util';
import type { ModuleEntry } from '../home-layout/types';
import { buildSystemdResourceProperties } from '../resource-limiter';
import { detectBackendStartCommand, type BackendStartCommand } from './detect-start-command';
import { appendModuleLog } from './module-file-logger';
import type { ModuleRuntimeHandle } from './types';

const execFileAsync = promisify(execFile);

/**
 * Builds systemd scope unit name for a module.
 * @param moduleId - Module identifier
 * @returns Scope unit base name
 */
export function buildScopeUnitName(moduleId: string): string {
  const safeId = moduleId.replace(/[^a-zA-Z0-9_-]/g, '-');
  return `modulehub-${safeId}`;
}

/**
 * Returns whether Linux systemd-run should be used for backend modules.
 * @returns True on Linux when not explicitly disabled
 */
export function shouldUseSystemdRun(): boolean {
  return process.platform === 'linux' && process.env.MODULEHUB_USE_SYSTEMD !== '0';
}

/**
 * Builds systemd-run argument list for a backend module start.
 * @param scopeUnit - Scope unit base name
 * @param moduleDirectory - Absolute module path
 * @param entry - Module metadata including assigned port
 * @param startCommand - Resolved start command
 * @returns Arguments passed to systemd-run
 */
export function buildSystemdRunArguments(
  scopeUnit: string,
  moduleDirectory: string,
  entry: ModuleEntry,
  startCommand: BackendStartCommand,
): string[] {
  const limits = buildSystemdResourceProperties(entry.resources);
  return [
    '--user',
    '--scope',
    `--unit=${scopeUnit}`,
    `--working-directory=${moduleDirectory}`,
    '-p', `CPUQuota=${limits.cpuQuotaPercent}%`,
    '-p', `MemoryMax=${limits.memoryMaxMb}M`,
    '-p', `MemorySwapMax=${limits.memorySwapMaxMb}M`,
    '-p', `IOWeight=${limits.ioWeight}`,
    '-p', `Environment=PORT=${entry.port}`,
    '--',
    startCommand.executable,
    ...startCommand.args,
  ];
}

/**
 * Starts a backend module with systemd-run (Linux) or detached node (dev).
 * @param moduleId - Module identifier
 * @param moduleDirectory - Absolute module path
 * @param entry - Module metadata
 * @returns Runtime handle after start
 */
export async function startBackendModule(
  moduleId: string,
  moduleDirectory: string,
  entry: ModuleEntry,
): Promise<ModuleRuntimeHandle> {
  const startCommand = await detectBackendStartCommand(moduleDirectory);
  const scopeUnit = buildScopeUnitName(moduleId);

  if (shouldUseSystemdRun()) {
    const systemdArgs = buildSystemdRunArguments(
      scopeUnit,
      moduleDirectory,
      entry,
      startCommand,
    );

    await execFileAsync('systemd-run', systemdArgs, { timeout: 30_000 });
    await appendModuleLog(moduleId, 'info', `Started via systemd-run (${startCommand.shellCommand})`);

    return {
      moduleId,
      kind: 'backend',
      startedAt: new Date().toISOString(),
      scopeUnit: `${scopeUnit}.scope`,
    };
  }

  const { spawn } = await import('child_process');
  const child = spawn(startCommand.executable, startCommand.args, {
    cwd: moduleDirectory,
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, PORT: String(entry.port) },
  });
  child.unref();

  await appendModuleLog(moduleId, 'info', `Started dev process pid=${child.pid} (${startCommand.shellCommand})`);

  return {
    moduleId,
    kind: 'backend',
    startedAt: new Date().toISOString(),
    processId: child.pid ?? undefined,
  };
}

/**
 * Stops a backend module scope or dev process.
 * @param handle - Runtime handle from registry
 * @returns Promise resolved when stop command completes
 */
export async function stopBackendModule(handle: ModuleRuntimeHandle): Promise<void> {
  if (handle.scopeUnit && shouldUseSystemdRun()) {
    await execFileAsync('systemctl', ['--user', 'stop', handle.scopeUnit], { timeout: 15_000 });
    await appendModuleLog(handle.moduleId, 'info', `Stopped systemd scope ${handle.scopeUnit}`);
    return;
  }

  if (handle.processId) {
    try {
      process.kill(handle.processId, 'SIGTERM');
      await appendModuleLog(handle.moduleId, 'info', `Stopped dev process pid=${handle.processId}`);
    } catch {
      await appendModuleLog(handle.moduleId, 'debug', `Process ${handle.processId} already exited`);
    }
  }
}

/**
 * Checks whether a systemd scope is still active.
 * @param scopeUnit - Full scope unit name
 * @returns True when active
 */
export async function isSystemdScopeActive(scopeUnit: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync('systemctl', ['--user', 'is-active', scopeUnit], {
      timeout: 5000,
    });
    return stdout.trim() === 'active';
  } catch {
    return false;
  }
}

/**
 * Verifies backend process health after start.
 * @param handle - Runtime handle
 * @returns True when process appears running
 */
export async function isBackendProcessRunning(handle: ModuleRuntimeHandle): Promise<boolean> {
  if (handle.scopeUnit) {
    return isSystemdScopeActive(handle.scopeUnit);
  }
  if (!handle.processId) {
    return false;
  }
  try {
    process.kill(handle.processId, 0);
    return true;
  } catch {
    return false;
  }
}
