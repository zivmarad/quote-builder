/** ברירות מחדל ללוקאל בלבד. בפרודקשן חייבים ENV מפורשים. */
export const DEFAULT_ADMIN_USERNAME = 'זיו';
export const DEFAULT_ADMIN_SECRET = 'זיו4';

/** Fetch דורש שערכי header יהיו ISO-8859-1; סיסמאות עם עברית/Unicode נשלחות בקידוד זה. */
const ADMIN_KEY_HEADER_PREFIX = 'qb0.';

function encodeAdminKeyForHeader(secret: string): string {
  return ADMIN_KEY_HEADER_PREFIX + Buffer.from(secret, 'utf8').toString('base64url');
}

/** מפענח X-Admin-Key לסיסמת ניהול אם תקפה (מקודד או ASCII ישיר לתאימות לאחור). */
export function parseAdminSecretFromHeader(provided: string | null): string | null {
  const t = provided?.trim() ?? null;
  if (!t) return null;
  if (t.startsWith(ADMIN_KEY_HEADER_PREFIX)) {
    try {
      const decoded = Buffer.from(t.slice(ADMIN_KEY_HEADER_PREFIX.length), 'base64url').toString('utf8');
      if (allValidAdminSecrets().includes(decoded)) return decoded;
    } catch {
      return null;
    }
    return null;
  }
  if (allValidAdminSecrets().includes(t)) return t;
  return null;
}

function nfc(s: string): string {
  return s.normalize('NFC');
}

export function resolvedAdminUsername(): string {
  const v = process.env.ADMIN_USERNAME?.trim();
  if (v && v.length > 0) return v;
  return process.env.NODE_ENV === 'production' ? '' : DEFAULT_ADMIN_USERNAME;
}

/** סיסמאות תקפות: בפרודקשן רק ENV; בלוקאל ENV או ברירת מחדל. */
export function allValidAdminSecrets(): string[] {
  const env = process.env.ADMIN_SECRET?.trim();
  if (process.env.NODE_ENV === 'production') {
    return env && env.length > 0 ? [env] : [];
  }
  const list: string[] = [];
  if (env && env.length > 0) list.push(env);
  if (!list.includes(DEFAULT_ADMIN_SECRET)) list.push(DEFAULT_ADMIN_SECRET);
  return list;
}

/** מצב קונפיג אדמין: בפרודקשן חובה שם משתמש + סיסמה דרך ENV. */
export function isAdminConfigReady(): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  const u = process.env.ADMIN_USERNAME?.trim();
  const s = process.env.ADMIN_SECRET?.trim();
  return !!u && !!s;
}

export function getAdminKeyFromRequest(request: Request): string | null {
  const provided = request.headers.get('x-admin-key')?.trim() ?? null;
  return parseAdminSecretFromHeader(provided) ? provided : null;
}

/**
 * בודק כניסת אדמין. מחזיר מפתח ASCII ל־X-Admin-Key (לא UTF-8 גולמי – מגבלת Fetch).
 */
export function tryAdminLogin(rawUsername: string, rawPassword: string): { key: string } | null {
  if (!isAdminConfigReady()) return null;
  const u = nfc(typeof rawUsername === 'string' ? rawUsername.trim() : '');
  const p = typeof rawPassword === 'string' ? rawPassword.trim() : '';
  const secrets = new Set(allValidAdminSecrets());
  if (!secrets.has(p)) return null;

  const resolved = resolvedAdminUsername();
  const resolvedUser = resolved ? nfc(resolved) : '';
  const defaultUser = nfc(DEFAULT_ADMIN_USERNAME);

  const wireKey = encodeAdminKeyForHeader(p);

  if (u === '' && secrets.has(p)) return { key: wireKey };

  if (process.env.NODE_ENV !== 'production' && u === defaultUser && p === DEFAULT_ADMIN_SECRET) {
    return { key: wireKey };
  }

  if (resolvedUser && u === resolvedUser && secrets.has(p)) return { key: wireKey };

  return null;
}
