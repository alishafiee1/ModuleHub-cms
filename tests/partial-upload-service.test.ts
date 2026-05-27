import fs from 'fs';
import os from 'os';
import path from 'path';
import AdmZip from 'adm-zip';
import { PartialUploadService } from '../core/src/modules/partial-upload-service';
import { ModuleRegistry } from '../core/src/modules/registry';

describe('PartialUploadService', () => {
  let tmpDir: string;
  let registry: ModuleRegistry;
  let moduleDir: string;
  let service: PartialUploadService;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-partial-'));
    moduleDir = path.join(tmpDir, 'standalone-modules', 'demo-api');
    fs.mkdirSync(moduleDir, { recursive: true });
    fs.writeFileSync(path.join(moduleDir, 'server.js'), 'old');
    registry = new ModuleRegistry(path.join(tmpDir, 'modules.json'));
    registry.upsert({
      id: 'demo-api',
      name: 'Demo API',
      type: 'standalone',
      version: '1.0.0',
      icon: 'a.png',
      description: 'API',
      status: 'running',
      installPath: moduleDir,
      createdAt: '',
      updatedAt: '',
    });
    service = new PartialUploadService(registry);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('replaces a single file from partial ZIP', () => {
    const zip = new AdmZip();
    zip.addFile('server.js', Buffer.from('new-version'));
    const result = service.applyZip('demo-api', zip.toBuffer());
    expect(result.success).toBe(true);
    expect(result.replacedFiles).toEqual(['server.js']);
    expect(fs.readFileSync(path.join(moduleDir, 'server.js'), 'utf-8')).toBe('new-version');
  });

  it('rejects unsafe absolute paths in partial ZIP', () => {
    const zip = new AdmZip();
    const unsafeEntry = process.platform === 'win32' ? 'C:/outside.txt' : '/etc/passwd';
    zip.addFile(unsafeEntry, Buffer.from('bad'));
    const result = service.applyZip('demo-api', zip.toBuffer());
    expect(result.success).toBe(false);
    expect(result.errors.join(' ')).toMatch(/traversal|invalid|absolute/i);
  });
});
