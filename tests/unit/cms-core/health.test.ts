import request from 'supertest';
import { createApp } from '../../../core/src/server/index';
import { resetCmsLoggerForTests } from '../../../core/src/modules/logger';

describe('GET /health', () => {
  beforeEach(() => {
    resetCmsLoggerForTests();
  });

  it('returns 200 and status ok', async () => {
    const app = createApp();
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
