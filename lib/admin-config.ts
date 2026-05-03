/** ברירות מחדל לכניסת אדמין. אפשר לדרוס ב-Vercel עם ADMIN_USERNAME ו־ADMIN_SECRET. */
export const DEFAULT_ADMIN_USERNAME = 'זיו';
export const DEFAULT_ADMIN_SECRET = 'זיו4';

export function resolvedAdminUsername(): string {
  const v = process.env.ADMIN_USERNAME?.trim();
  return v && v.length > 0 ? v : DEFAULT_ADMIN_USERNAME;
}

export function resolvedAdminSecret(): string {
  const v = process.env.ADMIN_SECRET?.trim();
  return v && v.length > 0 ? v : DEFAULT_ADMIN_SECRET;
}
