import { buildSystemdRunArguments } from '../../../core/src/modules/module-manager/backend-runner';
import type { BackendStartCommand } from '../../../core/src/modules/module-manager/detect-start-command';
import type { ModuleEntry } from '../../../core/src/modules/home-layout/types';

describe('backend-runner systemd args', () => {
  const entry: ModuleEntry = {
    name: 'Test backend',
    status: 'stopped',
    version: '1.0.0',
    docker: false,
    port: 4123,
    permissions: 'network',
    resources: {
      cpu_limit: 0.5,
      ram_limit_mb: 512,
      swap_limit_mb: 128,
      disk_iops: 100,
      net_mbps: 10,
    },
    icon: 'fas fa-server',
    thumbnail: '',
  };

  const startCommand: BackendStartCommand = {
    executable: 'node',
    args: ['server.js'],
    shellCommand: 'node server.js',
  };

  it('includes Environment=PORT for systemd-run', () => {
    const args = buildSystemdRunArguments(
      'modulehub-mod-test',
      '/opt/modulehub-cms/standalone-modules/mod-test',
      entry,
      startCommand,
    );

    expect(args).toContain('-p');
    expect(args).toContain('Environment=PORT=4123');
    expect(args[args.length - 2]).toBe('node');
    expect(args[args.length - 1]).toBe('server.js');
  });
});
