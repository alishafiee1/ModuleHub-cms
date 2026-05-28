import AdmZip from 'adm-zip';
import {
  FULL_BACKUP_MANIFEST_FILENAME,
  buildFullBackupManifestPayload,
  isSafeZipEntryName,
  parseFullBackupManifest,
  validateFullBackupZipEntries,
} from '../../../core/src/modules/backup-restore/backup-manifest';

function buildValidTestZip(): Buffer {
  const zip = new AdmZip();
  const createdAt = new Date().toISOString();
  const manifest = buildFullBackupManifestPayload(createdAt);
  zip.addFile(FULL_BACKUP_MANIFEST_FILENAME, Buffer.from(JSON.stringify(manifest), 'utf8'));
  zip.addFile('site-layout.json', Buffer.from('{"version":"1.0","tree":{},"modules":{}}', 'utf8'));
  zip.addFile('system-settings.json', Buffer.from('{}', 'utf8'));
  zip.addFile('standalone-modules/mod-a/index.html', Buffer.from('<html></html>', 'utf8'));
  zip.addFile('thumbnails/mod-a.png', Buffer.from('png', 'utf8'));
  return zip.toBuffer();
}

describe('backup-manifest', () => {
  it('accepts a ZIP with all required entries', () => {
    const zipBuffer = buildValidTestZip();
    const zip = new AdmZip(zipBuffer);
    const entryNames = zip.getEntries().map((entry) => entry.entryName);
    expect(validateFullBackupZipEntries(entryNames)).toBeNull();
  });

  it('rejects ZIP missing site-layout.json', () => {
    const zip = new AdmZip();
    const manifest = buildFullBackupManifestPayload(new Date().toISOString());
    zip.addFile(FULL_BACKUP_MANIFEST_FILENAME, Buffer.from(JSON.stringify(manifest), 'utf8'));
    zip.addFile('system-settings.json', Buffer.from('{}', 'utf8'));
    zip.addFile('standalone-modules/a.txt', Buffer.from('x', 'utf8'));
    zip.addFile('thumbnails/a.png', Buffer.from('x', 'utf8'));

    const entryNames = zip.getEntries().map((entry) => entry.entryName);
    expect(validateFullBackupZipEntries(entryNames)).toContain('site-layout.json');
  });

  it('flags unsafe zip entry names with parent traversal', () => {
    expect(isSafeZipEntryName('../etc/passwd')).toBe(false);
    expect(isSafeZipEntryName('standalone-modules/../../secret.txt')).toBe(false);
  });

  it('parses manifest JSON with supported format version', () => {
    const manifest = buildFullBackupManifestPayload('2026-05-28T00:00:00.000Z');
    const parsed = parseFullBackupManifest(JSON.stringify(manifest));
    expect('error' in parsed).toBe(false);
    if (!('error' in parsed)) {
      expect(parsed.manifest.createdAt).toBe('2026-05-28T00:00:00.000Z');
    }
  });

  it('rejects unsupported manifest format version', () => {
    const parsed = parseFullBackupManifest(JSON.stringify({ formatVersion: 99, createdAt: 'x' }));
    expect('error' in parsed).toBe(true);
  });
});
