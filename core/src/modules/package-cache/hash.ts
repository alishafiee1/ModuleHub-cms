import crypto from 'crypto';
import type { ScannedManifest } from './types';

/**
 * Normalizes manifest text so hashes match across Windows (CRLF) and Linux (LF).
 * @param content - Raw manifest file contents
 * @returns UTF-8 text with Unix line endings
 */
function normalizeManifestContent(content: string): string {
  return content.replace(/\r\n/g, '\n');
}

/**
 * Builds a deterministic string from manifest contents for hashing.
 * @param manifests - Scanned manifests sorted by filename
 * @returns Canonical manifest payload string
 */
export function buildManifestPayload(manifests: ScannedManifest[]): string {
  return manifests
    .map((manifest) => `${manifest.fileName}:${normalizeManifestContent(manifest.content)}`)
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
