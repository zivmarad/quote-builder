import { SignJWT, jwtVerify } from 'jose';
import { getSiteUrl } from './site-url';

const STATE_COOKIE = 'quoteBuilder_oauth';
const STATE_MAX_AGE = 10 * 60;

type OAuthState = {
  from: string;
  nonce: string;
};

function getJwtSecret(): Uint8Array | null {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

export function getGoogleRedirectUri(request: Request): string {
  const site = getSiteUrl();
  if (site) return `${site}/api/auth/google/callback`;
  return new URL('/api/auth/google/callback', request.url).toString();
}

export function sanitizeOAuthFrom(raw: string | null): string {
  if (!raw || typeof raw !== 'string') return '/';
  let p = raw.trim();
  if (!p.startsWith('/')) p = `/${p}`;
  if (p.startsWith('//') || p.includes('://')) return '/';
  return p.split('#')[0] || '/';
}

export async function createOAuthState(from: string): Promise<{ token: string; nonce: string } | null> {
  const secret = getJwtSecret();
  if (!secret) return null;
  const nonce = crypto.randomUUID();
  const token = await new SignJWT({ from, nonce })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${STATE_MAX_AGE}s`)
    .sign(secret);
  return { token, nonce };
}

export async function readOAuthState(token: string): Promise<OAuthState | null> {
  const secret = getJwtSecret();
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const from = typeof payload.from === 'string' ? sanitizeOAuthFrom(payload.from) : '/';
    const nonce = typeof payload.nonce === 'string' ? payload.nonce : '';
    if (!nonce) return null;
    return { from, nonce };
  } catch {
    return null;
  }
}

export function oauthCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true as const,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: STATE_MAX_AGE,
  };
}

export { STATE_COOKIE };

export function buildGoogleAuthUrl(params: { redirectUri: string; state: string }): string {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? '';
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', params.state);
  url.searchParams.set('access_type', 'online');
  url.searchParams.set('prompt', 'select_account');
  return url.toString();
}

export type GoogleUserInfo = {
  email: string;
  name?: string;
  emailVerified: boolean;
};

export async function exchangeGoogleCode(code: string, redirectUri: string): Promise<GoogleUserInfo | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });
  if (!tokenRes.ok) return null;
  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) return null;

  const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    cache: 'no-store',
  });
  if (!infoRes.ok) return null;
  const info = (await infoRes.json()) as {
    email?: string;
    name?: string;
    email_verified?: boolean | string;
  };
  const email = typeof info.email === 'string' ? info.email.trim().toLowerCase() : '';
  if (!email) return null;
  const verified = info.email_verified === true || info.email_verified === 'true';
  return {
    email,
    name: typeof info.name === 'string' ? info.name : undefined,
    emailVerified: verified,
  };
}
