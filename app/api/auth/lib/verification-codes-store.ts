import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

export interface VerificationEntry {
  email: string;
  code: string;
  expiresAt: string; // ISO
}

const DATA_DIR = path.join(process.cwd(), 'data');
const CODES_FILE = path.join(DATA_DIR, 'verification-codes.json');

async function readCodes(): Promise<VerificationEntry[]> {
  try {
    const raw = await readFile(CODES_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
}

async function writeCodes(entries: VerificationEntry[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(CODES_FILE, JSON.stringify(entries, null, 2), 'utf-8');
}

export async function saveVerificationCode(email: string, code: string, ttlMinutes = 10): Promise<void> {
  const entries = await readCodes();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
  const filtered = entries.filter((e) => e.email.toLowerCase() !== email.toLowerCase());
  filtered.push({ email: email.trim().toLowerCase(), code, expiresAt });
  await writeCodes(filtered);
}

/** בודק אם הקוד תקין (בלי למחוק) – לשימוש בשלב "המשך" בהרשמה */
export async function checkVerificationCode(email: string, code: string): Promise<boolean> {
  const entries = await readCodes();
  const now = new Date().toISOString();
  const normalizedEmail = email.trim().toLowerCase();
  return entries.some(
    (e) => e.email === normalizedEmail && e.code === code && e.expiresAt > now
  );
}

export async function consumeVerificationCode(email: string, code: string): Promise<boolean> {
  const entries = await readCodes();
  const now = new Date().toISOString();
  const normalizedEmail = email.trim().toLowerCase();
  const idx = entries.findIndex(
    (e) => e.email === normalizedEmail && e.code === code && e.expiresAt > now
  );
  if (idx === -1) return false;
  entries.splice(idx, 1);
  await writeCodes(entries);
  return true;
}

export function generateSixDigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
