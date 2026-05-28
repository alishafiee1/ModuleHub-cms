import fs from 'fs-extra';
import path from 'path';
import { computeManifestHash } from '../../../core/src/modules/package-cache/hash';
import type { ScannedManifest } from '../../../core/src/modules/package-cache/types';

const FIXTURE_DIR = path.join(
  process.cwd(),
  'tests',
  'fixtures',
  'modules',
  'phase4-cache-test',
);

/** Documented hash for phase4-cache-test fixture package.json */
export const PHASE4_CACHE_TEST_EXPECTED_HASH =
  '75a508b59d9b6f181fe942b28fa2296c082dbf1181b793bd1bd17d7ae2f73af5';

describe('phase4-cache-test fixture', () => {
  it('has stable manifest hash matching README and verify script', async () => {
    const packageJsonPath = path.join(FIXTURE_DIR, 'package.json');
    const content = await fs.readFile(packageJsonPath, 'utf8');
    const manifests: ScannedManifest[] = [
      {
        fileName: 'package.json',
        kind: 'npm',
        absolutePath: packageJsonPath,
        content,
      },
    ];

    expect(computeManifestHash(manifests)).toBe(PHASE4_CACHE_TEST_EXPECTED_HASH);
  });
});
