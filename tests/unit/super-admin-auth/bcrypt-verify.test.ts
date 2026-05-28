import { hashPassword, hasMinimumBcryptCost, verifyPassword, BCRYPT_COST } from '../../../core/src/modules/admin-auth/bcrypt-verify';

describe('super-admin-auth bcrypt-verify', () => {
  it('hashes with cost >= 12 and verifies correct password', async () => {
    const hash = await hashPassword('secure-test-password');
    expect(hasMinimumBcryptCost(hash)).toBe(true);
    expect(await verifyPassword('secure-test-password', hash)).toBe(true);
  });

  it('rejects wrong password for a valid hash', async () => {
    const hash = await hashPassword('correct-password');
    expect(await verifyPassword('wrong-password', hash)).toBe(false);
  });

  it('reports low-cost hashes as invalid for CMS policy', () => {
    expect(hasMinimumBcryptCost('$2b$10$abcdefghijklmnopqrstuv')).toBe(false);
    expect(BCRYPT_COST).toBeGreaterThanOrEqual(12);
  });
});
