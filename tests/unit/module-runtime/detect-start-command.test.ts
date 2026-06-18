import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { detectBackendStartCommand } from '../../../core/src/modules/module-manager/detect-start-command';

describe('detect-start-command', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'modulehub-start-command-'));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('detects Python app.py when requirements.txt exists', async () => {
    await fs.writeFile(path.join(tempDir, 'requirements.txt'), 'flask==3.0.0\n');
    await fs.writeFile(path.join(tempDir, 'app.py'), 'print("ok")\n');

    const command = await detectBackendStartCommand(tempDir);

    expect(command.args).toEqual(['app.py']);
    expect(command.executable).toContain(path.join('venv'));
    expect(command.shellCommand).toContain('app.py');
  });

  it('reports Python entry files in the missing command error', async () => {
    await fs.writeFile(path.join(tempDir, 'requirements.txt'), 'flask==3.0.0\n');

    await expect(detectBackendStartCommand(tempDir)).rejects.toThrow('Python app.py/main.py/wsgi.py');
  });
});
