import bcrypt from 'bcrypt';

/** Minimum bcrypt cost factor for CMS password hashes */
export const BCRYPT_COST = 12;

/**
 * Hashes a plaintext password with bcrypt at the CMS minimum cost.
 * @param plainPassword - Plaintext password
 * @returns bcrypt hash string
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_COST);
}

/**
 * Compares a plaintext password against a bcrypt hash.
 * @param plainPassword - Plaintext password
 * @param passwordHash - Stored bcrypt hash
 * @returns True when the password matches
 */
export async function verifyPassword(
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> {
  if (!passwordHash || !plainPassword) {
    return false;
  }
  return bcrypt.compare(plainPassword, passwordHash);
}

/**
 * Returns whether a bcrypt hash uses at least the CMS minimum cost.
 * @param passwordHash - bcrypt hash string
 * @returns True when cost factor is >= BCRYPT_COST
 */
export function hasMinimumBcryptCost(passwordHash: string): boolean {
  const match = /^\$2[aby]\$(\d+)\$/.exec(passwordHash);
  if (!match) {
    return false;
  }
  const cost = Number.parseInt(match[1], 10);
  return Number.isFinite(cost) && cost >= BCRYPT_COST;
}
