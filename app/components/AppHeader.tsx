'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { useLanguage } from '../contexts/LanguageContext';
import { User, LogIn, UserPlus, LogOut, Globe, Home, ShieldAlert, Undo2 } from 'lucide-react';

const LOCALE_LABELS: Record<string, string> = {
  he: 'עב',
  en: 'EN',
  ru: 'RU',
  ar: 'ع',
};

export default function AppHeader() {
  const { user, isLoaded, logout, impersonating, stopImpersonating } = useAuth();
  const [impersonateExitLoading, setImpersonateExitLoading] = useState(false);
  const { profile } = useProfile();
  const { t, locale, setLocale, dir } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayName = user
    ? (() => {
        const raw = profile?.contactName?.trim() || user.username;
        const first = raw.split(/\s+/)[0] || user.username;
        return first.includes('@') ? first.split('@')[0] : first;
      })()
    : (isLoaded ? t('header.guest') : '');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const locales = ['he', 'en', 'ru', 'ar'] as const;

  const handleExitImpersonation = async () => {
    setImpersonateExitLoading(true);
    try {
      const r = await stopImpersonating();
      if (r.ok) {
        window.location.href = '/admin';
        return;
      }
      alert(r.error ?? 'שגיאה');
    } finally {
      setImpersonateExitLoading(false);
    }
  };

  return (
    <header
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100"
      style={{ paddingTop: 'var(--safe-area-inset-top)' }}
    >
      {impersonating && (
        <div
          className="bg-amber-500 text-amber-950 text-sm font-bold px-3 py-2 flex flex-wrap items-center justify-center gap-3 border-b border-amber-600/30"
          dir="rtl"
          role="status"
        >
          <span className="inline-flex items-center gap-2">
            <ShieldAlert size={18} className="shrink-0" />
            מצב מנהל: אתה צופה באתר כמשתמש אחר. כל שמירה תשייך לחשבון הזה.
          </span>
          <button
            type="button"
            disabled={impersonateExitLoading}
            onClick={() => void handleExitImpersonation()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950 text-amber-50 hover:bg-black disabled:opacity-60 text-xs sm:text-sm"
          >
            <Undo2 size={16} />
            {impersonateExitLoading ? '…' : 'חזור ללוח הניהול'}
          </button>
        </div>
      )}
      <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 min-h-[52px] sm:min-h-0 min-w-0">
        <Link
          href="/"
          className="font-black text-slate-900 flex items-center gap-2 min-w-0 shrink-0 sm:min-w-0"
          aria-label={t('header.appName')}
        >
          <span className="sm:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-slate-100 text-slate-700">
            <Home size={22} />
          </span>
          <span className="hidden sm:inline truncate text-base sm:text-lg md:text-xl">{t('header.appName')}</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0 min-w-0">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setLangOpen((o) => !o)}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium text-xs sm:text-sm px-2.5 py-2 rounded-xl hover:bg-slate-100 transition-colors min-h-[44px] border border-slate-200/80"
              aria-label="שפה"
              aria-expanded={langOpen}
            >
              <Globe size={18} className="shrink-0" />
              <span className="font-bold">{LOCALE_LABELS[locale] ?? locale}</span>
            </button>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-40" aria-hidden onClick={() => setLangOpen(false)} />
                <div
                  className="absolute top-full mt-1 right-0 z-50 min-w-[120px] py-1 bg-white rounded-xl shadow-lg border border-slate-200"
                  dir={dir}
                >
                  {locales.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => {
                        setLocale(loc);
                        setLangOpen(false);
                      }}
                      className={`block w-full text-right px-4 py-2.5 text-sm font-medium transition-colors ${
                        loc === locale ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {loc === 'he' ? 'עברית' : loc === 'en' ? 'English' : loc === 'ru' ? 'Русский' : 'العربية'}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <Link
            href="/profile"
            className="flex items-center justify-center gap-1.5 sm:gap-2 text-slate-600 hover:text-slate-900 font-medium text-xs sm:text-sm px-2.5 sm:px-4 py-2.5 sm:py-2 rounded-xl hover:bg-slate-100 transition-colors min-h-[44px] min-w-0 shrink-0"
            aria-label={t('header.profile')}
          >
            <User size={20} className="shrink-0" />
            <span className="inline max-w-[85px] sm:max-w-[95px] truncate">{t('header.profile')}</span>
          </Link>
          {isLoaded &&
            (user ? (
              <>
                {displayName && (
                  <span className="text-slate-600 font-medium text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[120px]">
                    {t('header.hello')} {displayName}
                  </span>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center justify-center gap-1.5 text-slate-600 hover:text-red-600 font-medium text-xs sm:text-sm px-2.5 sm:px-3 py-2.5 sm:py-2 rounded-xl hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] sm:min-w-0"
                  aria-label={t('header.logout')}
                >
                  <LogOut size={18} />
                  <span className="hidden sm:inline">{t('header.logout')}</span>
                </button>
              </>
            ) : (
              <>
                {displayName && (
                  <span className="hidden sm:inline text-slate-600 font-medium text-xs sm:text-sm truncate max-w-[120px]">
                    {t('header.hello')} {displayName}
                  </span>
                )}
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium text-xs sm:text-sm px-2.5 sm:px-3 py-2.5 sm:py-2 rounded-xl hover:bg-slate-100 transition-colors min-h-[44px] min-w-0 shrink-0"
                  aria-label={t('header.login')}
                >
                  <LogIn size={18} className="shrink-0" />
                  <span className="inline">{t('header.login')}</span>
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center justify-center gap-1.5 bg-blue-600 text-white font-bold text-xs sm:text-sm px-2.5 sm:px-3 py-2.5 sm:py-2 rounded-xl hover:bg-blue-700 transition-colors min-h-[44px] min-w-[44px] sm:min-w-0"
                  aria-label={t('header.signup')}
                  title={t('header.signup')}
                >
                  <UserPlus size={18} className="shrink-0" />
                  <span className="hidden sm:inline">{t('header.signup')}</span>
                </Link>
              </>
            ))}
        </div>
      </div>
    </header>
  );
}
