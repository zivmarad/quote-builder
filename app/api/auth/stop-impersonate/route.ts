import { NextResponse } from 'next/server';
import {
  isImpersonationActive,
  getCurrentUser,
  getPrevSessionTokenFromRequest,
  setSessionCookie,
  clearSessionCookie,
  clearImpersonationCookies,
} from '../../../../lib/auth-server';
import { logAdminAudit } from '../../../../lib/admin-audit';
import { getRequestLogMeta, logWarn } from '../../../../lib/observability';
import { withRequestId } from '../../../../lib/api-helpers';

/** יציאה ממצב "צפה כמשתמש" – שחזור סשן קודם או התנתקות */
export async function POST(request: Request) {
  const meta = getRequestLogMeta(request);
  const json = (body: unknown, init?: ResponseInit) => withRequestId(NextResponse.json(body, init), meta.requestId);
  if (!isImpersonationActive(request)) {
    logWarn('Stop impersonate while not active', { ...meta });
    return json({ ok: false, error: 'לא במצב התחזות' }, { status: 400 });
  }

  const impersonatedUser = await getCurrentUser(request);
  const prev = getPrevSessionTokenFromRequest(request);
  const response = json({ ok: true });

  if (prev) {
    setSessionCookie(response, prev);
  } else {
    clearSessionCookie(response);
  }
  clearImpersonationCookies(response);
  await logAdminAudit(request, 'impersonate_stop', {
    targetUserId: impersonatedUser?.id ?? null,
    targetUsername: impersonatedUser?.username ?? null,
  });
  return response;
}
