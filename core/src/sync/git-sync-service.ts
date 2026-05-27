import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { ModuleRegistry } from '../modules/registry';
import { ModuleManifest } from '../modules/types';
import { GIT_PROTECTED_DIRS } from './git-protected-dirs';
import { logger } from '../server/logger';

const execFileAsync = promisify(execFile);

export type ExecFileFn = typeof execFileAsync;

export interface GitPullResult {
  success: boolean;
  output?: string;
  errors: string[];
  gitMissing?: boolean;
}

/**
 * Pull module content from GitHub while preserving protected user dirs.
 */
export class GitSyncService {
  constructor(
    private readonly registry: ModuleRegistry,
    private readonly execFileFn: ExecFileFn = execFileAsync,
  ) {}

  /**
   * Clone or pull remote repo into module install directory.
   */
  async pull(moduleId: string): Promise<GitPullResult> {
    const mod = this.registry.getById(moduleId);
    if (!mod || (mod.type !== 'standalone' && mod.type !== 'instance')) {
      return { success: false, errors: ['Module not found or not updatable via git'] };
    }

    const manifest = this.readManifest(mod.installPath);
    if (!manifest?.github?.repo) {
      return { success: false, errors: ['manifest.github.repo is not configured'] };
    }

    try {
      await this.execFileFn('git', ['--version']);
    } catch {
      return {
        success: false,
        errors: ['git is not installed on host — install with: sudo apt install git'],
        gitMissing: true,
      };
    }

    const branch = manifest.github.branch?.trim() || 'main';
    const backupRoot = await this.backupProtectedDirs(mod.installPath);

    try {
      const gitDir = path.join(mod.installPath, '.git');
      let output: string;

      if (fs.existsSync(gitDir)) {
        await this.execFileFn('git', ['fetch', 'origin', branch], { cwd: mod.installPath });
        const reset = await this.execFileFn('git', ['reset', '--hard', `origin/${branch}`], {
          cwd: mod.installPath,
        });
        output = reset.stdout || reset.stderr;
      } else {
        const tempClone = path.join(mod.installPath, '.git-pull-temp');
        if (fs.existsSync(tempClone)) {
          fs.rmSync(tempClone, { recursive: true, force: true });
        }
        fs.mkdirSync(tempClone, { recursive: true });
        const clone = await this.execFileFn(
          'git',
          ['clone', '--depth', '1', '--branch', branch, manifest.github.repo, tempClone],
          { cwd: mod.installPath },
        );
        this.copyTree(tempClone, mod.installPath, mod.installPath);
        const tempGit = path.join(tempClone, '.git');
        if (fs.existsSync(tempGit)) {
          fs.cpSync(tempGit, path.join(mod.installPath, '.git'), { recursive: true });
        }
        fs.rmSync(tempClone, { recursive: true, force: true });
        output = clone.stdout || clone.stderr;
      }

      await this.restoreProtectedDirs(backupRoot, mod.installPath);
      if (fs.existsSync(backupRoot)) {
        fs.rmSync(backupRoot, { recursive: true, force: true });
      }

      logger.info('Git pull completed', { moduleId, branch });
      return { success: true, output, errors: [] };
    } catch (error) {
      if (fs.existsSync(backupRoot)) {
        await this.restoreProtectedDirs(backupRoot, mod.installPath);
        fs.rmSync(backupRoot, { recursive: true, force: true });
      }
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Git pull failed', error, { moduleId });
      return { success: false, errors: [message] };
    }
  }

  private readManifest(installPath: string): ModuleManifest | null {
    const manifestPath = path.join(installPath, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as ModuleManifest;
  }

  private async backupProtectedDirs(installPath: string): Promise<string> {
    const backupRoot = path.join(installPath, '.git-protected-backup');
    if (fs.existsSync(backupRoot)) {
      fs.rmSync(backupRoot, { recursive: true, force: true });
    }
    fs.mkdirSync(backupRoot, { recursive: true });

    for (const dirName of GIT_PROTECTED_DIRS) {
      const sourceDir = path.join(installPath, dirName);
      if (fs.existsSync(sourceDir)) {
        fs.cpSync(sourceDir, path.join(backupRoot, dirName), { recursive: true });
      }
    }
    return backupRoot;
  }

  private async restoreProtectedDirs(backupRoot: string, installPath: string): Promise<void> {
    if (!fs.existsSync(backupRoot)) {
      return;
    }
    for (const dirName of GIT_PROTECTED_DIRS) {
      const backedUp = path.join(backupRoot, dirName);
      if (!fs.existsSync(backedUp)) {
        continue;
      }
      const targetDir = path.join(installPath, dirName);
      fs.mkdirSync(targetDir, { recursive: true });
      fs.cpSync(backedUp, targetDir, { recursive: true, force: true });
    }
  }

  private copyTree(sourceDir: string, targetDir: string, installRoot: string): void {
    for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
      if (entry.name === '.git') {
        continue;
      }
      const sourcePath = path.join(sourceDir, entry.name);
      const destPath = path.join(targetDir, entry.name);
      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        this.copyTree(sourcePath, destPath, installRoot);
        continue;
      }
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}
