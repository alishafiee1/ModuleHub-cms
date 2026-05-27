import { canTransitionModuleStatus, assertModuleStatusTransition } from '../core/src/modules/lifecycle';

describe('module lifecycle transitions', () => {
  it('allows upload flow installing → settings_pending → running', () => {
    expect(canTransitionModuleStatus('installing', 'settings_pending')).toBe(true);
    expect(canTransitionModuleStatus('settings_pending', 'running')).toBe(true);
  });

  it('rejects legacy stopped → running without settings when invalid path', () => {
    expect(canTransitionModuleStatus('static', 'running')).toBe(false);
  });

  it('throws on invalid transition', () => {
    expect(() => assertModuleStatusTransition('static', 'running')).toThrow(/Invalid module status/);
  });
});
