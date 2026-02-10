'use client';

import Link from 'next/link';
import { Palette, Umbrella, Droplet, Layers, Zap, Snowflake, Hammer, Link2, TreePine, Wrench, Building2, DoorOpen, Package, ChevronRight, Box, Radio } from 'lucide-react';
import { categories } from './service/services';
import { useLanguage } from './contexts/LanguageContext';

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
  drywall: Building2,
  doors: DoorOpen,
  communications: Radio,
  misc: Package,
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
  drywall: 'text-slate-500',
  doors: 'text-amber-900',
  communications: 'text-violet-600',
  misc: 'text-slate-500',
};

export default function HomePage() {
  const { t, dir } = useLanguage();
  return (
    <main className="min-h-screen bg-[#F8FAFC] px-5 py-6 sm:p-6 md:p-12" dir={dir}>
      <div className="max-w-5xl mx-auto text-right">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1E293B] mb-2 leading-tight">
            {t('home.title')}
          </h1>
          <p className="text-slate-500 font-medium text-sm sm:text-base mb-4">
            {t('home.subtitle')}
          </p>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline touch-manipulation"
          >
            {t('home.profileLink')}
          </Link>
        </header>

        <section className="home-categories-grid">
          {categories.map((cat) => {
            const IconComponent = categoryIcons[cat.id] ?? Package;
            const iconColor = categoryColors[cat.id] ?? 'text-slate-500';
            return (
              <Link
                key={cat.id}
                href={`/category/${cat.id}`}
                className="card-hover-safe bg-white min-h-[120px] sm:aspect-square sm:min-h-0 rounded-2xl shadow-[0_4px_6px_-1px_rgb(0_0_0_/_0.1)] border border-[#E2E8F0] hover:border-blue-400 hover:shadow-lg transition-all flex flex-col items-center justify-center text-center group active:scale-[0.98] p-4 relative"
              >
                <IconComponent size={28} className={`${iconColor} group-hover:opacity-90 mb-2 sm:mb-3 transition-colors shrink-0`} />
                <span className="font-semibold text-[1.1rem] text-[#1E293B] leading-tight line-clamp-2">
                  {t(`categoryName.${cat.id}`, cat.name)}
                </span>
                <span className="mt-2 text-slate-400 text-xs group-hover:text-blue-600 transition-colors">{t('common.enter')}</span>
                <ChevronRight size={18} className="absolute left-3 top-3 sm:left-4 sm:top-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
