import {
  getActiveManagedModuleIds,
  isDevSuperAdminEnabled,
  isModuleInManagerScope,
} from '../../../core/src/modules/admin-auth/scope-check';

describe('module-manager-auth scope-check', () => {
  const previousDevFlag = process.env.MODULEHUB_DEV_SUPER_ADMIN;
  const previousNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.MODULEHUB_DEV_SUPER_ADMIN = previousDevFlag;
    process.env.NODE_ENV = previousNodeEnv;
  });

  it('enables dev Super Admin only when MODULEHUB_DEV_SUPER_ADMIN is exactly 1', () => {
    process.env.NODE_ENV = 'test';
    process.env.MODULEHUB_DEV_SUPER_ADMIN = '1';
    expect(isDevSuperAdminEnabled()).toBe(true);

    process.env.MODULEHUB_DEV_SUPER_ADMIN = 'true';
    expect(isDevSuperAdminEnabled()).toBe(false);

    process.env.MODULEHUB_DEV_SUPER_ADMIN = '0';
    expect(isDevSuperAdminEnabled()).toBe(false);
  });

  it('disables dev Super Admin bypass in production NODE_ENV', () => {
    process.env.NODE_ENV = 'production';
    process.env.MODULEHUB_DEV_SUPER_ADMIN = '1';
    expect(isDevSuperAdminEnabled()).toBe(false);
    process.env.NODE_ENV = 'test';
  });

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
