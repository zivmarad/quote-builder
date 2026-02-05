import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4" dir="rtl">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-black text-slate-300 mb-2">404</h1>
        <h2 className="text-xl font-bold text-slate-800 mb-2">הדף לא נמצא</h2>
        <p className="text-slate-500 mb-8">
          הקישור שביקשת לא קיים או שונה. תוכל לחזור לדף הבית או לאיזור האישי.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            דף הבית
          </Link>
          <Link
            href="/profile"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold border-2 border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            איזור אישי
          </Link>
        </div>
      </div>
    </main>
  );
}
