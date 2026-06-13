import express from 'express';
import request from 'supertest';
import { createLoginRateLimiter } from '../../../core/src/modules/admin-auth/auth-session';

jest.mock('../../../core/src/modules/system-settings', () => ({
  loadSystemSettings: jest.fn(async () => ({
    loginRateLimitPerMinute: 2,
    moduleManagerSessionTtlHours: 4,
    modulePasswordMaxAttempts: 5,
    modulePasswordLockoutMinutes: 15,
    maxZipUploadMb: 200,
    portRangeStart: 4100,
    portRangeEnd: 4999,
    maxConcurrentRunningModules: 10,
    autoRestartOnCrash: false,
    autoRestartMaxAttemptsPerHour: 3,
    maxPackageCacheGb: 5,
    homeIconTheme: 'default',
    homePageTitle: 'ModuleHub',
    homePageSubtitle: '',
    homeBackgroundStyle: 'default',
    homeCardStyle: 'default',
    logLevel: 'info',
    logMaxFilesDays: 14,
    logMaxSizeMb: 20,
  })),
}));

describe('super-admin-auth rate-limit', () => {
  it('creates login rate limiter middleware function', () => {
    const limiter = createLoginRateLimiter();
    expect(typeof limiter).toBe('function');
  });

  it('returns 429 after exceeding loginRateLimitPerMinute', async () => {
    const app = express();
    app.set('trust proxy', 1);
    const limiter = createLoginRateLimiter();
    app.post('/admin/login', limiter, (_request, response) => {
      response.status(200).json({ ok: true });
    });

    const agent = request.agent(app);
    await agent.post('/admin/login').expect(200);
    await agent.post('/admin/login').expect(200);
    const blocked = await agent.post('/admin/login');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toContain('Too many login attempts');
  });
});
