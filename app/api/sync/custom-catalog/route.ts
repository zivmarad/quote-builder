import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '../../../../lib/supabase-server';
import { getCurrentUser } from '../../../../lib/auth-server';
import { rateLimitResponse, checkBodySize } from '../../../../lib/api-helpers';
import { LIMITS } from '../../../../lib/rate-limit';
import {
  EMPTY_CUSTOM_CATALOG,
  isCustomCatalogEmpty,
  parseCustomCatalog,
  type CustomCatalogData,
  type CustomCategory,
} from '../../../../lib/custom-catalog-types';
import { sendCustomProfessionNotificationEmail } from '../../auth/lib/send-email';
import type { Service } from '../../../../app/service/services';

function getAdminNotifyEmails(): string[] {
  const notifyEmails: string[] = [];
  const adminNotify = process.env.NOTIFY_ADMIN_EMAIL?.trim();
  const smsNotify = process.env.NOTIFY_SMS_EMAIL?.trim();
  if (adminNotify) notifyEmails.push(adminNotify);
  if (smsNotify) notifyEmails.push(smsNotify);
  if (notifyEmails.length === 0) {
    const envEmail = process.env.EMAIL_USER?.trim();
    if (envEmail) notifyEmails.push(envEmail);
  }
  return notifyEmails;
}

function serviceSnapshot(services: Service[]) {
  return services.map((s) => ({
    name: s.name,
    basePrice: s.basePrice,
    unit: s.unit,
    isCounter: s.isCounter,
    questions: s.questions.map((q) => ({
      text: q.text,
      impactType: q.impact.type,
      impactValue: q.impact.value,
    })),
  }));
}

async function notifyNewProfessions(params: {
  userId: string;
  username: string;
  email: string | null | undefined;
  previous: CustomCatalogData;
  next: CustomCatalogData;
}) {
  const prevIds = new Set(params.previous.customCategories.map((c) => c.id));
  const created = params.next.customCategories.filter((c) => !prevIds.has(c.id));
  if (created.length === 0) return;

  const notifyEmails = getAdminNotifyEmails();

  for (const category of created) {
    const services = params.next.servicesByCategory[category.id] ?? [];
    const snapshot = serviceSnapshot(services);

    try {
      await supabaseAdmin!.from('custom_profession_events').insert({
        user_id: params.userId,
        username: params.username,
        email: params.email ?? null,
        category_id: category.id,
        category_name: category.name,
        icon: category.icon,
        services_snapshot: snapshot,
        created_at: category.createdAt || new Date().toISOString(),
      });
    } catch (e) {
      console.warn('custom_profession_events insert failed:', e);
    }

    if (notifyEmails.length === 0) continue;
    try {
      await sendCustomProfessionNotificationEmail(notifyEmails, {
        userId: params.userId,
        username: params.username,
        email: params.email ?? null,
        categoryId: category.id,
        categoryName: category.name,
        icon: category.icon,
        services: snapshot,
        createdAt: category.createdAt || new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to send custom profession notification email:', e);
    }
  }
}

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
      .from('user_custom_catalog')
      .select('catalog')
      .eq('user_id', userId)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') {
      console.error('Sync custom-catalog GET:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    const catalog = parseCustomCatalog(data?.catalog ?? EMPTY_CUSTOM_CATALOG);
    return NextResponse.json({
      ok: true,
      catalog,
      empty: isCustomCatalogEmpty(catalog),
    });
  } catch (e) {
    console.error('Sync custom-catalog GET:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה בטעינה' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = await rateLimitResponse(request, LIMITS.SYNC);
  if (rateLimited) return rateLimited;
  const bodyTooBig = checkBodySize(request);
  if (bodyTooBig) return bodyTooBig;
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'נא להתחבר' }, { status: 401 });
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'Supabase לא מוגדר' }, { status: 503 });
  }
  try {
    const body = await request.json();
    const catalog = parseCustomCatalog((body as { catalog?: unknown }).catalog);
    const userId = user.id;

    const { data: existing } = await supabaseAdmin!
      .from('user_custom_catalog')
      .select('catalog')
      .eq('user_id', userId)
      .maybeSingle();
    const previous = parseCustomCatalog(existing?.catalog ?? EMPTY_CUSTOM_CATALOG);

    const { error } = await supabaseAdmin!
      .from('user_custom_catalog')
      .upsert(
        { user_id: userId, catalog, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    if (error) {
      console.error('Sync custom-catalog POST:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // לא חוסם שמירה אם מייל/לוג נכשלים
    await notifyNewProfessions({
      userId,
      username: user.username,
      email: user.email,
      previous,
      next: catalog,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Sync custom-catalog POST:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה בשמירה' }, { status: 500 });
  }
}

/** ייצוא עזר לטיפוסים (לא בשימוש ב-route) */
export type { CustomCategory };
