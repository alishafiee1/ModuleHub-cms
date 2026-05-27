import AdmZip from 'adm-zip';

export interface ZipManifestAnalysis {
  manifestEntry: AdmZip.IZipEntry | null;
  manifestRelativePath: string | null;
  rootPrefix: string | null;
  errors: string[];
}

/**
 * Locate manifest.json in a ZIP and detect nested-root layout issues.
 */
export function analyzeZipManifest(entries: AdmZip.IZipEntry[]): ZipManifestAnalysis {
  const manifestCandidates = entries.filter(
    (entry) => !entry.isDirectory && entry.entryName.replace(/\\/g, '/').endsWith('manifest.json'),
  );

  if (manifestCandidates.length === 0) {
    return {
      manifestEntry: null,
      manifestRelativePath: null,
      rootPrefix: null,
      errors: ['manifest.json not found in archive'],
    };
  }

  const manifestEntry = manifestCandidates.find((entry) => {
    const normalized = entry.entryName.replace(/\\/g, '/');
    return normalized === 'manifest.json';
  }) ?? manifestCandidates[0];

  const manifestRelativePath = manifestEntry.entryName.replace(/\\/g, '/');
  const rootPrefix =
    manifestRelativePath === 'manifest.json'
      ? null
      : manifestRelativePath.slice(0, manifestRelativePath.length - 'manifest.json'.length);

  const errors: string[] = [];
  if (rootPrefix) {
    errors.push(
      `manifest.json must be at the ZIP root, but found at "${manifestRelativePath}". ` +
        `Re-pack the archive so manifest.json and index.html are at the top level ` +
        `(not inside a folder like "${rootPrefix.replace(/\/$/, '')}/").`,
    );
  }

  if (manifestCandidates.length > 1 && manifestRelativePath !== 'manifest.json') {
    errors.push(
      `Multiple manifest.json files found (${manifestCandidates.length}). Use a single module root in the ZIP.`,
    );
  }

  return { manifestEntry, manifestRelativePath, rootPrefix, errors };
}

/**
 * Verify index.html exists at module root (same prefix as manifest when at root).
 */
export function validateZipIndexAtRoot(entries: AdmZip.IZipEntry[], rootPrefix: string | null): string[] {
  const hasRootIndex = entries.some((entry) => {
    if (entry.isDirectory) return false;
    const normalized = entry.entryName.replace(/\\/g, '/');
    if (rootPrefix) {
      return normalized === `${rootPrefix}index.html`;
    }
    return normalized === 'index.html' || normalized.endsWith('/index.html');
  });

  if (hasRootIndex) {
    return [];
  }

  if (rootPrefix) {
    return [`standalone ZIP must include index.html next to manifest.json (expected "${rootPrefix}index.html")`];
  }

  return ['standalone ZIP must include index.html at module root'];
}
