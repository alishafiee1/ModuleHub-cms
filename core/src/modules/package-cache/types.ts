/** Supported dependency manifest filenames in a module directory */
export type ManifestFileName = 'package.json' | 'requirements.txt' | 'composer.json';

/** Dependency ecosystem detected from manifest files */
export type DependencyKind = 'npm' | 'pip' | 'composer';

/** One scanned manifest with absolute path and raw content */
export interface ScannedManifest {
  fileName: ManifestFileName;
  kind: DependencyKind;
  absolutePath: string;
  content: string;
}

/** Metadata stored beside cached dependency artifacts */
export interface CacheEntryMeta {
  hash: string;
  lastAccessedAt: string;
  sizeBytes: number;
  manifestFiles: ManifestFileName[];
}

/** Result of resolving module dependencies via cache */
export interface DependencyInstallResult {
  hash: string | null;
  linkedTargets: string[];
  installed: boolean;
  skipped: boolean;
  message: string;
}

/** Injectable command runner for tests and production */
export interface CommandRunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

/** Runs a shell command in a working directory with timeout */
export interface CommandRunner {
  run(command: string, cwd: string, timeoutSec: number): Promise<CommandRunResult>;
}
