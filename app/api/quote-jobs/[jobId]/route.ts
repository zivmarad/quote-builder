import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth-server';
import { rateLimitResponse, withRequestId } from '../../../../lib/api-helpers';
import { LIMITS } from '../../../../lib/rate-limit';
import { isSupabaseConfigured, supabaseAdmin } from '../../../../lib/supabase-server';
import { getRequestLogMeta, logError } from '../../../../lib/observability';

export const runtime = 'nodejs';

type ExportJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const meta = getRequestLogMeta(request);
  const json = (body: unknown, init?: ResponseInit) => withRequestId(NextResponse.json(body, init), meta.requestId);

  const rateLimited = await rateLimitResponse(request, LIMITS.QUOTE_JOBS);
  if (rateLimited) return rateLimited;

  const user = await getCurrentUser(request);
  if (!user) return json({ ok: false, error: 'נא להתחבר' }, { status: 401 });
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return json({ ok: false, error: 'Supabase לא מוגדר' }, { status: 503 });
  }

  const { jobId } = await params;
  if (!jobId) return json({ ok: false, error: 'חסר jobId' }, { status: 400 });

  try {
    const { data, error } = await supabaseAdmin
      .from('quote_export_jobs')
      .select('id, status, error_message, attempts, file_url, created_at, updated_at, finished_at')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();
    if (error || !data) return json({ ok: false, error: 'משימה לא נמצאה' }, { status: 404 });
    return json({
      ok: true,
      job: {
        id: data.id,
        status: data.status,
        attempts: data.attempts ?? 0,
        fileUrl: data.file_url ?? null,
        errorMessage: data.error_message ?? null,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        finishedAt: data.finished_at ?? null,
      },
    });
  } catch (e) {
    logError('Quote job get exception', { ...meta, userId: user.id, jobId, error: e instanceof Error ? e.message : String(e) });
    return json({ ok: false, error: 'שגיאה בשרת' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const meta = getRequestLogMeta(request);
  const json = (body: unknown, init?: ResponseInit) => withRequestId(NextResponse.json(body, init), meta.requestId);

  const rateLimited = await rateLimitResponse(request, LIMITS.QUOTE_JOBS);
  if (rateLimited) return rateLimited;

  const user = await getCurrentUser(request);
  if (!user) return json({ ok: false, error: 'נא להתחבר' }, { status: 401 });
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return json({ ok: false, error: 'Supabase לא מוגדר' }, { status: 503 });
  }

  const { jobId } = await params;
  if (!jobId) return json({ ok: false, error: 'חסר jobId' }, { status: 400 });

  try {
    const body = (await request.json()) as {
      status?: ExportJobStatus;
      errorMessage?: string | null;
      incrementAttempts?: boolean;
    };
    const status = body.status;
    if (!status || !['queued', 'processing', 'completed', 'failed'].includes(status)) {
      return json({ ok: false, error: 'status לא תקין' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { status, updated_at: now };
    if (status === 'completed' || status === 'failed') patch.finished_at = now;
    if (typeof body.errorMessage === 'string') patch.error_message = body.errorMessage.slice(0, 500);
    if (body.errorMessage === null) patch.error_message = null;
    if (body.incrementAttempts) patch.attempts = 1; // increment via rpc-less expression below

    if (body.incrementAttempts) {
      const { data: row, error: rowErr } = await supabaseAdmin
        .from('quote_export_jobs')
        .select('attempts')
        .eq('id', jobId)
        .eq('user_id', user.id)
        .single();
      if (rowErr) {
        return json({ ok: false, error: 'משימה לא נמצאה' }, { status: 404 });
      }
      patch.attempts = (typeof row.attempts === 'number' ? row.attempts : 0) + 1;
    }

    const { error } = await supabaseAdmin
      .from('quote_export_jobs')
      .update(patch)
      .eq('id', jobId)
      .eq('user_id', user.id);

    if (error) {
      logError('Quote job update failed', { ...meta, userId: user.id, jobId, error: error.message });
      return json({ ok: false, error: 'שגיאה בעדכון משימה' }, { status: 500 });
    }

    return json({ ok: true });
  } catch (e) {
    logError('Quote job update exception', { ...meta, userId: user.id, jobId, error: e instanceof Error ? e.message : String(e) });
    return json({ ok: false, error: 'שגיאה בשרת' }, { status: 500 });
  }
}
