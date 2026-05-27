import AdmZip from 'adm-zip';
import { analyzeZipManifest, validateZipIndexAtRoot } from '../core/src/modules/zip-manifest-analysis';

describe('zip manifest analysis', () => {
  it('detects nested manifest path', () => {
    const zip = new AdmZip();
    zip.addFile('thankio/manifest.json', Buffer.from('{}'));
    const analysis = analyzeZipManifest(zip.getEntries());
    expect(analysis.manifestRelativePath).toBe('thankio/manifest.json');
    expect(analysis.errors.join(' ')).toMatch(/ZIP root/);
  });

  it('accepts manifest at archive root', () => {
    const zip = new AdmZip();
    zip.addFile('manifest.json', Buffer.from('{}'));
    const analysis = analyzeZipManifest(zip.getEntries());
    expect(analysis.errors).toHaveLength(0);
    expect(analysis.rootPrefix).toBeNull();
  });

  it('requires index.html beside manifest for nested layout', () => {
    const zip = new AdmZip();
    zip.addFile('pkg/manifest.json', Buffer.from('{}'));
    const entries = zip.getEntries();
    const analysis = analyzeZipManifest(entries);
    const indexErrors = validateZipIndexAtRoot(entries, analysis.rootPrefix);
    expect(indexErrors.join(' ')).toMatch(/index.html/);
  });
});
