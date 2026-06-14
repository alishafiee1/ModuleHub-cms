import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import validFixture from '../../fixtures/site-layout-valid.json';
import { resetCmsLoggerForTests } from '../../../core/src/modules/logger';
import { createAgentWithCsrf } from '../../helpers/admin-test-agent';

describe('folder management API', () => {
  let tempRoot: string;
  const previousAppRoot = process.env.MODULEHUB_APP_ROOT;
  const previousDevAdmin = process.env.MODULEHUB_DEV_SUPER_ADMIN;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'modulehub-folder-api-'));
    process.env.MODULEHUB_APP_ROOT = tempRoot;
    process.env.MODULEHUB_DEV_SUPER_ADMIN = '1';
    await fs.ensureDir(path.join(tempRoot, 'storage'));
    await fs.writeJson(path.join(tempRoot, 'storage', 'site-layout.json'), validFixture);
    jest.resetModules();
    resetCmsLoggerForTests();
  });

  afterEach(async () => {
    process.env.MODULEHUB_APP_ROOT = previousAppRoot;
    process.env.MODULEHUB_DEV_SUPER_ADMIN = previousDevAdmin;
    await fs.remove(tempRoot);
  });

  it('PATCH renames folder', async () => {
    const { createApp } = await import('../../../core/src/server/index');
    const app = createApp();
    const { agent, csrfToken } = await createAgentWithCsrf(app);
    const response = await agent
      .patch('/admin/folder/folder-a')
      .set('X-CSRF-Token', csrfToken)
      .send({ name: 'پروژه‌های جدید', cardDescription: 'زیرعنوان' });

    expect(response.status).toBe(200);
    expect(response.body.node.name).toBe('پروژه‌های جدید');
    expect(response.body.node.cardDescription).toBe('زیرعنوان');
  });

  it('DELETE returns 409 for non-empty folder with reject policy', async () => {
    const { createApp } = await import('../../../core/src/server/index');
    const app = createApp();
    const { agent, csrfToken } = await createAgentWithCsrf(app);
    const response = await agent
      .delete('/admin/folder/folder-a')
      .set('X-CSRF-Token', csrfToken)
      .send({ contentPolicy: 'reject-if-not-empty' });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('FOLDER_NOT_EMPTY');
  });
});
