/** Lockout state tracked per module id */
export interface ModuleLockoutState {
  failedAttempts: number;
  lockedUntilMs: number;
}

const lockoutByModuleId = new Map<string, ModuleLockoutState>();

/**
 * Resets the in-memory module lockout store (for tests).
 */
export function resetModuleLockoutStoreForTests(): void {
  lockoutByModuleId.clear();
}

/**
 * Returns whether module auth is currently locked out.
 * @param moduleId - Target module id
 * @param nowMs - Current timestamp in milliseconds
 * @returns True when further auth attempts should be rejected
 */
export function isModuleAuthLocked(moduleId: string, nowMs: number = Date.now()): boolean {
  const state = lockoutByModuleId.get(moduleId);
  if (!state) {
    return false;
  }
  if (state.lockedUntilMs > nowMs) {
    return true;
  }
  if (state.lockedUntilMs > 0 && state.lockedUntilMs <= nowMs) {
    lockoutByModuleId.delete(moduleId);
  }
  return false;
}

/**
 * Records a failed module password attempt and applies lockout when threshold is reached.
 * @param moduleId - Target module id
 * @param maxAttempts - Failed attempts before lockout
 * @param lockoutMinutes - Lockout duration in minutes
 * @param nowMs - Current timestamp in milliseconds
 * @returns Updated lockout state
 */
export function recordFailedModuleAuthAttempt(
  moduleId: string,
  maxAttempts: number,
  lockoutMinutes: number,
  nowMs: number = Date.now(),
): ModuleLockoutState {
  const current = lockoutByModuleId.get(moduleId) ?? { failedAttempts: 0, lockedUntilMs: 0 };
  const failedAttempts = current.failedAttempts + 1;
  const lockedUntilMs = failedAttempts >= maxAttempts
    ? nowMs + lockoutMinutes * 60 * 1000
    : current.lockedUntilMs;
  const nextState: ModuleLockoutState = { failedAttempts, lockedUntilMs };
  lockoutByModuleId.set(moduleId, nextState);
  return nextState;
}

/**
 * Clears failed attempts after successful module auth.
 * @param moduleId - Target module id
 */
export function clearModuleAuthLockout(moduleId: string): void {
  lockoutByModuleId.delete(moduleId);
}

/**
 * Returns remaining lockout milliseconds for a module (0 when not locked).
 * @param moduleId - Target module id
 * @param nowMs - Current timestamp in milliseconds
 * @returns Milliseconds until lockout expires
 */
export function getModuleLockoutRemainingMs(moduleId: string, nowMs: number = Date.now()): number {
  const state = lockoutByModuleId.get(moduleId);
  if (!state || state.lockedUntilMs <= nowMs) {
    return 0;
  }
  return state.lockedUntilMs - nowMs;
}
