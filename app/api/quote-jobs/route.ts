import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/auth-server';
import { rateLimitResponse, withRequestId } from '../../../lib/api-helpers';
import { LIMITS } from '../../../lib/rate-limit';
import { isSupabaseConfigured, supabaseAdmin } from '../../../lib/supabase-server';
import { getRequestLogMeta, logError } from '../../../lib/observability';
import { waitUntil } from '@vercel/functions';
import { generateServerQuotePdf, type ServerQuoteSnapshot } from '../../../lib/server-quote-pdf';

export const runtime = 'nodejs';

type ExportJobType = 'download' | 'whatsapp';
const QUOTE_EXPORT_BUCKET = process.env.QUOTE_EXPORT_BUCKET?.trim() || 'quote-exports';

async function processExportJob(params: {
  jobId: string;
  userId: string;
  exportType: ExportJobType;
  quoteData: ServerQuoteSnapshot;
  requestId: string;
}) {
  if (!supabaseAdmin) return;
  const now = new Date().toISOString();
  await supabaseAdmin
    .from('quote_export_jobs')
    .update({ status: 'processing', attempts: 1, updated_at: now })
    .eq('id', params.jobId)
    .eq('user_id', params.userId);

  try {
    const pdfBuffer = await generateServerQuotePdf(params.quoteData);
    const path = `${params.userId}/${params.jobId}.pdf`;
    const { error: uploadErr } = await supabaseAdmin.storage.from(QUOTE_EXPORT_BUCKET).upload(path, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });
    if (uploadErr) throw new Error(uploadErr.message || 'upload_failed');

    const { data: publicUrlData } = supabaseAdmin.storage.from(QUOTE_EXPORT_BUCKET).getPublicUrl(path);
    const fileUrl = publicUrlData?.publicUrl;
    if (!fileUrl) throw new Error('public_url_failed');

    await supabaseAdmin
      .from('quote_export_jobs')
      .update({
        status: 'completed',
        file_url: fileUrl,
        updated_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
      })
      .eq('id', params.jobId)
      .eq('user_id', params.userId);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    await supabaseAdmin
      .from('quote_export_jobs')
      .update({
        status: 'failed',
        error_message: errorMessage.slice(0, 500),
        updated_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
      })
      .eq('id', params.jobId)
      .eq('user_id', params.userId);
    logError('Quote job background processing failed', {
      requestId: params.requestId,
      userId: params.userId,
      jobId: params.jobId,
      exportType: params.exportType,
      error: errorMessage,
    });
  }
}

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
      quoteNumber?: number;
      payload?: Record<string, unknown>;
      quoteData?: ServerQuoteSnapshot;
    };
    const exportType = body.exportType === 'whatsapp' ? 'whatsapp' : body.exportType === 'download' ? 'download' : null;
    if (!exportType) {
      return json({ ok: false, error: 'exportType לא תקין' }, { status: 400 });
    }
    const quoteNumber = typeof body.quoteNumber === 'number' && body.quoteNumber >= 1 ? body.quoteNumber : null;
    const quoteData = body.quoteData;
    if (!quoteData || typeof quoteData !== 'object' || !Array.isArray(quoteData.items)) {
      return json({ ok: false, error: 'quoteData לא תקין' }, { status: 400 });
    }

    const jobId = `qjob_${crypto.randomUUID()}`;
    const payload = body.payload && typeof body.payload === 'object' ? body.payload : {};
    const now = new Date().toISOString();

    const { error } = await supabaseAdmin.from('quote_export_jobs').insert({
      id: jobId,
      user_id: user.id,
      export_type: exportType,
      status: 'queued',
      quote_number: quoteNumber,
      quote_data: quoteData,
      payload,
      attempts: 0,
      created_at: now,
      updated_at: now,
    });

    if (error) {
      logError('Quote job create failed', { ...meta, userId: user.id, error: error.message });
      return json({ ok: false, error: 'שגיאה ביצירת משימה' }, { status: 500 });
    }

    const processPromise = processExportJob({
      jobId,
      userId: user.id,
      exportType,
      quoteData,
      requestId: meta.requestId,
    });
    try {
      waitUntil(processPromise);
    } catch {
      // Local dev / non-Vercel fallback: still run background task best-effort.
      void processPromise;
    }

    return json({ ok: true, jobId, status: 'queued' }, { status: 202 });
  } catch (e) {
    logError('Quote job create exception', { ...meta, error: e instanceof Error ? e.message : String(e) });
    return json({ ok: false, error: 'שגיאה בשרת' }, { status: 500 });
  }
}
