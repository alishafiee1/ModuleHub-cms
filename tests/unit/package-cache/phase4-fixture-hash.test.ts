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
  '7064c31c899b1d8c9f847a6de82080a5892647a1717e461351651213bbc69c5f';

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
