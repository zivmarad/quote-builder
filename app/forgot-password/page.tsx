'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Mail, KeyRound } from 'lucide-react';

type Step = 'email' | 'code';

export default function ForgotPasswordPage() {
  const { sendResetCode, resetPassword } = useAuth();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await sendResetCode(email);
      if (result.ok) {
        setStep('code');
        setCode('');
      } else setError(result.error ?? 'שגיאה בשליחת הקוד');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('הסיסמאות לא תואמות');
      return;
    }
    if (newPassword.length < 4) {
      setError('הסיסמה חייבת להכיל לפחות 4 תווים');
      return;
    }
    setLoading(true);
    try {
      const result = await resetPassword(email, code, newPassword);
      if (result.ok) setSuccess(true);
      else setError(result.error ?? 'שגיאה באיפוס הסיסמה');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 text-center">
            <h1 className="text-2xl font-black text-slate-900 mb-2">הסיסמה עודכנה</h1>
            <p className="text-slate-500 text-sm mb-6">כעת תוכל להתחבר עם הסיסמה החדשה</p>
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
          <h1 className="text-2xl font-black text-slate-900 mb-2">שכחתי סיסמה</h1>
          <p className="text-slate-500 text-sm mb-6">
            {step === 'email'
              ? 'הזן את האימייל שאיתו נרשמת. נשלח אליך קוד לאיפוס הסיסמה.'
              : `הזן את הקוד שנשלח ל־${email} ובחר סיסמה חדשה.`}
          </p>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-4" role="alert">
              {error}
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-bold text-slate-700 mb-2">
                  אימייל
                </label>
                <input
                  id="reset-email"
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
                {loading ? 'שולח...' : 'שלח קוד איפוס'}
              </button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label htmlFor="reset-code" className="block text-sm font-bold text-slate-700 mb-2">
                  קוד אימות (6 ספרות)
                </label>
                <input
                  id="reset-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full px-4 py-3 min-h-[52px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-[0.5em] font-mono"
                  dir="ltr"
                  required
                />
              </div>
              <div>
                <label htmlFor="reset-new" className="block text-sm font-bold text-slate-700 mb-2">
                  סיסמה חדשה
                </label>
                <input
                  id="reset-new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="לפחות 4 תווים"
                  className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="ltr"
                  required
                />
              </div>
              <div>
                <label htmlFor="reset-confirm" className="block text-sm font-bold text-slate-700 mb-2">
                  אימות סיסמה
                </label>
                <input
                  id="reset-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="הזן שוב את הסיסמה"
                  className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="ltr"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-3 min-h-[52px] rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <KeyRound size={20} />
                {loading ? 'מאפס...' : 'אפס סיסמה'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('email'); setError(null); }}
                className="w-full py-2.5 text-slate-500 hover:text-slate-700 text-sm font-medium"
              >
                שינוי אימייל
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
