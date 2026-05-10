import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '../../../../lib/supabase-server';
import { getCurrentUser } from '../../../../lib/auth-server';
import { rateLimitResponse, checkCustomerBodySize } from '../../../../lib/api-helpers';
import { LIMITS } from '../../../../lib/rate-limit';

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizeRow(r: Record<string, unknown>) {
  return {
    id: String(r.id),
    user_id: String(r.user_id),
    full_name: str(r.full_name),
    phone: str(r.phone),
    email: str(r.email),
    address: str(r.address),
    city: str(r.city),
    notes: str(r.notes),
    created_at: typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
    updated_at: typeof r.updated_at === 'string' ? r.updated_at : new Date().toISOString(),
  };
}

/** רשימת לקוחות של המשתמש המחובר */
export async function GET(request: NextRequest) {
  const rateLimited = await rateLimitResponse(request, LIMITS.SYNC);
  if (rateLimited) return rateLimited;
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'נא להתחבר' }, { status: 401 });
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'Supabase לא מוגדר' }, { status: 503 });
  }
  const userId = user.id;
  try {
    const { data, error } = await supabaseAdmin!
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) {
      console.error('Sync customers GET:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    const customers = (data ?? []).map((r) => normalizeRow(r as Record<string, unknown>));
    return NextResponse.json({ ok: true, customers });
  } catch (e) {
    console.error('Sync customers GET:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה בטעינה' }, { status: 500 });
  }
}

/** יצירה או עדכון לקוח בודד */
export async function POST(request: NextRequest) {
  const rateLimited = await rateLimitResponse(request, LIMITS.SYNC);
  if (rateLimited) return rateLimited;
  const bodyTooBig = checkCustomerBodySize(request);
  if (bodyTooBig) return bodyTooBig;
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'נא להתחבר' }, { status: 401 });
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'Supabase לא מוגדר' }, { status: 503 });
  }
  const userId = user.id;
  try {
    const body = (await request.json()) as { customer?: unknown };
    const raw = body.customer;
    if (!raw || typeof raw !== 'object') {
      return NextResponse.json({ ok: false, error: 'חסר customer' }, { status: 400 });
    }
    const c = raw as Record<string, unknown>;
    const full_name = str(c.full_name);
    if (!full_name) {
      return NextResponse.json({ ok: false, error: 'חובה שם מלא' }, { status: 400 });
    }
    const phone = str(c.phone);
    const email = str(c.email);
    const address = str(c.address);
    const city = str(c.city);
    const notes = str(c.notes);
    const idRaw = str(c.id);
    const now = new Date().toISOString();

    if (idRaw && isUuid(idRaw)) {
      const { data: existing, error: exErr } = await supabaseAdmin!
        .from('customers')
        .select('id')
        .eq('user_id', userId)
        .eq('id', idRaw)
        .maybeSingle();
      if (exErr) {
        console.error('Sync customers POST read:', exErr);
        return NextResponse.json({ ok: false, error: exErr.message }, { status: 500 });
      }
      if (!existing) {
        return NextResponse.json({ ok: false, error: 'לקוח לא נמצא' }, { status: 404 });
      }
      const { data: updated, error: upErr } = await supabaseAdmin!
        .from('customers')
        .update({
          full_name,
          phone,
          email,
          address,
          city,
          notes,
          updated_at: now,
        })
        .eq('user_id', userId)
        .eq('id', idRaw)
        .select('*')
        .single();
      if (upErr) {
        console.error('Sync customers POST update:', upErr);
        return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, customer: normalizeRow(updated as Record<string, unknown>) });
    }

    const { data: inserted, error: insErr } = await supabaseAdmin!
      .from('customers')
      .insert({
        user_id: userId,
        full_name,
        phone,
        email,
        address,
        city,
        notes,
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single();
    if (insErr) {
      console.error('Sync customers POST insert:', insErr);
      return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, customer: normalizeRow(inserted as Record<string, unknown>) });
  } catch (e) {
    console.error('Sync customers POST:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה בשמירה' }, { status: 500 });
  }
}

/** מחיקת לקוח לפי id (query ?id=) */
export async function DELETE(request: NextRequest) {
  const rateLimited = await rateLimitResponse(request, LIMITS.SYNC);
  if (rateLimited) return rateLimited;
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'נא להתחבר' }, { status: 401 });
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'Supabase לא מוגדר' }, { status: 503 });
  }
  const userId = user.id;
  const id = request.nextUrl.searchParams.get('id')?.trim() ?? '';
  if (!id || !isUuid(id)) {
    return NextResponse.json({ ok: false, error: 'מזהה לא תקין' }, { status: 400 });
  }
  try {
    const { error } = await supabaseAdmin!.from('customers').delete().eq('user_id', userId).eq('id', id);
    if (error) {
      console.error('Sync customers DELETE:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Sync customers DELETE:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה במחיקה' }, { status: 500 });
  }
}
