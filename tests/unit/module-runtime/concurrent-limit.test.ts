import { parseSiteLayout } from '../../../core/src/modules/home-layout/layout-parser';
import type { SiteLayoutDocument } from '../../../core/src/modules/home-layout/types';
import {
  countRunningModules,
  isValidStatusTransition,
  validateConcurrentStartLimit,
} from '../../../core/src/modules/module-manager/concurrent-limit';

function buildTestLayout(
  moduleStatuses: Record<string, 'running' | 'stopped' | 'crashed'>,
): SiteLayoutDocument {
  const modules = Object.fromEntries(
    Object.entries(moduleStatuses).map(([moduleId, status]) => [
      moduleId,
      {
        name: moduleId,
        status,
        version: '1.0.0',
        docker: false,
        port: 4100,
        permissions: 'network',
        resources: {
          cpu_limit: 0.5,
          ram_limit_mb: 512,
          swap_limit_mb: 128,
          disk_iops: 100,
          net_mbps: 10,
        },
        icon: 'fas fa-cube',
        thumbnail: '',
      },
    ]),
  );

  return parseSiteLayout({
    version: '1.0',
    tree: {
      id: 'root',
      name: 'Home',
      type: 'folder',
      parentId: null,
      children: [],
    },
    modules,
  });
}

describe('concurrent-limit', () => {
  const layout = buildTestLayout({
    'mod-running': 'running',
    'mod-stopped': 'stopped',
  });

  it('counts running modules', () => {
    expect(countRunningModules(layout)).toBe(1);
  });

  it('rejects start when limit reached', () => {
    const fullLayout = buildTestLayout({
      'mod-a': 'running',
      'mod-b': 'running',
      'mod-c': 'stopped',
    });
    const error = validateConcurrentStartLimit(fullLayout, 2, 'mod-c');
    expect(error).toMatch(/Maximum concurrent/);
  });

  it('allows start when below limit', () => {
    expect(validateConcurrentStartLimit(layout, 10, 'mod-stopped')).toBeNull();
  });

  it('validates status transitions', () => {
    expect(isValidStatusTransition('stopped', 'running')).toBe(true);
    expect(isValidStatusTransition('running', 'crashed')).toBe(true);
    expect(isValidStatusTransition('stopped', 'crashed')).toBe(true);
    expect(isValidStatusTransition('stopped', 'stopped')).toBe(true);
  });
});
