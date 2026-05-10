import { getCurrentUser } from './auth-server';
import { getClientIdentifier } from './rate-limit';
import { isSupabaseConfigured, supabaseAdmin } from './supabase-server';

export type AdminAuditAction =
  | 'admin_login_success'
  | 'admin_login_failed'
  | 'admin_login_blocked_config'
  | 'impersonate_start'
  | 'impersonate_stop'
  | 'admin_user_deleted';

export async function logAdminAudit(
  request: Request,
  action: AdminAuditAction,
  details: Record<string, unknown> = {}
): Promise<void> {
  if (!isSupabaseConfigured || !supabaseAdmin) return;
  try {
    const sessionUser = await getCurrentUser(request);
    await supabaseAdmin.from('admin_audit_logs').insert({
      action,
      actor_user_id: sessionUser?.id ?? null,
      actor_username: sessionUser?.username ?? null,
      target_user_id: typeof details.targetUserId === 'string' ? details.targetUserId : null,
      ip: getClientIdentifier(request),
      details,
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('Admin audit log failed:', e);
  }
}
