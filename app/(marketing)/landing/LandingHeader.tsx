import Link from 'next/link';

export default function LandingHeader() {
  return (
    <header
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100"
      style={{ paddingTop: 'var(--safe-area-inset-top)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-4" dir="rtl">
        <Link href="/landing" className="font-black text-slate-900 text-base sm:text-lg shrink-0">
          בונה הצעות מחיר
        </Link>
        <nav className="flex items-center gap-1.5 sm:gap-4 text-sm font-medium">
          <Link
            href="/pricing"
            className="hidden sm:inline text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap"
          >
            מחירונים
          </Link>
          <Link
            href="/guides"
            className="hidden sm:inline text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap"
          >
            מדריכים
          </Link>
          <Link
            href="/templates"
            className="hidden sm:inline text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap"
          >
            טפסים
          </Link>
          <a
            href="#how-it-works"
            className="hidden sm:inline text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap"
          >
            איך זה עובד
          </a>
          <Link
            href="/login"
            className="text-slate-700 hover:text-slate-900 font-bold px-2 sm:px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors whitespace-nowrap text-xs sm:text-sm"
          >
            התחברות
          </Link>
          <Link
            href="/?try=1"
            className="text-white font-bold px-3 sm:px-4 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] transition-colors whitespace-nowrap text-xs sm:text-sm"
          >
            נסה בחינם
          </Link>
        </nav>
      </div>
    </header>
  );
}
