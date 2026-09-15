import { NextResponse } from 'next/server';
import { rateLimitResponse, withRequestId, getOrCreateRequestId } from '../../../../lib/api-helpers';
import { LIMITS } from '../../../../lib/rate-limit';
import {
  buildGoogleAuthUrl,
  createOAuthState,
  getGoogleRedirectUri,
  isGoogleOAuthConfigured,
  oauthCookieOptions,
  sanitizeOAuthFrom,
  STATE_COOKIE,
} from '../../../../lib/google-oauth';

export async function GET(request: Request) {
  const requestId = getOrCreateRequestId(request);
  const rateLimited = await rateLimitResponse(request, LIMITS.AUTH);
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const from = sanitizeOAuthFrom(url.searchParams.get('from'));
  const failTarget = new URL('/login', request.url);
  failTarget.searchParams.set('from', from);

  if (!isGoogleOAuthConfigured()) {
    failTarget.searchParams.set('error', 'google_config');
    return withRequestId(NextResponse.redirect(failTarget), requestId);
  }

  const state = await createOAuthState(from);
  if (!state) {
    failTarget.searchParams.set('error', 'google_config');
    return withRequestId(NextResponse.redirect(failTarget), requestId);
  }

  const redirectUri = getGoogleRedirectUri(request);
  const googleUrl = buildGoogleAuthUrl({ redirectUri, state: state.token });
  const res = NextResponse.redirect(googleUrl);
  res.cookies.set(STATE_COOKIE, state.nonce, oauthCookieOptions());
  return withRequestId(res, requestId);
}
