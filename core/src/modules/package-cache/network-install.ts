import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import type { SystemSettings } from '../system-settings/types';
import type { CommandRunner, CommandRunResult } from './types';

/**
 * Default production command runner using bash shell.
 * @param command - Shell command string
 * @param cwd - Working directory
 * @param timeoutSec - Timeout in seconds
 * @returns Exit code and captured streams
 */
export async function runShellCommand(
  command: string,
  cwd: string,
  timeoutSec: number,
): Promise<CommandRunResult> {
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      env: process.env,
    });

    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
    }, timeoutSec * 1000);

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

/**
 * Runs a dependency install command in the given working directory.
 * @param installCommand - Shell install command
 * @param cwd - Working directory for install
 * @param settings - System settings (timeout)
 * @param runner - Optional injectable runner for tests
 * @returns Command result
 */
export async function runInstallCommand(
  installCommand: string,
  cwd: string,
  settings: SystemSettings,
  runner: CommandRunner = { run: runShellCommand },
): Promise<CommandRunResult> {
  return runner.run(installCommand, cwd, settings.dependencyInstallTimeoutSec);
}

/** @deprecated Use runInstallCommand — kept for import compatibility during transition */
export const runInstallWithNetworkToggle = runInstallCommand;

/**
 * Resolves absolute path to npm for dependency installs under systemd.
 * @returns npm executable path
 */
export function resolveNpmExecutablePath(): string {
  if (process.env.MODULEHUB_NPM_PATH) {
    return process.env.MODULEHUB_NPM_PATH;
  }
  if (process.platform === 'linux') {
    const homeDirectory = process.env.HOME ?? '/home/deploy';
    const versionsDirectory = path.join(homeDirectory, '.nvm', 'versions', 'node');
    try {
      const versionDirectories = fs.readdirSync(versionsDirectory)
        .filter((name) => name.startsWith('v'))
        .sort();
      const preferredMajor = process.env.MODULEHUB_NODE_VERSION ?? '20';
      const matchedVersion = versionDirectories.find((name) => name.startsWith(`v${preferredMajor}.`));
      const selectedVersion = matchedVersion ?? versionDirectories.at(-1);
      if (selectedVersion) {
        return path.join(versionsDirectory, selectedVersion, 'bin', 'npm');
      }
    } catch {
      return 'npm';
    }
  }
  return 'npm';
}

/**
 * Resolves absolute path to composer when available.
 * @returns composer executable path or plain command name
 */
export function resolveComposerExecutablePath(): string {
  return process.env.MODULEHUB_COMPOSER_PATH ?? 'composer';
}

/**
 * Resolves Python executable for dependency installs.
 * @returns python executable path or command name
 */
export function resolvePythonExecutablePath(): string {
  return process.env.MODULEHUB_PYTHON_PATH ?? (process.platform === 'win32' ? 'python' : 'python3');
}

/**
 * Builds install shell command for npm dependencies.
 * @returns npm install command
 */
export function buildNpmInstallCommand(): string {
  const npmExecutable = resolveNpmExecutablePath();
  return `"${npmExecutable}" install --omit=dev --no-audit --no-fund`;
}

/**
 * Builds install shell command for Python requirements.
 * @returns venv + pip install command
 */
export function buildPipInstallCommand(): string {
  const pythonExecutable = resolvePythonExecutablePath();
  if (process.platform === 'win32') {
    return `"${pythonExecutable}" -m venv venv && ".\\venv\\Scripts\\pip.exe" install --no-cache-dir -r requirements.txt`;
  }
  return `"${pythonExecutable}" -m venv venv && ./venv/bin/pip install --no-cache-dir -r requirements.txt`;
}

/**
 * Builds install shell command for Composer dependencies.
 * @returns composer install command
 */
export function buildComposerInstallCommand(): string {
  const composerExecutable = resolveComposerExecutablePath();
  return `"${composerExecutable}" install --no-dev --prefer-dist --no-interaction`;
}
