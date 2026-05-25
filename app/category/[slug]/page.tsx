'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { categories } from '../../service/services';
import { usePriceOverrides } from '../../contexts/PriceOverridesContext';
import { useCustomCatalog } from '../../contexts/CustomCatalogContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getServiceDisplayName, isCustomServiceId } from '../../../lib/custom-catalog-types';
import AddCustomServiceModal from '../../components/AddCustomServiceModal';
import { Search, Plus, Trash2 } from 'lucide-react';

export default function CategoryPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { getBasePrice } = usePriceOverrides();
  const { getMergedServices, addCustomService, deleteCustomService } = useCustomCatalog();
  const { t, dir } = useLanguage();
  const [search, setSearch] = useState('');
  const [showAddService, setShowAddService] = useState(false);
  const categoryId = Array.isArray(slug) ? slug[0] : slug;
  const category = categories.find((c) => c.id === categoryId);

  const allServices = useMemo(() => {
    if (!category) return [];
    return getMergedServices(category.id, category.services);
  }, [category, getMergedServices]);

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allServices;
    return allServices.filter((s) => {
      const display = getServiceDisplayName(t, s);
      return display.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
    });
  }, [allServices, search, t]);

  const handleAddServiceClick = () => {
    if (!user) {
      router.push(`/login?from=${encodeURIComponent(`/category/${categoryId}`)}`);
      return;
    }
    setShowAddService(true);
  };

  const handleDeleteService = async (serviceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!category || !window.confirm(t('customCatalog.deleteServiceConfirm'))) return;
    await deleteCustomService(category.id, serviceId);
  };

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
          {filteredServices.map((service) => {
            const isCustom = isCustomServiceId(service.id);
            const displayName = getServiceDisplayName(t, service);
            return (
              <div
                key={service.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/category/${category.id}/${service.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(`/category/${category.id}/${service.id}`);
                  }
                }}
                className={`btn-hover-safe w-full text-right bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border transition-all active:scale-[0.98] min-h-[72px] cursor-pointer ${
                  isCustom
                    ? 'border-violet-200 hover:border-violet-400 hover:shadow-md'
                    : 'border-slate-100 hover:border-blue-500 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-2 mb-1">
                  <div className="flex-1 flex items-center gap-2 justify-start flex-wrap min-w-0 text-right">
                    {isCustom && (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full shrink-0">
                        {t('customCatalog.myService')}
                      </span>
                    )}
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">{displayName}</h2>
                  </div>
                  {isCustom && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteService(service.id, e)}
                      className="shrink-0 p-2 -m-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label={t('customCatalog.deleteService')}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-500 mb-2">
                  {t('category.fromPrice')} ₪{getBasePrice(service.id, service.basePrice).toLocaleString('he-IL')} {t('category.perUnit')} {service.unit}
                </p>
                {service.isCounter && (
                  <p className="text-xs text-slate-400">{t('category.quantityNote')}</p>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={handleAddServiceClick}
            className="w-full min-h-[72px] rounded-2xl sm:rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-400 transition-all flex flex-col items-center justify-center gap-2 p-4 active:scale-[0.98]"
          >
            <Plus size={22} className="text-blue-600" />
            <span className="font-bold text-blue-700 text-sm">{t('customCatalog.addServiceButton')}</span>
          </button>

          {filteredServices.length === 0 && search.trim() && (
            <p className="text-slate-400 text-sm col-span-full">
              {t('category.noResults')}
            </p>
          )}
        </section>
      </div>

      <AddCustomServiceModal
        open={showAddService}
        onClose={() => setShowAddService(false)}
        onSave={(input) => addCustomService(category.id, input)}
      />
    </main>
  );
}
