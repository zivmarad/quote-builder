'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  LayoutDashboard,
  Search,
  Check,
  ExternalLink,
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

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
  const [search, setSearch] = useState('');
  const [listFilter, setListFilter] = useState<'all' | '7d' | '30d' | 'top_quotes'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [installLoading, setInstallLoading] = useState(false);

  const PAGE_SIZE = 25;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = sessionStorage.getItem(ADMIN_KEY_STORAGE);
    if (stored) setSavedKey(stored);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    const onInstalled = () => setInstallSuccess(true);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onInstalled);
    };
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
          setStats({ ...stats, totalUsers: Math.max(0, stats.totalUsers - 1) });
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

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    setInstallLoading(true);
    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') setInstallSuccess(true);
    } finally {
      setInstallLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return iso;
    }
  };

  const filteredUsers = useMemo(() => {
    const now = Date.now();
    const ms7d = 7 * 24 * 60 * 60 * 1000;
    const ms30d = 30 * 24 * 60 * 60 * 1000;
    let list: UserRow[];
    if (listFilter === '7d') {
      list = users.filter((u) => new Date(u.createdAt).getTime() >= now - ms7d);
    } else if (listFilter === '30d') {
      list = users.filter((u) => new Date(u.createdAt).getTime() >= now - ms30d);
    } else if (listFilter === 'top_quotes') {
      list = [...users].sort((a, b) => b.quoteCount - a.quoteCount);
    } else {
      list = [...users].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          (u.email && u.email !== '—' && u.email.toLowerCase().includes(q))
      );
    }
    return list;
  }, [users, search, listFilter]);

  const totalFiltered = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const paginatedUsers = useMemo(
    () => filteredUsers.slice(pageStart, pageStart + PAGE_SIZE),
    [filteredUsers, pageStart]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [listFilter, search]);

  const listFilterLabel =
    listFilter === '7d'
      ? 'משתמשים חדשים (7 ימים)'
      : listFilter === '30d'
        ? 'משתמשים חדשים (30 יום)'
        : listFilter === 'top_quotes'
          ? 'משתמשים לפי מספר הצעות'
          : 'כל המשתמשים';

  // ——— כניסה ———
  if (savedKey === null) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-medium mb-6 transition-colors"
          >
            <ArrowRight size={20} /> חזרה לאתר
          </Link>
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-6 md:p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-blue-600">
                <Lock size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">כניסת מנהל</h1>
                <p className="text-slate-400 text-sm mt-0.5">לוח ניהול – גישה מאובטחת</p>
              </div>
            </div>
            {loginError && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300 text-sm mb-4" role="alert">
                {loginError}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="admin-username" className="block text-sm font-bold text-slate-300 mb-2">שם משתמש</label>
                <input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="שם משתמש אדמין"
                  className="w-full px-4 py-3 min-h-[48px] rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  dir="ltr"
                  autoComplete="username"
                />
              </div>
              <div>
                <label htmlFor="admin-password" className="block text-sm font-bold text-slate-300 mb-2">סיסמה</label>
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="סיסמת ניהול"
                  className="w-full px-4 py-3 min-h-[48px] rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  dir="ltr"
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                disabled={!username.trim() || !password}
                className="w-full py-3 min-h-[52px] rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition-all"
              >
                כניסה
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // ——— לוח ניהול ———
  return (
    <div className="min-h-screen flex bg-slate-100" dir="rtl">
      {/* סיידבר */}
      <aside className="w-64 shrink-0 bg-slate-900 text-white flex flex-col border-l border-slate-700">
        <div className="p-5 border-b border-slate-700">
          <h1 className="text-lg font-black text-white flex items-center gap-2">
            <LayoutDashboard size={22} className="text-blue-400" />
            לוח ניהול
          </h1>
          <p className="text-slate-400 text-xs mt-1">בונה הצעות מחיר</p>
        </div>
        <nav className="p-3 flex-1">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors mb-2"
          >
            <ExternalLink size={20} />
            <span>פתח את האתר</span>
          </Link>
        </nav>
        <div className="p-3 space-y-2 border-t border-slate-700">
          {installSuccess ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm">
              <Check size={20} /> נוסף למסך הבית
            </div>
          ) : installPrompt ? (
            <button
              type="button"
              onClick={handleInstallApp}
              disabled={installLoading}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-60 transition-colors"
            >
              <Smartphone size={20} />
              {installLoading ? 'מתקין...' : 'הורד לאפליקציה'}
            </button>
          ) : (
            <div className="px-4 py-3 rounded-xl bg-slate-800 text-slate-400 text-xs">
              <p className="font-medium text-slate-300 mb-1">להוספה למסך הבית</p>
              <p>בטלפון: תפריט (⋮) → הוסף למסך הבית</p>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} /> יציאה
          </button>
        </div>
      </aside>

      {/* תוכן ראשי */}
      <main className="flex-1 min-w-0 overflow-auto pb-12">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
          {listError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
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
              {/* כותרת דשבורד */}
              <header className="mb-8">
                <h2 className="text-2xl font-black text-slate-900">דשבורד</h2>
                <p className="text-slate-500 text-sm mt-0.5">סקירה כללית ושליטה במשתמשים</p>
              </header>

              {/* כרטיסי סטטיסטיקות – לחיצה מעבירה לרשימה מסוננת */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" aria-label="סטטיסטיקות">
                <button
                  type="button"
                  onClick={() => setListFilter('all')}
                  className={`text-right rounded-2xl border p-6 shadow-sm transition-all hover:shadow-md hover:border-slate-300 ${
                    listFilter === 'all' ? 'ring-2 ring-blue-500 border-blue-300 bg-blue-50/50' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-sm font-medium">סה"כ משתמשים</p>
                      <p className="text-3xl font-black text-slate-900 tabular-nums mt-1">{stats?.totalUsers ?? 0}</p>
                      <p className="text-xs text-slate-400 mt-2">לחץ לצפייה ברשימה</p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                      <Users size={28} />
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setListFilter('7d')}
                  className={`text-right rounded-2xl border p-6 shadow-sm transition-all hover:shadow-md hover:border-slate-300 ${
                    listFilter === '7d' ? 'ring-2 ring-emerald-500 border-emerald-300 bg-emerald-50/50' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-sm font-medium">נרשמו (7 ימים)</p>
                      <p className="text-3xl font-black text-slate-900 tabular-nums mt-1">{stats?.newUsers7d ?? 0}</p>
                      <p className="text-xs text-slate-400 mt-2">לחץ לראות מי</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
                      <UserPlus size={28} />
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setListFilter('30d')}
                  className={`text-right rounded-2xl border p-6 shadow-sm transition-all hover:shadow-md hover:border-slate-300 ${
                    listFilter === '30d' ? 'ring-2 ring-amber-500 border-amber-300 bg-amber-50/50' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-sm font-medium">נרשמו (30 יום)</p>
                      <p className="text-3xl font-black text-slate-900 tabular-nums mt-1">{stats?.newUsers30d ?? 0}</p>
                      <p className="text-xs text-slate-400 mt-2">לחץ לראות מי</p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-100 text-amber-600">
                      <TrendingUp size={28} />
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setListFilter('top_quotes')}
                  className={`text-right rounded-2xl border p-6 shadow-sm transition-all hover:shadow-md hover:border-slate-300 ${
                    listFilter === 'top_quotes' ? 'ring-2 ring-violet-500 border-violet-300 bg-violet-50/50' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-sm font-medium">סה"כ הצעות</p>
                      <p className="text-3xl font-black text-slate-900 tabular-nums mt-1">{stats?.totalQuotes ?? 0}</p>
                      <p className="text-xs text-slate-400 mt-2">משתמשים לפי הצעות</p>
                    </div>
                    <div className="p-3 rounded-xl bg-violet-100 text-violet-600">
                      <FileText size={28} />
                    </div>
                  </div>
                </button>
              </section>

              {/* רשימת משתמשים + Breadcrumb */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-slate-500">דשבורד</span>
                    <span className="text-slate-300">/</span>
                    <span className="font-medium text-slate-800">{listFilterLabel}</span>
                    {listFilter !== 'all' && (
                      <button
                        type="button"
                        onClick={() => setListFilter('all')}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        (הצג הכל)
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Users size={22} className="text-slate-600" />
                        {listFilterLabel}
                      </h3>
                      <p className="text-slate-500 text-sm mt-0.5">
                        {totalFiltered} משתמשים
                        {search.trim() && ` (מסונן)`}
                        {totalFiltered > PAGE_SIZE && ` • מציג ${pageStart + 1}-${Math.min(pageStart + PAGE_SIZE, totalFiltered)} מתוך ${totalFiltered}`}
                      </p>
                    </div>
                  <div className="relative w-full sm:w-64">
                    <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="חיפוש לפי שם או אימייל..."
                      className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                {users.length === 0 ? (
                  <div className="p-16 text-center text-slate-500 bg-slate-50/50">
                    <Users size={48} className="mx-auto mb-4 text-slate-300" />
                    <p>אין נרשמים עדיין</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">אין תוצאות לחיפוש</div>
                ) : (
                  <div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse min-w-[640px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-36">פעולות</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-12">#</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">שם משתמש</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">אימייל</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-20">הצעות</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">תאריך</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedUsers.map((u, i) => (
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
                            className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/admin/user/${u.id}`}
                                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                                >
                                  <Eye size={16} /> צפייה
                                </Link>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteUser(u, e)}
                                  disabled={deletingId === u.id}
                                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 disabled:opacity-60 transition-colors"
                                  title="הסר משתמש"
                                >
                                  <Trash2 size={16} /> {deletingId === u.id ? '...' : 'הסר'}
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-sm tabular-nums">{totalFiltered - pageStart - i}</td>
                            <td className="px-4 py-3 font-semibold text-slate-900">{u.username}</td>
                            <td className="px-4 py-3 text-slate-600 text-sm" dir="ltr">{u.email || '—'}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 text-slate-700">
                                <FileText size={14} /> {u.quoteCount}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-sm">{formatDate(u.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-4 sm:px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
                      <p className="text-slate-600 text-sm">
                        עמוד {currentPage} מתוך {totalPages}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage <= 1}
                          className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none text-sm font-medium"
                        >
                          הקודם
                        </button>
                        <span className="flex items-center gap-1 px-2">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) pageNum = i + 1;
                            else if (currentPage <= 3) pageNum = i + 1;
                            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                            else pageNum = currentPage - 2 + i;
                            return (
                              <button
                                key={pageNum}
                                type="button"
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                                  currentPage === pageNum
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage >= totalPages}
                          className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none text-sm font-medium"
                        >
                          הבא
                        </button>
                      </div>
                    </div>
                  )}
                  </div>
                )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      {deleteUserRow && (
        <ConfirmDialog
          open={!!deleteUserRow}
          title="הסרת משתמש"
          message={`להסיר את "${deleteUserRow.username}"${deleteUserRow.email && deleteUserRow.email !== '—' ? ` (${deleteUserRow.email})` : ''}? כל הנתונים יימחקו.`}
          confirmLabel="הסר"
          cancelLabel="ביטול"
          danger
          onConfirm={() => { doDeleteUser(deleteUserRow); setDeleteUserRow(null); }}
          onCancel={() => setDeleteUserRow(null)}
        />
      )}
    </div>
  );
}
