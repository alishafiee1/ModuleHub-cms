#!/usr/bin/env node
/**
 * ModuleHub CMS CLI — backup and future admin commands.
 * Usage: node scripts/cli.js backup --output /path/to/backup.zip
 */
const path = require('path');

async function loadCliBackupModule() {
  const distPath = path.join(__dirname, '..', 'dist', 'core', 'src', 'modules', 'backup-restore', 'cli-backup.js');
  try {
    return require(distPath);
  } catch {
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    require('tsx/cjs/api').register();
    return require(path.join(__dirname, '..', 'core', 'src', 'modules', 'backup-restore', 'cli-backup.ts'));
  }
}

async function main() {
  const [, , command, ...rest] = process.argv;

  if (command !== 'backup') {
    // eslint-disable-next-line no-console
    console.error('Usage: node scripts/cli.js backup --output <path-to.zip>');
    process.exit(1);
  }

  const cliModule = await loadCliBackupModule();
  const outputPath = cliModule.parseBackupOutputPath(rest);
  if (!outputPath) {
    // eslint-disable-next-line no-console
    console.error('Missing required flag: --output <path-to.zip>');
    process.exit(1);
  }

  const result = await cliModule.runCliFullBackup(outputPath);
  // eslint-disable-next-line no-console
  console.log(`Backup written to ${result.outputPath} (source: ${result.fileName})`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('CLI failed:', error);
  process.exit(1);
});
