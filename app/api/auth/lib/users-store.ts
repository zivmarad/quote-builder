import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

export interface StoredUser {
  id: string;
  username: string;
  /** אימייל – משמש להתחברות עם קוד אימות */
  email?: string;
  passwordHash: string;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function getUsersFilePath(): string {
  return USERS_FILE;
}

export async function readUsers(): Promise<StoredUser[]> {
  try {
    const raw = await readFile(getUsersFilePath(), 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
}

export async function writeUsers(users: StoredUser[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(getUsersFilePath(), JSON.stringify(users, null, 2), 'utf-8');
}

export function hashPassword(password: string): string {
  return createHash('sha256').update(password, 'utf8').digest('hex');
}

export function generateId(): string {
  return `u-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** מעדכן סיסמה למשתמש לפי אימייל (לשחזור סיסמה) */
export async function updatePasswordByEmail(email: string, newPasswordHash: string): Promise<boolean> {
  const users = await readUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const idx = users.findIndex((u) => u.email?.toLowerCase() === normalizedEmail);
  if (idx === -1) return false;
  users[idx] = { ...users[idx], passwordHash: newPasswordHash };
  await writeUsers(users);
  return true;
}
