import Link from 'next/link';

export default function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer
      className="border-t border-slate-200 bg-white mt-auto"
      dir="rtl"
      style={{ paddingBottom: 'var(--safe-area-inset-bottom)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-600">
          <span>© {year} מחולל הצעות מחיר</span>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
            <Link href="/landing#sample-quotes" className="hover:text-slate-900 font-medium transition-colors">
              הצעות מחיר לדוגמא
            </Link>
            <Link href="/contact" className="hover:text-slate-900 font-medium transition-colors">
              צור קשר
            </Link>
            <Link href="/terms" className="hover:text-slate-900 font-medium transition-colors">
              תנאי שימוש
            </Link>
            <Link href="/privacy" className="hover:text-slate-900 font-medium transition-colors">
              מדיניות פרטיות
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
