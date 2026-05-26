import path from 'path';
import fs from 'fs';
import { Router, Express, Request, Response } from 'express';
import multer from 'multer';
import { AppConfig } from '../server/config';
import { ModuleRegistry } from '../modules/registry';
import { ModuleInstaller } from '../modules/installer';
import { DockerManager } from '../docker/manager';
import { ReverseProxyManager } from '../proxy/reverse-proxy-manager';
import { SiteLayoutRegistry } from '../site-layout/registry';
import { filterModulesByRole, requireAuth, requireModuleAccess } from '../auth/session';
import { logger } from '../server/logger';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

export interface AdminRouterDeps {
  config: AppConfig;
  registry: ModuleRegistry;
  installer: ModuleInstaller;
  dockerManager: DockerManager;
  proxyManager: ReverseProxyManager;
  layoutRegistry: SiteLayoutRegistry;
}

/**
 * Create admin API and dashboard routes.
 */
export function createAdminRouter(deps: AdminRouterDeps): Router {
  const router = Router();
  const { config, registry, installer, dockerManager, proxyManager, layoutRegistry } = deps;

  router.post('/login', (req: Request, res: Response) => {
    const { password } = req.body as { password?: string };
    if (password === config.adminPassword) {
      req.session.authenticated = true;
      req.session.role = config.adminRole;
      res.json({ ok: true, role: config.adminRole });
      return;
    }
    res.status(401).json({ error: 'Invalid password' });
  });

  router.post('/logout', (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  router.get('/site-layout', requireAuth, (_req: Request, res: Response) => {
    res.json(layoutRegistry.getData());
  });

  router.put('/site-layout', requireAuth, (req: Request, res: Response) => {
    const result = layoutRegistry.setData(req.body);
    if (!result.success) {
      res.status(400).json({ errors: result.errors });
      return;
    }
    res.json(layoutRegistry.getData());
  });

  router.get('/modules', requireAuth, (req: Request, res: Response) => {
    const all = registry.getAll();
    const filtered = filterModulesByRole(all, req.session.role);
    res.json({ modules: filtered });
  });

  router.post('/modules/upload', requireAuth, upload.single('module'), (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'ZIP file required' });
      return;
    }
    const approve = req.body.approvePermissions === 'true';
    const result = installer.installFromZip(req.file.buffer, approve);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  });

  router.post('/modules/:id/start', requireAuth, requireModuleAccess((id) => registry.getById(id)), async (req: Request, res: Response) => {
    const mod = registry.getById(req.params.id)!;
    if (mod.type !== 'standalone') {
      res.status(400).json({ error: 'Only standalone modules can be started' });
      return;
    }
    if (!mod.permissionsApproved) {
      res.status(403).json({ error: 'Permissions not approved', needsApproval: true });
      return;
    }
    const result = await dockerManager.startModule(mod);
    if (!result.success) {
      mod.status = 'error';
      mod.updatedAt = new Date().toISOString();
      registry.upsert(mod);
      res.status(500).json({ error: result.error });
      return;
    }
    mod.status = 'running';
    mod.hostPort = result.hostPort;
    mod.containerId = result.containerId;
    mod.updatedAt = new Date().toISOString();
    registry.upsert(mod);
    if (mod.proxyPrefix && mod.hostPort) {
      proxyManager.registerRoute(mod.id, mod.proxyPrefix, mod.hostPort, mod.proxyPaths ?? ['api']);
    }
    res.json({
      ok: true,
      hostPort: mod.hostPort,
      firewallWarning: mod.hostPort
        ? `Module exposed on host port ${mod.hostPort}. Open in UFW if external access needed: sudo ufw allow ${mod.hostPort}/tcp`
        : undefined,
    });
  });

  router.post('/modules/:id/stop', requireAuth, requireModuleAccess((id) => registry.getById(id)), async (req: Request, res: Response) => {
    const mod = registry.getById(req.params.id)!;
    await dockerManager.stopModule(mod);
    mod.status = 'stopped';
    mod.hostPort = undefined;
    mod.containerId = undefined;
    mod.updatedAt = new Date().toISOString();
    registry.upsert(mod);
    proxyManager.removeRoute(mod.id);
    res.json({ ok: true });
  });

  router.post('/modules/:id/approve', requireAuth, requireModuleAccess((id) => registry.getById(id)), (req: Request, res: Response) => {
    const mod = registry.getById(req.params.id)!;
    mod.permissionsApproved = true;
    mod.updatedAt = new Date().toISOString();
    registry.upsert(mod);
    res.json({ ok: true });
  });

  router.delete('/modules/:id', requireAuth, requireModuleAccess((id) => registry.getById(id)), async (req: Request, res: Response) => {
    const mod = registry.getById(req.params.id)!;
    if (mod.type === 'builtin') {
      res.status(400).json({ error: 'Built-in modules cannot be deleted' });
      return;
    }
    if (mod.type === 'standalone' && mod.status === 'running') {
      await dockerManager.stopModule(mod);
    }
    proxyManager.removeRoute(mod.id);
    const removed = installer.uninstall(mod.id);
    if (!removed) {
      res.status(500).json({ error: 'Uninstall failed' });
      return;
    }
    res.json({ ok: true });
  });

  router.get('/modules/:id/logs', requireAuth, requireModuleAccess((id) => registry.getById(id)), async (req: Request, res: Response) => {
    const mod = registry.getById(req.params.id)!;
    const logs = await dockerManager.getLogs(mod);
    res.json({ logs });
  });

  router.get('/modules/:id/stats', requireAuth, requireModuleAccess((id) => registry.getById(id)), async (req: Request, res: Response) => {
    const mod = registry.getById(req.params.id)!;
    if (!mod.containerId) {
      res.json({ stats: null });
      return;
    }
    const stats = await dockerManager.getStats(mod.containerId);
    res.json({ stats });
  });

  return router;
}

/**
 * Serve admin dashboard HTML.
 */
export function serveDashboard(app: Express, config: AppConfig): void {
  const dashboardPath = path.join(config.projectRoot, 'core', 'src', 'admin', 'dashboard.html');
  app.get('/admin', (_req, res) => {
    res.sendFile(dashboardPath);
  });
}
