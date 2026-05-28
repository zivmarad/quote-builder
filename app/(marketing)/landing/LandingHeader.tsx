import Link from 'next/link';

export default function LandingHeader() {
  return (
    <header
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100"
      style={{ paddingTop: 'var(--safe-area-inset-top)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4" dir="rtl">
        <Link href="/landing" className="font-black text-slate-900 text-lg shrink-0">
          בונה הצעות מחיר
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6 text-sm font-medium">
          <a href="#how-it-works" className="text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap">
            איך זה עובד
          </a>
          <Link
            href="/login"
            className="text-slate-700 hover:text-slate-900 font-bold px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors whitespace-nowrap"
          >
            התחברות
          </Link>
        </nav>
      </div>
    </header>
  );
}
