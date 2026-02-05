/** האם Supabase מוגדר (מפתחות ב־env) */
export const isSyncAvailable = typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function fetchSync<T>(path: string, userId: string | null): Promise<T | null> {
  if (!userId || !isSyncAvailable) return null;
  try {
    const res = await fetch(`/api/sync${path}?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.ok ? data : null;
  } catch {
    return null;
  }
}

export async function postSync(
  path: string,
  userId: string | null,
  payload: Record<string, unknown>
): Promise<boolean> {
  if (!userId || !isSyncAvailable) return false;
  try {
    const res = await fetch(`/api/sync${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...payload }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data?.ok;
  } catch {
    return false;
  }
}
