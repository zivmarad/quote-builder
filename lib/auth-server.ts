import { SignJWT, jwtVerify } from 'jose';
import { NextResponse } from 'next/server';

const COOKIE_NAME = 'quoteBuilder_session';
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

/** מוציא את הטוקן מה-cookie של הבקשה */
export function getTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;)\\s*${COOKIE_NAME}=([^;]*)`));
  const value = match?.[1]?.trim();
  return value || null;
}

/** מחזיר את המשתמש המחובר מהבקשה, או null */
export async function getCurrentUser(request: Request): Promise<SessionUser | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifySessionToken(token);
}

/** מוסיף cookie סשן לתגובה */
export function setSessionCookie(response: NextResponse, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: JWT_EXPIRY_DAYS * 24 * 60 * 60,
  });
}

/** מוחק את cookie הסשן */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
}

export { COOKIE_NAME };
