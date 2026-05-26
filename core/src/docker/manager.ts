import { exec } from 'child_process';
import { promisify } from 'util';
import Docker, { ContainerInfo } from 'dockerode';
import { ModuleEntry, ModuleStats } from '../modules/types';
import { logger } from '../server/logger';

const execAsync = promisify(exec);

export interface DockerStartResult {
  success: boolean;
  hostPort?: number;
  containerId?: string;
  error?: string;
}

/**
 * Docker lifecycle manager for standalone modules on Ubuntu.
 */
export class DockerManager {
  private readonly docker: Docker;

  constructor(dockerSocket: string) {
    this.docker = new Docker({ socketPath: dockerSocket.replace('unix://', '') });
  }

  /**
   * Start module via docker compose up -d.
   */
  async startModule(module: ModuleEntry): Promise<DockerStartResult> {
    try {
      await execAsync('docker compose up -d --build', { cwd: module.installPath });
      const port = await this.discoverHostPort(module);
      const containerId = await this.findContainerId(module.installPath);
      return { success: true, hostPort: port, containerId };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error('Docker start failed', error, { moduleId: module.id });
      return { success: false, error: msg };
    }
  }

  /**
   * Stop module via docker compose down.
   */
  async stopModule(module: ModuleEntry): Promise<boolean> {
    try {
      await execAsync('docker compose down', { cwd: module.installPath });
      return true;
    } catch (error) {
      logger.error('Docker stop failed', error, { moduleId: module.id });
      return false;
    }
  }

  /**
   * Discover mapped host port for internal port.
   */
  async discoverHostPort(module: ModuleEntry): Promise<number | undefined> {
    const containers = await this.docker.listContainers({ all: false });
    const match = containers.find((c: ContainerInfo) =>
      c.Labels?.['com.docker.compose.project.working_dir'] === module.installPath ||
      c.Names.some((n: string) => n.includes(module.id)),
    );
    if (!match || !module.internalPort) return undefined;

    const inspect = await this.docker.getContainer(match.Id).inspect();
    const bindings = inspect.NetworkSettings.Ports[`${module.internalPort}/tcp`];
    if (bindings?.[0]?.HostPort) {
      return Number(bindings[0].HostPort);
    }
    return undefined;
  }

  /**
   * Get container stats for module.
   */
  async getStats(containerId: string): Promise<ModuleStats | null> {
    try {
      const container = this.docker.getContainer(containerId);
      const stream = await container.stats({ stream: false });
      const cpuDelta =
        stream.cpu_stats.cpu_usage.total_usage - (stream.precpu_stats.cpu_usage?.total_usage ?? 0);
      const systemDelta =
        stream.cpu_stats.system_cpu_usage - (stream.precpu_stats.system_cpu_usage ?? 0);
      const cpuCount = stream.cpu_stats.online_cpus ?? 1;
      const cpuPercent = systemDelta > 0
        ? ((cpuDelta / systemDelta) * cpuCount * 100).toFixed(2)
        : '0.00';
      const memUsage = stream.memory_stats.usage ?? 0;
      const memLimit = stream.memory_stats.limit ?? 1;
      return {
        cpuPercent: `${cpuPercent}%`,
        memoryUsage: `${Math.round(memUsage / 1024 / 1024)}MiB`,
        memoryLimit: `${Math.round(memLimit / 1024 / 1024)}MiB`,
      };
    } catch {
      return null;
    }
  }

  /**
   * Fetch recent container logs.
   */
  async getLogs(module: ModuleEntry, lines = 100): Promise<string> {
    try {
      const { stdout } = await execAsync(`docker compose logs --tail=${lines}`, {
        cwd: module.installPath,
      });
      return stdout;
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  }

  private async findContainerId(installPath: string): Promise<string | undefined> {
    const containers = await this.docker.listContainers({ all: false });
    const match = containers.find(
      (c: ContainerInfo) => c.Labels?.['com.docker.compose.project.working_dir'] === installPath,
    );
    return match?.Id;
  }
}
