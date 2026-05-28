import type { ModuleResources } from '../home-layout/types';

/** systemd-run property flags derived from module resources */
export interface SystemdResourceProperties {
  cpuQuotaPercent: number;
  memoryMaxMb: number;
  memorySwapMaxMb: number;
  ioWeight: number;
}

/** docker run CLI limit flags */
export interface DockerResourceFlags {
  cpus: number;
  memoryMb: number;
  memorySwapMb: number;
  blkioWeight: number;
  netMbps?: number;
}

/** Input for building limit arguments */
export interface ResourceLimitInput {
  resources: ModuleResources;
}
