'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Users, Lock } from 'lucide-react';

const ADMIN_KEY_STORAGE = 'quoteBuilder_adminKey';

export default function AdminPage() {
  const [key, setKey] = useState('');
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [users, setUsers] = useState<{ id: string; username: string; email: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = sessionStorage.getItem(ADMIN_KEY_STORAGE);
    if (stored) setSavedKey(stored);
  }, []);

  useEffect(() => {
    if (!savedKey) return;
    setLoading(true);
    setError(null);
    fetch('/api/admin/users', { headers: { 'X-Admin-Key': savedKey } })
      .then((res) => {
        if (res.status === 401) {
          sessionStorage.removeItem(ADMIN_KEY_STORAGE);
          setSavedKey(null);
          setError('סיסמת ניהול לא נכונה');
          return null;
        }
        if (!res.ok) return res.json().then((d) => { throw new Error(d.error ?? 'שגיאה'); });
        return res.json();
      })
      .then((data) => {
        if (data?.users) setUsers(data.users);
      })
      .catch((e) => setError(e.message ?? 'שגיאה בטעינה'))
      .finally(() => setLoading(false));
  }, [savedKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    sessionStorage.setItem(ADMIN_KEY_STORAGE, key.trim());
    setSavedKey(key.trim());
    setKey('');
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    setSavedKey(null);
    setUsers([]);
    setError(null);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('he-IL', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  };

  if (savedKey === null) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium mb-6">
            <ArrowRight size={20} /> חזרה לדף הבית
          </Link>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
            <h1 className="text-2xl font-black text-slate-900 mb-2 flex items-center gap-2">
              <Lock size={28} /> ניהול – רשימת נרשמים
            </h1>
            <p className="text-slate-500 text-sm mb-6">הזן סיסמת ניהול כדי לצפות ברשימה</p>
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-4" role="alert">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="admin-key" className="block text-sm font-bold text-slate-700 mb-2">
                  סיסמת ניהול
                </label>
                <input
                  id="admin-key"
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="הזן את הסיסמה שהגדרת ב-.env.local"
                  className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="ltr"
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                disabled={!key.trim()}
                className="w-full py-3 min-h-[52px] rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                כניסה
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-4 md:p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium">
            <ArrowRight size={20} /> חזרה לדף הבית
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="text-slate-500 hover:text-slate-700 text-sm font-medium"
          >
            יציאה מניהול
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Users size={24} className="text-slate-600" />
            <h1 className="text-xl font-black text-slate-900">רשימת נרשמים</h1>
          </div>
          {error && (
            <div className="p-4 bg-red-50 border-b border-red-100 text-red-700 text-sm" role="alert">
              {error}
            </div>
          )}
          {loading ? (
            <div className="p-12 text-center text-slate-500">טוען...</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-slate-500">אין נרשמים עדיין</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-sm font-bold text-slate-700">#</th>
                    <th className="px-4 py-3 text-sm font-bold text-slate-700">תאריך הרשמה</th>
                    <th className="px-4 py-3 text-sm font-bold text-slate-700">אימייל</th>
                    <th className="px-4 py-3 text-sm font-bold text-slate-700">שם משתמש</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-500 text-sm">{users.length - i}</td>
                      <td className="px-4 py-3 text-slate-700">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3 text-slate-900" dir="ltr">{u.email}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{u.username}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
