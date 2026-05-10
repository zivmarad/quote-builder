import { createHash } from 'crypto';
import { hash as bcryptHash, compare as bcryptCompare } from 'bcryptjs';
import { supabaseAdmin } from '../../../../lib/supabase-server';

const BCRYPT_ROUNDS = 10;

export interface StoredUser {
  id: string;
  username: string;
  email?: string;
  passwordHash: string;
  createdAt: string;
}

/** משתמש ללא סיסמה – לרשימות אדמין */
export interface UserListItem {
  id: string;
  username: string;
  email: string | null;
  createdAt: string;
}

export interface UsersPageResult {
  users: UserListItem[];
  total: number;
}

function isLegacyHash(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash);
}

function legacyHash(password: string): string {
  return createHash('sha256').update(password, 'utf8').digest('hex');
}

/** Hashing עם bcrypt (מלח אוטומטי). משתמשים חדשים והרשמות מחדש. */
export async function hashPassword(password: string): Promise<string> {
  return bcryptHash(password, BCRYPT_ROUNDS);
}

/** בודק סיסמה – תומך ב-bcrypt וב-SHA256 ישן (מיגרציה). */
export async function verifyPassword(plainPassword: string, storedHash: string): Promise<boolean> {
  if (isLegacyHash(storedHash)) {
    return legacyHash(plainPassword) === storedHash;
  }
  return bcryptCompare(plainPassword, storedHash);
}

/** מיגרציה: מעדכן גיבוב ישן ל-bcrypt אחרי התחברות מוצלחת */
export async function rehashToBcryptIfNeeded(userId: string, plainPassword: string, currentHash: string): Promise<void> {
  if (!isLegacyHash(currentHash) || !supabaseAdmin) return;
  const newHash = await hashPassword(plainPassword);
  await supabaseAdmin.from('app_users').update({ password_hash: newHash }).eq('id', userId).select('id').maybeSingle();
}

export function generateId(): string {
  return `u-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** מחזיר משתמש לפי שם משתמש או אימייל (חיפוש case-insensitive) */
export async function getUserByLogin(login: string): Promise<StoredUser | null> {
  if (!supabaseAdmin) return null;
  const trimmed = login.trim();
  if (!trimmed) return null;

  let { data } = await supabaseAdmin
    .from('app_users')
    .select('id, username, email, password_hash, created_at')
    .ilike('username', trimmed)
    .limit(1)
    .maybeSingle();

  if (!data) {
    const res = await supabaseAdmin
      .from('app_users')
      .select('id, username, email, password_hash, created_at')
      .ilike('email', trimmed)
      .limit(1)
      .maybeSingle();
    data = res.data;
  }

  if (!data) return null;
  return {
    id: data.id,
    username: data.username,
    email: data.email ?? undefined,
    passwordHash: data.password_hash,
    createdAt: data.created_at,
  };
}

/** מחזיר משתמש לפי id */
export async function getUserById(userId: string): Promise<StoredUser | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from('app_users')
    .select('id, username, email, password_hash, created_at')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    username: data.username,
    email: data.email ?? undefined,
    passwordHash: data.password_hash,
    createdAt: data.created_at,
  };
}

/** בודק אם שם משתמש תפוס (case-insensitive) */
export async function usernameExists(username: string): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const { data } = await supabaseAdmin
    .from('app_users')
    .select('id')
    .ilike('username', username.trim())
    .limit(1)
    .maybeSingle();
  return !!data;
}

/** בודק אם אימייל תפוס (case-insensitive) */
export async function emailExists(email: string): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const { data } = await supabaseAdmin
    .from('app_users')
    .select('id')
    .ilike('email', email.trim().toLowerCase())
    .limit(1)
    .maybeSingle();
  return !!data;
}

/** יוצר משתמש חדש (שורה אחת) */
export async function createUser(user: StoredUser): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const { error } = await supabaseAdmin.from('app_users').insert({
    id: user.id,
    username: user.username,
    email: user.email ?? null,
    password_hash: user.passwordHash,
    created_at: user.createdAt,
  });
  if (error) {
    console.error('createUser supabase error:', error);
    return false;
  }
  return true;
}

/** מעדכן סיסמה למשתמש לפי id */
export async function updatePasswordHash(userId: string, newPasswordHash: string): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const { data, error } = await supabaseAdmin
    .from('app_users')
    .update({ password_hash: newPasswordHash })
    .eq('id', userId)
    .select('id')
    .maybeSingle();
  if (error) {
    console.error('updatePasswordHash supabase error:', error);
    return false;
  }
  return !!data;
}

/** מעדכן סיסמה למשתמש לפי אימייל (שחזור סיסמה) – חיפוש case-insensitive */
export async function updatePasswordByEmail(email: string, newPasswordHash: string): Promise<boolean> {
  const user = await getUserByLogin(email.trim());
  if (!user) return false;
  return updatePasswordHash(user.id, newPasswordHash);
}

/** רשימת משתמשים לאדמין (בלי סיסמה), ממוין לפי תאריך */
export async function getUsersList(): Promise<UserListItem[]> {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from('app_users')
    .select('id, username, email, created_at')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('getUsersList supabase error:', error);
    return [];
  }
  return (
    data?.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email ?? null,
      createdAt: u.created_at,
    })) ?? []
  );
}

/** עמוד משתמשים לאדמין עם סינון בסיסי */
export async function getUsersPage(params: {
  page: number;
  pageSize: number;
  search?: string;
  sinceIso?: string;
}): Promise<UsersPageResult> {
  if (!supabaseAdmin) return { users: [], total: 0 };

  const safePage = Math.max(1, Math.floor(params.page || 1));
  const safePageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize || 25)));
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;
  const qText = (params.search ?? '').trim();

  let query = supabaseAdmin
    .from('app_users')
    .select('id, username, email, created_at', { count: 'exact' });

  if (qText) {
    query = query.or(`username.ilike.%${qText}%,email.ilike.%${qText}%`);
  }
  if (params.sinceIso) {
    query = query.gte('created_at', params.sinceIso);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('getUsersPage supabase error:', error);
    return { users: [], total: 0 };
  }

  const users: UserListItem[] =
    data?.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email ?? null,
      createdAt: u.created_at,
    })) ?? [];

  return { users, total: count ?? 0 };
}

/** סה"כ משתמשים */
export async function getUsersCount(): Promise<number> {
  if (!supabaseAdmin) return 0;
  const { count, error } = await supabaseAdmin.from('app_users').select('*', { count: 'exact', head: true });
  if (error) return 0;
  return count ?? 0;
}

/** משתמשים שנרשמו מאז תאריך (ISO) */
export async function getNewUsersCount(sinceIso: string): Promise<number> {
  if (!supabaseAdmin) return 0;
  const { count, error } = await supabaseAdmin
    .from('app_users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sinceIso);
  if (error) return 0;
  return count ?? 0;
}

/** מוחק משתמש וכל הנתונים המשויכים */
export async function deleteUserById(userId: string): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const user = await getUserById(userId);
  if (!user) return false;

  const tablesByUserId = ['quotes', 'quote_basket', 'quote_drafts', 'quote_history', 'user_profile', 'user_settings', 'price_overrides'] as const;
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
