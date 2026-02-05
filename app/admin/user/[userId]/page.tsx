'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  User,
  FileText,
  ShoppingBag,
  Settings,
  Mail,
  Building2,
  Calendar,
} from 'lucide-react';

const ADMIN_KEY_STORAGE = 'quoteBuilder_adminKey';

type UserDetail = {
  user: { id: string; username: string; email: string | null; createdAt: string };
  profile: Record<string, unknown>;
  quotes: unknown[];
  basketItems: unknown[];
  settings: Record<string, unknown>;
  overrides: Record<string, number>;
};

export default function AdminUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return iso;
    }
  };

  if (!userId || loading) {
    return (
      <main className="min-h-screen bg-slate-50/80 p-6" dir="rtl">
        <div className="max-w-4xl mx-auto text-center py-20 text-slate-500">טוען...</div>
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

  return (
    <main className="min-h-screen bg-slate-50/80 p-4 md:p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium mb-6"
        >
          <ArrowRight size={20} /> חזרה ללוח הבקרה
        </Link>

        <header className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-100">
              <User size={28} className="text-slate-700" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">{user.username}</h1>
              {user.email && (
                <p className="text-slate-600 flex items-center gap-2 mt-1" dir="ltr">
                  <Mail size={16} /> {user.email}
                </p>
              )}
              <p className="text-slate-500 text-sm flex items-center gap-2 mt-1">
                <Calendar size={14} /> נרשם ב־{formatDate(user.createdAt)}
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <Building2 size={20} className="text-slate-600" />
              <h2 className="font-bold text-slate-900">פרופיל עסקי</h2>
            </div>
            <div className="p-4">
              {profileEntries.length === 0 ? (
                <p className="text-slate-500 text-sm">לא מולא</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {profileEntries.map(([k, v]) => (
                    <li key={k} className="flex gap-2">
                      <span className="text-slate-500 min-w-[100px]">{k}:</span>
                      <span className="text-slate-900 break-all">
                        {typeof v === 'string' && (v.startsWith('data:') || v.length > 80)
                          ? '[תמונה/נתונים]'
                          : String(v)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <FileText size={20} className="text-slate-600" />
              <h2 className="font-bold text-slate-900">היסטוריית הצעות</h2>
              <span className="text-slate-500 text-sm mr-auto">({quotes.length} הצעות)</span>
            </div>
            <div className="p-4 max-h-64 overflow-y-auto">
              {quotes.length === 0 ? (
                <p className="text-slate-500 text-sm">אין הצעות</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {quotes.slice(0, 20).map((q: unknown, i: number) => {
                    const x = q as Record<string, unknown>;
                    const total = typeof x?.totalWithVAT === 'number' ? x.totalWithVAT : 0;
                    const date = typeof x?.createdAt === 'string' ? formatDate(x.createdAt) : '';
                    return (
                      <li key={i} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                        <span className="text-slate-600">{date}</span>
                        <span className="font-medium text-slate-900">₪{total.toLocaleString('he-IL')}</span>
                      </li>
                    );
                  })}
                  {quotes.length > 20 && (
                    <li className="text-slate-500 text-sm py-2">ועוד {quotes.length - 20} הצעות</li>
                  )}
                </ul>
              )}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <ShoppingBag size={20} className="text-slate-600" />
              <h2 className="font-bold text-slate-900">סל נוכחי</h2>
              <span className="text-slate-500 text-sm mr-auto">({basketItems.length} פריטים)</span>
            </div>
            <div className="p-4">
              {basketItems.length === 0 ? (
                <p className="text-slate-500 text-sm">הסל ריק</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {(basketItems as Array<{ name?: string; basePrice?: number }>).map((item, i) => (
                    <li key={i} className="flex justify-between">
                      <span className="text-slate-900">{item.name ?? 'פריט'}</span>
                      <span className="text-slate-600">₪{Number(item.basePrice ?? 0).toLocaleString('he-IL')}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <Settings size={20} className="text-slate-600" />
              <h2 className="font-bold text-slate-900">הגדרות</h2>
            </div>
            <div className="p-4">
              {Object.keys(settings).length === 0 ? (
                <p className="text-slate-500 text-sm">ברירת מחדל</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {Object.entries(settings).map(([k, v]) => (
                    <li key={k} className="flex gap-2">
                      <span className="text-slate-500">{k}:</span>
                      <span className="text-slate-900">{String(v)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {Object.keys(overrides).length > 0 && (
            <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                <h2 className="font-bold text-slate-900">מחירי בסיס מותאמים</h2>
              </div>
              <div className="p-4">
                <ul className="space-y-2 text-sm">
                  {Object.entries(overrides).map(([k, v]) => (
                    <li key={k} className="flex justify-between">
                      <span className="text-slate-700">{k}</span>
                      <span className="text-slate-900">₪{Number(v).toLocaleString('he-IL')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
