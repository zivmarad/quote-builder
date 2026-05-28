'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
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
  ChevronRight,
  Box,
  Radio,
  Cog,
  Search,
  Plus,
  Mountain,
  Sofa,
} from 'lucide-react';
import { categories } from './service/services';
import { useLanguage } from './contexts/LanguageContext';
import { useCustomCatalog } from './contexts/CustomCatalogContext';
import { getServiceDisplayName } from '../lib/custom-catalog-types';
import {
  SPOTLIGHT_SUGGESTED_HOME_CATEGORY_ID,
  SPOTLIGHT_TARGET_CLASS,
} from '@/lib/spotlight-onboarding';
import { useSpotlightOnboarding } from './hooks/useSpotlightOnboarding';
import SpotlightOverlay from './components/onboarding/SpotlightOverlay';

const categoryIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
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
};

const categoryColors: Record<string, string> = {
  paint: 'text-amber-600',
  sealing: 'text-purple-600',
  concrete: 'text-slate-700',
  plumbing: 'text-blue-500',
  tiling: 'text-amber-700',
  electricity: 'text-amber-500',
  ac: 'text-cyan-500',
  carpentry: 'text-amber-800',
  aluminium: 'text-slate-600',
  gardening: 'text-green-600',
  handyman: 'text-orange-600',
  welder: 'text-slate-700',
  drywall: 'text-slate-500',
  doors: 'text-amber-900',
  communications: 'text-violet-600',
  misc: 'text-slate-500',
  earthwork: 'text-orange-700',
  'sofa-cleaning': 'text-teal-600',
};

type SearchResult = {
  type: 'category' | 'service';
  categoryId: string;
  categoryName: string;
  serviceId?: string;
  serviceName?: string;
  href: string;
};

