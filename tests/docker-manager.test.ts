import { DockerManager } from '../core/src/docker/manager';
import { ModuleEntry } from '../core/src/modules/types';

jest.mock('dockerode', () => {
  return jest.fn().mockImplementation(() => ({
    listContainers: jest.fn().mockResolvedValue([
      {
        Id: 'abc123',
        Names: ['/demo-api-app-1'],
        Labels: { 'com.docker.compose.project.working_dir': '/opt/demo-api' },
      },
    ]),
    getContainer: jest.fn().mockReturnValue({
      inspect: jest.fn().mockResolvedValue({
        NetworkSettings: {
          Ports: { '3000/tcp': [{ HostPort: '32775' }] },
        },
      }),
      stats: jest.fn().mockResolvedValue({
        cpu_stats: { cpu_usage: { total_usage: 200 }, online_cpus: 1, system_cpu_usage: 1000 },
        precpu_stats: { cpu_usage: { total_usage: 100 }, system_cpu_usage: 500 },
        memory_stats: { usage: 52428800, limit: 268435456 },
      }),
    }),
  }));
});

jest.mock('child_process', () => ({
  exec: jest.fn((_cmd: string, _opts: unknown, cb: (err: null, result: { stdout: string }) => void) => {
    cb(null, { stdout: 'started' });
  }),
}));

describe('DockerManager', () => {
  const mod: ModuleEntry = {
    id: 'demo-api',
    name: 'Demo',
    type: 'standalone',
    version: '1',
    icon: 'i',
    description: 'd',
    status: 'stopped',
    installPath: '/opt/demo-api',
    internalPort: 3000,
    createdAt: '',
    updatedAt: '',
  };

  it('discovers host port from container inspect', async () => {
    const manager = new DockerManager('unix:///var/run/docker.sock');
    const port = await manager.discoverHostPort(mod);
    expect(port).toBe(32775);
  });

  it('returns stats for container', async () => {
    const manager = new DockerManager('unix:///var/run/docker.sock');
    const stats = await manager.getStats('abc123');
    expect(stats?.cpuPercent).toBeDefined();
    expect(stats?.memoryUsage).toContain('MiB');
  });
});
