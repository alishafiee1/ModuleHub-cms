import type { ModuleResources } from '../home-layout/types';
import type { DockerResourceFlags, SystemdResourceProperties } from './types';

const MIN_CPU = 0.1;
const MAX_CPU = 2;
const MIN_RAM_MB = 128;
const MAX_RAM_MB = 4096;
const DEFAULT_IO_WEIGHT = 50;
const DOCKER_BLKIO_SCALE = 10;

/**
 * Clamps CPU cores to the allowed wizard range.
 * @param cpuLimit - Requested CPU share in cores
 * @returns Clamped value
 */
export function clampCpuLimit(cpuLimit: number): number {
  if (!Number.isFinite(cpuLimit)) {
    return MIN_CPU;
  }
  return Math.min(MAX_CPU, Math.max(MIN_CPU, cpuLimit));
}

/**
 * Clamps RAM megabytes to the allowed range.
 * @param ramMb - Requested RAM in MB
 * @returns Clamped value
 */
export function clampRamMb(ramMb: number): number {
  if (!Number.isFinite(ramMb)) {
    return MIN_RAM_MB;
  }
  return Math.min(MAX_RAM_MB, Math.max(MIN_RAM_MB, ramMb));
}

/**
 * Builds systemd-run cgroup properties from module resources.
 * @param resources - Module resource limits from site-layout
 * @returns Properties for systemd-run -p flags
 */
export function buildSystemdResourceProperties(resources: ModuleResources): SystemdResourceProperties {
  const cpuLimit = clampCpuLimit(resources.cpu_limit);
  const memoryMaxMb = clampRamMb(resources.ram_limit_mb);
  const swapMb = clampRamMb(resources.swap_limit_mb ?? 0);
  const ioWeight = resources.disk_iops
    ? Math.min(1000, Math.max(1, Math.round(resources.disk_iops / 2)))
    : DEFAULT_IO_WEIGHT;

  return {
    cpuQuotaPercent: Math.round(cpuLimit * 100),
    memoryMaxMb,
    memorySwapMaxMb: memoryMaxMb + swapMb,
    ioWeight,
  };
}

/**
 * Builds docker run resource flags from module resources.
 * @param resources - Module resource limits from site-layout
 * @returns Docker CLI limit values
 */
export function buildDockerResourceFlags(resources: ModuleResources): DockerResourceFlags {
  const cpus = clampCpuLimit(resources.cpu_limit);
  const memoryMb = clampRamMb(resources.ram_limit_mb);
  const swapMb = clampRamMb(resources.swap_limit_mb ?? 0);
  const blkioWeight = resources.disk_iops
    ? Math.min(1000, Math.max(10, resources.disk_iops * DOCKER_BLKIO_SCALE))
    : 500;

  const flags: DockerResourceFlags = {
    cpus,
    memoryMb,
    memorySwapMb: memoryMb + swapMb,
    blkioWeight,
  };

  if (resources.net_mbps && resources.net_mbps > 0) {
    flags.netMbps = resources.net_mbps;
  }

  return flags;
}
