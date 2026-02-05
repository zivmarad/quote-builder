'use client';

import { useParams, useRouter } from 'next/navigation';
import { categories } from '../../service/services';
import RequireAuth from '../../components/RequireAuth';
import { usePriceOverrides } from '../../contexts/PriceOverridesContext';

export default function CategoryPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { getBasePrice } = usePriceOverrides();
  const categoryId = Array.isArray(slug) ? slug[0] : slug;
  const category = categories.find((c) => c.id === categoryId);

  if (!category) {
    return (
      <RequireAuth>
        <main className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
          <p className="text-slate-500 font-bold">טוען קטגוריה...</p>
        </main>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:p-6 md:p-10" dir="rtl">
      <div className="max-w-4xl mx-auto text-right">
        <button
          onClick={() => router.push('/')}
          className="mb-4 sm:mb-6 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 min-h-[44px] px-2 -mr-2 rounded-xl active:bg-slate-100"
        >
          <span>חזרה</span>
          <span className="text-lg" aria-hidden="true">↩</span>
        </button>

        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 flex items-center gap-2 sm:gap-3 justify-end flex-wrap">
            <span>{category.name}</span>
            <span className="text-2xl sm:text-3xl md:text-4xl" aria-hidden="true">
              {category.icon}
            </span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm sm:text-base">
            בחר סוג עבודה כדי להמשיך לשאלות ולהערכת מחיר מדויקת
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {category.services.map((service) => (
            <button
              key={service.id}
              onClick={() => router.push(`/category/${category.id}/${service.id}`)}
              className="btn-hover-safe w-full text-right bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 hover:border-blue-500 hover:shadow-md transition-all active:scale-[0.98] min-h-[72px]"
            >
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-1">{service.name}</h2>
              <p className="text-sm text-slate-500 mb-2">
                החל מ־₪{getBasePrice(service.id, service.basePrice).toLocaleString('he-IL')} לכל {service.unit}
              </p>
              {service.isCounter && (
                <p className="text-xs text-slate-400">ניתן להזין כמות בשלב השאלות</p>
              )}
            </button>
          ))}

          {category.services.length === 0 && (
            <p className="text-slate-400 text-sm">
              בקרוב יתווספו שירותים בקטגוריה זו. ניתן לעדכן את קטלוג השירותים בקובץ הנתונים.
            </p>
          )}
        </section>
      </div>
    </main>
    </RequireAuth>
  );
}