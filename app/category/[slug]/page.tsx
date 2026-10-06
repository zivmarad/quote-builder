'use client';

import { useDeferredValue, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { categories } from '../../service/services';
import { usePriceOverrides } from '../../contexts/PriceOverridesContext';
import { useCustomCatalog } from '../../contexts/CustomCatalogContext';
import { useQuoteBasket } from '../../contexts/QuoteBasketContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';
import { getServiceDisplayName, isCustomCategoryId, isCustomServiceId } from '../../../lib/custom-catalog-types';
import { SPOTLIGHT_TARGET_CLASS } from '@/lib/spotlight-onboarding';
import { useSpotlightOnboarding } from '../../hooks/useSpotlightOnboarding';
import SpotlightOverlay from '../../components/onboarding/SpotlightOverlay';
import AddCustomServiceModal from '../../components/AddCustomServiceModal';
import {
  Search,
  Plus,
  Trash2,
  ArrowRight,
  Palette,
  Umbrella,
  Droplet,
  Layers,
  Zap,
  Snowflake,
  Hammer,
  Link2,
  TreePine,
  Wrench,
  Building2,
  DoorOpen,
  Package,
  Box,
  Radio,
  Cog,
  Mountain,
  Sofa,
  Bath,
  Home,
  type LucideIcon,
} from 'lucide-react';

const categoryIcons: Record<string, LucideIcon> = {
  paint: Palette,
  sealing: Umbrella,
  concrete: Box,
  plumbing: Droplet,
  tiling: Layers,
  electricity: Zap,
  ac: Snowflake,
  carpentry: Hammer,
  aluminium: Link2,
  gardening: TreePine,
  handyman: Wrench,
  welder: Cog,
  drywall: Building2,
  doors: DoorOpen,
  communications: Radio,
  misc: Package,
  earthwork: Mountain,
  'sofa-cleaning': Sofa,
  'shower-renovation': Bath,
  'home-renovation': Home,
};

export default function CategoryPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { getBasePrice } = usePriceOverrides();
  const {
    getMergedServices,
    addCustomService,
    deleteCustomService,
    deleteCustomCategory,
    getCategoryById,
  } = useCustomCatalog();
  const { t, dir } = useLanguage();
  const { shouldShow, dismissPage } = useSpotlightOnboarding();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [showAddService, setShowAddService] = useState(false);
  const [deletingProfession, setDeletingProfession] = useState(false);
  const [addedServiceId, setAddedServiceId] = useState<string | null>(null);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addItem } = useQuoteBasket();
  const spotlightRef = useRef<HTMLDivElement>(null);
  const categoryId = Array.isArray(slug) ? slug[0] : slug;
  const category = getCategoryById(categoryId ?? '', categories);
  const isCustomProfession = Boolean(category && isCustomCategoryId(category.id));

  const allServices = useMemo(() => {
    if (!category) return [];
    return getMergedServices(category.id, category.services);
  }, [category, getMergedServices]);

  const filteredServices = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return allServices;
    return allServices.filter((s) => {
      const display = getServiceDisplayName(t, s);
      return display.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
    });
  }, [allServices, deferredSearch, t]);

  const showServiceSpotlight = shouldShow('category');
  const spotlightServiceId =
    showServiceSpotlight && filteredServices[0] ? filteredServices[0].id : null;

  const handleAddServiceClick = () => {
    setShowAddService(true);
  };

  const handleDeleteService = async (serviceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!category || !window.confirm(t('customCatalog.deleteServiceConfirm'))) return;
    await deleteCustomService(category.id, serviceId);
  };

  const handleDeleteProfession = async () => {
    if (!category || !isCustomProfession) return;
    const ok = window.confirm(
      t('requestProfession.deleteConfirm', `למחוק את המקצוע "${category.name}" ואת כל השירותים שלו?`)
    );
    if (!ok) return;
    setDeletingProfession(true);
    try {
      const deleted = await deleteCustomCategory(category.id);
      if (deleted) router.push('/');
    } finally {
      setDeletingProfession(false);
    }
  };

  const navigateToService = (serviceId: string) => {
    if (showServiceSpotlight) {
      dismissPage('category');
    }
    router.push(`/category/${category!.id}/${serviceId}`);
  };

  const addOwnService = (serviceId: string) => {
    const service = allServices.find((item) => item.id === serviceId);
    if (!service || !category) return;
    if (showServiceSpotlight) dismissPage('category');
    addItem({
      name: getServiceDisplayName(t, service),
      category: category.id,
      basePrice: getBasePrice(service.id, service.basePrice),
      extras: [],
      description: '',
    });
    trackEvent(AnalyticsEvents.AddToCart, { category: category.id });
    setAddedServiceId(service.id);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAddedServiceId(null), 1400);
  };

  if (!category) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50" dir={dir}>
        <p className="text-slate-500 font-bold">{t('common.loading')}</p>
      </main>
    );
  }

  const TradeIcon = categoryIcons[category.id] ?? Wrench;
  const categoryTitle = t(`categoryName.${category.id}`, category.name);

  return (
    <main className="min-h-screen bg-[#f3f6fb] pb-28" dir={dir}>
      <div className="mx-auto max-w-md text-slate-900">
        <div className="px-5 pt-4">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500"
          >
            <ArrowRight size={18} />
            {t('common.back')}
          </button>
          <div className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              {isCustomProfession && category.icon ? (
                <span className="text-xl leading-none" aria-hidden>{category.icon}</span>
              ) : (
                <TradeIcon size={22} strokeWidth={1.75} aria-hidden />
              )}
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold leading-tight tracking-tight text-slate-900">{categoryTitle}</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {isCustomProfession ? t('category.tapAdds') : t('category.chooseService')}
              </p>
            </div>
          </div>
          {isCustomProfession && (
            <div className="mt-3 flex items-center gap-2">
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                {t('customCatalog.myProfession', 'מקצוע שלי')}
              </span>
              <button
                type="button"
                onClick={handleDeleteProfession}
                disabled={deletingProfession}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-slate-500 disabled:opacity-60"
              >
                <Trash2 size={14} />
                {deletingProfession
                  ? t('requestProfession.saving', 'מוחק...')
                  : t('requestProfession.delete', 'מחק מקצוע')}
              </button>
            </div>
          )}
        </div>

        <div className="px-4 pt-5">
          <label htmlFor="service-search" className="relative block">
            <span className="sr-only">{t('category.searchLabel')}</span>
            <Search className="pointer-events-none absolute end-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              id="service-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('category.searchPlaceholder')}
              className="w-full rounded-full border border-white bg-white py-3.5 pe-12 ps-4 text-sm text-slate-900 shadow-[0_8px_24px_rgba(15,23,42,0.06)] placeholder:text-slate-400 focus:border-blue-700 focus:outline-none"
              dir={dir}
              autoComplete="off"
            />
          </label>

          <div className="mt-4 flex flex-col gap-2">
            {filteredServices.map((service) => {
              const isCustom = isCustomServiceId(service.id);
              const displayName = getServiceDisplayName(t, service);
              const isSpotlight = spotlightServiceId === service.id;
              const price = getBasePrice(service.id, service.basePrice).toLocaleString('he-IL');
              return (
                <div
                  key={service.id}
                  ref={isSpotlight ? spotlightRef : undefined}
                  className={`flex items-center gap-2 rounded-[28px] bg-white px-2 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.05)] ${isSpotlight ? SPOTLIGHT_TARGET_CLASS : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => (isCustomProfession ? addOwnService(service.id) : navigateToService(service.id))}
                    className="flex min-w-0 flex-1 items-center gap-3 px-2 py-1.5 text-right"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-semibold leading-snug text-slate-900">{displayName}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {t('category.perUnit')}
                        {service.unit}
                      </span>
                    </span>
                    <span className={`shrink-0 whitespace-nowrap text-sm font-semibold tabular-nums ${addedServiceId === service.id ? 'text-blue-800' : 'text-slate-900'}`}>
                      {addedServiceId === service.id
                        ? t('category.added')
                        : `${isCustomProfession ? '' : t('category.fromPrice')}₪${price}`}
                    </span>
                  </button>
                  {isCustom && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteService(service.id, e)}
                      className="me-1 shrink-0 rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={t('customCatalog.deleteService')}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              );
            })}

            {filteredServices.length === 0 && search.trim() && (
              <p className="rounded-[28px] bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                {t('category.noResults')}
              </p>
            )}

            <button
              type="button"
              onClick={handleAddServiceClick}
              className="mt-1 flex w-full items-center gap-3 rounded-[28px] bg-white px-4 py-3.5 text-right shadow-[0_8px_24px_rgba(15,23,42,0.05)] active:scale-[0.99]"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-800">
                <Plus size={18} aria-hidden />
              </span>
              <span className="text-sm font-semibold text-slate-900">{t('customCatalog.addServiceButton')}</span>
            </button>
          </div>
        </div>
      </div>

      <SpotlightOverlay
        open={!!spotlightServiceId}
        targetRef={spotlightRef}
        title={t('spotlight.categoryTitle')}
        body={isCustomProfession ? t('spotlight.customCategoryBody') : t('spotlight.categoryBody')}
        skipLabel={t('spotlight.skip')}
        step={2}
        onDismiss={() => dismissPage('category')}
      />

      <AddCustomServiceModal
        open={showAddService}
        onClose={() => setShowAddService(false)}
        onSave={(input) => addCustomService(category.id, input)}
      />
    </main>
  );
}
