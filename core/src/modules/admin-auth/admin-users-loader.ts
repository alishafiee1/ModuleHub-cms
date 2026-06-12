import path from 'path';
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
  const usersByUsername = new Map<string, AdminUserRecord>();

  const envHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (envHash) {
    const envUsername = process.env.ADMIN_USERNAME?.trim() || 'admin';
    usersByUsername.set(envUsername.toLowerCase(), {
      username: envUsername,
      passwordHash: envHash,
    });
  }

  if (await fs.pathExists(PATHS.adminUsers)) {
    const file = await fs.readJson(PATHS.adminUsers) as AdminUsersFile;
    if (Array.isArray(file.users)) {
      for (const user of file.users) {
        if (user.username && user.passwordHash) {
          const trimmedUsername = user.username.trim();
          usersByUsername.set(trimmedUsername.toLowerCase(), {
            username: trimmedUsername,
            passwordHash: user.passwordHash,
          });
        }
      }
    }
  }

  return Array.from(usersByUsername.values());
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

/**
 * Reads admin-users.json from disk or returns an empty users list.
 * @returns Parsed admin users file shape
 */
async function readAdminUsersFile(): Promise<AdminUsersFile> {
  if (await fs.pathExists(PATHS.adminUsers)) {
    const file = await fs.readJson(PATHS.adminUsers) as AdminUsersFile;
    if (Array.isArray(file.users)) {
      return { users: file.users };
    }
  }
  return { users: [] };
}

/**
 * Persists admin-users.json atomically via a temporary file and rename.
 * @param file - Admin users file to write
 */
async function writeAdminUsersFileAtomic(file: AdminUsersFile): Promise<void> {
  await fs.ensureDir(path.dirname(PATHS.adminUsers));
  const tempPath = `${PATHS.adminUsers}.tmp`;
  await fs.writeJson(tempPath, file, { spaces: 4 });
  await fs.rename(tempPath, PATHS.adminUsers);
}

/**
 * Updates or inserts a Super Admin password hash in storage/admin-users.json.
 * Creates the file when missing (e.g. env-only credentials migrated on first change).
 * @param username - Admin username to update
 * @param newHash - bcrypt hash for the new password
 */
export async function updateAdminPassword(username: string, newHash: string): Promise<void> {
  const normalized = username.trim().toLowerCase();
  const file = await readAdminUsersFile();
  const existingIndex = file.users.findIndex(
    (user) => user.username.trim().toLowerCase() === normalized,
  );

  if (existingIndex >= 0) {
    file.users[existingIndex] = {
      username: file.users[existingIndex].username.trim(),
      passwordHash: newHash,
    };
  } else {
    file.users.push({
      username: username.trim(),
      passwordHash: newHash,
    });
  }

  await writeAdminUsersFileAtomic(file);
}
