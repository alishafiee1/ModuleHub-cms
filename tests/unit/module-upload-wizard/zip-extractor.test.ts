import AdmZip from 'adm-zip';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import {
  extractZipToModuleDirectory,
  isSafeZipEntry,
} from '../../../core/src/modules/module-upload-wizard/zip-extractor';
import { resolveSafeZipEntryTarget } from '../../../core/src/modules/shared/safe-zip-path';

describe('zip-extractor', () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'modulehub-zip-extractor-'));
  });

  afterEach(async () => {
    await fs.remove(tempRoot);
  });

  it('rejects path traversal entries', () => {
    expect(isSafeZipEntry('../etc/passwd')).toBe(false);
    expect(isSafeZipEntry('foo/../../secret.txt')).toBe(false);
    expect(isSafeZipEntry('standalone-modules/../../secret.txt')).toBe(false);
    expect(isSafeZipEntry('/etc/passwd')).toBe(false);
    expect(isSafeZipEntry('C:\\Windows\\system.ini')).toBe(false);
  });

  it('extracts safe entries under the module directory', async () => {
    const zipPath = path.join(tempRoot, 'safe.zip');
    const targetDirectory = path.join(tempRoot, 'module');
    const zip = new AdmZip();
    zip.addFile('public/index.html', Buffer.from('<html></html>', 'utf8'));
    zip.writeZip(zipPath);

    await extractZipToModuleDirectory(zipPath, targetDirectory);

    expect(await fs.pathExists(path.join(targetDirectory, 'public', 'index.html'))).toBe(true);
  });

  it('refuses to resolve traversal entries outside the module directory', async () => {
    const targetDirectory = path.join(tempRoot, 'module');

    expect(() => resolveSafeZipEntryTarget(targetDirectory, 'foo/../../secret.txt')).toThrow('Unsafe path in ZIP');
    expect(await fs.pathExists(path.join(tempRoot, 'secret.txt'))).toBe(false);
  });
});
