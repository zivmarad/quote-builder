'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

/** מציג את הילדים רק למשתמש מחובר; אחרת מפנה להתחברות עם ?from=... */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useAuth();
  const { t, dir } = useLanguage();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      const from = pathname ? encodeURIComponent(pathname) : '';
      const loginUrl = from ? `/login?from=${from}` : '/login';
      window.location.href = loginUrl;
    }
  }, [isLoaded, user, pathname]);

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center" dir={dir}>
        <p className="text-slate-500 font-medium">{t('common.loading')}</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center" dir={dir}>
        <p className="text-slate-500 font-medium">{t('requireAuth.redirecting')}</p>
      </main>
    );
  }

  return <>{children}</>;
}
