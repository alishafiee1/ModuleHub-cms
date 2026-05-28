import {
  canAutoRestartModule,
  clearAutoRestartAttemptsForTests,
  pruneAttemptsWithinHour,
  recordAutoRestartAttempt,
} from '../../../core/src/modules/module-manager/auto-restart-tracker';

describe('auto-restart', () => {
  beforeEach(() => {
    clearAutoRestartAttemptsForTests();
  });

  it('prunes attempts older than one hour', () => {
    const now = Date.now();
    const attempts = [now - 2 * 60 * 60 * 1000, now - 30 * 60 * 1000];
    const recent = pruneAttemptsWithinHour(attempts, now);
    expect(recent).toHaveLength(1);
  });

  it('blocks restart when hourly limit reached', () => {
    const moduleId = 'mod-test';
    const now = Date.now();
    recordAutoRestartAttempt(moduleId, now - 1000);
    recordAutoRestartAttempt(moduleId, now - 2000);
    recordAutoRestartAttempt(moduleId, now - 3000);
    expect(canAutoRestartModule(moduleId, 3, now)).toBe(false);
    expect(canAutoRestartModule(moduleId, 4, now)).toBe(true);
  });
});
