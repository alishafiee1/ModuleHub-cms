import path from 'path';
import fs from 'fs-extra';
import type { DependencyKind, ManifestFileName, ScannedManifest } from './types';

const MANIFEST_DEFINITIONS: ReadonlyArray<{ fileName: ManifestFileName; kind: DependencyKind }> = [
  { fileName: 'package.json', kind: 'npm' },
  { fileName: 'requirements.txt', kind: 'pip' },
  { fileName: 'composer.json', kind: 'composer' },
];

/**
 * Scans a module directory for known dependency manifest files.
 * @param moduleDirectory - Absolute path to extracted module root
 * @returns Found manifests sorted by filename for stable hashing
 */
export async function scanDependencyManifests(moduleDirectory: string): Promise<ScannedManifest[]> {
  const manifests: ScannedManifest[] = [];

  for (const definition of MANIFEST_DEFINITIONS) {
    const absolutePath = path.join(moduleDirectory, definition.fileName);
    if (!(await fs.pathExists(absolutePath))) {
      continue;
    }
    const content = await fs.readFile(absolutePath, 'utf8');
    manifests.push({
      fileName: definition.fileName,
      kind: definition.kind,
      absolutePath,
      content,
    });
  }

  return manifests.sort((left, right) => left.fileName.localeCompare(right.fileName));
}

/**
 * Returns the module-relative directory name linked for a dependency kind.
 * @param kind - Dependency ecosystem
 * @returns Directory name inside module (node_modules, venv, vendor)
 */
export function getLinkTargetName(kind: DependencyKind): string {
  if (kind === 'npm') {
    return 'node_modules';
  }
  if (kind === 'pip') {
    return 'venv';
  }
  return 'vendor';
}
