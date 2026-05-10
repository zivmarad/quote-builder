import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '../../../lib/supabase-server';
import { getOrCreateRequestId, withRequestId } from '../../../lib/api-helpers';
import { logError } from '../../../lib/observability';

/**
 * Health check – לבדיקות אוטומטיות (Vercel, load balancer) ולניטור.
 * מחזיר 200 עם סטטוס Supabase.
 */
export async function GET(request: Request) {
  const requestId = getOrCreateRequestId(request);
  try {
    const supabaseOk = isSupabaseConfigured;
    return withRequestId(NextResponse.json({
      ok: true,
      supabase: supabaseOk,
      timestamp: new Date().toISOString(),
    }), requestId);
  } catch (e) {
    logError('Health check error', { requestId, error: e instanceof Error ? e.message : String(e) });
    return withRequestId(
      NextResponse.json({ ok: false, error: 'health check failed' }, { status: 500 }),
      requestId
    );
  }
}
