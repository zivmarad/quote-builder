import { createHash } from 'crypto';
import { supabaseAdmin } from '../../../../lib/supabase-server';

export interface StoredUser {
  id: string;
  username: string;
  /** אימייל – משמש להתחברות עם קוד אימות */
  email?: string;
  passwordHash: string;
  createdAt: string;
}

export async function readUsers(): Promise<StoredUser[]> {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from('app_users')
    .select('id, username, email, password_hash, created_at')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('readUsers supabase error:', error);
    return [];
  }
  return (
    data?.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email ?? undefined,
      passwordHash: u.password_hash,
      createdAt: u.created_at,
    })) ?? []
  );
}

export async function writeUsers(users: StoredUser[]): Promise<void> {
  if (!supabaseAdmin || !users?.length) return;
  const rows = users.map((u) => ({
    id: u.id,
    username: u.username,
    email: u.email ?? null,
    password_hash: u.passwordHash,
    created_at: u.createdAt,
  }));
  const { error } = await supabaseAdmin
    .from('app_users')
    .upsert(rows, { onConflict: 'id' });
  if (error) console.error('writeUsers supabase error:', error);
}

export function hashPassword(password: string): string {
  return createHash('sha256').update(password, 'utf8').digest('hex');
}

export function generateId(): string {
  return `u-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** מוחק משתמש לפי id – כולל כל הנתונים המשויכים (פרופיל, סל, היסטוריה, הגדרות, קודי אימות) */
export async function deleteUserById(userId: string): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const users = await readUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return false;

  const tablesByUserId = ['quote_basket', 'quote_history', 'user_profile', 'user_settings', 'price_overrides'] as const;
  for (const table of tablesByUserId) {
    const { error } = await supabaseAdmin.from(table).delete().eq('user_id', userId);
    if (error) console.error(`deleteUserById ${table} error:`, error);
  }
  if (user.email) {
    const { error } = await supabaseAdmin.from('verification_codes').delete().eq('email', user.email.trim().toLowerCase());
    if (error) console.error('deleteUserById verification_codes error:', error);
  }
  const { error } = await supabaseAdmin.from('app_users').delete().eq('id', userId);
  if (error) {
    console.error('deleteUserById app_users error:', error);
    return false;
  }
  return true;
}

/** מעדכן סיסמה למשתמש לפי אימייל (לשחזור סיסמה) */
export async function updatePasswordByEmail(email: string, newPasswordHash: string): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabaseAdmin
    .from('app_users')
    .update({ password_hash: newPasswordHash })
    .eq('email', normalizedEmail)
    .select('id')
    .maybeSingle();
  if (error) {
    console.error('updatePasswordByEmail supabase error:', error);
    return false;
  }
  return !!data;
}
