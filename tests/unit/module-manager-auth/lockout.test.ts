import {
  clearModuleAuthLockout,
  isModuleAuthLocked,
  recordFailedModuleAuthAttempt,
  resetModuleLockoutStoreForTests,
} from '../../../core/src/modules/admin-auth/module-lockout';

describe('module-manager-auth lockout', () => {
  beforeEach(() => {
    resetModuleLockoutStoreForTests();
  });

  it('locks module auth after max failed attempts', () => {
    const moduleId = 'mod-lock-test';
    const now = 1_700_000_000_000;

    for (let attempt = 0; attempt < 4; attempt += 1) {
      recordFailedModuleAuthAttempt(moduleId, 5, 15, now);
      expect(isModuleAuthLocked(moduleId, now)).toBe(false);
    }

    recordFailedModuleAuthAttempt(moduleId, 5, 15, now);
    expect(isModuleAuthLocked(moduleId, now)).toBe(true);
  });

  it('clears lockout after successful auth reset', () => {
    const moduleId = 'mod-clear-test';
    const now = 1_700_000_000_000;
    recordFailedModuleAuthAttempt(moduleId, 1, 15, now);
    expect(isModuleAuthLocked(moduleId, now)).toBe(true);
    clearModuleAuthLockout(moduleId);
    expect(isModuleAuthLocked(moduleId, now)).toBe(false);
  });
});
