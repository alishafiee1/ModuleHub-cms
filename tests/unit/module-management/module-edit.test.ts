import { parseSiteLayout } from '../../../core/src/modules/home-layout/layout-parser';
import { applyModuleEdit } from '../../../core/src/modules/module-management/module-edit';
import validFixture from '../../fixtures/site-layout-valid.json';

describe('module-edit', () => {
  it('updates resources and version in layout', async () => {
    const layout = parseSiteLayout(validFixture);
    const moduleId = 'mod-1';

    const updated = await applyModuleEdit(layout, moduleId, {
      name: 'Updated Name',
      version: '2.0.0',
      resources: { ram_limit_mb: 1024 },
    });

    expect(updated.modules[moduleId].name).toBe('Updated Name');
    expect(updated.modules[moduleId].version).toBe('2.0.0');
    expect(updated.modules[moduleId].resources.ram_limit_mb).toBe(1024);
    expect(updated.modules[moduleId].updatedAt).toBeDefined();
  });

  it('stores bcrypt hash when management password is set', async () => {
    const layout = parseSiteLayout(validFixture);
    const moduleId = 'mod-1';

    const updated = await applyModuleEdit(layout, moduleId, {
      managementPasswordPlain: 'secret-module-pass',
    });

    const hash = updated.modules[moduleId].managementPasswordHash;
    expect(hash).toBeDefined();
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it('throws when module id is missing from layout', async () => {
    const layout = parseSiteLayout(validFixture);
    await expect(
      applyModuleEdit(layout, 'mod-nonexistent', { name: 'X' }),
    ).rejects.toThrow('not found');
  });
});
