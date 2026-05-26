import { Express, Request, Response, NextFunction } from 'express';
import httpProxy from 'http-proxy';
import { ModuleRegistry } from '../modules/registry';
import { logger } from '../server/logger';

interface ProxyRoute {
  prefix: string;
  targetPort: number;
  moduleId: string;
}

/**
 * Dynamic reverse proxy for standalone module prefixes.
 */
export class ReverseProxyManager {
  private readonly proxy = httpProxy.createProxyServer({ changeOrigin: true });
  private routes: ProxyRoute[] = [];

  constructor(private readonly registry: ModuleRegistry) {
    this.proxy.on('error', (err, _req, res) => {
      logger.error('Proxy error', err);
      if (res && 'writeHead' in res && typeof res.writeHead === 'function') {
        (res as Response).status(502).json({ error: 'Proxy error' });
      }
    });
  }

  /**
   * Register proxy route for a module.
   */
  registerRoute(moduleId: string, prefix: string, targetPort: number): void {
    this.routes = this.routes.filter((r) => r.moduleId !== moduleId);
    this.routes.push({ prefix, targetPort, moduleId });
    logger.info('Proxy route registered', { moduleId, prefix, targetPort });
  }

  /**
   * Remove proxy route for a module.
   */
  removeRoute(moduleId: string): void {
    this.routes = this.routes.filter((r) => r.moduleId !== moduleId);
  }

  /**
   * Mount proxy middleware on Express app.
   */
  mount(app: Express): void {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const route = this.routes.find((r) => req.path.startsWith(r.prefix));
      if (!route) return next();

      const mod = this.registry.getById(route.moduleId);
      if (!mod || mod.status !== 'running' || !mod.hostPort) {
        res.status(503).json({ error: 'Module unavailable', moduleId: route?.moduleId });
        return;
      }

      req.headers['x-real-ip'] = req.ip ?? req.socket.remoteAddress ?? '';
      req.headers['x-forwarded-for'] = req.headers['x-forwarded-for'] ?? req.ip ?? '';

      this.proxy.web(req, res, { target: `http://127.0.0.1:${mod.hostPort}` });
    });
  }
}
