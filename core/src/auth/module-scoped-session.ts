import { Request, Response } from 'express';
import { sign, unsign } from 'cookie-signature';

export const MODULE_UNLOCK_COOKIE_TTL_MS = 8 * 60 * 60 * 1000;

export interface ModuleUnlockPayload {
  moduleId: string;
  unlockedAt: number;
}

/**
 * Cookie name for a module-scoped unlock session.
 */
export function moduleUnlockCookieName(moduleId: string): string {
  return `modulehub_module_${moduleId}`;
}

/**
 * Parse Cookie header into key/value map.
 */
export function parseRequestCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) {
    return cookies;
  }
  for (const part of header.split(';')) {
    const trimmed = part.trim();
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }
    const key = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1);
    cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

/**
 * Set signed module unlock cookie on response.
 */
export function setModuleUnlockCookie(
  res: Response,
  moduleId: string,
  sessionSecret: string,
): void {
  const payload: ModuleUnlockPayload = { moduleId, unlockedAt: Date.now() };
  const signedValue = sign(JSON.stringify(payload), sessionSecret);
  const cookieName = moduleUnlockCookieName(moduleId);
  const maxAgeSeconds = Math.floor(MODULE_UNLOCK_COOKIE_TTL_MS / 1000);
  res.append(
    'Set-Cookie',
    `${cookieName}=${encodeURIComponent(signedValue)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`,
  );
}

/**
 * Clear module unlock cookie.
 */
export function clearModuleUnlockCookie(res: Response, moduleId: string): void {
  const cookieName = moduleUnlockCookieName(moduleId);
  res.append('Set-Cookie', `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

/**
 * Verify module unlock cookie for the given module id.
 */
export function isModuleUnlocked(
  req: Request,
  moduleId: string,
  sessionSecret: string,
): boolean {
  const cookies = parseRequestCookies(req.headers.cookie);
  const rawValue = cookies[moduleUnlockCookieName(moduleId)];
  if (!rawValue) {
    return false;
  }
  const unsigned = unsign(decodeURIComponent(rawValue), sessionSecret);
  if (!unsigned) {
    return false;
  }
  let payload: ModuleUnlockPayload;
  try {
    payload = JSON.parse(unsigned) as ModuleUnlockPayload;
  } catch {
    return false;
  }
  if (payload.moduleId !== moduleId) {
    return false;
  }
  if (Date.now() - payload.unlockedAt > MODULE_UNLOCK_COOKIE_TTL_MS) {
    return false;
  }
  return true;
}
