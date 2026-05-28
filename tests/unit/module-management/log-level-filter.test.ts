import {
  filterLogLinesByLevel,
  parseModuleLogLineLevel,
} from '../../../core/src/modules/module-management/log-level-filter';

describe('log-level-filter', () => {
  const sampleLog = [
    '2026-01-01T00:00:00.000Z [info] started',
    '2026-01-01T00:00:01.000Z [error] crash',
    '2026-01-01T00:00:02.000Z [debug] trace',
    'legacy line without level marker',
  ].join('\n');

  it('parses module log line levels', () => {
    expect(parseModuleLogLineLevel('[info] hello')).toBe('info');
    expect(parseModuleLogLineLevel('2026 [ERROR] boom')).toBe('error');
    expect(parseModuleLogLineLevel('no level here')).toBeNull();
  });

  it('filters lines by level while keeping unmarked lines', () => {
    const filtered = filterLogLinesByLevel(sampleLog, 'error');
    expect(filtered).toContain('[error] crash');
    expect(filtered).not.toContain('[info] started');
    expect(filtered).toContain('legacy line without level marker');
  });

  it('returns all lines when filter is null', () => {
    expect(filterLogLinesByLevel(sampleLog, null)).toBe(sampleLog);
  });
});
