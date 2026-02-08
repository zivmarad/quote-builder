'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, ArrowRight, Mail } from 'lucide-react';

type Step = 'email' | 'code' | 'details';

export default function SignupPage() {
  const [from, setFrom] = useState('/');
  const { sendVerificationCode, checkVerificationCode, signupWithEmail } = useAuth();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const f = params.get('from') || '/';
    setFrom(f.startsWith('/') ? f : `/${f}`);
  }, []);

  const goToTarget = () => {
    window.location.href = typeof window !== 'undefined' ? `${window.location.origin}/` : '/';
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await sendVerificationCode(email);
      if (result.ok) {
        setStep('code');
        setCode('');
      } else setError(result.error ?? 'שגיאה בשליחת הקוד');
    } catch (err) {
      console.error('Send code error:', err);
      setError('שגיאה בשליחת הקוד. בדוק חיבור לאינטרנט ונסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) {
      setError('הקוד חייב להכיל 6 ספרות');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await checkVerificationCode(email, code);
      if (result.ok) setStep('details');
      else setError(result.error ?? 'קוד לא תקין או שפג תוקפו');
    } catch (err) {
      console.error('Check code error:', err);
      setError('שגיאה באימות. בדוק חיבור לאינטרנט ונסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('הסיסמאות לא תואמות');
      return;
    }
    setLoading(true);
    try {
      const result = await signupWithEmail(email, code, username, password);
      if (result.ok) goToTarget();
      else setError(result.error ?? 'שגיאה בהרשמה');
    } catch (err) {
      console.error('Signup error:', err);
      setError('שגיאה בהרשמה. בדוק חיבור לאינטרנט ונסה שוב.');
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
          <h1 className="text-2xl font-black text-slate-900 mb-2">הרשמה</h1>
          <p className="text-slate-500 text-sm mb-6">
            {step === 'email' && 'נשלח אליך קוד אימות למייל. אחר כך תבחר שם משתמש וסיסמה.'}
            {step === 'code' && `הזן את הקוד שנשלח ל־${email}`}
            {step === 'details' && 'בחר שם משתמש וסיסמה לחשבון'}
          </p>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-4" role="alert">
              {error}
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label htmlFor="signup-email" className="block text-sm font-bold text-slate-700 mb-2">
                  אימייל
                </label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoComplete="email"
                  dir="ltr"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 min-h-[52px] rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
              >
                <Mail size={20} />
                {loading ? 'שולח...' : 'שלח קוד אימות'}
              </button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleCodeNext} className="space-y-4">
              <div>
                <label htmlFor="signup-code" className="block text-sm font-bold text-slate-700 mb-2">
                  קוד אימות (6 ספרות)
                </label>
                <input
                  id="signup-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full px-4 py-3 min-h-[52px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-[0.5em] font-mono"
                  dir="ltr"
                  autoComplete="one-time-code"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || code.trim().length !== 6}
                className="w-full py-3 min-h-[52px] rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors active:scale-[0.98]"
              >
                {loading ? 'בודק קוד...' : 'המשך לבחירת שם משתמש וסיסמה'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('email'); setCode(''); setError(null); }}
                className="w-full py-2.5 text-slate-500 hover:text-slate-700 text-sm font-medium"
              >
                שינוי אימייל או שליחה מחדש
              </button>
            </form>
          )}

          {step === 'details' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label htmlFor="signup-username" className="block text-sm font-bold text-slate-700 mb-2">
                  שם משתמש
                </label>
                <input
                  id="signup-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="בחר שם משתמש (לפחות 2 תווים)"
                  className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoComplete="username"
                  dir="ltr"
                  required
                />
              </div>
              <div>
                <label htmlFor="signup-password" className="block text-sm font-bold text-slate-700 mb-2">
                  סיסמה
                </label>
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="לפחות 4 תווים"
                  className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoComplete="new-password"
                  dir="ltr"
                  required
                />
              </div>
              <div>
                <label htmlFor="signup-confirm" className="block text-sm font-bold text-slate-700 mb-2">
                  אימות סיסמה
                </label>
                <input
                  id="signup-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="הזן שוב את הסיסמה"
                  className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoComplete="new-password"
                  dir="ltr"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 min-h-[52px] rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
              >
                <UserPlus size={20} />
                {loading ? 'נרשם...' : 'הרשם'}
              </button>
            </form>
          )}

          <p className="text-slate-500 text-sm mt-6 text-center">
            כבר יש לך חשבון?{' '}
            <Link href={from !== '/' ? `/login?from=${encodeURIComponent(from)}` : '/login'} className="text-blue-600 font-bold hover:underline">
              התחבר
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
