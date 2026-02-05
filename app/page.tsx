import Link from 'next/link';
import { categories } from './service/services';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-6 sm:p-6 md:p-12" dir="rtl">
      <div className="max-w-5xl mx-auto text-right">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mb-2 leading-tight">
            בונה הצעות מחיר
          </h1>
          <p className="text-slate-500 font-medium text-sm sm:text-base mb-4">
            בחר תחום עבודה כדי להתחיל תמחור מהיר ומדויק
          </p>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline touch-manipulation"
          >
            איזור אישי – פרטים, היסטוריה והגדרות
          </Link>
        </header>

        <section className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.id}`}
              className="card-hover-safe bg-white min-h-[120px] sm:aspect-square sm:min-h-0 rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-slate-100 hover:border-blue-500 hover:shadow-lg transition-all flex flex-col items-center justify-center text-center group active:scale-[0.98] p-4"
            >
              <span className="text-3xl sm:text-4xl md:text-5xl mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 transition-transform block">
                {cat.icon}
              </span>
              <span className="font-bold text-slate-800 text-sm sm:text-base md:text-lg leading-tight line-clamp-2">
                {cat.name}
              </span>
              <span className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] md:text-xs bg-blue-50 text-blue-600 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-bold sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                כניסה
              </span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
