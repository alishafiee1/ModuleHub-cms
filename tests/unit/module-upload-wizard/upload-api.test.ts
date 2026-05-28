import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import AdmZip from 'adm-zip';
import validFixture from '../../fixtures/site-layout-valid.json';
import { resetCmsLoggerForTests } from '../../../core/src/modules/logger';
import { createAgentWithCsrf } from '../../helpers/admin-test-agent';

describe('POST /admin/folder and upload', () => {
  let tempRoot: string;
  const previousAppRoot = process.env.MODULEHUB_APP_ROOT;
  const previousDevAdmin = process.env.MODULEHUB_DEV_SUPER_ADMIN;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'modulehub-upload-api-'));
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

  it('creates virtual folder via API', async () => {
    const { createApp: createFreshApp } = await import('../../../core/src/server/index');
    const app = createFreshApp();
    const { agent, csrfToken } = await createAgentWithCsrf(app);
    const response = await agent
      .post('/admin/folder')
      .set('X-CSRF-Token', csrfToken)
      .send({ parentId: 'root', name: 'API Folder' });

    expect(response.status).toBe(201);
    expect(response.body.folderId).toMatch(/^folder-/);

    const layout = await fs.readJson(path.join(tempRoot, 'storage', 'site-layout.json'));
    const rootChildren = layout.tree.children as { id: string; name: string }[];
    expect(rootChildren.some((child) => child.name === 'API Folder')).toBe(true);
  });

  it('rejects non-ZIP upload', async () => {
    const { createApp: createFreshApp } = await import('../../../core/src/server/index');
    const app = createFreshApp();
    const { agent, csrfToken } = await createAgentWithCsrf(app);
    const response = await agent
      .post('/admin/upload')
      .set('X-CSRF-Token', csrfToken)
      .attach('zipFile', Buffer.from('not a zip'), 'readme.txt');

    expect(response.status).toBe(400);
  });

  it('accepts valid ZIP upload', async () => {
    const zipPath = path.join(tempRoot, 'test.zip');
    const zip = new AdmZip();
    zip.addFile('index.html', Buffer.from('<html></html>'));
    zip.writeZip(zipPath);

    const { createApp: createFreshApp } = await import('../../../core/src/server/index');
    const app = createFreshApp();
    const { agent, csrfToken } = await createAgentWithCsrf(app);
    const response = await agent
      .post('/admin/upload')
      .set('X-CSRF-Token', csrfToken)
      .attach('zipFile', zipPath);

    expect(response.status).toBe(201);
    expect(response.body.moduleId).toMatch(/^mod-/);
    const moduleDir = path.join(tempRoot, 'standalone-modules', response.body.moduleId);
    expect(await fs.pathExists(path.join(moduleDir, 'index.html'))).toBe(true);
  });
});
