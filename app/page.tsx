'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
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
  Star,
  FileText,
  History,
  User,
  Users,
  Settings,
  ChevronLeft,
  Mountain,
  Sofa,
  Bath,
  Home,
  type LucideIcon,
} from 'lucide-react';
import { savePdfBlob } from './components/utils/savePdf';
import InstallAppButton from './components/InstallAppButton';
import { categories, splitOrderedCategories } from './service/services';
import type { Category } from './service/services';
import { useLanguage } from './contexts/LanguageContext';
import { useCustomCatalog } from './contexts/CustomCatalogContext';
import { useAuth } from './contexts/AuthContext';
import { useProfile } from './contexts/ProfileContext';
import { useQuoteBasket } from './contexts/QuoteBasketContext';
import { useQuoteHistory, type SavedQuote } from './contexts/QuoteHistoryContext';
import { useSettings } from './contexts/SettingsContext';
import { getServiceDisplayName, isCustomCategoryId } from '../lib/custom-catalog-types';
import { useSpotlightOnboarding } from './hooks/useSpotlightOnboarding';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';
import { recordProductMetric } from '@/lib/product-metrics-client';
import {
  FEATURED_TRADE_IDS,
  STARTER_TRADE_IDS,
  migrateGuestTradeInterests,
  readTradeInterests,
  writeTradeInterests,
  type TradeInterests,
} from '@/lib/trade-interests';

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

type SearchResult = {
  type: 'category' | 'service';
  categoryId: string;
  categoryName: string;
  serviceId?: string;
  serviceName?: string;
  href: string;
};

const tradeGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 12,
} as const;

const choiceGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
} as const;

const tileClass =
  'flex flex-col items-center justify-center gap-2.5 min-h-[118px] rounded-[32px] border border-white/80 bg-white/80 px-3 py-4 text-center shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm transition-all active:scale-[0.98]';

const actionClass =
  'h-12 w-full rounded-full bg-blue-800 text-base font-semibold text-white hover:bg-blue-900';

const tradeTones: Record<string, string> = {
  paint: 'bg-amber-100 text-amber-800',
  sealing: 'bg-cyan-100 text-cyan-800',
  concrete: 'bg-stone-200 text-stone-700',
  plumbing: 'bg-sky-100 text-sky-800',
  tiling: 'bg-orange-100 text-orange-800',
  electricity: 'bg-yellow-100 text-yellow-800',
  ac: 'bg-indigo-100 text-indigo-700',
  carpentry: 'bg-orange-100 text-orange-900',
  aluminium: 'bg-slate-200 text-slate-700',
  gardening: 'bg-emerald-100 text-emerald-800',
  handyman: 'bg-rose-100 text-rose-800',
  welder: 'bg-zinc-200 text-zinc-700',
  drywall: 'bg-amber-50 text-amber-700',
  doors: 'bg-lime-100 text-lime-800',
  communications: 'bg-violet-100 text-violet-800',
  misc: 'bg-stone-100 text-stone-600',
  earthwork: 'bg-yellow-100 text-yellow-900',
  'sofa-cleaning': 'bg-fuchsia-100 text-fuchsia-800',
  'shower-renovation': 'bg-teal-100 text-teal-800',
  'home-renovation': 'bg-blue-100 text-blue-800',
};

function tradeTone(id: string) {
  return tradeTones[id] ?? 'bg-teal-50 text-teal-800';
}

