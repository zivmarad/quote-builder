'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [from, setFrom] = useState('/');
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const f = params.get('from') || '/';
    setFrom(f.startsWith('/') ? f : `/${f}`);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(username, password);
      if (result.ok) {
        window.location.href = typeof window !== 'undefined' ? `${window.location.origin}/` : '/';
        return;
      }
      setError(result.error ?? 'שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium mb-6">
          <ArrowRight size={20} /> חזרה לדף הבית
        </Link>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          <h1 className="text-2xl font-black text-slate-900 mb-2">התחברות</h1>
          <p className="text-slate-500 text-sm mb-6">הזן שם משתמש או אימייל וסיסמה</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="login-username" className="block text-sm font-bold text-slate-700 mb-2">
                שם משתמש או אימייל
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
                סיסמה
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
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 min-h-[52px] rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
            >
              <LogIn size={20} />
              {loading ? 'מתחבר...' : 'התחבר'}
            </button>
          </form>
          <p className="text-slate-500 text-sm mt-4 text-center flex flex-wrap justify-center gap-x-4 gap-y-1">
            <Link href="/forgot-password" className="text-blue-600 font-medium hover:underline">
              שכחתי סיסמה
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/forgot-username" className="text-blue-600 font-medium hover:underline">
              שכחתי שם משתמש
            </Link>
          </p>
          <p className="text-slate-500 text-sm mt-2 text-center">
            עדיין אין לך חשבון?{' '}
            <Link href={from !== '/' ? `/signup?from=${encodeURIComponent(from)}` : '/signup'} className="text-blue-600 font-bold hover:underline">
              הרשם
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
