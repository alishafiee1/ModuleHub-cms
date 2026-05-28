import {
  buildDockerResourceFlags,
  buildSystemdResourceProperties,
} from '../../../core/src/modules/resource-limiter';

describe('resource-limiter', () => {
  const resources = {
    cpu_limit: 0.5,
    ram_limit_mb: 512,
    swap_limit_mb: 128,
    disk_iops: 100,
    net_mbps: 10,
  };

  it('builds systemd properties from module resources', () => {
    const props = buildSystemdResourceProperties(resources);
    expect(props.cpuQuotaPercent).toBe(50);
    expect(props.memoryMaxMb).toBe(512);
    expect(props.memorySwapMaxMb).toBe(640);
    expect(props.ioWeight).toBe(50);
  });

  it('builds docker flags including network limit', () => {
    const flags = buildDockerResourceFlags(resources);
    expect(flags.cpus).toBe(0.5);
    expect(flags.memoryMb).toBe(512);
    expect(flags.netMbps).toBe(10);
  });
});
