/** בסיס URL ל-canonical/OG – עדכן NEXT_PUBLIC_SITE_URL כשיש דומיין. */
export function getSiteUrl(): string | undefined {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
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
