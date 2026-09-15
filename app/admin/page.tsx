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
  DollarSign,
  BarChart3,
  ShoppingCart,
  Percent,
  LogOut,
  Eye,
  Trash2,
  Smartphone,
  Loader2,
  LayoutDashboard,
  Search,
  Check,
  ExternalLink,
  Menu,
  X,
  Briefcase,
  MousePointerClick,
  Download,
  MessageCircle,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { isAdminWireKeyHeaderSafe } from '../../lib/admin-header-key-safe';
import {
  emptyProductEventStats,
  type ProductEventCount,
  type ProductEventStats,
} from '../../lib/product-events';

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
  quotesLast7d: number;
  quotesLast30d: number;
  totalRevenue: number;
  usersWithQuotes: number;
  usersWithBasket: number;
  totalBasketLineItems: number;
  avgQuotesPerActiveUser: number;
  avgRevenuePerQuote: number;
  productEvents?: ProductEventStats;
} | null;

function formatCount(n: number) {
  return n.toLocaleString('he-IL');
}

function formatMoney(n: number) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(n);
}

function ClickStat({
  label,
  count,
  icon,
  iconClass,
}: {
  label: string;
  count: ProductEventCount;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.07] border border-white/10 p-4 md:p-5 text-right">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-slate-300 text-xs md:text-sm font-medium">{label}</p>
          <p className="text-3xl md:text-[2.35rem] font-black text-white tabular-nums mt-1 tracking-tight leading-none">
            {formatCount(count.total)}
          </p>
          <p className="text-slate-400 text-xs mt-2">{formatCount(count.last7d)} בשבעה ימים</p>
        </div>
        <div className={`p-2.5 rounded-xl shrink-0 ${iconClass}`}>{icon}</div>
      </div>
    </div>
  );
}

function QuietStat({
  label,
  value,
  icon,
  iconClass,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm text-right">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-slate-500 text-xs font-medium">{label}</p>
          <p className="text-xl md:text-2xl font-black text-slate-900 tabular-nums mt-1.5 leading-tight">
            {value}
          </p>
        </div>
        <div className={`p-2 rounded-lg shrink-0 ${iconClass}`}>{icon}</div>
      </div>
    </div>
  );
}

type UserRow = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  quoteCount: number;
};

