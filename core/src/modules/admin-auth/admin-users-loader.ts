import fs from 'fs-extra';
import { PATHS } from '../../config/paths';

/** Single Super Admin account entry */
export interface AdminUserRecord {
  username: string;
  passwordHash: string;
}

/** admin-users.json on-disk shape */
interface AdminUsersFile {
  users: AdminUserRecord[];
}

/**
 * Loads Super Admin accounts from env ADMIN_PASSWORD_HASH and storage/admin-users.json.
 * @returns Admin user records with bcrypt password hashes
 */
export async function loadAdminUsers(): Promise<AdminUserRecord[]> {
  const users: AdminUserRecord[] = [];

  const envHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (envHash) {
    users.push({
      username: process.env.ADMIN_USERNAME?.trim() || 'admin',
      passwordHash: envHash,
    });
  }

  if (await fs.pathExists(PATHS.adminUsers)) {
    const file = await fs.readJson(PATHS.adminUsers) as AdminUsersFile;
    if (Array.isArray(file.users)) {
      for (const user of file.users) {
        if (user.username && user.passwordHash) {
          users.push({
            username: user.username.trim(),
            passwordHash: user.passwordHash,
          });
        }
      }
    }
  }

  return users;
}

/**
 * Finds a Super Admin account by username.
 * @param username - Login username
 * @returns Matching admin record or null
 */
export async function findAdminUser(username: string): Promise<AdminUserRecord | null> {
  const normalized = username.trim().toLowerCase();
  const users = await loadAdminUsers();
  return users.find((user) => user.username.toLowerCase() === normalized) ?? null;
}
