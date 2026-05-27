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
import { CatalogService } from '../catalog/catalog-service';
import { CatalogInstanceService } from '../catalog/catalog-instance-service';
import { ModuleSettingsService } from '../modules/module-settings-service';
import { GitSyncService } from '../sync/git-sync-service';
import { PartialUploadService } from '../modules/partial-upload-service';
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
  catalogService: CatalogService;
  catalogInstanceService: CatalogInstanceService;
  settingsService: ModuleSettingsService;
  gitSyncService: GitSyncService;
  partialUploadService: PartialUploadService;
}

/**
 * Create admin API and dashboard routes.
 */
export function createAdminRouter(deps: AdminRouterDeps): Router {
  const router = Router();
  const { config, registry, installer, dockerManager, proxyManager, layoutRegistry, catalogService, catalogInstanceService, settingsService, gitSyncService, partialUploadService } = deps;

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

  router.post('/site-layout/folders', requireAuth, (req: Request, res: Response) => {
    const { parentId, title, id } = req.body as {
      parentId?: string;
      title?: string;
      id?: string;
    };
    if (!parentId || !title?.trim()) {
      res.status(400).json({ error: 'parentId and title are required' });
      return;
    }
    const result = layoutRegistry.addFolder(parentId, title.trim(), id?.trim());
    if (!result.success) {
      res.status(400).json({ errors: result.errors });
      return;
    }
    res.status(201).json({ folder: result.folder, layout: layoutRegistry.getData() });
  });

  router.get('/catalog', requireAuth, (_req: Request, res: Response) => {
    res.json({ templates: catalogService.listTemplates() });
  });

  router.post('/instances', requireAuth, (req: Request, res: Response) => {
    const { templateId, instanceId, cardTitle, cardDescription, iconClass, folderId } = req.body as {
      templateId?: string;
      instanceId?: string;
      cardTitle?: string;
      cardDescription?: string;
      iconClass?: string;
      folderId?: string;
    };

    if (!templateId?.trim() || !cardTitle?.trim()) {
      res.status(400).json({ error: 'templateId and cardTitle are required' });
      return;
    }

    const result = catalogInstanceService.create({
      templateId: templateId.trim(),
      instanceId: instanceId?.trim() ?? cardTitle.trim(),
      cardTitle: cardTitle.trim(),
      cardDescription: cardDescription?.trim(),
      iconClass: iconClass?.trim(),
      folderId: folderId?.trim(),
    });

    if (!result.success) {
      const status = result.errors.some((message) => message.includes('already')) ? 409 : 400;
      res.status(status).json({ errors: result.errors });
      return;
    }

    res.status(201).json({
      instanceId: result.instanceId,
      module: result.module,
      layout: layoutRegistry.getData(),
    });
  });

  router.get('/modules', requireAuth, (req: Request, res: Response) => {
    const all = registry.getAll();
    const filtered = filterModulesByRole(all, req.session.role);
    res.json({ modules: filtered });
  });

  router.post('/modules/upload', requireAuth, upload.single('module'), async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'ZIP file required' });
      return;
    }
    const result = await installer.installFromZip(req.file.buffer);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  });

  router.get(
    '/modules/:id/settings',
    requireAuth,
    requireModuleAccess((id) => registry.getById(id)),
    (req: Request, res: Response) => {
      const settings = settingsService.getSettings(req.params.id);
      if (!settings) {
        res.status(404).json({ error: 'Settings not available for this module' });
        return;
      }
      res.json({ settings });
    },
  );

  router.put(
    '/modules/:id/settings',
    requireAuth,
    requireModuleAccess((id) => registry.getById(id)),
    async (req: Request, res: Response) => {
      const result = await settingsService.saveSettings(req.params.id, req.body);
      if (!result.success) {
        res.status(400).json({ errors: result.errors, warnings: result.warnings });
        return;
      }
      res.json({
        ok: true,
        module: result.module,
        warnings: result.warnings,
        layout: layoutRegistry.getData(),
      });
    },
  );

  router.post('/modules/:id/start', requireAuth, requireModuleAccess((id) => registry.getById(id)), async (req: Request, res: Response) => {
    const mod = registry.getById(req.params.id)!;
    if (mod.type !== 'standalone') {
      res.status(400).json({ error: 'Only standalone modules can be started' });
      return;
    }
    if (mod.status === 'settings_pending') {
      res.status(400).json({
        error: 'Complete module settings first',
        needsSettings: true,
        message: 'تنظیمات ماژول را ذخیره کنید.',
      });
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
    if (mod.type === 'standalone' && (mod.status === 'running' || mod.status === 'settings_pending')) {
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

  router.post('/modules/:id/git-pull', requireAuth, requireModuleAccess((id) => registry.getById(id)), async (req: Request, res: Response) => {
    const result = await gitSyncService.pull(req.params.id);
    if (!result.success) {
      const status = result.gitMissing ? 503 : 400;
      res.status(status).json({ errors: result.errors });
      return;
    }
    logger.info('Git pull via API', { moduleId: req.params.id });
    res.json({ ok: true, output: result.output });
  });

  router.post(
    '/modules/:id/partial-upload',
    requireAuth,
    requireModuleAccess((id) => registry.getById(id)),
    upload.single('partial'),
    (req: Request, res: Response) => {
      if (!req.file) {
        res.status(400).json({ error: 'partial ZIP file required' });
        return;
      }
      const result = partialUploadService.applyZip(req.params.id, req.file.buffer);
      if (!result.success) {
        res.status(400).json({ errors: result.errors, replacedFiles: result.replacedFiles });
        return;
      }
      res.json({ ok: true, replacedFiles: result.replacedFiles });
    },
  );

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
