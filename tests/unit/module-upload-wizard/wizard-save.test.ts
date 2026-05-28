import { parseSiteLayout } from '../../../core/src/modules/home-layout/layout-parser';
import { DEFAULT_SYSTEM_SETTINGS } from '../../../core/src/modules/system-settings';
import { registerModuleInLayout } from '../../../core/src/modules/module-upload-wizard/wizard-save';
import validFixture from '../../fixtures/site-layout-valid.json';

describe('wizard-save', () => {
  it('registers module with version 1.0.0 and status stopped', () => {
    const layout = parseSiteLayout(validFixture);
    const moduleId = 'mod-test-new';

    const result = registerModuleInLayout(layout, DEFAULT_SYSTEM_SETTINGS, {
      moduleId,
      parentId: 'root',
      name: 'Test Module',
      docker: false,
      port: null,
      permissions: 'network',
      resources: DEFAULT_SYSTEM_SETTINGS.defaultModuleResources,
      icon: 'fas fa-cube',
      thumbnail: '',
      needsProcess: true,
    });

    expect(result.entry.version).toBe('1.0.0');
    expect(result.entry.status).toBe('stopped');
    expect(result.layout.modules[moduleId]).toBeDefined();
    const rootChildren = result.layout.tree.children ?? [];
    expect(rootChildren.some((child) => child.moduleId === moduleId)).toBe(true);
  });
});
