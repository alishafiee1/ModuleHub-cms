import { canManageModule, filterModulesByRole } from '../core/src/auth/session';
import { ModuleEntry } from '../core/src/modules/types';

const base: ModuleEntry = {
  id: 'm1',
  name: 'M',
  type: 'builtin',
  version: '1',
  icon: 'i',
  description: 'd',
  status: 'static',
  installPath: '/x',
  createdAt: '',
  updatedAt: '',
};

describe('Role access control', () => {
  it('admin can manage all modules', () => {
    expect(canManageModule('admin', { ...base, adminRole: 'robot_engineer' })).toBe(true);
  });

  it('user cannot manage restricted module', () => {
    expect(canManageModule('editor', { ...base, adminRole: 'robot_engineer' })).toBe(false);
  });

  it('user can manage module without admin_role', () => {
    expect(canManageModule('editor', base)).toBe(true);
  });

  it('filters modules by role', () => {
    const modules: ModuleEntry[] = [
      base,
      { ...base, id: 'm2', adminRole: 'robot_engineer' },
      { ...base, id: 'm3', adminRole: 'editor' },
    ];
    const filtered = filterModulesByRole(modules, 'editor');
    expect(filtered.map((m) => m.id)).toEqual(['m1', 'm3']);
  });
});
