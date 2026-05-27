import fs from 'fs';
import os from 'os';
import path from 'path';
import { GitSyncService } from '../core/src/sync/git-sync-service';
import { ModuleRegistry } from '../core/src/modules/registry';

describe('GitSyncService', () => {
  let tmpDir: string;
  let registry: ModuleRegistry;
  let moduleDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-git-'));
    moduleDir = path.join(tmpDir, 'standalone-modules', 'demo-api');
    fs.mkdirSync(moduleDir, { recursive: true });
    fs.writeFileSync(
      path.join(moduleDir, 'manifest.json'),
      JSON.stringify({
        name: 'Demo API',
        type: 'standalone',
        version: '1.0.0',
        icon: 'a.png',
        description: 'API',
        github: { repo: 'https://github.com/org/demo-api', branch: 'main' },
        docker: { composeFile: 'docker-compose.yml', ports: [3000] },
        proxy: { prefix: '/modules/demo-api/', internalPort: 3000 },
      }),
    );
    fs.mkdirSync(path.join(moduleDir, 'images'), { recursive: true });
    fs.writeFileSync(path.join(moduleDir, 'images', 'keep.jpg'), 'local-image');

    registry = new ModuleRegistry(path.join(tmpDir, 'modules.json'));
    registry.upsert({
      id: 'demo-api',
      name: 'Demo API',
      type: 'standalone',
      version: '1.0.0',
      icon: 'a.png',
      description: 'API',
      status: 'running',
      installPath: moduleDir,
      createdAt: '',
      updatedAt: '',
    });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns 503-equivalent when git binary missing', async () => {
    const execMock = jest.fn().mockRejectedValue(new Error('git not found'));
    const service = new GitSyncService(registry, execMock as never);
    const result = await service.pull('demo-api');
    expect(result.success).toBe(false);
    expect(result.gitMissing).toBe(true);
  });

  it('pull preserves protected images directory after reset', async () => {
    const execMock = jest.fn(async (cmd: string, args: string[]) => {
      if (cmd === 'git' && args[0] === '--version') {
        return { stdout: 'git version 2.0', stderr: '' };
      }
      if (cmd === 'git' && args[0] === 'fetch') {
        return { stdout: '', stderr: '' };
      }
      if (cmd === 'git' && args[0] === 'reset') {
        fs.writeFileSync(path.join(moduleDir, 'index.html'), '<html>remote</html>');
        if (fs.existsSync(path.join(moduleDir, 'images'))) {
          fs.rmSync(path.join(moduleDir, 'images'), { recursive: true, force: true });
        }
        return { stdout: 'HEAD is now', stderr: '' };
      }
      throw new Error(`unexpected exec ${cmd} ${args.join(' ')}`);
    });

    fs.mkdirSync(path.join(moduleDir, '.git'));
    const service = new GitSyncService(registry, execMock as never);
    const result = await service.pull('demo-api');
    expect(result.success).toBe(true);
    expect(fs.readFileSync(path.join(moduleDir, 'images', 'keep.jpg'), 'utf-8')).toBe('local-image');
  });

  it('rejects pull when github repo missing', async () => {
    fs.writeFileSync(
      path.join(moduleDir, 'manifest.json'),
      JSON.stringify({
        name: 'Demo API',
        type: 'standalone',
        version: '1.0.0',
        icon: 'a.png',
        description: 'API',
      }),
    );
    const service = new GitSyncService(registry);
    const result = await service.pull('demo-api');
    expect(result.success).toBe(false);
    expect(result.errors[0]).toMatch(/github/i);
  });
});
