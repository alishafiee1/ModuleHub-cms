import { parseSiteLayout } from '../../../core/src/modules/home-layout/layout-parser';
import {
  countRunningModules,
  isValidStatusTransition,
  validateConcurrentStartLimit,
} from '../../../core/src/modules/module-manager/concurrent-limit';
import validFixture from '../../fixtures/site-layout-valid.json';

describe('concurrent-limit', () => {
  const layout = parseSiteLayout(validFixture);

  it('counts running modules', () => {
    expect(countRunningModules(layout)).toBe(1);
  });

  it('rejects start when limit reached', () => {
    const fullLayout = parseSiteLayout({
      ...validFixture,
      modules: {
        ...validFixture.modules,
        'mod-a': { ...validFixture.modules['mod-1'], status: 'running' },
        'mod-b': { ...validFixture.modules['mod-2'], status: 'running' },
      },
    });
    const error = validateConcurrentStartLimit(fullLayout, 2, 'mod-3');
    expect(error).toMatch(/Maximum concurrent/);
  });

  it('allows start when below limit', () => {
    expect(validateConcurrentStartLimit(layout, 10, 'mod-2')).toBeNull();
  });

  it('validates status transitions', () => {
    expect(isValidStatusTransition('stopped', 'running')).toBe(true);
    expect(isValidStatusTransition('running', 'crashed')).toBe(true);
    expect(isValidStatusTransition('stopped', 'crashed')).toBe(true);
    expect(isValidStatusTransition('stopped', 'stopped')).toBe(true);
  });
});
