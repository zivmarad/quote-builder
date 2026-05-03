/** ברירות מחדל לכניסת אדמין. תמיד פעילים; ב-Vercel אפשר להוסיף גם ADMIN_SECRET / ADMIN_USERNAME. */
export const DEFAULT_ADMIN_USERNAME = 'זיו';
export const DEFAULT_ADMIN_SECRET = 'זיו4';

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

/** מפתח ב־X-Admin-Key תקין אם הוא אחת מסיסמאות הניהול המוכרות */
export function adminProvidedKeyValid(provided: string | null): boolean {
  if (!provided) return false;
  const t = provided.trim();
  return allValidAdminSecrets().some((s) => s === t);
}

export function getAdminKeyFromRequest(request: Request): string | null {
  const provided = request.headers.get('x-admin-key')?.trim() ?? null;
  if (!provided || !adminProvidedKeyValid(provided)) return null;
  return provided;
}

/**
 * בודק כניסת אדמין. מחזיר את המפתח לשמירה ב־X-Admin-Key (הסיסמה שהוזנה, אם תקפה).
 */
export function tryAdminLogin(rawUsername: string, rawPassword: string): { key: string } | null {
  const u = nfc(typeof rawUsername === 'string' ? rawUsername.trim() : '');
  const p = typeof rawPassword === 'string' ? rawPassword.trim() : '';
  const secrets = new Set(allValidAdminSecrets());
  if (!secrets.has(p)) return null;

  const resolvedUser = nfc(resolvedAdminUsername());
  const defaultUser = nfc(DEFAULT_ADMIN_USERNAME);

  if (u === '' && secrets.has(p)) return { key: p };

  if (u === defaultUser && p === DEFAULT_ADMIN_SECRET) return { key: p };

  if (u === resolvedUser && secrets.has(p)) return { key: p };

  return null;
}
