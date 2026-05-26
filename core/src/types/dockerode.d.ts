declare module 'dockerode' {
  import { EventEmitter } from 'events';

  export interface ContainerInfo {
    Id: string;
    Names: string[];
    Labels?: Record<string, string>;
  }

  export interface ContainerInspectInfo {
    NetworkSettings: {
      Ports: Record<string, Array<{ HostPort: string }> | null>;
    };
  }

  export interface ContainerStats {
    cpu_stats: {
      cpu_usage: { total_usage: number };
      online_cpus?: number;
      system_cpu_usage: number;
    };
    precpu_stats: {
      cpu_usage?: { total_usage: number };
      system_cpu_usage?: number;
    };
    memory_stats: { usage?: number; limit?: number };
  }

  export interface Container {
    inspect(): Promise<ContainerInspectInfo>;
    stats(options: { stream: false }): Promise<ContainerStats>;
  }

  export default class Dockerode extends EventEmitter {
    constructor(options: { socketPath: string });
    listContainers(options?: { all?: boolean }): Promise<ContainerInfo[]>;
    getContainer(id: string): Container;
  }
}