export default function HomePage() {
  const router = useRouter();
  const { t, dir } = useLanguage();
  const { getMergedServices } = useCustomCatalog();
  const { shouldShow, dismissPage } = useSpotlightOnboarding();
  const [search, setSearch] = useState('');
  const spotlightRef = useRef<HTMLAnchorElement>(null);

  const showCategorySpotlight = shouldShow('home');
  const suggestedCategoryId = SPOTLIGHT_SUGGESTED_HOME_CATEGORY_ID;

  const searchResults = useMemo((): SearchResult[] => {
    const q = search.trim().toLowerCase();
    if (!q) return [];

    const results: SearchResult[] = [];

    for (const cat of categories) {
      const categoryName = t(`categoryName.${cat.id}`, cat.name);
      if (categoryName.toLowerCase().includes(q) || cat.name.toLowerCase().includes(q)) {
        results.push({
          type: 'category',
          categoryId: cat.id,
          categoryName,
          href: `/category/${cat.id}`,
        });
      }

      const services = getMergedServices(cat.id, cat.services);
      for (const svc of services) {
        const serviceName = getServiceDisplayName(t, svc);
        if (serviceName.toLowerCase().includes(q) || svc.name.toLowerCase().includes(q)) {
          results.push({
            type: 'service',
            categoryId: cat.id,
            categoryName,
            serviceId: svc.id,
            serviceName,
            href: `/category/${cat.id}/${svc.id}`,
          });
        }
      }
    }

    return results.slice(0, 12);
  }, [search, t, getMergedServices]);

  const showResults = search.trim().length > 0;

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-5 py-6 sm:p-6 md:p-12" dir={dir}>
      <div className="max-w-5xl mx-auto text-right">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1E293B] mb-2 leading-tight">
            {t('home.title')}
          </h1>
          <p className="text-slate-500 font-medium text-sm sm:text-base mb-4">{t('home.subtitle')}</p>

          <div className="relative max-w-xl">
            <label htmlFor="home-search" className="sr-only">
              {t('home.searchLabel')}
            </label>
            <Search
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
              aria-hidden
            />
            <input
              id="home-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('home.searchPlaceholder')}
              className="w-full pr-12 pl-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              dir="rtl"
              autoComplete="off"
            />
            {showResults && (
              <div className="absolute z-20 top-full mt-2 w-full bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                {searchResults.length > 0 ? (
                  <ul className="max-h-72 overflow-y-auto py-1">
                    {searchResults.map((result) => (
                      <li key={`${result.type}-${result.categoryId}-${result.serviceId ?? 'cat'}`}>
                        <button
                          type="button"
                          onClick={() => {
                            router.push(result.href);
                            setSearch('');
                          }}
                          className="w-full text-right px-4 py-3 hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 text-sm truncate">
                              {result.type === 'service' ? result.serviceName : result.categoryName}
                            </p>
                            {result.type === 'service' && (
                              <p className="text-xs text-slate-500 truncate">{result.categoryName}</p>
                            )}
                          </div>
                          <ChevronRight size={16} className="text-slate-300 shrink-0 rotate-180" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-4 text-sm text-slate-500">{t('home.noResults')}</p>
                )}
              </div>
            )}
          </div>
          {!showResults && <p className="mt-2 text-xs text-slate-400">{t('home.searchHint')}</p>}
        </header>

        <section className="home-categories-grid">
          {categories.map((cat) => {
            const IconComponent = categoryIcons[cat.id] ?? Package;
            const iconColor = categoryColors[cat.id] ?? 'text-slate-500';
            const isSpotlight = showCategorySpotlight && cat.id === suggestedCategoryId;
            return (
              <Link
                key={cat.id}
                ref={isSpotlight ? spotlightRef : undefined}
                href={`/category/${cat.id}`}
                onClick={() => {
                  if (showCategorySpotlight) {
                    dismissPage('home');
                  }
                }}
                className={`card-hover-safe bg-white min-h-[120px] sm:aspect-square sm:min-h-0 rounded-2xl shadow-[0_4px_6px_-1px_rgb(0_0_0_/_0.1)] border border-[#E2E8F0] hover:border-blue-400 hover:shadow-lg transition-all flex flex-col items-center justify-center text-center group active:scale-[0.98] p-4 relative ${
                  isSpotlight ? SPOTLIGHT_TARGET_CLASS : ''
                }`}
              >
                <IconComponent
                  size={28}
                  className={`${iconColor} group-hover:opacity-90 mb-2 sm:mb-3 transition-colors shrink-0`}
                />
                <span className="font-semibold text-[1.1rem] text-[#1E293B] leading-tight line-clamp-2">
                  {t(`categoryName.${cat.id}`, cat.name)}
                </span>
                <span className="mt-2 text-slate-400 text-xs group-hover:text-blue-600 transition-colors">
                  {t('common.enter')}
                </span>
                <ChevronRight
                  size={18}
                  className="absolute left-3 top-3 sm:left-4 sm:top-4 text-slate-300 group-hover:text-blue-500 transition-colors"
                />
              </Link>
            );
          })}
          <Link
            href="/request-profession"
            className="card-hover-safe bg-gradient-to-br from-slate-50 to-blue-50/50 min-h-[120px] sm:aspect-square sm:min-h-0 rounded-2xl shadow-[0_4px_6px_-1px_rgb(0_0_0_/_0.1)] border-2 border-dashed border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all flex flex-col items-center justify-center text-center group active:scale-[0.98] p-4 relative"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-blue-200 transition-colors">
              <Plus size={24} className="text-blue-600" />
            </div>
            <span className="font-semibold text-[1.05rem] text-[#1E293B] leading-tight">
              {t('home.addProfessionTitle')}
            </span>
            <span className="mt-2 text-blue-500 text-xs font-medium group-hover:text-blue-600 transition-colors">
              {t('home.addProfessionSubtitle')}
            </span>
          </Link>
        </section>
      </div>

      <SpotlightOverlay
        open={showCategorySpotlight}
        targetRef={spotlightRef}
        hint={t('spotlight.homeCategory')}
        skipLabel={t('spotlight.skip')}
        onDismiss={() => dismissPage('home')}
      />
    </main>
  );
}
