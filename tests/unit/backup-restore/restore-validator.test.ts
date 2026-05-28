import AdmZip from 'adm-zip';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import validFixture from '../../fixtures/site-layout-valid.json';
import {
  FULL_BACKUP_MANIFEST_FILENAME,
  buildFullBackupManifestPayload,
} from '../../../core/src/modules/backup-restore/backup-manifest';
import {
  RestoreValidationError,
  validateRestoreZipBuffer,
} from '../../../core/src/modules/backup-restore/restore-service';

describe('restore-validator', () => {
  let tempRoot: string;
  const previousAppRoot = process.env.MODULEHUB_APP_ROOT;
  const previousDevAdmin = process.env.MODULEHUB_DEV_SUPER_ADMIN;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'modulehub-restore-'));
    process.env.MODULEHUB_APP_ROOT = tempRoot;
    process.env.MODULEHUB_DEV_SUPER_ADMIN = '1';

    await fs.ensureDir(path.join(tempRoot, 'storage'));
    const layoutFixture = validFixture;
    const settingsFixture = {
      maxZipUploadMb: 200,
      portRangeStart: 4100,
      portRangeEnd: 4999,
      defaultModuleResources: {
        cpu_limit: 0.5,
        ram_limit_mb: 512,
        swap_limit_mb: 128,
        disk_iops: 100,
        net_mbps: 10,
      },
      maxConcurrentRunningModules: 10,
      logRetentionDays: 14,
      maxPackageCacheGb: 5,
      dependencyInstallTimeoutSec: 600,
      autoRestartOnCrash: false,
      autoRestartMaxAttemptsPerHour: 3,
      uploadTempCleanupHours: 24,
      packageInstallInterface: 'enp63s0',
      logViewerMaxLines: 50,
      sessionTtlHours: 8,
      loginRateLimitPerMinute: 5,
      moduleManagerSessionTtlHours: 4,
      modulePasswordMaxAttempts: 5,
      modulePasswordLockoutMinutes: 15,
    };

    await fs.ensureDir(path.join(tempRoot, 'docs'));
    await fs.writeJson(path.join(tempRoot, 'storage', 'site-layout.json'), layoutFixture);
    await fs.writeJson(path.join(tempRoot, 'docs', 'site-layout.json'), layoutFixture);
    await fs.writeJson(path.join(tempRoot, 'storage', 'system-settings.json'), settingsFixture);
    await fs.writeJson(
      path.join(tempRoot, 'docs', 'system-settings.example.json'),
      settingsFixture,
    );

    await fs.ensureDir(path.join(tempRoot, 'standalone-modules'));
    await fs.ensureDir(path.join(tempRoot, 'thumbnails'));
    jest.resetModules();
  });

  afterEach(async () => {
    process.env.MODULEHUB_APP_ROOT = previousAppRoot;
    process.env.MODULEHUB_DEV_SUPER_ADMIN = previousDevAdmin;
    await fs.remove(tempRoot);
  });

  it('validateRestoreZipBuffer rejects corrupt non-ZIP buffer', () => {
    expect(() => validateRestoreZipBuffer(Buffer.from('not-a-zip', 'utf8'))).toThrow(
      RestoreValidationError,
    );
  });

  it('validateRestoreZipBuffer rejects ZIP missing manifest', () => {
    const zip = new AdmZip();
    zip.addFile('site-layout.json', Buffer.from('{}', 'utf8'));
    expect(() => validateRestoreZipBuffer(zip.toBuffer())).toThrow(RestoreValidationError);
  });

  it('createFullBackup includes required manifest files', async () => {
    const { createFullBackup: createBackup } = await import(
      '../../../core/src/modules/backup-restore/backup-service'
    );
    const result = await createBackup();
    const zip = new AdmZip(path.join(tempRoot, 'storage', 'backups', result.fileName));
    const names = zip.getEntries().map((entry) => entry.entryName);
    expect(names).toContain(FULL_BACKUP_MANIFEST_FILENAME);
    expect(names).toContain('site-layout.json');
    expect(names).toContain('system-settings.json');
    expect(names.some((name) => name.startsWith('standalone-modules/'))).toBe(true);
    expect(names.some((name) => name.startsWith('thumbnails/'))).toBe(true);
  });

  it('restoreFullBackupFromZipBuffer writes layout from backup', async () => {
    const layoutPath = path.join(tempRoot, 'storage', 'site-layout.json');
    const layoutWithModule = {
      ...validFixture,
      modules: {
        ...validFixture.modules,
        'mod-restored': {
          name: 'Restored Module',
          status: 'stopped',
          version: '1.0.0',
          docker: false,
          port: 4105,
          permissions: { read: true, write: false, execute: false },
          resources: {
            cpu_limit: 0.5,
            ram_limit_mb: 512,
            swap_limit_mb: 128,
            disk_iops: 100,
            net_mbps: 10,
          },
          icon: 'default',
          thumbnail: '',
        },
      },
    };
    await fs.writeJson(layoutPath, layoutWithModule);

    const { createFullBackup: createBackup } = await import(
      '../../../core/src/modules/backup-restore/backup-service'
    );
    const backup = await createBackup();
    const zipBuffer = await fs.readFile(path.join(tempRoot, 'storage', 'backups', backup.fileName));

    await fs.writeJson(layoutPath, validFixture);

    const { restoreFullBackupFromZipBuffer: restore } = await import(
      '../../../core/src/modules/backup-restore/restore-service'
    );
    const restoreResult = await restore(zipBuffer);
    expect(restoreResult.preRestoreBackupFileName).toMatch(/^modulehub-pre-restore-/);

    const restoredLayout = await fs.readJson(layoutPath);
    expect(restoredLayout.modules['mod-restored']).toBeDefined();
  });

  it('buildFullBackupManifestPayload is embedded in valid backup ZIP', () => {
    const zip = new AdmZip();
    const manifest = buildFullBackupManifestPayload(new Date().toISOString());
    zip.addFile(FULL_BACKUP_MANIFEST_FILENAME, Buffer.from(JSON.stringify(manifest), 'utf8'));
    zip.addFile('site-layout.json', Buffer.from('{}', 'utf8'));
    zip.addFile('system-settings.json', Buffer.from('{}', 'utf8'));
    zip.addFile('standalone-modules/x.txt', Buffer.from('1', 'utf8'));
    zip.addFile('thumbnails/x.png', Buffer.from('1', 'utf8'));
    expect(() => validateRestoreZipBuffer(zip.toBuffer())).not.toThrow();
  });
});
