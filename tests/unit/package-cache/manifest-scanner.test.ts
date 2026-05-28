import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import {
  getLinkTargetName,
  scanDependencyManifests,
} from '../../../core/src/modules/package-cache/manifest-scanner';

describe('manifest-scanner', () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'modulehub-manifest-'));
  });

  afterEach(async () => {
    await fs.remove(tempRoot);
  });

  it('detects package.json, requirements.txt, and composer.json', async () => {
    await fs.writeFile(path.join(tempRoot, 'package.json'), '{"name":"demo"}');
    await fs.writeFile(path.join(tempRoot, 'requirements.txt'), 'requests==2.32.0\n');
    await fs.writeFile(path.join(tempRoot, 'composer.json'), '{"name":"vendor/demo"}');

    const manifests = await scanDependencyManifests(tempRoot);

    expect(manifests.map((manifest) => manifest.fileName)).toEqual([
      'composer.json',
      'package.json',
      'requirements.txt',
    ]);
    expect(manifests.map((manifest) => manifest.kind)).toEqual(['composer', 'npm', 'pip']);
  });

  it('returns empty list when no manifest files exist', async () => {
    const manifests = await scanDependencyManifests(tempRoot);
    expect(manifests).toEqual([]);
  });

  it('maps dependency kinds to expected link directory names', () => {
    expect(getLinkTargetName('npm')).toBe('node_modules');
    expect(getLinkTargetName('pip')).toBe('venv');
    expect(getLinkTargetName('composer')).toBe('vendor');
  });
});
