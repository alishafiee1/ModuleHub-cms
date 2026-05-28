import crypto from 'crypto';
import type { ScannedManifest } from './types';

/**
 * Builds a deterministic string from manifest contents for hashing.
 * @param manifests - Scanned manifests sorted by filename
 * @returns Canonical manifest payload string
 */
export function buildManifestPayload(manifests: ScannedManifest[]): string {
  return manifests
    .map((manifest) => `${manifest.fileName}:${manifest.content}`)
    .join('\n');
}

/**
 * Computes SHA256 hex digest for dependency manifest content.
 * @param manifests - Scanned manifests from module directory
 * @returns Lowercase hex hash or null when no manifests exist
 */
export function computeManifestHash(manifests: ScannedManifest[]): string | null {
  if (manifests.length === 0) {
    return null;
  }
  const payload = buildManifestPayload(manifests);
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}
