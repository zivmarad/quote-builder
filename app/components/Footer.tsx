'use client';

import Link from 'next/link';
import { useLanguage } from '../contexts/LanguageContext';

export default function Footer() {
  const year = new Date().getFullYear();
  const { t, dir } = useLanguage();
  return (
    <footer
      className="border-t border-slate-200 bg-white/90 mt-auto"
      dir={dir}
      style={{ paddingBottom: 'var(--safe-area-inset-bottom)' }}
    >
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-sm text-slate-600">
          <span>© {year} {t('footer.copyright')}</span>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
            <Link href="/contact" className="hover:text-slate-900 font-medium transition-colors">
              {t('footer.contact')}
            </Link>
            <Link href="/terms" className="hover:text-slate-900 font-medium transition-colors">
              {t('footer.terms')}
            </Link>
            <Link href="/privacy" className="hover:text-slate-900 font-medium transition-colors">
              {t('footer.privacy')}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
