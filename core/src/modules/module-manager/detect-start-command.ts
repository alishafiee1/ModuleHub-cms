import fs from 'fs-extra';
import path from 'path';

/** Resolved shell command to start a backend module */
export interface BackendStartCommand {
  executable: string;
  args: string[];
  shellCommand: string;
}

/**
 * Detects how to start a Node/backend module from its directory contents.
 * @param moduleDirectory - Path to standalone-modules/<id>
 * @returns Start command parts
 */
export async function detectBackendStartCommand(moduleDirectory: string): Promise<BackendStartCommand> {
  const packageJsonPath = path.join(moduleDirectory, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = (await fs.readJson(packageJsonPath)) as {
      main?: string;
      scripts?: { start?: string };
    };
    if (packageJson.scripts?.start) {
      return {
        executable: 'npm',
        args: ['run', 'start'],
        shellCommand: 'npm run start',
      };
    }
    if (packageJson.main) {
      return {
        executable: 'node',
        args: [packageJson.main],
        shellCommand: `node ${packageJson.main}`,
      };
    }
  }

  const indexJsPath = path.join(moduleDirectory, 'index.js');
  if (await fs.pathExists(indexJsPath)) {
    return {
      executable: 'node',
      args: ['index.js'],
      shellCommand: 'node index.js',
    };
  }

  throw new Error('No start command found (package.json scripts.start, main, or index.js)');
}
