import { NextResponse } from 'next/server';
import { isAdminConfigReady, tryAdminLogin } from '../../../../lib/admin-config';
import { logAdminAudit } from '../../../../lib/admin-audit';
import { getRequestLogMeta, logError, logWarn } from '../../../../lib/observability';
import { withRequestId } from '../../../../lib/api-helpers';

/** כניסת אדמין – שם משתמש וסיסמה. מחזיר מפתח לשימוש ב־X-Admin-Key. */
export async function POST(request: Request) {
  const meta = getRequestLogMeta(request);
  const json = (body: unknown, init?: ResponseInit) => withRequestId(NextResponse.json(body, init), meta.requestId);
  try {
    if (!isAdminConfigReady()) {
      await logAdminAudit(request, 'admin_login_blocked_config', { reason: 'admin_env_missing' });
      logWarn('Admin login blocked - missing config', { ...meta });
      return json({ ok: false, error: 'תצורת אדמין חסרה בשרת' }, { status: 503 });
    }
    const body = await request.json();
    const u = typeof body.username === 'string' ? body.username : '';
    const p = typeof body.password === 'string' ? body.password : '';
    const ok = tryAdminLogin(u, p);
    if (!ok) {
      await logAdminAudit(request, 'admin_login_failed', { username: u });
      logWarn('Admin login failed', { ...meta, username: u });
      return json({ ok: false, error: 'שם משתמש או סיסמה שגויים' }, { status: 401 });
    }
    await logAdminAudit(request, 'admin_login_success', { username: u });
    return json({ ok: true, key: ok.key });
  } catch (e) {
    logError('Admin login exception', { ...meta, error: e instanceof Error ? e.message : String(e) });
    return json({ ok: false, error: 'שגיאה בשרת' }, { status: 500 });
  }
}
