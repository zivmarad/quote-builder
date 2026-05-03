import { SignJWT, jwtVerify } from 'jose';
import { NextResponse } from 'next/server';

const COOKIE_NAME = 'quoteBuilder_session';
/** סשן לפני "התחבר כמשתמש" (מנהל) – לשחזור */
const SESSION_PREV_COOKIE = 'quoteBuilder_session_prev';
/** מסמן שהסשן הנוכחי נוצר דרך התחזות מנהל */
const IMPERSONATION_MARKER_COOKIE = 'quoteBuilder_impersonating';
const JWT_EXPIRY_DAYS = 7;

export interface SessionUser {
  id: string;
  username: string;
  email?: string;
}

function getSecretForSigning(): Uint8Array {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set in .env and at least 32 characters');
  }
  return new TextEncoder().encode(secret);
}

function getSecretForVerify(): Uint8Array | null {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

/** יוצר JWT למשתמש מחובר */
export async function createSessionToken(user: SessionUser): Promise<string> {
  const secret = getSecretForSigning();
  const exp = new Date();
  exp.setDate(exp.getDate() + JWT_EXPIRY_DAYS);
  return new SignJWT({
    username: user.username,
    email: user.email ?? null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(secret);
}

/** מאמת JWT ומחזיר payload או null */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const secret = getSecretForVerify();
    if (!secret) return null;
    const { payload } = await jwtVerify(token, secret);
    const id = payload.sub;
    const username = payload.username;
    if (typeof id !== 'string' || !id || typeof username !== 'string' || !username) {
      return null;
    }
    return {
      id,
      username,
      email: typeof payload.email === 'string' ? payload.email : undefined,
    };
  } catch {
    return null;
  }
}

function getCookieRaw(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  const safe = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = cookieHeader.match(new RegExp(`(?:^|;)\\s*${safe}=([^;]*)`));
  const value = match?.[1]?.trim();
  try {
    return value ? decodeURIComponent(value) : null;
  } catch {
    return value || null;
  }
}

/** מוציא את הטוקן מה-cookie של הבקשה */
export function getTokenFromRequest(request: Request): string | null {
  return getCookieRaw(request, COOKIE_NAME);
}

export function getPrevSessionTokenFromRequest(request: Request): string | null {
  return getCookieRaw(request, SESSION_PREV_COOKIE);
}

export function isImpersonationActive(request: Request): boolean {
  return getCookieRaw(request, IMPERSONATION_MARKER_COOKIE) === '1';
}

/** מחזיר את המשתמש המחובר מהבקשה, או null */
export async function getCurrentUser(request: Request): Promise<SessionUser | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifySessionToken(token);
}

function cookieBaseOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true as const,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: JWT_EXPIRY_DAYS * 24 * 60 * 60,
  };
}

/** מוסיף cookie סשן לתגובה */
export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, cookieBaseOptions());
}

export function setPrevSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(SESSION_PREV_COOKIE, token, cookieBaseOptions());
}

export function setImpersonationMarkerCookie(response: NextResponse): void {
  response.cookies.set(IMPERSONATION_MARKER_COOKIE, '1', {
    ...cookieBaseOptions(),
    maxAge: JWT_EXPIRY_DAYS * 24 * 60 * 60,
  });
}

/** מוחק את cookie הסשן */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
}

export function clearImpersonationCookies(response: NextResponse): void {
  response.cookies.set(SESSION_PREV_COOKIE, '', { path: '/', maxAge: 0 });
  response.cookies.set(IMPERSONATION_MARKER_COOKIE, '', { path: '/', maxAge: 0 });
}

export { COOKIE_NAME, SESSION_PREV_COOKIE, IMPERSONATION_MARKER_COOKIE };
