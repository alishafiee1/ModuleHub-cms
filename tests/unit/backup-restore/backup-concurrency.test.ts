import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import type { Request, Response } from 'express';
import validFixture from '../../fixtures/site-layout-valid.json';

describe('backup concurrency', () => {
  let tempRoot: string;
  const previousAppRoot = process.env.MODULEHUB_APP_ROOT;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'modulehub-backup-concurrency-'));
    process.env.MODULEHUB_APP_ROOT = tempRoot;

    const exampleSettings = await fs.readJson(
      path.join(process.cwd(), 'docs', 'system-settings.example.json'),
    );
    await fs.ensureDir(path.join(tempRoot, 'storage'));
    await fs.ensureDir(path.join(tempRoot, 'standalone-modules', 'mod-a'));
    await fs.ensureDir(path.join(tempRoot, 'thumbnails'));
    await fs.writeFile(path.join(tempRoot, 'standalone-modules', 'mod-a', 'index.html'), '<html></html>');
    await fs.writeFile(path.join(tempRoot, 'thumbnails', 'mod-a.png'), 'png');
    await fs.writeJson(path.join(tempRoot, 'storage', 'site-layout.json'), validFixture);
    await fs.writeJson(path.join(tempRoot, 'storage', 'system-settings.json'), exampleSettings);

    jest.resetModules();
  });

  afterEach(async () => {
    process.env.MODULEHUB_APP_ROOT = previousAppRoot;
    await fs.remove(tempRoot);
  });

  it('rejects a second full backup while one is already running', async () => {
    const { BackupAlreadyInProgressError, createFullBackup } = await import(
      '../../../core/src/modules/backup-restore/backup-service'
    );

    const firstBackup = createFullBackup();
    const secondBackup = createFullBackup();

    await expect(secondBackup).rejects.toBeInstanceOf(BackupAlreadyInProgressError);
    await expect(firstBackup).resolves.toMatchObject({ fileName: expect.stringMatching(/^modulehub-full-/) });
  });

  it('maps concurrent backup attempts to HTTP 409', async () => {
    const { createFullBackup } = await import('../../../core/src/modules/backup-restore/backup-service');
    const { postFullBackupHandler } = await import('../../../core/src/modules/backup-restore/backup-routes');
    const firstBackup = createFullBackup();
    const responsePayload: { status?: number; body?: unknown } = {};
    const response = {
      status: jest.fn((status: number) => {
        responsePayload.status = status;
        return response;
      }),
      json: jest.fn((body: unknown) => {
        responsePayload.body = body;
        return response;
      }),
    } as unknown as Response;

    await postFullBackupHandler({} as Request, response);

    expect(responsePayload.status).toBe(409);
    expect(responsePayload.body).toMatchObject({ error: 'A full backup is already in progress' });
    await firstBackup;
  });
});