export default function HomePage() {
  const router = useRouter();
  const { t, dir, locale } = useLanguage();
  const { user, isLoaded: authLoaded } = useAuth();
  const { profile } = useProfile();
  const { vatRate, validityDays } = useSettings();
  const { items, totalWithVAT, itemCount, isLoaded: basketLoaded, loadBasket } = useQuoteBasket();
  const { quotes, isLoaded: historyLoaded } = useQuoteHistory();
  const { getMergedServices, customCategories, addCustomCategory } = useCustomCatalog();
  const { shouldShow, dismissPage } = useSpotlightOnboarding();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [interests, setInterests] = useState<TradeInterests | null | undefined>(undefined);
  const [editingTrades, setEditingTrades] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const showCategorySpotlight = shouldShow('home');
  const userId = user?.id ?? null;

  useEffect(() => {
    try {
      if (sessionStorage.getItem('qb_app_entry_tracked') === '1') return;
      sessionStorage.setItem('qb_app_entry_tracked', '1');
    } catch {
      /* ignore */
    }
    const hasSession = document.cookie.includes('quoteBuilder_session=');
    if (!hasSession) trackEvent(AnalyticsEvents.AppEnteredGuest);
    recordProductMetric('app_entered');
  }, []);

  useEffect(() => {
    if (!authLoaded) return;
    if (userId) migrateGuestTradeInterests(userId);
    setInterests(readTradeInterests(userId));
  }, [authLoaded, userId]);

  const { trades: tradeCategories, projects: projectCategories } = useMemo(
    () => splitOrderedCategories(),
    [],
  );

  const myProfessionCategories = useMemo(
    () =>
      customCategories.map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        services: [] as Category['services'],
      })),
    [customCategories],
  );

  const knownIds = useMemo(() => {
    const ids = new Set<string>();
    for (const cat of [...tradeCategories, ...projectCategories, ...myProfessionCategories]) {
      ids.add(cat.id);
    }
    return ids;
  }, [tradeCategories, projectCategories, myProfessionCategories]);

  const selectedIds = useMemo(() => {
    if (!interests) return [];
    return interests.ids.filter((id) => knownIds.has(id));
  }, [interests, knownIds]);

  const showStarterTrades = selectedIds.length === 0 && myProfessionCategories.length === 0;
  const needsPick = editingTrades;

  const displayName = useCallback(
    (cat: Category) => (isCustomCategoryId(cat.id) ? cat.name : t(`categoryName.${cat.id}`, cat.name)),
    [t],
  );

  const catById = useMemo(() => {
    const map = new Map<string, Category>();
    for (const cat of [...tradeCategories, ...projectCategories, ...myProfessionCategories]) {
      map.set(cat.id, cat);
    }
    return map;
  }, [tradeCategories, projectCategories, myProfessionCategories]);

  const visibleTrades = useMemo(() => {
    if (showStarterTrades) {
      return STARTER_TRADE_IDS.map((id) => catById.get(id)).filter((cat): cat is Category => Boolean(cat));
    }
    const picked = selectedIds
      .map((id) => catById.get(id))
      .filter((cat): cat is Category => {
        if (!cat) return false;
        return !isCustomCategoryId(cat.id);
      });
    return [...myProfessionCategories, ...picked];
  }, [showStarterTrades, selectedIds, catById, myProfessionCategories]);

  const searchResults = useMemo((): SearchResult[] => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return [];

    const results: SearchResult[] = [];
    const allCats: Category[] = [...categories, ...myProfessionCategories];

    for (const cat of allCats) {
      const categoryName = displayName(cat);
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
            href: isCustomCategoryId(cat.id) ? `/category/${cat.id}` : `/category/${cat.id}/${svc.id}`,
          });
        }
      }
    }

    return results.slice(0, 12);
  }, [deferredSearch, t, getMergedServices, myProfessionCategories, displayName]);

  const saveInterests = (next: TradeInterests, close = true) => {
    writeTradeInterests(userId, next);
    setInterests(next);
    if (!close) return;
    setEditingTrades(false);
    setSearch('');
    window.scrollTo(0, 0);
  };

  const quoteWasIssued = (quote: SavedQuote) => {
    if (quote.status === 'download' || quote.status === 'whatsapp' || quote.status === 'email') return true;
    const workflow = quote.quoteStatus ?? 'draft';
    return workflow === 'sent' || workflow === 'approved' || workflow === 'paid';
  };

  const copyQuoteToCart = (quote: SavedQuote) => {
    sessionStorage.setItem('quoteBuilder_pendingDraft', JSON.stringify({
      customerName: quote.customerName || '',
      customerPhone: quote.customerPhone || '',
      customerEmail: quote.customerEmail || '',
      customerAddress: quote.customerAddress || '',
      customerCompanyId: quote.customerCompanyId || '',
      notes: quote.notes || '',
      discountType: quote.discount?.type,
      discountValue: quote.discount?.value != null ? String(quote.discount.value) : '',
    }));
    loadBasket(quote.items, quote.discount);
    router.push('/cart');
  };

  const downloadIssuedQuote = async (quote: SavedQuote) => {
    if (downloadingId) return;
    const snap = quote.quote_data ?? quote.quoteData;
    setDownloadingId(quote.id);
    try {
      const { generateQuotePDFAsBlob } = await import('./components/utils/pdfExport');
      const blob = await generateQuotePDFAsBlob(
        quote.items,
        quote.totalBeforeVAT,
        quote.VAT,
        quote.totalWithVAT,
        snap?.profile ?? profile,
        quote.customerName ?? undefined,
        quote.notes ?? undefined,
        snap?.quoteTitle,
        quote.quoteNumber ?? undefined,
        quote.customerPhone ?? undefined,
        quote.customerEmail ?? undefined,
        quote.customerAddress ?? undefined,
        quote.customerCompanyId ?? undefined,
        snap?.validityDays ?? validityDays,
        snap?.vatRate ?? vatRate,
        quote.subtotalBeforeDiscount,
        quote.discountAmount,
        quote.discount
      );
      setDownloadingId(null);
      await savePdfBlob(blob, `hatzaat-mechir-${quote.createdAt.slice(0, 10)}.pdf`);
    } finally {
      setDownloadingId(null);
    }
  };

  const recentQuotes = useMemo(
    () =>
      [...quotes]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3),
    [quotes],
  );
  const dateLocale = locale === 'he' ? 'he-IL' : locale === 'ar' ? 'ar' : locale === 'ru' ? 'ru-RU' : 'en';

  useEffect(() => {
    if (!editingTrades) return;
    const toTop = () => window.scrollTo(0, 0);
    toTop();
    const frame = requestAnimationFrame(toTop);
    return () => cancelAnimationFrame(frame);
  }, [editingTrades]);

  const inferredIds = useMemo(() => {
    const ids: string[] = [];
    for (const item of items) {
      if (knownIds.has(item.category) && !ids.includes(item.category)) ids.push(item.category);
    }
    return ids;
  }, [items, knownIds]);

  if (interests === undefined || !authLoaded || !basketLoaded) {
    return <main className="min-h-[50vh] bg-[#f3f6fb]" dir={dir} />;
  }

  const rawName =
    profile.contactName?.trim() || profile.businessName?.trim() || (user ? user.username : '');
  const firstName = rawName
    ? rawName.includes('@')
      ? rawName.split('@')[0]
      : rawName.split(/\s+/)[0]
    : '';
  const greetingName = firstName || t('header.guest');

  return (
    <main
      className={`bg-[#f3f6fb] ${!needsPick && itemCount > 0 ? 'pb-28' : 'pb-8'}`}
      dir={dir}
      style={editingTrades ? { overflowAnchor: 'none' } : undefined}
    >
      <div className="mx-auto max-w-md text-slate-900">
        <h1 className="sr-only">{t('home.title')}</h1>

        {needsPick ? (
          <div className="px-5 pt-4">
          <TradePicker
            trades={tradeCategories}
            projects={projectCategories}
            custom={myProfessionCategories}
            initialIds={editingTrades ? selectedIds : selectedIds.length > 0 ? selectedIds : inferredIds}
            isEdit={editingTrades}
            displayName={displayName}
            onSave={(ids, close) => saveInterests({ ids, catalogOff: false }, close)}
            onAddProfession={async (name) => {
              const created = await addCustomCategory({ name });
              return created != null;
            }}
            onSkip={() => saveInterests({ ids: [], catalogOff: true })}
            onCancel={editingTrades ? () => { setEditingTrades(false); window.scrollTo(0, 0); } : undefined}
          />
          </div>
        ) : (
          <>
            <section className="relative md:px-3 md:pt-3">
              <div className="relative overflow-hidden rounded-b-[36px] bg-gradient-to-br from-blue-600 via-blue-800 to-indigo-950 px-6 pb-12 pt-7 text-white shadow-[0_24px_50px_rgba(30,58,138,0.28)] md:rounded-[48px] md:pb-14 md:pt-8">
                <div className="pointer-events-none absolute -start-6 -top-8 size-36 rounded-full bg-cyan-300/30 blur-2xl" />
                <div className="pointer-events-none absolute -end-4 bottom-6 size-28 rounded-full bg-white/15 blur-2xl" />
                <h2 className="relative text-[1.7rem] font-semibold leading-snug tracking-tight">
                  {t('home.hello')} {greetingName},
                  <br />
                  {t('home.heroAsk')}
                </h2>
              </div>
              <InstallAppButton
                label={t('home.installHint')}
                labelClassName="whitespace-nowrap"
                className="absolute end-6 top-7 z-20 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-blue-900 shadow-[0_8px_20px_rgba(15,23,42,0.18)] active:scale-[0.98]"
              />
              <div
                className="relative z-10 -mt-6 mx-auto w-[72%] md:-mt-7 md:w-[78%]"
                style={{ display: 'grid', gridTemplateColumns: '0.82fr 1.14fr', gap: 10 }}
              >
                <Link
                  href="/quotes"
                  className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-[28px] bg-slate-200 px-2 py-4 text-center text-slate-600 shadow-[0_12px_28px_rgba(15,23,42,0.06)] active:scale-[0.98]"
                >
                  <History className="text-slate-500" size={52} aria-hidden />
                  <span className="block text-xl font-bold leading-tight">{t('home.pastQuotes')}</span>
                </Link>
                <Link
                  href={itemCount > 0 ? '/cart' : '/quick-quote'}
                  className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-[32px] bg-white px-3 py-4 text-center text-slate-900 shadow-[0_16px_40px_rgba(15,23,42,0.08)] ring-1 ring-white active:scale-[0.98]"
                >
                  <FileText className="text-emerald-600" size={52} aria-hidden />
                  <span className="block text-center">
                    <span className="block text-3xl font-bold leading-tight">{t('home.quickQuoteTitle')}</span>
                    <span className="mt-1 block whitespace-pre-line text-sm font-medium leading-snug text-slate-500">
                      {itemCount > 0
                        ? `₪${totalWithVAT.toLocaleString(dateLocale)}`
                        : t('home.quickQuoteCardHint')}
                    </span>
                  </span>
                </Link>
              </div>
            </section>

            <section className="mt-8 px-4">
              <div className="rounded-[28px] bg-white px-4 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] ring-1 ring-blue-100">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">{t('home.tradesSection')}</h2>
              {showCategorySpotlight ? (
                <div className="mb-3.5 mt-1">
                  <p className="text-sm leading-relaxed text-slate-600">{t('spotlight.homeQuiet')}</p>
                  <button
                    type="button"
                    onClick={() => dismissPage('home')}
                    className="mt-1.5 text-sm font-semibold text-blue-800"
                  >
                    {t('spotlight.gotIt')}
                  </button>
                </div>
              ) : (
                (showStarterTrades || visibleTrades.length !== 1) && (
                  <p className="mb-3.5 mt-1 text-sm leading-snug text-slate-500">{t('home.tradesFullHint')}</p>
                )
              )}
              <div className={`flex flex-col gap-2 ${visibleTrades.length === 1 ? 'mt-3' : ''}`}>
                {visibleTrades.map((cat) => (
                  <TradeHomeRow
                    key={cat.id}
                    cat={cat}
                    label={displayName(cat)}
                    lead={visibleTrades.length === 1}
                    onClick={() => {
                      if (showCategorySpotlight) dismissPage('home');
                    }}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setEditingTrades(true)}
                  className="mt-1 flex w-full items-center justify-center gap-1.5 py-2 text-sm font-semibold text-blue-800"
                >
                  <Plus size={16} aria-hidden />
                  {t('home.moreTrades')}
                </button>
              </div>
              </div>
            </section>

            <div className="px-4">
            <SearchBox
              search={search}
              setSearch={setSearch}
              showResults={search.trim().length > 0}
              searchResults={searchResults}
              onPick={(href) => {
                router.push(href);
                setSearch('');
              }}
            />

            {historyLoaded && recentQuotes.length > 0 && (
              <section className="mt-7">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-medium text-slate-500">{t('home.pastQuotes')}</h2>
                  <Link href="/quotes" className="text-sm font-semibold text-blue-800">
                    {t('home.allQuotes')}
                  </Link>
                </div>
                <div className="flex flex-col gap-2">
                  {recentQuotes.map((quote) => {
                    const issued = quoteWasIssued(quote);
                    return (
                    <div
                      key={quote.id}
                      className="flex items-center gap-1 rounded-full bg-white/90 py-1 pe-1.5 ps-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-white"
                    >
                      <button
                        type="button"
                        onClick={() => (issued ? void downloadIssuedQuote(quote) : copyQuoteToCart(quote))}
                        className="flex min-w-0 flex-1 items-center gap-3 py-2 text-right active:opacity-70"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-900">
                            {quote.customerName?.trim() || t('home.pastQuoteUntitled')}
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-500">
                            {downloadingId === quote.id
                              ? t('profile.downloading')
                              : new Date(quote.createdAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                          ₪{quote.totalWithVAT.toLocaleString(dateLocale)}
                        </span>
                      </button>
                      {issued && (
                        <button
                          type="button"
                          onClick={() => copyQuoteToCart(quote)}
                          className="shrink-0 rounded-full bg-[#f3f6fb] px-3 py-2 text-xs font-semibold text-slate-700"
                        >
                          {t('profile.duplicate')}
                        </button>
                      )}
                    </div>
                    );
                  })}
                </div>
              </section>
            )}

            <div className="mt-8 flex flex-col gap-4 rounded-[36px] bg-white px-5 py-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] ring-1 ring-white">
              <Link href="/profile" className="flex items-center gap-3 active:opacity-70">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-800 text-lg font-semibold text-white">
                  {user ? greetingName.slice(0, 1) : <User size={22} aria-hidden />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-bold leading-tight text-slate-900">{t('header.profile')}</span>
                  <span className="mt-1 block text-sm font-medium text-slate-500">{t('home.personalHint')}</span>
                </span>
                <ChevronLeft className="shrink-0 text-slate-300" size={22} aria-hidden />
              </Link>
              <span style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {(
                  [
                    { icon: User, label: t('profile.details'), hint: t('profile.detailsShort'), href: '/profile?view=details' },
                    { icon: Users, label: t('profile.navCustomers'), hint: t('home.customersPocket'), href: '/customers' },
                    { icon: Settings, label: t('profile.settings'), hint: t('profile.settingsShort'), href: '/profile?view=settings' },
                  ] as const
                ).map(({ icon: Icon, label, hint, href }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex flex-col items-center gap-1 rounded-[22px] bg-[#f3f6fb] px-2 py-3 text-center active:opacity-70"
                  >
                    <Icon className="text-slate-500" size={18} aria-hidden />
                    <span className="text-xs font-semibold text-slate-700">{label}</span>
                    <span className="text-[11px] font-medium leading-snug text-slate-500">{hint}</span>
                  </Link>
                ))}
              </span>
            </div>
            </div>
          </>
        )}
      </div>

    </main>
  );
}

function quickQuoteHref(work?: string) {
  const name = work?.trim().slice(0, 60) ?? '';
  if (!name) return '/quick-quote';
  return `/quick-quote?work=${encodeURIComponent(name)}`;
}

function TradeHomeRow({
  cat,
  label,
  lead,
  onClick,
}: {
  cat: Category;
  label: string;
  lead: boolean;
  onClick: () => void;
}) {
  const { t } = useLanguage();
  const Icon = categoryIcons[cat.id] ?? Wrench;
  return (
    <Link
      href={`/category/${cat.id}`}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-[22px] bg-[#f3f6fb] pe-3 ps-2.5 active:scale-[0.99] ${lead ? 'py-3.5' : 'py-2.5'}`}
    >
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${tradeTone(cat.id)}`}>
        {isCustomCategoryId(cat.id) && cat.icon ? (
          <span className="text-xl leading-none" aria-hidden>
            {cat.icon}
          </span>
        ) : (
          <Icon size={20} strokeWidth={1.75} aria-hidden />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-semibold text-slate-900">{label}</span>
        {lead && (
          <span className="mt-0.5 block text-sm text-slate-500">
            {isCustomCategoryId(cat.id) ? t('home.ownTradeHint') : t('home.tradeRowHint')}
          </span>
        )}
      </span>
      <ChevronLeft className="shrink-0 text-slate-300" size={20} aria-hidden />
    </Link>
  );
}

function TradeFace({
  cat,
  label,
  row = false,
  pill = false,
}: {
  cat: Category;
  label: string;
  row?: boolean;
  pill?: boolean;
}) {
  const Icon = categoryIcons[cat.id] ?? Wrench;
  return (
    <>
      <span className={`flex shrink-0 items-center justify-center rounded-full ${pill ? 'size-9' : 'size-11'} ${tradeTone(cat.id)}`}>
        {isCustomCategoryId(cat.id) && cat.icon ? (
          <span className="text-xl leading-none" aria-hidden>
            {cat.icon}
          </span>
        ) : (
          <Icon size={pill ? 16 : 22} strokeWidth={1.75} aria-hidden />
        )}
      </span>
      <span className={pill || row ? 'min-w-0 flex-1 truncate text-start text-sm font-medium text-slate-900' : 'line-clamp-2 text-[13px] font-medium leading-tight text-stone-800'}>
        {label}
      </span>
    </>
  );
}

function TradePicker({
  trades,
  projects,
  custom,
  initialIds,
  isEdit,
  displayName,
  onSave,
  onAddProfession,
  onSkip,
  onCancel,
}: {
  trades: Category[];
  projects: Category[];
  custom: Category[];
  initialIds: string[];
  isEdit: boolean;
  displayName: (cat: Category) => string;
  onSave: (ids: string[], close?: boolean) => void;
  onAddProfession: (name: string) => Promise<boolean>;
  onSkip: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const { t, dir } = useLanguage();
  const [picked, setPicked] = useState<string[]>(() => {
    const ids = new Set(initialIds);
    for (const cat of custom) ids.add(cat.id);
    return [...ids];
  });
  const [query, setQuery] = useState('');
  const [ownName, setOwnName] = useState('');
  const [ownTouched, setOwnTouched] = useState(false);
  const [adding, setAdding] = useState(false);

  const featured = FEATURED_TRADE_IDS.map((id) => trades.find((cat) => cat.id === id)).filter(
    (cat): cat is Category => Boolean(cat),
  );
  const featuredSet = new Set(featured.map((cat) => cat.id));
  const rest = [...trades.filter((cat) => !featuredSet.has(cat.id)), ...projects];
  const list = [...featured, ...rest];
  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const matches = searching
    ? [...custom, ...trades, ...projects].filter((cat) => {
        const name = displayName(cat).toLowerCase();
        return name.includes(q) || cat.name.toLowerCase().includes(q);
      })
    : null;
  const quoteHref = quickQuoteHref(query);
  const suggestedOwn = searching && matches && matches.length === 0 ? query.trim() : '';
  const ownValue = ownTouched ? ownName : suggestedOwn;

  const toggle = (id: string) => {
    setPicked((curr) => {
      const adding = !curr.includes(id);
      const next = adding ? [...curr, id] : curr.filter((x) => x !== id);
      if (isEdit) onSave(next, adding);
      return next;
    });
  };

  const tile = (cat: Category) => {
    const on = picked.includes(cat.id);
    if (!isEdit) {
      return (
        <button
          key={cat.id}
          type="button"
          onClick={() => toggle(cat.id)}
          aria-pressed={on}
          className={`${tileClass} ${on ? 'border-blue-800 ring-2 ring-blue-800' : ''}`}
        >
          <TradeFace cat={cat} label={displayName(cat)} />
        </button>
      );
    }
    return (
      <div key={cat.id} className="flex flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <button
          type="button"
          onClick={() => router.push(`/category/${cat.id}`)}
          className="flex flex-col items-center gap-2.5 px-3 pb-2 pt-4 text-center active:opacity-70"
        >
          <TradeFace cat={cat} label={displayName(cat)} />
        </button>
        <button
          type="button"
          aria-pressed={on}
          onClick={() => toggle(cat.id)}
          className={`mx-2 mb-2 flex h-9 items-center justify-center gap-1 rounded-full text-xs font-semibold ${on ? 'bg-blue-800 text-white' : 'bg-[#f3f6fb] text-slate-600'}`}
        >
          <Star size={13} className={on ? 'fill-white text-white' : 'text-slate-400'} aria-hidden />
          {on ? t('home.pickOnHome') : t('home.pickAddHome')}
        </button>
      </div>
    );
  };

  return (
    <div>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="mb-4 text-sm font-medium text-stone-500"
        >
          {t('home.pickBack')}
        </button>
      )}
      <h2 className="text-[1.85rem] font-semibold leading-[1.2] tracking-tight text-stone-900">{t('home.pickTitle')}</h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-500">
        {isEdit ? t('home.pickEditSubtitle') : t('home.pickSubtitle')}
      </p>

      <div className="sticky top-0 z-10 -mx-5 mt-4 bg-[#f3f6fb] px-5 pb-3 pt-1">
      <label className="relative block">
        <span className="sr-only">{t('home.pickSearchLabel')}</span>
        <Search
          className="pointer-events-none absolute end-4 top-1/2 size-5 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('home.pickSearchPlaceholder')}
          className="w-full rounded-full border border-white bg-white py-3.5 pe-12 ps-4 text-sm text-slate-900 shadow-[0_8px_24px_rgba(15,23,42,0.06)] placeholder:text-slate-400 focus:border-blue-700 focus:outline-none"
          dir={dir}
          autoComplete="off"
        />
      </label>
      </div>

      {searching && matches && matches.length === 0 ? (
        <p className="mt-4 text-center text-sm leading-relaxed text-slate-500">{t('home.pickNoTrade')}</p>
      ) : (
        <div className="mt-3" style={isEdit ? choiceGridStyle : tradeGridStyle}>
          {(searching ? matches ?? [] : [...custom, ...list]).map(tile)}
        </div>
      )}

      <form
        className="mt-6"
        onSubmit={(e) => {
          e.preventDefault();
          const name = ownValue.trim();
          if (!name || adding) return;
          setAdding(true);
          void onAddProfession(name).then((ok) => {
            setAdding(false);
            if (!ok) return;
            setOwnName('');
            setOwnTouched(false);
            setQuery('');
            onCancel?.();
          });
        }}
      >
        <p className="text-sm font-semibold text-slate-900">{t('home.pickOwnTitle')}</p>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={ownValue}
            onChange={(e) => {
              setOwnTouched(true);
              setOwnName(e.target.value);
            }}
            placeholder={t('home.pickOwnPlaceholder')}
            maxLength={60}
            dir={dir}
            className="min-w-0 flex-1 rounded-full border border-white bg-white px-4 py-3 text-sm text-slate-900 shadow-[0_8px_24px_rgba(15,23,42,0.06)] placeholder:text-slate-400 focus:border-blue-700 focus:outline-none"
          />
          <button
            type="submit"
            disabled={adding}
            className="shrink-0 rounded-full bg-blue-800 px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {t('home.pickOwnAdd')}
          </button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">{t('home.pickOwnHint')}</p>
        <Link href={quoteHref} className="mt-2 inline-block text-sm font-semibold text-blue-800">
          {t('home.pickOwnQuote')}
        </Link>
      </form>

      {!isEdit && (
        <Button
          type="button"
          disabled={picked.length === 0}
          onClick={() => onSave(picked)}
          className={cn(actionClass, 'mt-8')}
        >
          {t('home.pickContinue')}
        </Button>
      )}
      {!isEdit && (
        <button
          type="button"
          onClick={onSkip}
          className="mt-3 w-full py-2 text-sm font-medium text-stone-500"
        >
          {t('home.pickSkip')}
        </button>
      )}
    </div>
  );
}

function SearchBox({
  search,
  setSearch,
  showResults,
  searchResults,
  onPick,
}: {
  search: string;
  setSearch: (value: string) => void;
  showResults: boolean;
  searchResults: SearchResult[];
  onPick: (href: string) => void;
}) {
  const { t, dir } = useLanguage();
  const missedTradeHref = quickQuoteHref(search);

  return (
    <div className="relative mt-4">
      <label htmlFor="home-search" className="sr-only">
        {t('home.searchLabel')}
      </label>
      <Search
        className="pointer-events-none absolute end-4 top-1/2 size-5 -translate-y-1/2 text-stone-400"
        aria-hidden
      />
      <input
        id="home-search"
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('home.searchPlaceholder')}
        className="w-full rounded-full border border-white bg-white/90 py-3.5 pe-12 ps-4 text-sm text-slate-900 shadow-[0_8px_24px_rgba(15,23,42,0.06)] placeholder:text-slate-400 focus:border-blue-700 focus:outline-none"
        dir={dir}
        autoComplete="off"
      />
      {showResults && (
        <div className="absolute z-20 top-full mt-2 w-full bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {searchResults.length > 0 ? (
            <>
              <ul className="max-h-72 overflow-y-auto py-1">
                {searchResults.map((result) => (
                  <li key={`${result.type}-${result.categoryId}-${result.serviceId ?? 'cat'}`}>
                    <button
                      type="button"
                      onClick={() => onPick(result.href)}
                      className="w-full text-right px-4 py-3 hover:bg-slate-50 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">
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
              <Link
                href={missedTradeHref}
                className="flex items-center justify-center gap-1.5 border-t border-slate-100 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-slate-50"
              >
                <Plus size={15} />
                {t('home.pickAddTitle')}
              </Link>
            </>
          ) : (
            <div className="px-4 py-4 space-y-3">
              <p className="text-sm text-slate-600 text-center leading-relaxed">{t('home.pickNoTrade')}</p>
              <Link
                href={missedTradeHref}
                className="flex items-center justify-center w-full px-4 py-3 rounded-xl bg-blue-800 text-white font-bold text-sm"
              >
                {t('home.noResultsQuickQuote')}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
