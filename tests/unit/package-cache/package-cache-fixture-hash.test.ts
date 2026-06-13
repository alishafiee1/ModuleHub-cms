import fs from 'fs-extra';
import path from 'path';
import { computeManifestHash } from '../../../core/src/modules/package-cache/hash';
import type { ScannedManifest } from '../../../core/src/modules/package-cache/types';

const FIXTURE_DIR = path.join(
  process.cwd(),
  'tests',
  'fixtures',
  'modules',
  'package-cache-test',
);

/** Documented hash for package-cache-test fixture package.json */
export const PACKAGE_CACHE_TEST_EXPECTED_HASH =
  '36ac3dc3c1c3e0acb45bf01d7bdbe262facce1c24bb31f03abf84db5ea951107';

describe('package-cache-test fixture', () => {
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

    expect(computeManifestHash(manifests)).toBe(PACKAGE_CACHE_TEST_EXPECTED_HASH);
  });
});
