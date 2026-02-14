/** האם Supabase מוגדר (מפתחות ב־env) */
export const isSyncAvailable = typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_SUPABASE_URL;

/** אירוע כשסנכרון נכשל (לא 401) – להצגת הודעה למשתמש */
export const SYNC_FAILED_EVENT = 'quoteBuilderSyncFailed';

function notifySyncFailed(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SYNC_FAILED_EVENT));
}

export async function fetchSync<T>(path: string, userId: string | null): Promise<T | null> {
  if (!userId) return null;
  try {
    const res = await fetch(`/api/sync${path}?userId=${encodeURIComponent(userId)}`, { credentials: 'include' });
    if (!res.ok) {
      if (res.status !== 401 && res.status !== 503) notifySyncFailed();
      return null;
    }
    const data = await res.json();
    return data?.ok ? data : null;
  } catch {
    if (isSyncAvailable) notifySyncFailed();
    return null;
  }
}

export async function postSync(
  path: string,
  userId: string | null,
  payload: Record<string, unknown>
): Promise<boolean> {
  if (!userId) return false;
  try {
    const res = await fetch(`/api/sync${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...payload }),
      credentials: 'include',
    });
    if (!res.ok) {
      if (res.status !== 401 && res.status !== 503) notifySyncFailed();
      return false;
    }
    const data = await res.json();
    return !!data?.ok;
  } catch {
    if (isSyncAvailable) notifySyncFailed();
    return false;
  }
}
