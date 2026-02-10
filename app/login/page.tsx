'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { SAVED_USERNAME_KEY, SAVED_PASSWORD_KEY } from '../contexts/AuthContext';
import { LogIn, ArrowRight, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const [from, setFrom] = useState('/');
  const { login } = useAuth();
  const { t, dir } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberUsername, setRememberUsername] = useState(true);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const f = params.get('from') || '/';
    setFrom(f.startsWith('/') ? f : `/${f}`);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedUser = localStorage.getItem(SAVED_USERNAME_KEY);
      if (savedUser) setUsername(savedUser);
      const savedPass = localStorage.getItem(SAVED_PASSWORD_KEY);
      if (savedPass) setPassword(savedPass);
    } catch { /* ignore */ }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(username, password);
      if (result.ok) {
        try {
          if (typeof window !== 'undefined') {
            if (rememberUsername) localStorage.setItem(SAVED_USERNAME_KEY, username.trim());
            else localStorage.removeItem(SAVED_USERNAME_KEY);
            if (rememberPassword) localStorage.setItem(SAVED_PASSWORD_KEY, password);
            else localStorage.removeItem(SAVED_PASSWORD_KEY);
          }
        } catch { /* ignore */ }
        window.location.href = typeof window !== 'undefined' ? `${window.location.origin}/` : '/';
        return;
      }
      setError(result.error ?? 'שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4" dir={dir}>
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium mb-6">
          <ArrowRight size={20} /> {t('common.backHome')}
        </Link>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          <h1 className="text-2xl font-black text-slate-900 mb-2">{t('login.title')}</h1>
          <p className="text-slate-500 text-sm mb-4">{t('login.description')}</p>
          <div className="mb-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-slate-700 text-sm font-medium mb-2">{t('login.newUserTitle')}</p>
            <Link
              href={from !== '/' ? `/signup?from=${encodeURIComponent(from)}` : '/signup'}
              className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm"
            >
              <UserPlus size={18} />
              {t('login.signupButton')}
            </Link>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="login-username" className="block text-sm font-bold text-slate-700 mb-2">
                {t('login.username')}
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={(e) => {
                  const el = e.currentTarget;
                  if (el.value && el.selectionStart === 0 && el.selectionEnd === el.value.length) {
                    el.setSelectionRange(el.value.length, el.value.length);
                  }
                }}
                placeholder="username או your@email.com"
                className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoComplete="username email"
                dir="ltr"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-bold text-slate-700 mb-2">
                {t('login.password')}
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoComplete="current-password"
                dir="ltr"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={rememberUsername}
                  onChange={(e) => setRememberUsername(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                {t('login.rememberUsername')}
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={rememberPassword}
                  onChange={(e) => setRememberPassword(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                {t('login.rememberPassword')}
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 min-h-[52px] rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
            >
              <LogIn size={20} />
              {loading ? t('login.submitting') : t('login.submit')}
            </button>
          </form>
          <p className="text-slate-500 text-sm mt-4 text-center flex flex-wrap justify-center gap-x-4 gap-y-1">
            <Link href="/forgot-password" className="text-blue-600 font-medium hover:underline">
              {t('login.forgotPassword')}
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/forgot-username" className="text-blue-600 font-medium hover:underline">
              {t('login.forgotUsername')}
            </Link>
          </p>
          <p className="text-slate-500 text-sm mt-2 text-center">
            {t('login.noAccount')}{' '}
            <Link href={from !== '/' ? `/signup?from=${encodeURIComponent(from)}` : '/signup'} className="text-blue-600 font-bold hover:underline">
              {t('login.signupHere')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
