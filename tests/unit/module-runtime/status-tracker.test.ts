import { parseSiteLayout } from '../../../core/src/modules/home-layout/layout-parser';
import { setModuleStatusInLayout, markModuleCrashed } from '../../../core/src/modules/module-manager/status-tracker';
import validFixture from '../../fixtures/site-layout-valid.json';

describe('status-tracker', () => {
  it('updates status and updatedAt', () => {
    const layout = parseSiteLayout(validFixture);
    const before = layout.modules['mod-2'].updatedAt;
    setModuleStatusInLayout(layout, 'mod-2', 'running');
    expect(layout.modules['mod-2'].status).toBe('running');
    expect(layout.modules['mod-2'].updatedAt).not.toBe(before);
  });

  it('marks module crashed', () => {
    const layout = parseSiteLayout(validFixture);
    setModuleStatusInLayout(layout, 'mod-1', 'running');
    markModuleCrashed(layout, 'mod-1');
    expect(layout.modules['mod-1'].status).toBe('crashed');
  });

  it('rejects unknown module id', () => {
    const layout = parseSiteLayout(validFixture);
    expect(() => setModuleStatusInLayout(layout, 'missing-id', 'running')).toThrow(/not found/);
  });
});