type ProfessionEvent = {
  id: number;
  user_id: string;
  username: string | null;
  email: string | null;
  category_id: string;
  category_name: string;
  icon: string;
  services_snapshot: unknown;
  created_at: string;
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
  const [usersLoading, setUsersLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteUserRow, setDeleteUserRow] = useState<UserRow | null>(null);
  const [search, setSearch] = useState('');
  const [listFilter, setListFilter] = useState<'all' | '7d' | '30d' | 'top_quotes'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [installLoading, setInstallLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [professionEvents, setProfessionEvents] = useState<ProfessionEvent[]>([]);
  const [professionsTotal, setProfessionsTotal] = useState(0);
  const [professionsTableMissing, setProfessionsTableMissing] = useState(false);

  const PAGE_SIZE = 25;

  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = sessionStorage.getItem(ADMIN_KEY_STORAGE);
    if (!stored) return;
    if (!isAdminWireKeyHeaderSafe(stored)) {
      sessionStorage.removeItem(ADMIN_KEY_STORAGE);
      return;
    }
    setSavedKey(stored);
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

  const fetchData = (key: string, page: number, q: string, filter: 'all' | '7d' | '30d' | 'top_quotes') => {
    const firstLoad = !stats;
    if (firstLoad) setLoading(true);
    else setUsersLoading(true);
    setListError(null);
    const usersUrl = new URL('/api/admin/users', window.location.origin);
    usersUrl.searchParams.set('page', String(page));
    usersUrl.searchParams.set('pageSize', String(PAGE_SIZE));
    if (q.trim()) usersUrl.searchParams.set('search', q.trim());
    usersUrl.searchParams.set('filter', filter);
    usersUrl.searchParams.set('sort', filter === 'top_quotes' ? 'top_quotes' : 'recent');
    Promise.all([
      fetch('/api/admin/stats', { headers: { 'X-Admin-Key': key } }),
      fetch(usersUrl.toString(), { headers: { 'X-Admin-Key': key } }),
      fetch('/api/admin/custom-professions?page=1&pageSize=20', {
        headers: { 'X-Admin-Key': key },
      }),
    ])
      .then(async ([statsRes, usersRes, professionsRes]) => {
        if (statsRes.status === 401 || usersRes.status === 401) {
          sessionStorage.removeItem(ADMIN_KEY_STORAGE);
          setSavedKey(null);
          setListError('ההתחברות פגה');
          return;
        }
        if (!statsRes.ok) throw new Error('שגיאה בטעינת סטטיסטיקות');
        if (!usersRes.ok) throw new Error('שגיאה בטעינת משתמשים');
        const [statsData, usersData, professionsData] = await Promise.all([
          statsRes.json(),
          usersRes.json(),
          professionsRes.ok ? professionsRes.json() : Promise.resolve(null),
        ]);
        setStats(statsData);
        if (Array.isArray(usersData?.users)) setUsers(usersData.users);
        setTotalFiltered(typeof usersData?.total === 'number' ? usersData.total : 0);
        setTotalPages(typeof usersData?.totalPages === 'number' ? usersData.totalPages : 1);
        if (professionsData?.ok) {
          setProfessionEvents(Array.isArray(professionsData.events) ? professionsData.events : []);
          setProfessionsTotal(typeof professionsData.total === 'number' ? professionsData.total : 0);
          setProfessionsTableMissing(Boolean(professionsData.tableMissing));
        }
      })
      .catch((e) => setListError(e.message ?? 'שגיאה'))
      .finally(() => {
        setLoading(false);
        setUsersLoading(false);
      });
  };

  useEffect(() => {
    if (savedKey) fetchData(savedKey, currentPage, search, listFilter);
  }, [savedKey, currentPage, search, listFilter]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!password) {
      setLoginError('נא למלא סיסמה');
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
    setTotalFiltered(0);
    setTotalPages(1);
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
        setTotalFiltered((prev) => Math.max(0, prev - 1));
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

  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const paginatedUsers = users;

  useEffect(() => {
    setCurrentPage(1);
  }, [listFilter, search]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, Math.max(1, totalPages)));
  }, [totalPages]);

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
      <main className="min-h-screen bg-[#0b1220] flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-medium mb-6 transition-colors"
          >
            <ArrowRight size={20} /> חזרה לאתר
          </Link>
          <div className="bg-slate-900/80 rounded-3xl border border-white/10 shadow-2xl p-6 md:p-8 backdrop-blur">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30">
                <Lock size={28} className="text-white" />
              </div>
              <div>
                <p className="text-blue-300 text-xs font-bold tracking-wide mb-1">הצעות.קו</p>
                <h1 className="text-2xl font-black text-white">כניסת מנהל</h1>
                <p className="text-slate-400 text-sm mt-0.5">לוח ניהול מאובטח</p>
              </div>
            </div>
            {loginError && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300 text-sm mb-4" role="alert">
                {loginError}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="admin-username" className="block text-sm font-bold text-slate-300 mb-2">
                  שם משתמש <span className="font-normal text-slate-500">(אופציונלי)</span>
                </label>
                <input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ריק = רק סיסמת ניהול, כמו בעבר"
                  className="w-full px-4 py-3 min-h-[48px] rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  dir="ltr"
                  autoComplete="username"
                />
                <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                  אם הוגדר <span dir="ltr">ADMIN_USERNAME</span> בשרת – יש להזין אותו יחד עם הסיסמה. אחרת אפשר להשאיר ריק ולהזין רק את סיסמת הניהול.
                </p>
              </div>
              <div>
                <label htmlFor="admin-password" className="block text-sm font-bold text-slate-300 mb-2">סיסמה</label>
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="סיסמת ניהול"
                  className="w-full px-4 py-3 min-h-[48px] rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  dir="ltr"
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                disabled={!password}
                className="w-full py-3 min-h-[52px] rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20"
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
  const clicks = stats?.productEvents ?? emptyProductEventStats(true);
  const templateClicks: ProductEventCount = {
    total: clicks.templateWord.total + clicks.templateExcel.total + clicks.templatePdf.total,
    last7d: clicks.templateWord.last7d + clicks.templateExcel.last7d + clicks.templatePdf.last7d,
  };
  const todayLabel = new Date().toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="min-h-screen flex bg-slate-50" dir="rtl">
      {/* Overlay מובייל כשהסיידבר פתוח */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="סגור תפריט"
          onClick={closeSidebar}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      {/* סיידבר: במובייל drawer, במחשב תמיד גלוי */}
      <aside
        className={`
          w-64 shrink-0 bg-[#0b1220] text-white flex flex-col border-l border-white/10
          fixed md:relative top-0 bottom-0 z-50 md:z-auto
          transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}
        style={{ height: '100dvh' }}
      >
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
              <LayoutDashboard size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-black text-white leading-tight">לוח ניהול</h1>
              <p className="text-slate-400 text-xs mt-0.5">הצעות.קו</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="סגור תפריט"
            onClick={closeSidebar}
            className="p-2 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white md:hidden"
          >
            <X size={24} />
          </button>
        </div>
        <nav className="p-3 flex-1 overflow-auto">
          <div className="flex items-center gap-3 px-4 py-3 min-h-[48px] rounded-xl bg-white/10 text-white font-medium mb-1">
            <BarChart3 size={20} className="text-blue-300" />
            <span>דשבורד</span>
          </div>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeSidebar}
            className="flex items-center gap-3 px-4 py-3 min-h-[48px] rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <ExternalLink size={20} />
            <span>פתח את האתר</span>
          </Link>
        </nav>
        <div className="p-3 space-y-2 border-t border-white/10">
          {installSuccess ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm min-h-[48px]">
              <Check size={20} /> נוסף למסך הבית
            </div>
          ) : installPrompt ? (
            <button
              type="button"
              onClick={() => { handleInstallApp(); closeSidebar(); }}
              disabled={installLoading}
              className="w-full flex items-center gap-3 px-4 py-3 min-h-[48px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-60 transition-colors"
            >
              <Smartphone size={20} />
              {installLoading ? 'מתקין...' : 'הורד לאפליקציה'}
            </button>
          ) : (
            <div className="px-4 py-3 rounded-xl bg-white/5 text-slate-400 text-xs min-h-[48px] flex items-center">
              <p className="font-medium text-slate-300">להוספה למסך הבית: תפריט → הוסף למסך הבית</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => { handleLogout(); closeSidebar(); }}
            className="w-full flex items-center gap-3 px-4 py-3 min-h-[48px] rounded-xl text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} /> יציאה
          </button>
        </div>
      </aside>

      {/* תוכן ראשי */}
      <main className="flex-1 min-w-0 overflow-auto pb-12 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 md:py-6">
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
              {/* כותרת + כפתור תפריט מובייל (דביק במובייל) */}
              <header className="sticky top-0 z-30 -mx-4 px-4 py-3 md:py-0 md:static md:mx-0 md:px-0 bg-slate-50/95 md:bg-transparent backdrop-blur md:backdrop-blur-none mb-6 md:mb-8 flex items-start justify-between gap-4">
                <div>
                  <p className="text-slate-500 text-xs font-medium mb-0.5">{todayLabel}</p>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900">דשבורד מנהלים</h2>
                  <p className="text-slate-500 text-sm mt-0.5 hidden sm:block">קליקים, משתמשים והצעות במקום אחד</p>
                </div>
                <button
                  type="button"
                  aria-label="פתח תפריט"
                  onClick={() => setSidebarOpen(true)}
                  className="p-3 rounded-xl bg-[#0b1220] text-white hover:bg-slate-800 active:bg-slate-700 md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                >
                  <Menu size={24} />
                </button>
              </header>

              <section
                className="rounded-3xl bg-[#0b1220] text-white p-5 md:p-7 mb-6 md:mb-8 shadow-xl shadow-slate-900/10"
                aria-label="קליקים במוצר"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                  <div>
                    <h3 className="text-lg md:text-xl font-black flex items-center gap-2">
                      <MousePointerClick size={22} className="text-blue-300" />
                      קליקים במוצר
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">
                      ספירה מדויקת מהאתר — מתעדכנת אוטומטית, גם מהטלפון
                    </p>
                  </div>
                </div>
                {clicks.tableMissing ? (
                  <div className="rounded-2xl bg-amber-400/15 border border-amber-300/30 text-amber-100 p-4 text-sm">
                    טבלת הספירה עדיין לא הוגדרה ב־Supabase. הרץ את{' '}
                    <code className="font-mono text-xs bg-black/20 px-1.5 py-0.5 rounded">supabase-product-events.sql</code>
                    {' '}ואז רענן את הדף.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-3 md:mb-4">
                      <ClickStat
                        label="כניסות לאפליקציה"
                        count={clicks.appEntered}
                        icon={<MousePointerClick size={18} />}
                        iconClass="bg-blue-500/20 text-blue-300"
                      />
                      <ClickStat
                        label="הורדת PDF הצעה"
                        count={clicks.quotePdf}
                        icon={<Download size={18} />}
                        iconClass="bg-emerald-500/20 text-emerald-300"
                      />
                      <ClickStat
                        label="שיתוף בוואטסאפ"
                        count={clicks.quoteWhatsapp}
                        icon={<MessageCircle size={18} />}
                        iconClass="bg-green-500/20 text-green-300"
                      />
                      <ClickStat
                        label="הורדות תבניות"
                        count={templateClicks}
                        icon={<FileText size={18} />}
                        iconClass="bg-violet-500/20 text-violet-300"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 md:gap-3">
                      <div className="rounded-xl bg-white/[0.05] border border-white/10 px-3 py-3 text-right">
                        <p className="text-slate-400 text-[11px] md:text-xs flex items-center gap-1.5">
                          <FileText size={13} /> Word
                        </p>
                        <p className="text-lg md:text-xl font-black tabular-nums mt-1">
                          {formatCount(clicks.templateWord.total)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white/[0.05] border border-white/10 px-3 py-3 text-right">
                        <p className="text-slate-400 text-[11px] md:text-xs flex items-center gap-1.5">
                          <FileSpreadsheet size={13} /> Excel
                        </p>
                        <p className="text-lg md:text-xl font-black tabular-nums mt-1">
                          {formatCount(clicks.templateExcel.total)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white/[0.05] border border-white/10 px-3 py-3 text-right">
                        <p className="text-slate-400 text-[11px] md:text-xs flex items-center gap-1.5">
                          <Printer size={13} /> PDF להדפסה
                        </p>
                        <p className="text-lg md:text-xl font-black tabular-nums mt-1">
                          {formatCount(clicks.templatePdf.total)}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </section>

              <h3 className="text-sm font-bold text-slate-500 mb-3 px-0.5">משתמשים</h3>
              {/* כרטיסי סטטיסטיקות – לחיצה מעבירה לרשימה מסוננת */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8" aria-label="סטטיסטיקות משתמשים">
                <button
                  type="button"
                  onClick={() => setListFilter('all')}
                  className={`text-right rounded-2xl border p-4 md:p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300 active:scale-[0.98] min-h-[88px] md:min-h-0 ${
                    listFilter === 'all' ? 'ring-2 ring-blue-500 border-blue-300 bg-blue-50/50' : 'bg-white border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-slate-500 text-xs md:text-sm font-medium truncate">{'סה"כ משתמשים'}</p>
                      <p className="text-2xl md:text-3xl font-black text-slate-900 tabular-nums mt-0.5 md:mt-1">{stats?.totalUsers ?? 0}</p>
                    </div>
                    <div className="p-2 md:p-3 rounded-xl bg-blue-100 text-blue-600 shrink-0">
                      <Users size={22} className="md:w-6 md:h-6" />
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setListFilter('7d')}
                  className={`text-right rounded-2xl border p-4 md:p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300 active:scale-[0.98] min-h-[88px] md:min-h-0 ${
                    listFilter === '7d' ? 'ring-2 ring-emerald-500 border-emerald-300 bg-emerald-50/50' : 'bg-white border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-slate-500 text-xs md:text-sm font-medium truncate">נרשמו (7 ימים)</p>
                      <p className="text-2xl md:text-3xl font-black text-slate-900 tabular-nums mt-0.5 md:mt-1">{stats?.newUsers7d ?? 0}</p>
                    </div>
                    <div className="p-2 md:p-3 rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
                      <UserPlus size={22} className="md:w-6 md:h-6" />
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setListFilter('30d')}
                  className={`text-right rounded-2xl border p-4 md:p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300 active:scale-[0.98] min-h-[88px] md:min-h-0 ${
                    listFilter === '30d' ? 'ring-2 ring-amber-500 border-amber-300 bg-amber-50/50' : 'bg-white border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-slate-500 text-xs md:text-sm font-medium truncate">נרשמו (30 יום)</p>
                      <p className="text-2xl md:text-3xl font-black text-slate-900 tabular-nums mt-0.5 md:mt-1">{stats?.newUsers30d ?? 0}</p>
                    </div>
                    <div className="p-2 md:p-3 rounded-xl bg-amber-100 text-amber-600 shrink-0">
                      <TrendingUp size={22} className="md:w-6 md:h-6" />
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setListFilter('top_quotes')}
                  className={`text-right rounded-2xl border p-4 md:p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300 active:scale-[0.98] min-h-[88px] md:min-h-0 ${
                    listFilter === 'top_quotes' ? 'ring-2 ring-violet-500 border-violet-300 bg-violet-50/50' : 'bg-white border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-slate-500 text-xs md:text-sm font-medium truncate">{'סה"כ הצעות'}</p>
                      <p className="text-2xl md:text-3xl font-black text-slate-900 tabular-nums mt-0.5 md:mt-1">{stats?.totalQuotes ?? 0}</p>
                    </div>
                    <div className="p-2 md:p-3 rounded-xl bg-violet-100 text-violet-600 shrink-0">
                      <FileText size={22} className="md:w-6 md:h-6" />
                    </div>
                  </div>
                </button>
              </section>

              <h3 className="text-sm font-bold text-slate-500 mb-3 px-0.5">הצעות ועסק</h3>
              <section
                className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8"
                aria-label="סטטיסטיקות מורחבות"
              >
                <QuietStat
                  label="הצעות חדשות (7 ימים)"
                  value={stats?.quotesLast7d ?? 0}
                  icon={<FileText size={18} />}
                  iconClass="bg-teal-100 text-teal-700"
                />
                <QuietStat
                  label="הצעות (30 יום)"
                  value={stats?.quotesLast30d ?? 0}
                  icon={<BarChart3 size={18} />}
                  iconClass="bg-cyan-100 text-cyan-700"
                />
                <QuietStat
                  label="סה״כ סכומי הצעות (מע״מ)"
                  value={formatMoney(stats?.totalRevenue ?? 0)}
                  icon={<DollarSign size={18} />}
                  iconClass="bg-green-100 text-green-700"
                />
                <QuietStat
                  label="משתמשים עם הצעות"
                  value={stats?.usersWithQuotes ?? 0}
                  icon={<Users size={18} />}
                  iconClass="bg-indigo-100 text-indigo-700"
                />
                <QuietStat
                  label="סלים לא ריקים"
                  value={stats?.usersWithBasket ?? 0}
                  icon={<ShoppingCart size={18} />}
                  iconClass="bg-orange-100 text-orange-700"
                />
                <QuietStat
                  label="שורות סל (סה״כ)"
                  value={stats?.totalBasketLineItems ?? 0}
                  icon={<ShoppingCart size={18} />}
                  iconClass="bg-slate-200 text-slate-700"
                />
                <QuietStat
                  label="ממוצע הצעות / משתמש פעיל"
                  value={stats?.avgQuotesPerActiveUser ?? 0}
                  icon={<Percent size={18} />}
                  iconClass="bg-violet-100 text-violet-700"
                />
                <QuietStat
                  label="ממוצע סכום / הצעה"
                  value={formatMoney(stats?.avgRevenuePerQuote ?? 0)}
                  icon={<DollarSign size={18} />}
                  iconClass="bg-emerald-100 text-emerald-800"
                />
              </section>

              {/* מקצועות מותאמים שמשתמשים יצרו */}
              <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-6 md:mb-8">
                <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Briefcase size={18} className="text-blue-600" />
                      מקצועות שנוספו ע״י משתמשים
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {professionsTotal} אירועים · מעקב לאורך זמן + מייל בכל יצירה
                    </p>
                  </div>
                </div>
                {professionsTableMissing ? (
                  <div className="p-5 text-sm text-amber-800 bg-amber-50">
                    טבלת המעקב עדיין לא הוגדרה ב־Supabase. הרץ את{' '}
                    <code className="font-mono text-xs">supabase-custom-professions.sql</code> ואז רענן.
                  </div>
                ) : professionEvents.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">עדיין לא נוצרו מקצועות מותאמים</div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {professionEvents.map((ev) => {
                      const services = Array.isArray(ev.services_snapshot)
                        ? ev.services_snapshot
                        : [];
                      return (
                        <li key={ev.id} className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900">
                              <span className="me-1">{ev.icon || '🧰'}</span>
                              {ev.category_name}
                            </p>
                            <p className="text-sm text-slate-600 mt-1">
                              {ev.username || '—'}
                              {ev.email ? ` · ${ev.email}` : ''}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(ev.created_at).toLocaleString('he-IL')}
                              {' · '}
                              {services.length} שירותים בעת היצירה
                            </p>
                            {services.length > 0 && (
                              <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                                {(services as Array<{ name?: string }>)
                                  .map((s) => s.name)
                                  .filter(Boolean)
                                  .join(' · ')}
                              </p>
                            )}
                          </div>
                          <Link
                            href={`/admin/user/${ev.user_id}`}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 shrink-0"
                          >
                            למשתמש <ExternalLink size={14} />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* רשימת משתמשים + Breadcrumb */}
              <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-col gap-3">
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
                ) : paginatedUsers.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">אין תוצאות לחיפוש</div>
                ) : (
                  <div className="relative">
                  {usersLoading && (
                    <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                      <Loader2 size={28} className="animate-spin text-blue-600" />
                    </div>
                  )}
                  {/* רשימת כרטיסים למובייל */}
                  <div className="flex flex-col gap-3 md:hidden pb-4">
                    {paginatedUsers.map((u) => (
                      <div
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
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm active:bg-slate-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900 truncate">{u.username}</p>
                            <p className="text-slate-500 text-sm truncate mt-0.5" dir="ltr">{u.email || '—'}</p>
                            <div className="flex items-center gap-3 mt-2 text-slate-500 text-xs">
                              <span className="inline-flex items-center gap-1">
                                <FileText size={14} /> {u.quoteCount} הצעות
                              </span>
                              <span>{formatDate(u.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <Link
                              href={`/admin/user/${u.id}`}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                            >
                              <Eye size={18} /> צפייה
                            </Link>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteUser(u, e)}
                              disabled={deletingId === u.id}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 disabled:opacity-60"
                              title="הסר משתמש"
                            >
                              <Trash2 size={18} /> {deletingId === u.id ? '...' : 'הסר'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="hidden md:block overflow-x-auto">
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
                    <div className="px-4 sm:px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row flex-wrap items-center justify-between gap-4 bg-slate-50/50">
                      <p className="text-slate-600 text-sm order-2 sm:order-1">
                        עמוד {currentPage} מתוך {totalPages}
                      </p>
                      <div className="flex items-center gap-2 order-1 sm:order-2 flex-wrap justify-center">
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage <= 1}
                          className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none text-sm font-medium inline-flex items-center justify-center"
                        >
                          הקודם
                        </button>
                        <span className="flex items-center gap-1">
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
                                className={`min-h-[44px] min-w-[44px] rounded-lg text-sm font-medium transition-colors inline-flex items-center justify-center ${
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
                          className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none text-sm font-medium inline-flex items-center justify-center"
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
