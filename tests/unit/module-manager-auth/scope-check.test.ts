import {
  getActiveManagedModuleIds,
  isModuleInManagerScope,
} from '../../../core/src/modules/admin-auth/scope-check';

describe('module-manager-auth scope-check', () => {
  it('returns only module ids inside Module Manager TTL window', () => {
    const now = Date.now();
    const moduleAuthTimes = {
      'mod-a': now - 30 * 60 * 1000,
      'mod-b': now - 5 * 60 * 60 * 1000,
    };
    const activeIds = getActiveManagedModuleIds(moduleAuthTimes, 4);
    expect(activeIds).toEqual(['mod-a']);
  });

  it('checks whether a module id is in manager scope list', () => {
    expect(isModuleInManagerScope(['gal-789'], 'gal-789')).toBe(true);
    expect(isModuleInManagerScope(['gal-789'], 'other')).toBe(false);
  });
});
