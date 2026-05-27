import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export interface AppConfig {
  port: number;
  adminPassword: string;
  adminRole: string;
  sessionSecret: string;
  modulesJsonPath: string;
  siteLayoutJsonPath: string;
  builtinModulesDir: string;
  catalogModulesDir: string;
  staticModulesDir: string;
  standaloneModulesDir: string;
  dockerSocket: string;
  projectRoot: string;
}

/**
 * Load application configuration from environment variables.
 */
export function loadConfig(): AppConfig {
  const projectRoot = path.resolve(process.cwd());
  return {
    port: Number(process.env.PORT ?? 4000),
    adminPassword: process.env.ADMIN_PASSWORD ?? 'change-me',
    adminRole: process.env.ADMIN_ROLE ?? 'admin',
    sessionSecret: process.env.SESSION_SECRET ?? 'dev-secret',
    modulesJsonPath: process.env.MODULES_JSON_PATH ?? path.join(projectRoot, 'data', 'modules.json'),
    siteLayoutJsonPath: process.env.SITE_LAYOUT_JSON_PATH ?? path.join(projectRoot, 'data', 'site-layout.json'),
    builtinModulesDir: process.env.BUILTIN_MODULES_DIR ?? path.join(projectRoot, 'core', 'builtin-modules'),
    catalogModulesDir: process.env.CATALOG_MODULES_DIR ?? path.join(projectRoot, 'core', 'catalog-modules'),
    staticModulesDir: process.env.STATIC_MODULES_DIR ?? path.join(projectRoot, 'static-modules'),
    standaloneModulesDir: process.env.STANDALONE_MODULES_DIR ?? path.join(projectRoot, 'standalone-modules'),
    dockerSocket: process.env.DOCKER_SOCKET ?? 'unix:///var/run/docker.sock',
    projectRoot,
  };
}
