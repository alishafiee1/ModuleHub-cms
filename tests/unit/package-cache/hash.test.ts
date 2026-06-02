import { buildManifestPayload, computeManifestHash } from '../../../core/src/modules/package-cache/hash';
import type { ScannedManifest } from '../../../core/src/modules/package-cache/types';

function buildManifest(content: string): ScannedManifest {
  return {
    fileName: 'package.json',
    kind: 'npm',
    absolutePath: '/tmp/module/package.json',
    content,
  };
}

describe('package-cache hash', () => {
  it('returns null when no manifests are provided', () => {
    expect(computeManifestHash([])).toBeNull();
  });

  it('returns identical SHA256 for identical manifest content', () => {
    const manifests = [buildManifest('{"name":"demo","dependencies":{"express":"^5.0.0"}}')];
    const firstHash = computeManifestHash(manifests);
    const secondHash = computeManifestHash(manifests);
    expect(firstHash).toBe(secondHash);
    expect(firstHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('changes hash when manifest content changes', () => {
    const base = [buildManifest('{"name":"demo"}')];
    const changed = [buildManifest('{"name":"demo-v2"}')];
    expect(computeManifestHash(base)).not.toBe(computeManifestHash(changed));
  });

  it('builds stable payload with filename prefix', () => {
    const manifests = [buildManifest('{"name":"demo"}')];
    expect(buildManifestPayload(manifests)).toBe('package.json:{"name":"demo"}');
  });

  it('normalizes CRLF line endings before hashing', () => {
    const unix = [buildManifest('{"name":"demo"}\n')];
    const windows = [buildManifest('{"name":"demo"}\r\n')];
    expect(computeManifestHash(unix)).toBe(computeManifestHash(windows));
  });
});
