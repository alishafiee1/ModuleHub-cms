import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import request from 'supertest';
import { resetCmsLoggerForTests } from '../../../core/src/modules/logger';
import { createAgentWithCsrf } from '../../helpers/admin-test-agent';

describe('POST /admin/card-background/upload', () => {
  let tempRoot: string;
  const previousAppRoot = process.env.MODULEHUB_APP_ROOT;
  const previousDevAdmin = process.env.MODULEHUB_DEV_SUPER_ADMIN;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'modulehub-card-bg-'));
    process.env.MODULEHUB_APP_ROOT = tempRoot;
    process.env.MODULEHUB_DEV_SUPER_ADMIN = '1';
    await fs.ensureDir(path.join(tempRoot, 'storage', 'card-backgrounds'));
    jest.resetModules();
    resetCmsLoggerForTests();
  });

  afterEach(async () => {
    process.env.MODULEHUB_APP_ROOT = previousAppRoot;
    process.env.MODULEHUB_DEV_SUPER_ADMIN = previousDevAdmin;
    await fs.remove(tempRoot);
  });

  it('uploads jpeg and returns /card-backgrounds/ URL', async () => {
    const { createApp: createFreshApp } = await import('../../../core/src/server/index');
    const app = createFreshApp();

    const onePixelJpeg = Buffer.from(
      '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGfAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEABj8Cf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8hf//Z',
      'base64',
    );

    const { agent, csrfToken } = await createAgentWithCsrf(app);
    const response = await agent
      .post('/admin/card-background/upload')
      .set('X-CSRF-Token', csrfToken)
      .attach('image', onePixelJpeg, { filename: 'bg.jpg', contentType: 'image/jpeg' });

    expect(response.status).toBe(200);
    expect(response.body.imageUrl).toMatch(/^\/card-backgrounds\/[0-9a-f-]+\.jpg$/);

    const savedName = path.basename(response.body.imageUrl as string);
    const savedPath = path.join(tempRoot, 'storage', 'card-backgrounds', savedName);
    expect(await fs.pathExists(savedPath)).toBe(true);
  });

  it('serves uploaded file at /card-backgrounds/', async () => {
    const { createApp: createFreshApp } = await import('../../../core/src/server/index');
    const app = createFreshApp();
    const fileName = 'test-bg.png';
    const filePath = path.join(tempRoot, 'storage', 'card-backgrounds', fileName);
    await fs.writeFile(filePath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));

    const response = await request(app).get(`/card-backgrounds/${fileName}`);
    expect(response.status).toBe(200);
  });

  it('rejects upload without super admin session', async () => {
    process.env.MODULEHUB_DEV_SUPER_ADMIN = '0';
    jest.resetModules();
    resetCmsLoggerForTests();

    const { createApp: createFreshApp } = await import('../../../core/src/server/index');
    const app = createFreshApp();
    const agent = request.agent(app);
    const csrfResponse = await agent.get('/api/auth/csrf-token');
    const csrfToken = csrfResponse.body.csrfToken as string;

    const response = await agent
      .post('/admin/card-background/upload')
      .set('X-CSRF-Token', csrfToken)
      .attach('image', Buffer.from('fake'), { filename: 'x.jpg', contentType: 'image/jpeg' });

    expect(response.status).toBe(401);
  });
});
