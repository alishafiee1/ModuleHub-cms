import fs from 'fs-extra';
import path from 'path';
import { createFullBackup } from './backup-service';

/**
 * Parses CLI args for backup command.
 * @param argv - process.argv slice after node and script
 * @returns Output path or null when invalid
 */
export function parseBackupOutputPath(argv: string[]): string | null {
  const outputFlagIndex = argv.indexOf('--output');
  if (outputFlagIndex === -1 || outputFlagIndex + 1 >= argv.length) {
    return null;
  }
  return argv[outputFlagIndex + 1];
}

/**
 * Runs full backup and copies result to the requested output path.
 * @param outputPath - Destination file path for the ZIP
 * @returns Created backup metadata
 */
export async function runCliFullBackup(outputPath: string): Promise<{ fileName: string; outputPath: string }> {
  const resolvedOutput = path.resolve(outputPath);
  await fs.ensureDir(path.dirname(resolvedOutput));

  const result = await createFullBackup();
  await fs.copy(result.filePath, resolvedOutput, { overwrite: true });

  return { fileName: result.fileName, outputPath: resolvedOutput };
}
