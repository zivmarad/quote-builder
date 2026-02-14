import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '../../../lib/supabase-server';

/**
 * Health check – לבדיקות אוטומטיות (Vercel, load balancer) ולניטור.
 * מחזיר 200 עם סטטוס Supabase.
 */
export async function GET() {
  try {
    const supabaseOk = isSupabaseConfigured;
    return NextResponse.json({
      ok: true,
      supabase: supabaseOk,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Health check error:', e);
    return NextResponse.json({ ok: false, error: 'health check failed' }, { status: 500 });
  }
}
