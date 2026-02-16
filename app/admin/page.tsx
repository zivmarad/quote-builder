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
  Trash2,
  Smartphone,
  Loader2,
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteUserRow, setDeleteUserRow] = useState<UserRow | null>(null);

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

  const doDeleteUser = async (u: UserRow) => {
    if (!savedKey) return;
    setDeletingId(u.id);
    try {
      const res = await fetch(`/api/admin/user/${u.id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Key': savedKey },
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setUsers((prev) => prev.filter((x) => x.id !== u.id));
        if (stats) {
          setStats({
            ...stats,
            totalUsers: Math.max(0, stats.totalUsers - 1),
          });
        }
      } else {
        alert(json?.error ?? 'שגיאה במחיקה');
      }
    } catch {
      alert('שגיאה בתקשורת');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteUser = (u: UserRow, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteUserRow(u);
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
      <main className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-50 flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium mb-6 transition-colors"
          >
            <ArrowRight size={20} /> חזרה לדף הבית
          </Link>
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-300/30 p-6 md:p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
                <Lock size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900">כניסת מנהל</h1>
                <p className="text-slate-500 text-sm mt-0.5">שם משתמש וסיסמה לניהול האתר</p>
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
            <form onSubmit={handleLogin} className="space-y-5">
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
                  className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
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
                  className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  dir="ltr"
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                disabled={!username.trim() || !password}
                className="w-full py-3 min-h-[52px] rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg disabled:shadow-none"
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
    <main className="min-h-screen bg-slate-50/90 pb-12" dir="rtl">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              <ArrowRight size={20} /> חזרה לדף הבית
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-black text-slate-800 hidden sm:block">לוח ניהול</h1>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 text-slate-500 hover:text-red-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} /> יציאה
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-6">
        <header className="mb-6">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
            <BarChart3 size={28} className="text-blue-600" /> לוח בקרה
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">מעקב משתמשים וסטטיסטיקות</p>
        </header>

        {listError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-6" role="alert">
            {listError}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-500">
            <Loader2 size={40} className="animate-spin text-blue-500" />
            <span>טוען...</span>
          </div>
        ) : (
          <>
            {/* הוספה למסך הבית – מובייל */}
            <section className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-100/80">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 shrink-0">
                  <Smartphone size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">להוספת לוח הניהול למסך הבית (טלפון)</h3>
                  <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                    פתח דף זה במובייל בדפדפן Chrome או Safari → תפריט (⋮) או שתף → &quot;הוסף למסך הבית&quot;. כך תגיע ללוח הניהול במהירות מהמסך הראשי.
                  </p>
                </div>
              </div>
            </section>

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
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/80">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users size={22} className="text-slate-600" />
                  רשימת נרשמים
                </h2>
                <p className="text-slate-500 text-sm mt-0.5">לחץ על שורה או על &quot;צפייה&quot; כדי לראות היסטוריה, סל והגדרות</p>
              </div>
              {users.length === 0 ? (
                <div className="p-16 text-center text-slate-500 bg-slate-50/50">אין נרשמים עדיין</div>
              ) : (
                <div className="overflow-x-auto -mx-px">
                  <table className="w-full text-right border-collapse min-w-[640px]">
                    <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 text-sm font-bold text-slate-700 w-40">פעולות</th>
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
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/admin/user/${u.id}`}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                              >
                                <Eye size={18} aria-hidden />
                                צפייה
                              </Link>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteUser(u, e)}
                                disabled={deletingId === u.id}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 disabled:opacity-60 transition-colors"
                                title="הסר משתמש"
                              >
                                <Trash2 size={18} aria-hidden />
                                {deletingId === u.id ? 'מוחק...' : 'הסר'}
                              </button>
                            </div>
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
      {deleteUserRow && (
        <ConfirmDialog
          open={!!deleteUserRow}
          title="הסרת משתמש"
          message={`להסיר את "${deleteUserRow.username}"${deleteUserRow.email && deleteUserRow.email !== '—' ? ` (${deleteUserRow.email})` : ''}? כל הנתונים יימחקו.`}
          confirmLabel="הסר"
          cancelLabel="ביטול"
          danger
          onConfirm={() => {
            doDeleteUser(deleteUserRow);
          }}
          onCancel={() => setDeleteUserRow(null)}
        />
      )}
    </main>
  );
}
