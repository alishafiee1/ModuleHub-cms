import path from 'path';
import fs from 'fs';
import { Express, Request, Response } from 'express';
import { AppConfig } from '../server/config';
import { ModuleRegistry } from '../modules/registry';
import { SiteLayoutRegistry } from '../site-layout/registry';
import { renderHomepage } from './homepage-renderer';

/**
 * Serve public homepage and static public assets.
 */
export function mountPublicRoutes(
  app: Express,
  config: AppConfig,
  registry: ModuleRegistry,
  layoutRegistry: SiteLayoutRegistry,
): void {
  const distCss = path.join(config.projectRoot, 'dist', 'core', 'src', 'public', 'homepage.css');
  const devCss = path.join(config.projectRoot, 'core', 'src', 'public', 'homepage.css');
  const cssPath = fs.existsSync(distCss) ? distCss : devCss;

  app.get('/public/homepage.css', (_req, res) => {
    res.sendFile(cssPath);
  });

  app.get('/', (req: Request, res: Response) => {
    const layout = layoutRegistry.getData();
    const modules = registry.getAll();
    const html = renderHomepage({
      layout,
      modules,
      isAuthenticated: Boolean(req.session?.authenticated),
      userRole: req.session?.role,
    });
    res.type('html').send(html);
  });
}

/**
 * Serve built-in modules at /pages/:id/
 */
export function mountBuiltinModules(app: Express, registry: ModuleRegistry): void {
  app.get('/pages/:id/*', (req: Request, res: Response) => {
    const moduleId = req.params.id;
    const mod = registry.getById(moduleId);
    if (!mod || mod.type !== 'builtin') {
      res.status(404).json({ error: 'Built-in module not found' });
      return;
    }
    let relPath = req.params[0] ?? '';
    if (!relPath || relPath.endsWith('/')) {
      relPath = `${relPath}index.html`.replace(/\/+/g, '/');
    }
    const filePath = path.join(mod.installPath, relPath);
    if (!filePath.startsWith(mod.installPath) || !fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }
    res.sendFile(filePath);
  });

  app.get('/pages/:id', (req: Request, res: Response) => {
    res.redirect(`/pages/${req.params.id}/`);
  });
}

/**
 * Serve standalone module host files at /modules/:id/ (index.html and assets).
 */
export function mountStandaloneHostFiles(app: Express, registry: ModuleRegistry): void {
  app.get('/modules/:id/*', (req: Request, res: Response) => {
    const moduleId = req.params.id;
    const mod = registry.getById(moduleId);
    if (!mod || mod.type !== 'standalone') {
      res.status(404).json({ error: 'Standalone module not found' });
      return;
    }
    let relPath = req.params[0] ?? '';
    if (!relPath || relPath.endsWith('/')) {
      relPath = `${relPath}index.html`.replace(/\/+/g, '/');
    }
    const filePath = path.join(mod.installPath, relPath);
    if (!filePath.startsWith(mod.installPath) || !fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }
    res.sendFile(filePath);
  });

  app.get('/modules/:id', (req: Request, res: Response) => {
    res.redirect(`/modules/${req.params.id}/`);
  });
}
