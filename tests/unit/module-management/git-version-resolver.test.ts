import { stripGitTagVersionPrefix } from '../../../core/src/modules/module-management/git-version-resolver';

describe('git-version-resolver', () => {
  it('strips leading v prefix from git tags', () => {
    expect(stripGitTagVersionPrefix('v1.2.3')).toBe('1.2.3');
    expect(stripGitTagVersionPrefix('V2.0.0')).toBe('2.0.0');
    expect(stripGitTagVersionPrefix('1.0.0')).toBe('1.0.0');
  });
});
