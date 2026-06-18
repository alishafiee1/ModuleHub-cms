import { buildPipInstallCommand } from '../../../core/src/modules/package-cache/network-install';

describe('network-install commands', () => {
  it('builds a pip install command for the current platform', () => {
    const command = buildPipInstallCommand();

    expect(command).toContain('-m venv venv');
    expect(command).toContain('pip');
    expect(command).toContain('requirements.txt');
    if (process.platform === 'win32') {
      expect(command).toContain('venv\\Scripts\\pip.exe');
    } else {
      expect(command).toContain('./venv/bin/pip');
    }
  });
});
