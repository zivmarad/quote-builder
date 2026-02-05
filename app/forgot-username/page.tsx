'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Mail } from 'lucide-react';

export default function ForgotUsernamePage() {
  const { sendUsernameToEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await sendUsernameToEmail(email);
      if (result.ok) {
        setSent(true);
      } else setError(result.error ?? 'שגיאה בשליחה');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 text-center">
            <h1 className="text-2xl font-black text-slate-900 mb-2">נשלח למייל</h1>
            <p className="text-slate-500 text-sm mb-6">
              אם האימייל רשום במערכת, קיבלת מייל עם שם המשתמש שלך.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700"
            >
              <ArrowRight size={20} /> להתחברות
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <Link href="/login" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium mb-6">
          <ArrowRight size={20} /> חזרה להתחברות
        </Link>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          <h1 className="text-2xl font-black text-slate-900 mb-2">שכחתי שם משתמש</h1>
          <p className="text-slate-500 text-sm mb-6">
            הזן את האימייל שאיתו נרשמת. נשלח אליך את שם המשתמש.
          </p>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-4" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username-email" className="block text-sm font-bold text-slate-700 mb-2">
                אימייל
              </label>
              <input
                id="username-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                dir="ltr"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 min-h-[52px] rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Mail size={20} />
              {loading ? 'שולח...' : 'שלח שם משתמש'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
