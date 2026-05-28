/** דומיין production – משמש כ-fallback כש-VERCEL_ENV=production ואין NEXT_PUBLIC_SITE_URL. */
export const PRODUCTION_SITE_URL = 'https://hatzaot.co.il';

/** בסיס URL ל-canonical/OG – NEXT_PUBLIC_SITE_URL דורס את ברירת המחדל. */
export function getSiteUrl(): string | undefined {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (process.env.VERCEL_ENV === 'production') return PRODUCTION_SITE_URL;
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  }
  return undefined;
}

export function absoluteUrl(path: string): string | undefined {
  const base = getSiteUrl();
  if (!base) return undefined;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
