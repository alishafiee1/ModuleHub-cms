import { z } from 'zod';

export const ModuleStatusSchema = z.enum(['running', 'stopped', 'static', 'error']);
export type ModuleStatus = z.infer<typeof ModuleStatusSchema>;

export const ModuleTypeSchema = z.enum(['static', 'standalone']);
export type ModuleType = z.infer<typeof ModuleTypeSchema>;

export const ManifestSchema = z.object({
  name: z.string().min(1),
  type: ModuleTypeSchema,
  version: z.string().min(1),
  icon: z.string().min(1),
  description: z.string().min(1),
  author: z.string().optional(),
  admin_role: z.string().optional(),
  docker: z
    .object({
      composeFile: z.string().default('docker-compose.yml'),
      ports: z.array(z.number().int().min(1).max(65535)).min(1),
      resources: z
        .object({
          memory: z.string().optional(),
          cpus: z.string().optional(),
        })
        .optional(),
      capabilities: z
        .object({
          add: z.array(z.string()).optional(),
          drop: z.array(z.string()).optional(),
        })
        .optional(),
    })
    .optional(),
  proxy: z
    .object({
      prefix: z.string().min(1),
      internalPort: z.number().int().min(1).max(65535),
    })
    .optional(),
  webhook: z
    .object({
      onInstall: z.string().url().optional(),
      onUninstall: z.string().url().optional(),
    })
    .optional(),
});

export type ModuleManifest = z.infer<typeof ManifestSchema>;

export interface ModuleEntry {
  id: string;
  name: string;
  type: ModuleType;
  version: string;
  icon: string;
  description: string;
  status: ModuleStatus;
  installPath: string;
  adminRole?: string;
  proxyPrefix?: string;
  internalPort?: number;
  hostPort?: number;
  containerId?: string;
  permissionsApproved?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleRegistryData {
  modules: ModuleEntry[];
}

export interface ModuleStats {
  cpuPercent: string;
  memoryUsage: string;
  memoryLimit: string;
}

export interface ValidationResult {
  valid: boolean;
  manifest?: ModuleManifest;
  moduleId?: string;
  errors: string[];
  warnings: string[];
}
