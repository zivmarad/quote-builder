'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  User,
  FileText,
  ShoppingBag,
  Settings,
  Mail,
  Building2,
  Calendar,
  Trash2,
  Loader2,
  LogIn,
  Eye,
  X,
} from 'lucide-react';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { isAdminWireKeyHeaderSafe } from '../../../../lib/admin-header-key-safe';
import { getQuotePreviewHtml } from '../../../components/utils/pdfExport';
import type { BasketItem } from '../../../contexts/QuoteBasketContext';
import type { QuoteProfile } from '../../../components/utils/pdfExport';

const ADMIN_KEY_STORAGE = 'quoteBuilder_adminKey';

type UserDetail = {
  user: { id: string; username: string; email: string | null; createdAt: string };
  profile: Record<string, unknown>;
  quotes: unknown[];
  basketItems: unknown[];
  settings: Record<string, unknown>;
  overrides: Record<string, number>;
};

type TabId = 'overview' | 'profile' | 'quotes' | 'basket' | 'settings';

function toQuoteProfile(p: Record<string, unknown>): QuoteProfile | null {
  if (!p || typeof p !== 'object') return null;
  const businessName = typeof p.businessName === 'string' ? p.businessName : '';
  const phone = typeof p.phone === 'string' ? p.phone : '';
  return {
    businessName,
    contactName: typeof p.contactName === 'string' ? p.contactName : undefined,
    companyId: typeof p.companyId === 'string' ? p.companyId : undefined,
    phone,
    email: typeof p.email === 'string' ? p.email : undefined,
    address: typeof p.address === 'string' ? p.address : undefined,
    logo: typeof p.logo === 'string' ? p.logo : undefined,
  };
}

function parseQuote(q: unknown): {
  id: string;
  createdAt: string;
  customerName?: string;
  items: BasketItem[];
  totalBeforeVAT: number;
  VAT: number;
  totalWithVAT: number;
  quoteNumber?: number;
  notes?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerCompanyId?: string;
} | null {
  if (!q || typeof q !== 'object') return null;
  const r = q as Record<string, unknown>;
  const items = Array.isArray(r.items) ? (r.items as BasketItem[]) : [];
  return {
    id: typeof r.id === 'string' ? r.id : String(Math.random()),
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : '',
    customerName: typeof r.customerName === 'string' ? r.customerName : undefined,
    items,
    totalBeforeVAT: typeof r.totalBeforeVAT === 'number' ? r.totalBeforeVAT : 0,
    VAT: typeof r.VAT === 'number' ? r.VAT : 0,
    totalWithVAT: typeof r.totalWithVAT === 'number' ? r.totalWithVAT : 0,
    quoteNumber: typeof r.quoteNumber === 'number' ? r.quoteNumber : undefined,
    notes: typeof r.notes === 'string' ? r.notes : undefined,
    customerPhone: typeof r.customerPhone === 'string' ? r.customerPhone : undefined,
    customerEmail: typeof r.customerEmail === 'string' ? r.customerEmail : undefined,
    customerAddress: typeof r.customerAddress === 'string' ? r.customerAddress : undefined,
    customerCompanyId: typeof r.customerCompanyId === 'string' ? r.customerCompanyId : undefined,
  };
}

