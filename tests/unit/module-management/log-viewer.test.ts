import { readLogTailFromText } from '../../../core/src/modules/module-management/log-viewer';

describe('log-viewer', () => {
  it('returns last N lines from multiline text', () => {
    const text = 'line1\nline2\nline3\nline4\nline5';
    expect(readLogTailFromText(text, 3)).toBe('line3\nline4\nline5');
  });

  it('returns empty string for empty log', () => {
    expect(readLogTailFromText('', 50)).toBe('');
  });

  it('returns all lines when fewer than max', () => {
    expect(readLogTailFromText('only-one', 50)).toBe('only-one');
  });

  it('defaults to at least one line when maxLines is zero', () => {
    const text = 'a\nb\nc';
    expect(readLogTailFromText(text, 0)).toBe('c');
  });
});
