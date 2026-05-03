/** ברירות מחדל לכניסת אדמין. תמיד פעילים; ב-Vercel אפשר להוסיף גם ADMIN_SECRET / ADMIN_USERNAME. */
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
  return v && v.length > 0 ? v : DEFAULT_ADMIN_USERNAME;
}

/** סיסמאות תקפות: ברירת המחדל מהקוד + (אם קיים) ADMIN_SECRET משרת – כדי שלא ייחסמו אחרי הגדרה ב-Vercel. */
export function allValidAdminSecrets(): string[] {
  const env = process.env.ADMIN_SECRET?.trim();
  const list = [DEFAULT_ADMIN_SECRET];
  if (env && env.length > 0 && env !== DEFAULT_ADMIN_SECRET) list.push(env);
  return list;
}

export function getAdminKeyFromRequest(request: Request): string | null {
  const provided = request.headers.get('x-admin-key')?.trim() ?? null;
  return parseAdminSecretFromHeader(provided) ? provided : null;
}

/**
 * בודק כניסת אדמין. מחזיר מפתח ASCII ל־X-Admin-Key (לא UTF-8 גולמי – מגבלת Fetch).
 */
export function tryAdminLogin(rawUsername: string, rawPassword: string): { key: string } | null {
  const u = nfc(typeof rawUsername === 'string' ? rawUsername.trim() : '');
  const p = typeof rawPassword === 'string' ? rawPassword.trim() : '';
  const secrets = new Set(allValidAdminSecrets());
  if (!secrets.has(p)) return null;

  const resolvedUser = nfc(resolvedAdminUsername());
  const defaultUser = nfc(DEFAULT_ADMIN_USERNAME);

  const wireKey = encodeAdminKeyForHeader(p);

  if (u === '' && secrets.has(p)) return { key: wireKey };

  if (u === defaultUser && p === DEFAULT_ADMIN_SECRET) return { key: wireKey };

  if (u === resolvedUser && secrets.has(p)) return { key: wireKey };

  return null;
}
