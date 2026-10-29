import { NextResponse } from 'next/server';
import { displayNameFromGoogle, findOrCreateGoogleUser, seedProfileContactNameIfEmpty } from '../../lib/users-store';
import { getAdminNotifyRecipients, sendNewUserNotificationEmail, sendWelcomeEmail } from '../../lib/send-email';
import { createSessionToken, setSessionCookie, clearImpersonationCookies } from '../../../../../lib/auth-server';
import { resolvePostLoginRedirectPath } from '../../../../../lib/post-login-redirect';
import { rateLimitResponse, withRequestId, getOrCreateRequestId } from '../../../../../lib/api-helpers';
import { LIMITS } from '../../../../../lib/rate-limit';
import {
  exchangeGoogleCode,
  getGoogleRedirectUri,
  oauthCookieOptions,
  readOAuthState,
  sanitizeOAuthFrom,
  STATE_COOKIE,
} from '../../../../../lib/google-oauth';

function cookieFromRequest(request: Request, name: string): string | null {
  const header = request.headers.get('cookie');
  if (!header) return null;
  const safe = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = header.match(new RegExp(`(?:^|;)\\s*${safe}=([^;]*)`));
  const value = match?.[1]?.trim();
  try {
    return value ? decodeURIComponent(value) : null;
  } catch {
    return value || null;
  }
}

export async function GET(request: Request) {
  const requestId = getOrCreateRequestId(request);
  const rateLimited = await rateLimitResponse(request, LIMITS.AUTH);
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const fail = (code: string, from = '/') => {
    const target = new URL('/login', request.url);
    target.searchParams.set('from', from);
    target.searchParams.set('error', code);
    const res = NextResponse.redirect(target);
    res.cookies.set(STATE_COOKIE, '', { ...oauthCookieOptions(), maxAge: 0 });
    return withRequestId(res, requestId);
  };

  const oauthError = url.searchParams.get('error');
  if (oauthError === 'access_denied') return fail('google_denied');
  if (oauthError) return fail('google_failed');

  const code = url.searchParams.get('code');
  const stateToken = url.searchParams.get('state');
  if (!code || !stateToken) return fail('google_failed');

  const state = await readOAuthState(stateToken);
  const cookieNonce = cookieFromRequest(request, STATE_COOKIE);
  if (!state || !cookieNonce || state.nonce !== cookieNonce) return fail('google_failed');

  const from = sanitizeOAuthFrom(state.from);
  const info = await exchangeGoogleCode(code, getGoogleRedirectUri(request));
  if (!info) return fail('google_failed', from);
  if (!info.emailVerified) return fail('google_email', from);

  const result = await findOrCreateGoogleUser({ email: info.email, name: info.name });
  if (!result) return fail('google_failed', from);

  const contactName = displayNameFromGoogle(info.name);
  if (contactName) {
    try {
      await seedProfileContactNameIfEmpty(result.user.id, contactName);
    } catch {
      /* greeting seed must not block login */
    }
  }

  if (result.created) {
    const signupEmail = result.user.email ?? info.email;
    try {
      await sendNewUserNotificationEmail(getAdminNotifyRecipients(), {
        email: signupEmail,
        username: result.user.username,
        createdAt: result.user.createdAt,
      });
    } catch {
      /* admin mail must not block signup */
    }
    try {
      await sendWelcomeEmail(signupEmail);
    } catch {
      /* welcome mail must not block signup */
    }
  }

  const token = await createSessionToken({
    id: result.user.id,
    username: result.user.username,
    email: result.user.email,
  });

  const dest = result.created ? '/welcome' : resolvePostLoginRedirectPath(from);
  const res = NextResponse.redirect(new URL(dest, request.url));
  setSessionCookie(res, token);
  clearImpersonationCookies(res);
  res.cookies.set(STATE_COOKIE, '', { ...oauthCookieOptions(), maxAge: 0 });
  return withRequestId(res, requestId);
}
