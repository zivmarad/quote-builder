'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Users,
  Lock,
  UserPlus,
  FileText,
  TrendingUp,
  LogOut,
  BarChart3,
  Eye,
} from 'lucide-react';

const ADMIN_KEY_STORAGE = 'quoteBuilder_adminKey';

type Stats = {
  totalUsers: number;
  newUsers7d: number;
  newUsers30d: number;
  totalQuotes: number;
} | null;

type UserRow = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  quoteCount: number;
};

export default function AdminPage() {
  const router = useRouter();
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<Stats>(null);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = sessionStorage.getItem(ADMIN_KEY_STORAGE);
    if (stored) setSavedKey(stored);
  }, []);

  const fetchData = (key: string) => {
    setLoading(true);
    setListError(null);
    Promise.all([
      fetch('/api/admin/stats', { headers: { 'X-Admin-Key': key } }),
      fetch('/api/admin/users', { headers: { 'X-Admin-Key': key } }),
    ])
      .then(async ([statsRes, usersRes]) => {
        if (statsRes.status === 401 || usersRes.status === 401) {
          sessionStorage.removeItem(ADMIN_KEY_STORAGE);
          setSavedKey(null);
          setListError('ההתחברות פגה');
          return;
        }
        if (!statsRes.ok) throw new Error('שגיאה בטעינת סטטיסטיקות');
        if (!usersRes.ok) throw new Error('שגיאה בטעינת משתמשים');
        const [statsData, usersData] = await Promise.all([statsRes.json(), usersRes.json()]);
        setStats(statsData);
        if (usersData?.users) setUsers(usersData.users);
      })
      .catch((e) => setListError(e.message ?? 'שגיאה'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (savedKey) fetchData(savedKey);
  }, [savedKey]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!username.trim() || !password) {
      setLoginError('נא למלא שם משתמש וסיסמה');
      return;
    }
    fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), password }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok && data?.key) {
          sessionStorage.setItem(ADMIN_KEY_STORAGE, data.key);
          setSavedKey(data.key);
          setUsername('');
          setPassword('');
        } else {
          setLoginError(data?.error ?? 'שם משתמש או סיסמה שגויים');
        }
      })
      .catch(() => setLoginError('שגיאה בתקשורת'));
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    setSavedKey(null);
    setUsers([]);
    setStats(null);
    setListError(null);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return iso;
    }
  };

  if (savedKey === null) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium mb-6"
          >
            <ArrowRight size={20} /> חזרה לדף הבית
          </Link>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-slate-100">
                <Lock size={28} className="text-slate-700" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900">כניסת מנהל</h1>
                <p className="text-slate-500 text-sm">שם משתמש וסיסמה לניהול האתר</p>
              </div>
            </div>
            {loginError && (
              <div
                className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-4"
                role="alert"
              >
                {loginError}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="admin-username" className="block text-sm font-bold text-slate-700 mb-2">
                  שם משתמש
                </label>
                <input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="שם משתמש אדמין"
                  className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="ltr"
                  autoComplete="username"
                />
              </div>
              <div>
                <label htmlFor="admin-password" className="block text-sm font-bold text-slate-700 mb-2">
                  סיסמה
                </label>
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="סיסמת ניהול"
                  className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="ltr"
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                disabled={!username.trim() || !password}
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
    <main className="min-h-screen bg-slate-50/80 p-4 md:p-6" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
          >
            <ArrowRight size={20} /> חזרה לדף הבית
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-red-600 text-sm font-medium"
          >
            <LogOut size={18} /> יציאה מניהול
          </button>
        </div>

        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-2">
            <BarChart3 size={32} /> לוח בקרה – ניהול
          </h1>
          <p className="text-slate-500 mt-1">מעקב משתמשים וסטטיסטיקות</p>
        </header>

        {listError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-6" role="alert">
            {listError}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">טוען...</div>
        ) : (
          <>
            {/* סטטיסטיקות */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" aria-label="סטטיסטיקות">
              <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                    <Users size={24} aria-hidden />
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm font-medium">סה"כ משתמשים</p>
                    <p className="text-2xl font-black text-slate-900 tabular-nums">{stats?.totalUsers ?? 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
                    <UserPlus size={24} aria-hidden />
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm font-medium">חדשים (7 ימים)</p>
                    <p className="text-2xl font-black text-slate-900 tabular-nums">{stats?.newUsers7d ?? 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-100 text-amber-600">
                    <TrendingUp size={24} aria-hidden />
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm font-medium">חדשים (30 יום)</p>
                    <p className="text-2xl font-black text-slate-900 tabular-nums">{stats?.newUsers30d ?? 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-violet-100 text-violet-600">
                    <FileText size={24} aria-hidden />
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm font-medium">סה"כ הצעות</p>
                    <p className="text-2xl font-black text-slate-900 tabular-nums">{stats?.totalQuotes ?? 0}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* רשימת משתמשים */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/70">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users size={22} className="text-slate-600" />
                  רשימת נרשמים
                </h2>
                <p className="text-slate-500 text-sm mt-0.5">לחץ על שורה או על כפתור "צפייה בפרטים" כדי לראות היסטוריה, סל והגדרות</p>
              </div>
              {users.length === 0 ? (
                <div className="p-12 text-center text-slate-500">אין נרשמים עדיין</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200">
                        <th className="px-4 py-3 text-sm font-bold text-slate-700 w-24">פעולות</th>
                        <th className="px-4 py-3 text-sm font-bold text-slate-700">#</th>
                        <th className="px-4 py-3 text-sm font-bold text-slate-700">שם משתמש</th>
                        <th className="px-4 py-3 text-sm font-bold text-slate-700">אימייל</th>
                        <th className="px-4 py-3 text-sm font-bold text-slate-700 w-20">הצעות</th>
                        <th className="px-4 py-3 text-sm font-bold text-slate-700">תאריך הרשמה</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u, i) => (
                        <tr
                          key={u.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => router.push(`/admin/user/${u.id}`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              router.push(`/admin/user/${u.id}`);
                            }
                          }}
                          className="border-b border-slate-100 hover:bg-blue-50/60 cursor-pointer transition-colors group"
                        >
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <Link
                              href={`/admin/user/${u.id}`}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                            >
                              <Eye size={18} aria-hidden />
                              צפייה בפרטים
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-sm tabular-nums">{users.length - i}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{u.username}</td>
                          <td className="px-4 py-3 text-slate-700" dir="ltr">
                            {u.email}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-slate-700">
                              <FileText size={14} aria-hidden /> {u.quoteCount}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-sm">{formatDate(u.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
