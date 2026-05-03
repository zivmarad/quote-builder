import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '../../../../lib/supabase-server';
import { getCurrentUser } from '../../../../lib/auth-server';
import { rateLimitResponse, checkBodySize } from '../../../../lib/api-helpers';
import { LIMITS } from '../../../../lib/rate-limit';

const MAX_LOGO_UPLOAD_BYTES = 2 * 1024 * 1024; // JSON with base64
const MAX_DECODED_BYTES = 1.75 * 1024 * 1024;

const BUCKET = 'profile-logos';

function parseDataUrl(dataUrl: string): { buffer: Buffer; contentType: string; ext: string } | null {
  const trimmed = dataUrl.trim();
  const m = /^data:(image\/jpeg|image\/jpg|image\/png|image\/webp);base64,(.+)$/i.exec(trimmed);
  if (!m) return null;
  const rawMime = m[1].toLowerCase();
  const contentType =
    rawMime === 'image/jpg' || rawMime === 'image/jpeg' ? 'image/jpeg' : rawMime === 'image/png' ? 'image/png' : 'image/webp';
  const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
  try {
    const buffer = Buffer.from(m[2], 'base64');
    if (buffer.length > MAX_DECODED_BYTES) return null;
    return { buffer, contentType, ext };
  } catch {
    return null;
  }
}

/** העלאת לוגו ל־Supabase Storage – נשמר URL בפרופיל (יציב, לא תלוי ב־localStorage). */
export async function POST(request: NextRequest) {
  const rateLimited = rateLimitResponse(request, LIMITS.LOGO_UPLOAD);
  if (rateLimited) return rateLimited;
  const tooBig = checkBodySize(request, MAX_LOGO_UPLOAD_BYTES);
  if (tooBig) return tooBig;

  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'נא להתחבר' }, { status: 401 });
  }
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return NextResponse.json({ ok: false, error: 'Supabase לא מוגדר' }, { status: 503 });
  }

  try {
    const body = (await request.json()) as { dataUrl?: string };
    const dataUrl = typeof body.dataUrl === 'string' ? body.dataUrl : '';
    const parsed = parseDataUrl(dataUrl);
    if (!parsed) {
      return NextResponse.json({ ok: false, error: 'תמונה לא תקינה או גדולה מדי' }, { status: 400 });
    }

    const path = `${user.id}/logo.${parsed.ext}`;

    const { error: upErr } = await supabaseAdmin.storage.from(BUCKET).upload(path, parsed.buffer, {
      contentType: parsed.contentType,
      upsert: true,
    });

    if (upErr) {
      console.error('profile-logo upload:', upErr);
      return NextResponse.json(
        { ok: false, error: upErr.message || 'העלאה נכשלה' },
        { status: upErr.message?.includes('Bucket not found') ? 503 : 500 }
      );
    }

    const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
    const url = pub?.publicUrl;
    if (!url) {
      return NextResponse.json({ ok: false, error: 'לא נוצר קישור לתמונה' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, url });
  } catch (e) {
    console.error('profile-logo POST:', e);
    return NextResponse.json({ ok: false, error: 'שגיאת שרת' }, { status: 500 });
  }
}
