import { parseSiteLayout } from '../../../core/src/modules/home-layout/layout-parser';
import {
  removeModuleFromLayout,
} from '../../../core/src/modules/module-management/module-delete';
import {
  isValidModuleId,
} from '../../../core/src/modules/module-management/module-id-validator';
import validFixture from '../../fixtures/site-layout-valid.json';

describe('module-delete', () => {
  it('validates module id format', () => {
    expect(isValidModuleId('mod-abc123')).toBe(true);
    expect(isValidModuleId('mod-static')).toBe(true);
    expect(isValidModuleId('invalid')).toBe(false);
    expect(isValidModuleId('mod-')).toBe(false);
  });

  it('removes module from layout tree and modules map', () => {
    const layout = parseSiteLayout(validFixture);
    const moduleId = 'mod-1';

    const updated = removeModuleFromLayout(layout, moduleId);
    expect(updated.modules[moduleId]).toBeUndefined();

    const rootChildren = updated.tree.children ?? [];
    expect(rootChildren.some((child) => child.moduleId === moduleId)).toBe(false);
  });

  it('throws when deleting unknown module', () => {
    const layout = parseSiteLayout(validFixture);
    expect(() => removeModuleFromLayout(layout, 'mod-unknown999')).toThrow('not found');
  });
});
