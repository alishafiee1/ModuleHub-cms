import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import request from 'supertest';
import validFixture from '../../fixtures/site-layout-valid.json';
import { hashPassword } from '../../../core/src/modules/admin-auth/bcrypt-verify';
import { resetCmsLoggerForTests } from '../../../core/src/modules/logger';
import { createAgentWithCsrf } from '../../helpers/admin-test-agent';

describe('backup-restore admin routes', () => {
  let tempRoot: string;
  const previousAppRoot = process.env.MODULEHUB_APP_ROOT;
  const previousDevAdmin = process.env.MODULEHUB_DEV_SUPER_ADMIN;

  jest.setTimeout(60_000);

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'modulehub-backup-routes-'));
    process.env.MODULEHUB_APP_ROOT = tempRoot;
    process.env.MODULEHUB_DEV_SUPER_ADMIN = '1';

    const exampleSettings = await fs.readJson(
      path.join(process.cwd(), 'docs', 'system-settings.example.json'),
    );

    await fs.ensureDir(path.join(tempRoot, 'storage'));
    await fs.ensureDir(path.join(tempRoot, 'docs'));
    await fs.ensureDir(path.join(tempRoot, 'standalone-modules'));
    await fs.ensureDir(path.join(tempRoot, 'thumbnails'));
    await fs.writeJson(path.join(tempRoot, 'storage', 'site-layout.json'), validFixture);
    await fs.writeJson(path.join(tempRoot, 'docs', 'site-layout.json'), validFixture);
    await fs.writeJson(path.join(tempRoot, 'storage', 'system-settings.json'), exampleSettings);
    await fs.writeJson(
      path.join(tempRoot, 'docs', 'system-settings.example.json'),
      exampleSettings,
    );

    jest.resetModules();
    resetCmsLoggerForTests();
  });

  afterEach(async () => {
    process.env.MODULEHUB_APP_ROOT = previousAppRoot;
    process.env.MODULEHUB_DEV_SUPER_ADMIN = previousDevAdmin;
    await fs.remove(tempRoot);
  });

  async function createTestApp() {
    const { createApp } = await import('../../../core/src/server/index');
    return createApp();
  }

  async function createAuthenticatedAgent() {
    const app = await createTestApp();
    const { agent, csrfToken } = await createAgentWithCsrf(app);
    return { app, agent, csrfToken };
  }

  it('POST /admin/backup creates a full backup with Super Admin session and CSRF', async () => {
    const { agent, csrfToken } = await createAuthenticatedAgent();
    const response = await agent
      .post('/admin/backup')
      .set('X-CSRF-Token', csrfToken);

    expect(response.status).toBe(201);
    expect(response.body.fileName).toMatch(/^modulehub-full-/);
    expect(response.body.createdAt).toBeTruthy();
    expect(response.body.downloadPath).toContain(response.body.fileName);

    const backupPath = path.join(tempRoot, 'storage', 'backups', response.body.fileName);
    expect(await fs.pathExists(backupPath)).toBe(true);
  });

  it('GET /admin/backup/list returns enriched backup entries', async () => {
    const { agent, csrfToken } = await createAuthenticatedAgent();
    const createResponse = await agent
      .post('/admin/backup')
      .set('X-CSRF-Token', csrfToken);
    expect(createResponse.status).toBe(201);

    const listResponse = await agent.get('/admin/backup/list');
    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body.backups)).toBe(true);
    expect(listResponse.body.backups.length).toBeGreaterThanOrEqual(1);

    const entry = listResponse.body.backups.find(
      (item: { fileName: string }) => item.fileName === createResponse.body.fileName,
    );
    expect(entry).toBeDefined();
    expect(typeof entry.sizeBytes).toBe('number');
    expect(entry.sizeBytes).toBeGreaterThan(0);
    expect(entry.createdAt).toBeTruthy();
  });

  it('GET /admin/backup/download/:fileName returns application/zip', async () => {
    const { agent, csrfToken } = await createAuthenticatedAgent();
    const createResponse = await agent
      .post('/admin/backup')
      .set('X-CSRF-Token', csrfToken);
    const fileName = createResponse.body.fileName as string;

    const downloadResponse = await agent.get(
      `/admin/backup/download/${encodeURIComponent(fileName)}`,
    );
    expect(downloadResponse.status).toBe(200);
    expect(downloadResponse.headers['content-type']).toContain('application/zip');
    expect(Buffer.isBuffer(downloadResponse.body) || typeof downloadResponse.body === 'object').toBe(true);
  });

  it('POST /admin/backup/restore/:fileName restores when confirmed', async () => {
    const layoutPath = path.join(tempRoot, 'storage', 'site-layout.json');
    const layoutWithMarker = {
      ...validFixture,
      modules: {
        ...validFixture.modules,
        'mod-route-restore': {
          name: 'Route Restore Marker',
          status: 'stopped',
          version: '1.0.0',
          docker: false,
          port: 4110,
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
    await fs.writeJson(layoutPath, layoutWithMarker);

    const { agent, csrfToken } = await createAuthenticatedAgent();
    const createResponse = await agent
      .post('/admin/backup')
      .set('X-CSRF-Token', csrfToken);
    const fileName = createResponse.body.fileName as string;

    await fs.writeJson(layoutPath, validFixture);

    const restoreResponse = await agent
      .post(`/admin/backup/restore/${encodeURIComponent(fileName)}`)
      .set('X-CSRF-Token', csrfToken)
      .send({ confirm: true });

    expect(restoreResponse.status).toBe(200);
    expect(restoreResponse.body.preRestoreBackupFileName).toMatch(/^modulehub-pre-restore-/);
    expect(restoreResponse.body.restoredAt).toBeTruthy();

    const restoredLayout = await fs.readJson(layoutPath);
    expect(restoredLayout.modules['mod-route-restore']).toBeDefined();

    const listResponse = await agent.get('/admin/backup/list');
    expect(listResponse.status).toBe(200);
    const preRestoreEntry = listResponse.body.backups.find(
      (item: { fileName: string }) => item.fileName === restoreResponse.body.preRestoreBackupFileName,
    );
    expect(preRestoreEntry).toBeDefined();
    expect(preRestoreEntry.fileName).toMatch(/^modulehub-pre-restore-/);
  });

  it('POST /admin/backup/restore/:fileName returns 400 without confirm', async () => {
    const { agent, csrfToken } = await createAuthenticatedAgent();
    const createResponse = await agent
      .post('/admin/backup')
      .set('X-CSRF-Token', csrfToken);
    const fileName = createResponse.body.fileName as string;

    const restoreResponse = await agent
      .post(`/admin/backup/restore/${encodeURIComponent(fileName)}`)
      .set('X-CSRF-Token', csrfToken)
      .send({});

    expect(restoreResponse.status).toBe(400);
    expect(restoreResponse.body.error).toContain('confirmation');
  });

  it('rejects invalid backup file names and path traversal', async () => {
    const { agent, csrfToken } = await createAuthenticatedAgent();

    const traversalResponse = await agent
      .post('/admin/backup/restore/..%2F..%2Fetc%2Fpasswd.zip')
      .set('X-CSRF-Token', csrfToken)
      .send({ confirm: true });
    expect(traversalResponse.status).toBe(400);

    const preRestoreResponse = await agent
      .post('/admin/backup/restore/modulehub-pre-restore-test.zip')
      .set('X-CSRF-Token', csrfToken)
      .send({ confirm: true });
    expect(preRestoreResponse.status).toBe(400);
    expect(preRestoreResponse.body.error).toContain('modulehub-full-');
  });

  it('returns 401 without Super Admin session', async () => {
    process.env.MODULEHUB_DEV_SUPER_ADMIN = '0';
    jest.resetModules();
    resetCmsLoggerForTests();

    const app = await createTestApp();
    const response = await request(app).get('/admin/backup/list');
    expect(response.status).toBe(401);
  });

  it('returns 403 for POST /admin/backup without CSRF token', async () => {
    const { agent } = await createAuthenticatedAgent();
    const response = await agent.post('/admin/backup');
    expect(response.status).toBe(403);
  });

  it('POST /admin/restore accepts multipart ZIP upload with confirm', async () => {
    const { agent, csrfToken } = await createAuthenticatedAgent();
    const createResponse = await agent
      .post('/admin/backup')
      .set('X-CSRF-Token', csrfToken);
    const fileName = createResponse.body.fileName as string;
    const zipPath = path.join(tempRoot, 'storage', 'backups', fileName);

    const layoutPath = path.join(tempRoot, 'storage', 'site-layout.json');
    await fs.writeJson(layoutPath, validFixture);

    const uploadResponse = await agent
      .post('/admin/restore')
      .set('X-CSRF-Token', csrfToken)
      .field('confirm', 'true')
      .attach('backup', zipPath);

    expect(uploadResponse.status).toBe(200);
    expect(uploadResponse.body.preRestoreBackupFileName).toMatch(/^modulehub-pre-restore-/);
  });

  describe('DELETE /admin/backup/:fileName', () => {
    let adminPasswordHash: string;
    const previousAdminHash = process.env.ADMIN_PASSWORD_HASH;
    const previousAdminUsername = process.env.ADMIN_USERNAME;

    beforeAll(async () => {
      adminPasswordHash = await hashPassword('backup-delete-pass');
    });

    beforeEach(() => {
      process.env.ADMIN_PASSWORD_HASH = adminPasswordHash;
      process.env.ADMIN_USERNAME = 'admin';
      jest.resetModules();
      resetCmsLoggerForTests();
    });

    afterEach(() => {
      process.env.ADMIN_PASSWORD_HASH = previousAdminHash;
      process.env.ADMIN_USERNAME = previousAdminUsername;
    });

    it('deletes backup when admin password is correct', async () => {
      const { agent, csrfToken } = await createAuthenticatedAgent();
      const createResponse = await agent
        .post('/admin/backup')
        .set('X-CSRF-Token', csrfToken);
      const fileName = createResponse.body.fileName as string;

      const deleteResponse = await agent
        .delete(`/admin/backup/${encodeURIComponent(fileName)}`)
        .set('X-CSRF-Token', csrfToken)
        .send({ adminPassword: 'backup-delete-pass' });

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.fileName).toBe(fileName);
      expect(await fs.pathExists(path.join(tempRoot, 'storage', 'backups', fileName))).toBe(false);
    });

    it('returns 401 when admin password is wrong', async () => {
      const { agent, csrfToken } = await createAuthenticatedAgent();
      const createResponse = await agent
        .post('/admin/backup')
        .set('X-CSRF-Token', csrfToken);
      const fileName = createResponse.body.fileName as string;

      const deleteResponse = await agent
        .delete(`/admin/backup/${encodeURIComponent(fileName)}`)
        .set('X-CSRF-Token', csrfToken)
        .send({ adminPassword: 'wrong-password' });

      expect(deleteResponse.status).toBe(401);
      expect(await fs.pathExists(path.join(tempRoot, 'storage', 'backups', fileName))).toBe(true);
    });

    it('returns 400 when admin password is missing', async () => {
      const { agent, csrfToken } = await createAuthenticatedAgent();
      const createResponse = await agent
        .post('/admin/backup')
        .set('X-CSRF-Token', csrfToken);
      const fileName = createResponse.body.fileName as string;

      const deleteResponse = await agent
        .delete(`/admin/backup/${encodeURIComponent(fileName)}`)
        .set('X-CSRF-Token', csrfToken)
        .send({});

      expect(deleteResponse.status).toBe(400);
    });
  });
});
