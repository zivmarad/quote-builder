import { supabaseAdmin } from '../../../../lib/supabase-server';

const TABLE = 'verification_codes';

export interface VerificationEntry {
  email: string;
  code: string;
  expiresAt: string; // ISO
}

export async function saveVerificationCode(email: string, code: string, ttlMinutes = 10): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
  const { error } = await supabaseAdmin
    .from(TABLE)
    .upsert(
      { email: email.trim().toLowerCase(), code, expires_at: expiresAt, used: false },
      { onConflict: 'email,code' }
    );
  if (error) {
    console.error('saveVerificationCode supabase error:', error);
    return false;
  }
  return true;
}

/** בודק אם הקוד תקין (בלי למחוק) – לשימוש בשלב "המשך" בהרשמה */
export async function checkVerificationCode(email: string, code: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!supabaseAdmin) return false;
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select('code')
    .eq('email', normalizedEmail)
    .eq('code', code)
    .eq('used', false)
    .gte('expires_at', new Date().toISOString())
    .maybeSingle();
  if (error && error.code !== 'PGRST116') {
    console.error('checkVerificationCode supabase error:', error);
    return false;
  }
  return !!data;
}

export async function consumeVerificationCode(email: string, code: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!supabaseAdmin) return false;
  const nowIso = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update({ used: true })
    .eq('email', normalizedEmail)
    .eq('code', code)
    .eq('used', false)
    .gte('expires_at', nowIso)
    .select('email')
    .maybeSingle();
  if (error && error.code !== 'PGRST116') {
    console.error('consumeVerificationCode supabase error:', error);
    return false;
  }
  return !!data;
}

export function generateSixDigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
