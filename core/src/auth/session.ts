import { Request, Response, NextFunction } from 'express';
import { ModuleEntry } from '../modules/types';

/**
 * Check if user role can manage a module.
 */
export function canManageModule(userRole: string | undefined, module: ModuleEntry): boolean {
  if (!userRole) return false;
  if (userRole === 'admin') return true;
  if (!module.adminRole) return true;
  return module.adminRole === userRole;
}

/**
 * Filter modules visible to user role.
 */
export function filterModulesByRole(modules: ModuleEntry[], userRole: string | undefined): ModuleEntry[] {
  if (userRole === 'admin') return modules;
  return modules.filter((m) => !m.adminRole || m.adminRole === userRole);
}

/**
 * Express middleware — require authenticated session.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.authenticated) {
    next();
    return;
  }
  res.status(401).json({ error: 'Authentication required' });
}

/**
 * Express middleware — require admin role for module action.
 */
export function requireModuleAccess(moduleLookup: (id: string) => ModuleEntry | undefined) {
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
    if (!canManageModule(req.session?.role, mod)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}

declare module 'express-session' {
  interface SessionData {
    authenticated?: boolean;
    role?: string;
  }
}
