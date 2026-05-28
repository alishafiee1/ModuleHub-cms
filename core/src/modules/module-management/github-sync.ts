import fs from 'fs-extra';
import path from 'path';
import { getModuleDirectory } from '../../config/paths';
import { installModuleDependencies } from '../package-cache';
import { runShellCommand } from '../package-cache/network-install';
import { loadSystemSettings } from '../system-settings';
import type { DependencyInstallResult } from '../package-cache/types';
import { resolveLatestGitTagVersion } from './git-version-resolver';

/** Result of git pull + dependency reinstall */
export interface GitHubSyncResult {
  gitOutput: string;
  dependencies: DependencyInstallResult;
  versionFromTag: string | null;
}

/**
 * Runs git pull in the module directory.
 * @param moduleDirectory - Absolute module root path
 * @param timeoutSec - Command timeout in seconds
 * @returns Combined stdout/stderr from git
 */
export async function runGitPullInDirectory(
  moduleDirectory: string,
  timeoutSec: number,
): Promise<string> {
  const gitDir = path.join(moduleDirectory, '.git');
  if (!(await fs.pathExists(gitDir))) {
    throw new Error('Module directory is not a git repository (.git missing)');
  }

  const result = await runShellCommand(
    'git pull --ff-only',
    moduleDirectory,
    timeoutSec,
  );
  const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();

  if (result.exitCode !== 0) {
    throw new Error(`git pull failed (exit ${result.exitCode}): ${output || 'unknown error'}`);
  }

  return output || 'git pull completed';
}

/**
 * Pulls latest code and reinstalls dependencies via package cache.
 * @param moduleId - Module identifier
 * @param gitRepo - Optional configured repo URL (for error messages)
 * @returns Git output and dependency install summary
 */
export async function syncModuleFromGitHub(
  moduleId: string,
  gitRepo?: string,
): Promise<GitHubSyncResult> {
  if (!gitRepo || !gitRepo.trim()) {
    throw new Error('gitRepo is not configured for this module');
  }

  const moduleDirectory = getModuleDirectory(moduleId);
  if (!(await fs.pathExists(moduleDirectory))) {
    throw new Error(`Module files missing at ${moduleDirectory}`);
  }

  const settings = await loadSystemSettings();
  const gitOutput = await runGitPullInDirectory(
    moduleDirectory,
    settings.dependencyInstallTimeoutSec,
  );
  const dependencies = await installModuleDependencies(moduleDirectory, settings);
  const versionFromTag = await resolveLatestGitTagVersion(
    moduleDirectory,
    settings.dependencyInstallTimeoutSec,
  );

  return { gitOutput, dependencies, versionFromTag };
}
