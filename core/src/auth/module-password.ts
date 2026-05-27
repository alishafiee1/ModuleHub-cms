import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { ModuleManifest } from '../modules/types';

const BCRYPT_ROUNDS = 10;

/**
 * Read manifest.json from a module install directory.
 */
export function readModuleManifest(installPath: string): ModuleManifest | null {
  const manifestPath = path.join(installPath, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as ModuleManifest;
}

/**
 * Return whether manifest has a module password hash configured.
 */
export function moduleManifestHasPassword(manifest: ModuleManifest | null): boolean {
  const hash = (manifest as ModuleManifest & { modulePasswordHash?: string | null })
    ?.modulePasswordHash;
  return typeof hash === 'string' && hash.length > 0;
}

/**
 * Hash a plaintext module password for manifest storage.
 */
export async function hashModulePassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
}

/**
 * Verify plaintext against stored bcrypt hash.
 */
export async function verifyModulePassword(
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}