export default function AdminUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tab, setTab] = useState<TabId>('overview');
  const [impersonating, setImpersonating] = useState(false);
  const [previewQuote, setPreviewQuote] = useState<ReturnType<typeof parseQuote> | null>(null);

  useEffect(() => {
    params.then((p) => setUserId(p.userId));
  }, [params]);

  useEffect(() => {
    if (!userId) return;
    const key = typeof window !== 'undefined' ? sessionStorage.getItem(ADMIN_KEY_STORAGE) : null;
    if (!key) {
      setError('נדרשת כניסת מנהל');
      setLoading(false);
      return;
    }
    if (!isAdminWireKeyHeaderSafe(key)) {
      sessionStorage.removeItem(ADMIN_KEY_STORAGE);
      setError('נא להתחבר מחדש מדף הניהול');
      setLoading(false);
      return;
    }
    fetch(`/api/admin/user/${userId}`, { headers: { 'X-Admin-Key': key } })
      .then((res) => {
        if (res.status === 401) {
          setError('גישה לא מורשית');
          return null;
        }
        if (!res.ok) throw new Error('שגיאה בטעינה');
        return res.json();
      })
      .then((d) => {
        if (d) setData(d);
      })
      .catch((e) => setError(e.message ?? 'שגיאה'))
      .finally(() => setLoading(false));
  }, [userId]);

  const quoteModels = useMemo(() => {
    if (!data?.quotes?.length) return [];
    return data.quotes.map(parseQuote).filter(Boolean) as NonNullable<ReturnType<typeof parseQuote>>[];
  }, [data?.quotes]);

  const profileModel = useMemo(() => (data?.profile ? toQuoteProfile(data.profile as Record<string, unknown>) : null), [data?.profile]);

  const vatRate = typeof data?.settings?.vatRate === 'number' ? data.settings.vatRate : 0.18;
  const defaultQuoteTitle =
    typeof data?.settings?.defaultQuoteTitle === 'string' ? data.settings.defaultQuoteTitle : 'הצעת מחיר';
  const validityDays =
    typeof data?.settings?.validityDays === 'number' ? data.settings.validityDays : 30;

  const doDeleteUser = async () => {
    if (!userId || !data?.user) return;
    const key = typeof window !== 'undefined' ? sessionStorage.getItem(ADMIN_KEY_STORAGE) : null;
    if (!key || !isAdminWireKeyHeaderSafe(key)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/user/${userId}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Key': key },
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        router.push('/admin');
      } else {
        alert(json?.error ?? 'שגיאה במחיקה');
      }
    } catch {
      alert('שגיאה בתקשורת');
    } finally {
      setDeleting(false);
    }
  };

  const handleImpersonate = async () => {
    if (!userId) return;
    const key = typeof window !== 'undefined' ? sessionStorage.getItem(ADMIN_KEY_STORAGE) : null;
    if (!key || !isAdminWireKeyHeaderSafe(key)) return;
    setImpersonating(true);
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': key,
        },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });
      const j = await res.json();
      if (res.ok && j?.ok) {
        window.location.href = '/';
        return;
      }
      alert(j?.error ?? 'לא ניתן להתחזות');
    } catch {
      alert('שגיאה בתקשורת');
    } finally {
      setImpersonating(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return iso;
    }
  };

  const formatMoney = (n: number) =>
    new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n);

  if (!userId || loading) {
    return (
      <main className="min-h-screen bg-slate-50/90 p-6 flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <Loader2 size={40} className="animate-spin text-blue-500" />
          <span>טוען...</span>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-50/80 p-6" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <Link href="/admin" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
            <ArrowRight size={20} /> חזרה ללוח הבקרה
          </Link>
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6">{error ?? 'לא נמצא'}</div>
        </div>
      </main>
    );
  }

  const { user, profile, quotes, basketItems, settings, overrides } = data;
  const profileEntries = Object.entries(profile).filter(([, v]) => v != null && v !== '');
  const logoUrl = typeof profile.logo === 'string' && profile.logo.length > 0 ? profile.logo : null;

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'סקירה' },
    { id: 'profile', label: 'פרופיל' },
    { id: 'quotes', label: `הצעות (${quotes.length})` },
    { id: 'basket', label: `סל (${basketItems.length})` },
    { id: 'settings', label: 'הגדרות' },
  ];

  return (
    <main className="min-h-screen bg-slate-50/90 pb-12" dir="rtl">
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 mb-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm">
            <ArrowRight size={20} /> חזרה ללוח הבקרה
          </Link>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleImpersonate()}
              disabled={impersonating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-60 min-h-[44px]"
            >
              <LogIn size={18} />
              {impersonating ? 'מתחבר…' : 'התחבר כמשתמש (צפייה מלאה)'}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 disabled:opacity-60 min-h-[44px]"
            >
              <Trash2 size={18} />
              הסר משתמש
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <header className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-4">
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-20 h-20 rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt=""
                  className="w-full h-full object-contain"
                  {...(logoUrl.startsWith('http') ? { crossOrigin: 'anonymous' as const } : {})}
                />
              ) : (
                <User size={36} className="text-slate-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-black text-slate-900">{user.username}</h1>
              {user.email && (
                <p className="text-slate-600 flex items-center gap-2 mt-1 text-sm" dir="ltr">
                  <Mail size={16} /> {user.email}
                </p>
              )}
              <p className="text-slate-500 text-sm flex items-center gap-2 mt-1">
                <Calendar size={14} /> נרשם ב־{formatDate(user.createdAt)}
              </p>
              <p className="text-slate-500 text-xs mt-3 leading-relaxed">
                כפתור &quot;התחבר כמשתמש&quot; מחליף את הסשן שלך בסשן של המשתמש — תראה את האתר בדיוק כמוה (סל, פרופיל, PDF). לחץ על &quot;חזור ללוח הניהול&quot; בפס העליון כדי לצאת.
              </p>
            </div>
          </div>
        </header>

        <div className="flex gap-1 p-1 bg-slate-200/80 rounded-xl mb-4 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-colors min-h-[44px] ${
                tab === t.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-slate-500 text-xs font-bold uppercase">הצעות בהיסטוריה</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{quotes.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-slate-500 text-xs font-bold uppercase">פריטים בסל</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{basketItems.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-slate-500 text-xs font-bold uppercase">שדות פרופיל</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{profileEntries.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-slate-500 text-xs font-bold uppercase">מחירים מותאמים</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{Object.keys(overrides).length}</p>
            </div>
          </div>
        )}

        {tab === 'profile' && (
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <Building2 size={20} className="text-slate-600" />
              <h2 className="font-bold text-slate-900">פרופיל עסקי</h2>
            </div>
            <div className="p-4 md:p-6">
              {logoUrl && (
                <div className="mb-6 flex justify-center">
                  <img
                    src={logoUrl}
                    alt="לוגו"
                    className="max-h-40 max-w-full object-contain rounded-xl border border-slate-100"
                    {...(logoUrl.startsWith('http') ? { crossOrigin: 'anonymous' as const } : {})}
                  />
                </div>
              )}
              {profileEntries.length === 0 ? (
                <p className="text-slate-500 text-sm">לא מולא</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {profileEntries.map(([k, v]) => (
                    <li key={k} className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 border-b border-slate-100 pb-3 last:border-0">
                      <span className="text-slate-500 font-medium">{k}</span>
                      <span className="text-slate-900 break-words">
                        {typeof v === 'string' && v.startsWith('data:') ? (
                          <span className="text-slate-500">[תמונה – מוצגת למעלה]</span>
                        ) : (
                          String(v)
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {tab === 'quotes' && (
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <FileText size={20} className="text-slate-600" />
              <h2 className="font-bold text-slate-900">היסטוריית הצעות</h2>
            </div>
            <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
              {quoteModels.length === 0 ? (
                <p className="p-6 text-slate-500 text-sm">אין הצעות</p>
              ) : (
                quoteModels.map((q) => (
                  <div key={q.id} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/80">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900">{q.customerName?.trim() || 'ללא שם לקוח'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{formatDate(q.createdAt)}</p>
                      <p className="text-sm text-slate-700 mt-1">
                        {q.items.length} פריטים · {formatMoney(q.totalWithVAT)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewQuote(q)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm font-medium hover:bg-slate-100 min-h-[40px]"
                    >
                      <Eye size={16} />
                      תצוגה מקדימה
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {tab === 'basket' && (
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <ShoppingBag size={20} className="text-slate-600" />
              <h2 className="font-bold text-slate-900">סל נוכחי</h2>
            </div>
            <div className="p-4">
              {basketItems.length === 0 ? (
                <p className="text-slate-500 text-sm">הסל ריק</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {(basketItems as Array<{ name?: string; basePrice?: number; quantity?: number; extras?: { price: number }[] }>).map(
                    (item, i) => {
                      const extras = item.extras?.reduce((s, e) => s + e.price, 0) ?? 0;
                      const line = (item.basePrice ?? 0) + extras;
                      return (
                        <li key={i} className="flex justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
                          <span className="text-slate-900">
                            {item.name ?? 'פריט'}
                            {item.quantity && item.quantity > 1 ? ` ×${item.quantity}` : ''}
                          </span>
                          <span className="text-slate-600 shrink-0">{formatMoney(line)}</span>
                        </li>
                      );
                    }
                  )}
                </ul>
              )}
            </div>
          </section>
        )}

        {tab === 'settings' && (
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <Settings size={20} className="text-slate-600" />
              <h2 className="font-bold text-slate-900">הגדרות הצעה</h2>
            </div>
            <div className="p-4">
              {Object.keys(settings).length === 0 ? (
                <p className="text-slate-500 text-sm">ברירת מחדל</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {Object.entries(settings).map(([k, v]) => (
                    <li key={k} className="flex gap-2 border-b border-slate-100 pb-2 last:border-0">
                      <span className="text-slate-500 min-w-[140px]">{k}</span>
                      <span className="text-slate-900 break-all">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {Object.keys(overrides).length > 0 && tab === 'overview' && (
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mt-4">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-900">מחירי בסיס מותאמים</h2>
            </div>
            <div className="p-4">
              <ul className="space-y-2 text-sm">
                {Object.entries(overrides).map(([k, v]) => (
                  <li key={k} className="flex justify-between">
                    <span className="text-slate-700">{k}</span>
                    <span className="text-slate-900 font-medium">{formatMoney(Number(v))}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>

      {previewQuote && (
        <div
          className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && setPreviewQuote(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-900">תצוגה מקדימה</h3>
              <button
                type="button"
                onClick={() => setPreviewQuote(null)}
                className="p-2 rounded-lg hover:bg-slate-200 text-slate-600"
                aria-label="סגור"
              >
                <X size={22} />
              </button>
            </div>
            <div
              className="overflow-y-auto p-4 bg-slate-100 min-h-0 flex-1 [&_.quote-preview-body]:shadow-lg [&_.quote-preview-body]:bg-white"
              dangerouslySetInnerHTML={{
                __html: getQuotePreviewHtml({
                  items: previewQuote.items,
                  totalBeforeVAT: previewQuote.totalBeforeVAT,
                  totalWithVAT: previewQuote.totalWithVAT,
                  profile: profileModel ?? undefined,
                  customerName: previewQuote.customerName,
                  customerPhone: previewQuote.customerPhone,
                  customerEmail: previewQuote.customerEmail,
                  customerAddress: previewQuote.customerAddress,
                  customerCompanyId: previewQuote.customerCompanyId,
                  notes: previewQuote.notes,
                  quoteTitle: defaultQuoteTitle,
                  quoteNumber: previewQuote.quoteNumber,
                  validityDays,
                  vatRate,
                }),
              }}
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        title="הסרת משתמש"
        message={data?.user ? `להסיר את המשתמש "${data.user.username}"${data.user.email ? ` (${data.user.email})` : ''}? כל הנתונים שלו יימחקו – פרופיל, סל, היסטוריה והגדרות.` : ''}
        confirmLabel="הסר"
        cancelLabel="ביטול"
        danger
        onConfirm={() => doDeleteUser()}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </main>
  );
}
