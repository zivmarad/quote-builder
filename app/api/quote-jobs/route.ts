import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/auth-server';
import { rateLimitResponse, withRequestId } from '../../../lib/api-helpers';
import { LIMITS } from '../../../lib/rate-limit';
import { isSupabaseConfigured, supabaseAdmin } from '../../../lib/supabase-server';
import { getRequestLogMeta, logError } from '../../../lib/observability';

type ExportJobType = 'download' | 'whatsapp';
type ExportJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export async function POST(request: NextRequest) {
  const meta = getRequestLogMeta(request);
  const json = (body: unknown, init?: ResponseInit) => withRequestId(NextResponse.json(body, init), meta.requestId);

  const rateLimited = await rateLimitResponse(request, LIMITS.QUOTE_JOBS);
  if (rateLimited) return rateLimited;

  const user = await getCurrentUser(request);
  if (!user) return json({ ok: false, error: 'נא להתחבר' }, { status: 401 });
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return json({ ok: false, error: 'Supabase לא מוגדר' }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      exportType?: ExportJobType;
      status?: ExportJobStatus;
      quoteNumber?: number;
      payload?: Record<string, unknown>;
    };
    const exportType = body.exportType === 'whatsapp' ? 'whatsapp' : body.exportType === 'download' ? 'download' : null;
    if (!exportType) {
      return json({ ok: false, error: 'exportType לא תקין' }, { status: 400 });
    }

    const status: ExportJobStatus = body.status === 'processing' ? 'processing' : 'queued';
    const quoteNumber = typeof body.quoteNumber === 'number' && body.quoteNumber >= 1 ? body.quoteNumber : null;
    const jobId = `qjob_${crypto.randomUUID()}`;
    const payload = body.payload && typeof body.payload === 'object' ? body.payload : {};
    const now = new Date().toISOString();

    const { error } = await supabaseAdmin.from('quote_export_jobs').insert({
      id: jobId,
      user_id: user.id,
      export_type: exportType,
      status,
      quote_number: quoteNumber,
      payload,
      attempts: 0,
      created_at: now,
      updated_at: now,
    });

    if (error) {
      logError('Quote job create failed', { ...meta, userId: user.id, error: error.message });
      return json({ ok: false, error: 'שגיאה ביצירת משימה' }, { status: 500 });
    }

    return json({ ok: true, jobId, status });
  } catch (e) {
    logError('Quote job create exception', { ...meta, error: e instanceof Error ? e.message : String(e) });
    return json({ ok: false, error: 'שגיאה בשרת' }, { status: 500 });
  }
}
