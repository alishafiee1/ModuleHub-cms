import express from 'express';
import session from 'express-session';
import { loadConfig } from './config';
import { logger } from './logger';
import { ModuleRegistry } from '../modules/registry';
import { ManifestValidator } from '../modules/manifest-validator';
import { ModuleInstaller } from '../modules/installer';
import { DockerManager } from '../docker/manager';
import { ReverseProxyManager } from '../proxy/reverse-proxy-manager';
import { SiteLayoutRegistry } from '../site-layout/registry';
import { createAdminRouter, serveDashboard } from '../admin/routes';
import { CatalogService } from '../catalog/catalog-service';
import { CatalogInstanceService } from '../catalog/catalog-instance-service';
import { ModuleSettingsService } from '../modules/module-settings-service';
import { GitSyncService } from '../sync/git-sync-service';
import { PartialUploadService } from '../modules/partial-upload-service';
import { bootstrapExistingModules, migrateLegacyStaticGallery } from '../modules/bootstrap';
import { mountPublicRoutes, mountBuiltinModules, mountStandaloneHostFiles } from '../public/routes';

/**
 * Build and configure the Express application.
 */
export function createApp(): express.Express {
  const config = loadConfig();
  const app = express();

  app.use(express.json());
  app.use(
    session({
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 86400000 },
    }),
  );

  const registry = new ModuleRegistry(config.modulesJsonPath);
  registry.load();

  const layoutRegistry = new SiteLayoutRegistry(config.siteLayoutJsonPath);
  layoutRegistry.load();

  const validator = new ManifestValidator();
  bootstrapExistingModules(config, registry, validator);
  migrateLegacyStaticGallery(registry, config);
  layoutRegistry.bootstrapFromModules(registry.getAll());

  const dockerManager = new DockerManager(config.dockerSocket);
  const proxyManager = new ReverseProxyManager(registry);
  const catalogService = new CatalogService(config);
  const catalogInstanceService = new CatalogInstanceService(
    config,
    registry,
    layoutRegistry,
    validator,
  );
  const settingsService = new ModuleSettingsService(
    registry,
    layoutRegistry,
    validator,
    dockerManager,
    proxyManager,
  );
  const gitSyncService = new GitSyncService(registry);
  const partialUploadService = new PartialUploadService(registry);

  const installer = new ModuleInstaller(
    config,
    registry,
    validator,
    layoutRegistry,
    dockerManager,
  );

  proxyManager.mount(app);
  mountStandaloneHostFiles(app, registry);
  mountBuiltinModules(app, registry);
  mountPublicRoutes(app, config, registry, layoutRegistry);

  app.use(
    '/api',
    createAdminRouter({ config, registry, installer, dockerManager, proxyManager, layoutRegistry, catalogService, catalogInstanceService, settingsService, gitSyncService, partialUploadService }),
  );
  serveDashboard(app, config);

  app.get('/logout', (req, res) => {
    req.session.destroy(() => {
      res.redirect('/');
    });
  });

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Unhandled error', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

/**
 * Start HTTP server.
 */
export function startServer(): void {
  const config = loadConfig();
  const app = createApp();
  app.listen(config.port, () => {
    logger.info('ModuleHub CMS started', { port: config.port, platform: 'ubuntu-target' });
  });
}
