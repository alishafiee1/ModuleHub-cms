import { Request, Response, NextFunction } from 'express';
import { ModuleEntry } from '../modules/types';
import { canManageModule } from './session';
import { isModuleUnlocked } from './module-scoped-session';

export type ModuleAccessLevel = 'admin' | 'scoped';

declare module 'express-serve-static-core' {
  interface Request {
    moduleAccessLevel?: ModuleAccessLevel;
  }
}

/**
 * Resolve whether request may manage a module via global admin or module unlock.
 */
export function resolveModuleAccessLevel(
  req: Request,
  mod: ModuleEntry,
  sessionSecret: string,
): ModuleAccessLevel | null {
  if (req.session?.authenticated && canManageModule(req.session.role, mod)) {
    return 'admin';
  }
  if (isModuleUnlocked(req, mod.id, sessionSecret)) {
    return 'scoped';
  }
  return null;
}

/**
 * Middleware — global admin session with module role check (delete, list, upload).
 */
export function requireGlobalModuleAdmin(moduleLookup: (id: string) => ModuleEntry | undefined) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session?.authenticated) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const moduleId = req.params.id;
    if (!moduleId) {
      res.status(400).json({ error: 'Module id required' });
      return;
    }
    const mod = moduleLookup(moduleId);
    if (!mod) {
      res.status(404).json({ error: 'Module not found' });
      return;
    }
    if (!canManageModule(req.session.role, mod)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    req.moduleAccessLevel = 'admin';
    next();
  };
}

/**
 * Middleware — global admin OR valid module-scoped unlock cookie.
 */
export function requireModuleGearAccess(
  moduleLookup: (id: string) => ModuleEntry | undefined,
  sessionSecret: string,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const moduleId = req.params.id;
    if (!moduleId) {
      res.status(400).json({ error: 'Module id required' });
      return;
    }
    const mod = moduleLookup(moduleId);
    if (!mod) {
      res.status(404).json({ error: 'Module not found' });
      return;
    }
    const level = resolveModuleAccessLevel(req, mod, sessionSecret);
    if (!level) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    req.moduleAccessLevel = level;
    next();
  };
}
