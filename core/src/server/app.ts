import express from 'express';
import session from 'express-session';
import { loadConfig } from './config';
import { logger } from './logger';
import { ModuleRegistry } from '../modules/registry';
import { ManifestValidator } from '../modules/manifest-validator';
import { ModuleInstaller } from '../modules/installer';
import { DockerManager } from '../docker/manager';
import { ReverseProxyManager } from '../proxy/reverse-proxy-manager';
import { createAdminRouter, mountStaticModules, serveDashboard } from '../admin/routes';
import { bootstrapExistingModules } from '../modules/bootstrap';

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

  const validator = new ManifestValidator();
  bootstrapExistingModules(config, registry, validator);
  const installer = new ModuleInstaller(config, registry, validator);
  const dockerManager = new DockerManager(config.dockerSocket);
  const proxyManager = new ReverseProxyManager(registry);

  proxyManager.mount(app);
  mountStaticModules(app, config, registry);

  app.use('/api', createAdminRouter({ config, registry, installer, dockerManager, proxyManager }));
  serveDashboard(app, config);

  app.get('/', (_req, res) => {
    res.redirect('/admin');
  });

  app.get('/logout', (req, res) => {
    req.session.destroy(() => {
      res.redirect('/admin');
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
