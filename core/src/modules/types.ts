import { z } from 'zod';

export const ModuleStatusSchema = z.enum([
  'running',
  'stopped',
  'static',
  'error',
  'settings_pending',
  'installing',
]);
export type ModuleStatus = z.infer<typeof ModuleStatusSchema>;

export const ModuleTypeSchema = z.enum(['builtin', 'standalone', 'static', 'instance']);
export type ModuleType = z.infer<typeof ModuleTypeSchema>;

export const ManifestTypeSchema = z.enum(['builtin', 'standalone', 'instance']);
export type ManifestType = z.infer<typeof ManifestTypeSchema>;

export const ManifestSchema = z.object({
  name: z.string().min(1),
  type: ManifestTypeSchema,
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
      paths: z.array(z.string()).optional(),
    })
    .optional(),
  webhook: z
    .object({
      onInstall: z.string().url().optional(),
      onUninstall: z.string().url().optional(),
    })
    .optional(),
  github: z
    .object({
      repo: z.string().url(),
      branch: z.string().optional(),
    })
    .optional(),
  entryHtml: z.string().min(1).optional(),
  modulePasswordHash: z.string().min(1).nullable().optional(),
});

export type ModuleManifest = z.infer<typeof ManifestSchema>;

export const ModuleEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: ModuleTypeSchema,
  version: z.string().min(1),
  icon: z.string().min(1),
  description: z.string().min(1),
  status: ModuleStatusSchema,
  installPath: z.string().min(1),
  adminRole: z.string().optional(),
  proxyPrefix: z.string().optional(),
  proxyPaths: z.array(z.string()).optional(),
  internalPort: z.number().int().optional(),
  hostPort: z.number().int().optional(),
  containerId: z.string().optional(),
  /** @deprecated Legacy approve flow — settings save sets this; no runtime gate. */
  permissionsApproved: z.boolean().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type ModuleEntry = z.infer<typeof ModuleEntrySchema>;

export const ModuleRegistrySchema = z.object({
  modules: z.array(ModuleEntrySchema),
});

export type ModuleRegistryData = z.infer<typeof ModuleRegistrySchema>;

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
