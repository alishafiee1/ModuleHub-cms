import { createLoginRateLimiter } from '../../../core/src/modules/admin-auth/auth-session';

describe('super-admin-auth rate-limit', () => {
  it('creates login rate limiter middleware function', () => {
    const limiter = createLoginRateLimiter();
    expect(typeof limiter).toBe('function');
  });
});
