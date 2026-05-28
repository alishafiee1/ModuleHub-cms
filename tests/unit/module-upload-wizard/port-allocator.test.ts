import { parseSiteLayout } from '../../../core/src/modules/home-layout/layout-parser';
import {
  assignNextPort,
  collectUsedPorts,
  resolveModulePort,
  validateManualPort,
} from '../../../core/src/modules/port-allocator';
import validFixture from '../../fixtures/site-layout-valid.json';

describe('port-allocator', () => {
  const layout = parseSiteLayout(validFixture);

  it('assigns next free port in range', () => {
    const used = [4100, 4101, 4103];
    expect(assignNextPort(used, 4100, 4999)).toBe(4102);
  });

  it('rejects port outside range', () => {
    expect(validateManualPort(5000, [], 4100, 4999)).toMatch(/between/);
  });

  it('rejects duplicate port', () => {
    expect(validateManualPort(4100, [4100], 4100, 4999)).toMatch(/already in use/);
  });

  it('allows port 0 for static modules', () => {
    expect(validateManualPort(0, [4100], 4100, 4999)).toBeNull();
  });

  it('auto-assigns when needsProcess and port empty', () => {
    const used = collectUsedPorts(layout);
    const port = resolveModulePort(null, true, layout, 4100, 4999);
    expect(port).toBeGreaterThanOrEqual(4100);
    expect(port).toBeLessThanOrEqual(4999);
    expect(used).not.toContain(port);
  });

  it('returns 0 when static module', () => {
    expect(resolveModulePort(null, false, layout, 4100, 4999)).toBe(0);
  });
});
