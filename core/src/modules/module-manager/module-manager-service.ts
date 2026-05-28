import fs from 'fs-extra';
import { getModuleDirectory } from '../../config/paths';
import { readSiteLayout, writeSiteLayout } from '../home-layout/layout-store';
import type { ModuleEntry, SiteLayoutDocument } from '../home-layout/types';
import { loadSystemSettings } from '../system-settings';
import { canAutoRestartModule, recordAutoRestartAttempt } from './auto-restart-tracker';
import {
  isBackendProcessRunning,
  startBackendModule,
  stopBackendModule,
} from './backend-runner';
import { classifyModuleHosting } from './module-classifier';
import { validateConcurrentStartLimit } from './concurrent-limit';
import {
  buildDockerContainerName,
  isDockerContainerRunning,
  startDockerModule,
  stopDockerModule,
} from './docker-runner';
import { appendModuleLog } from './module-file-logger';
import {
  clearRuntimeHandle,
  getRuntimeHandle,
  registerRuntimeHandle,
} from './process-registry';
import { markModuleCrashed, setModuleStatusInLayout } from './status-tracker';
import type { ModuleOperationResult, ModuleRuntimeHandle } from './types';

/**
 * Starts a module according to its hosting kind.
 * @param moduleId - Module identifier
 * @returns Operation result with updated status
 */
export async function startModuleById(moduleId: string): Promise<ModuleOperationResult> {
  const layout = await readSiteLayout();
  const entry = layout.modules[moduleId];
  if (!entry) {
    throw new Error(`Module "${moduleId}" not found`);
  }

  if (entry.status === 'running') {
    return { moduleId, status: 'running', message: 'Module is already running' };
  }

  const settings = await loadSystemSettings();
  const limitError = validateConcurrentStartLimit(
    layout,
    settings.maxConcurrentRunningModules,
    moduleId,
  );
  if (limitError) {
    throw new Error(limitError);
  }

  const moduleDirectory = getModuleDirectory(moduleId);
  if (!(await fs.pathExists(moduleDirectory))) {
    throw new Error(`Module files missing at ${moduleDirectory}`);
  }

  const kind = classifyModuleHosting(entry);
  let handle: ModuleRuntimeHandle;

  if (kind === 'static') {
    handle = {
      moduleId,
      kind: 'static',
      startedAt: new Date().toISOString(),
    };
    await appendModuleLog(moduleId, 'info', 'Static module enabled (no background process)');
  } else if (kind === 'backend') {
    handle = await startBackendModule(moduleId, moduleDirectory, entry);
    const running = await isBackendProcessRunning(handle);
    if (!running) {
      await appendModuleLog(moduleId, 'error', 'Backend process failed to stay running');
      throw new Error('Backend process failed to start');
    }
  } else {
    handle = await startDockerModule(moduleId, moduleDirectory, entry);
    const running = await isDockerContainerRunning(handle.containerName ?? '');
    if (!running) {
      throw new Error('Docker container failed to start');
    }
  }

  registerRuntimeHandle(handle);
  setModuleStatusInLayout(layout, moduleId, 'running');
  await writeSiteLayout(layout);

  return { moduleId, status: 'running', message: `Module started (${kind})` };
}

/**
 * Stops a running module and updates layout status.
 * @param moduleId - Module identifier
 * @returns Operation result
 */
export async function stopModuleById(moduleId: string): Promise<ModuleOperationResult> {
  const layout = await readSiteLayout();
  const entry = layout.modules[moduleId];
  if (!entry) {
    throw new Error(`Module "${moduleId}" not found`);
  }

  if (entry.status === 'stopped') {
    return { moduleId, status: 'stopped', message: 'Module is already stopped' };
  }

  const handle = getRuntimeHandle(moduleId);
  const kind = classifyModuleHosting(entry);

  if (kind === 'backend' && handle) {
    await stopBackendModule(handle);
  } else if (kind === 'docker') {
    const containerName = handle?.containerName ?? buildDockerContainerName(moduleId);
    await stopDockerModule(containerName, moduleId);
  } else {
    await appendModuleLog(moduleId, 'info', 'Static module disabled');
  }

  clearRuntimeHandle(moduleId);
  setModuleStatusInLayout(layout, moduleId, 'stopped');
  await writeSiteLayout(layout);

  return { moduleId, status: 'stopped', message: 'Module stopped' };
}

/**
 * Syncs layout status when a tracked process has exited unexpectedly.
 * @param moduleId - Module identifier
 * @returns True when status was updated to crashed
 */
export async function syncCrashedStatusIfProcessExited(moduleId: string): Promise<boolean> {
  const handle = getRuntimeHandle(moduleId);
  if (!handle || handle.kind === 'static') {
    return false;
  }

  let stillRunning = false;
  if (handle.kind === 'backend') {
    stillRunning = await isBackendProcessRunning(handle);
  } else if (handle.containerName) {
    stillRunning = await isDockerContainerRunning(handle.containerName);
  }

  if (stillRunning) {
    return false;
  }

  const layout = await readSiteLayout();
  const entry = layout.modules[moduleId];
  if (!entry || entry.status !== 'running') {
    return false;
  }

  clearRuntimeHandle(moduleId);
  markModuleCrashed(layout, moduleId);
  await appendModuleLog(moduleId, 'error', 'Process exited unexpectedly (possible OOM)');
  await writeSiteLayout(layout);

  const settings = await loadSystemSettings();
  if (
    settings.autoRestartOnCrash
    && canAutoRestartModule(moduleId, settings.autoRestartMaxAttemptsPerHour, Date.now())
  ) {
    recordAutoRestartAttempt(moduleId, Date.now());
    await startModuleById(moduleId);
  }

  return true;
}

/**
 * Returns module entry for runtime serving decisions.
 * @param moduleId - Module identifier
 * @returns Module entry or null
 */
export async function getModuleEntryForServing(moduleId: string): Promise<ModuleEntry | null> {
  const layout = await readSiteLayout();
  return layout.modules[moduleId] ?? null;
}

/**
 * Loads full layout for serving middleware (cached read per request).
 * @returns Site layout document
 */
export async function loadLayoutForServing(): Promise<SiteLayoutDocument> {
  return readSiteLayout();
}
