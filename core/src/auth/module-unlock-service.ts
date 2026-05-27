import { Request, Response } from 'express';
import { ModuleRegistry } from '../modules/registry';
import {
  moduleManifestHasPassword,
  readModuleManifest,
  verifyModulePassword,
} from './module-password';
import { ModuleUnlockRateLimiter } from './module-unlock-rate-limiter';
import { setModuleUnlockCookie } from './module-scoped-session';

export interface ModuleUnlockResult {
  success: boolean;
  errors: string[];
  rateLimited?: boolean;
}

/**
 * Handle module password unlock and issue scoped session cookie.
 */
export class ModuleUnlockService {
  constructor(
    private readonly registry: ModuleRegistry,
    private readonly sessionSecret: string,
    private readonly rateLimiter: ModuleUnlockRateLimiter = new ModuleUnlockRateLimiter(),
  ) {}

  /**
   * Build rate-limit client key from request IP and module id.
   */
  static buildClientKey(req: Request, moduleId: string): string {
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.socket.remoteAddress ?? 'unknown';
    return `${ip}:${moduleId}`;
  }

  /**
   * Verify password and set module-scoped cookie on success.
   */
  async unlock(
    req: Request,
    res: Response,
    moduleId: string,
    plainPassword: string | undefined,
  ): Promise<ModuleUnlockResult> {
    const mod = this.registry.getById(moduleId);
    if (!mod) {
      return { success: false, errors: ['Module not found'] };
    }
    if (mod.type !== 'standalone' && mod.type !== 'instance') {
      return { success: false, errors: ['Module unlock not supported for this type'] };
    }

    const manifest = readModuleManifest(mod.installPath);
    const passwordHash = (manifest as { modulePasswordHash?: string } | null)?.modulePasswordHash;
    if (!moduleManifestHasPassword(manifest)) {
      return { success: false, errors: ['Module password is not configured'] };
    }

    const clientKey = ModuleUnlockService.buildClientKey(req, moduleId);
    if (this.rateLimiter.isBlocked(clientKey)) {
      return { success: false, errors: ['Too many failed attempts'], rateLimited: true };
    }

    if (!plainPassword?.trim()) {
      this.rateLimiter.recordFailure(clientKey);
      return { success: false, errors: ['Password required'] };
    }

    const valid = await verifyModulePassword(plainPassword.trim(), passwordHash!);
    if (!valid) {
      this.rateLimiter.recordFailure(clientKey);
      return { success: false, errors: ['Invalid password'] };
    }

    this.rateLimiter.clearFailures(clientKey);
    setModuleUnlockCookie(res, moduleId, this.sessionSecret);
    return { success: true, errors: [] };
  }
}
