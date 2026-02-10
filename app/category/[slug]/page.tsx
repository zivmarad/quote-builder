'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { categories } from '../../service/services';
import { usePriceOverrides } from '../../contexts/PriceOverridesContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Search } from 'lucide-react';

export default function CategoryPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { getBasePrice } = usePriceOverrides();
  const { t, dir } = useLanguage();
  const [search, setSearch] = useState('');
  const categoryId = Array.isArray(slug) ? slug[0] : slug;
  const category = categories.find((c) => c.id === categoryId);

  const filteredServices = useMemo(() => {
    if (!category) return [];
    const q = search.trim().toLowerCase();
    if (!q) return category.services;
    return category.services.filter((s) => s.name.toLowerCase().includes(q));
  }, [category, search]);

  if (!category) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50" dir={dir}>
        <p className="text-slate-500 font-bold">{t('common.loading')}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:p-6 md:p-10" dir={dir}>
      <div className="max-w-4xl mx-auto text-right">
        <button
          onClick={() => router.push('/')}
          className="mb-4 sm:mb-6 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 min-h-[44px] px-2 -mr-2 rounded-xl active:bg-slate-100"
        >
          <span>{t('common.back')}</span>
          <span className="text-lg" aria-hidden="true">↩</span>
        </button>

        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 flex items-center gap-2 sm:gap-3 justify-end flex-wrap">
            <span>{t(`categoryName.${category.id}`, category.name)}</span>
            <span className="text-2xl sm:text-3xl md:text-4xl" aria-hidden="true">
              {category.icon}
            </span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm sm:text-base">
            {t('category.chooseService')}
          </p>
          <div className="mt-4">
            <label htmlFor="service-search" className="sr-only">
              {t('category.searchLabel')}
            </label>
            <div className="relative max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden />
              <input
                id="service-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('category.searchPlaceholder')}
                className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                dir="rtl"
              />
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {filteredServices.map((service) => (
            <button
              key={service.id}
              onClick={() => router.push(`/category/${category.id}/${service.id}`)}
              className="btn-hover-safe w-full text-right bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 hover:border-blue-500 hover:shadow-md transition-all active:scale-[0.98] min-h-[72px]"
            >
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-1">{t(`service.${service.id}`, service.name)}</h2>
              <p className="text-sm text-slate-500 mb-2">
                {t('category.fromPrice')}₪{getBasePrice(service.id, service.basePrice).toLocaleString('he-IL')}{t('category.perUnit')}{service.unit}
              </p>
              {service.isCounter && (
                <p className="text-xs text-slate-400">{t('category.quantityNote')}</p>
              )}
            </button>
          ))}

          {filteredServices.length === 0 && (
            <p className="text-slate-400 text-sm col-span-full">
              {search.trim() ? t('category.noResults') : t('category.noServices')}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}