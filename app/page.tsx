'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  SPOTLIGHT_SUGGESTED_HOME_CATEGORY_ID,
  SPOTLIGHT_TARGET_CLASS,
} from '@/lib/spotlight-onboarding';
import { useSpotlightOnboarding } from './hooks/useSpotlightOnboarding';
import SpotlightOverlay from './components/onboarding/SpotlightOverlay';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';
import { recordProductMetric } from '@/lib/product-metrics-client';
import {
  FEATURED_TRADE_IDS,
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
  const { getMergedServices, customCategories } = useCustomCatalog();
  const { shouldShow, dismissPage } = useSpotlightOnboarding();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const spotlightRef = useRef<HTMLAnchorElement>(null);
  const [interests, setInterests] = useState<TradeInterests | null | undefined>(undefined);
  const [editingTrades, setEditingTrades] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const showCategorySpotlight = shouldShow('home');
  const suggestedCategoryId = SPOTLIGHT_SUGGESTED_HOME_CATEGORY_ID;
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

  const catalogOff = Boolean(interests?.catalogOff) && selectedIds.length === 0;
  const needsPick = interests === null || editingTrades;

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
    if (catalogOff) return myProfessionCategories;
    const picked = selectedIds
      .map((id) => catById.get(id))
      .filter((cat): cat is Category => {
        if (!cat) return false;
        return !isCustomCategoryId(cat.id);
      });
    return [...myProfessionCategories, ...picked];
  }, [selectedIds, catById, myProfessionCategories, catalogOff]);

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
            href: `/category/${cat.id}/${svc.id}`,
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
    <main className={`bg-[#f3f6fb] ${!needsPick && itemCount > 0 ? 'pb-28' : 'pb-8'}`} dir={dir}>
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
            onSkip={() => saveInterests({ ids: [], catalogOff: true })}
            onCancel={editingTrades ? () => setEditingTrades(false) : undefined}
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
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">{t('home.tradesSection')}</h2>
              <p className="mb-3.5 mt-1 text-sm leading-snug text-slate-600">{t('home.tradesFullHint')}</p>
              <div className="flex flex-wrap gap-2">
                {visibleTrades.map((cat) => {
                  const isSpotlight = showCategorySpotlight && cat.id === suggestedCategoryId;
                  return (
                    <Link
                      key={cat.id}
                      ref={isSpotlight ? spotlightRef : undefined}
                      href={`/category/${cat.id}`}
                      onClick={() => {
                        if (showCategorySpotlight) dismissPage('home');
                      }}
                      className={`inline-flex items-center gap-2 rounded-full bg-[#f3f6fb] py-2 pe-4 ps-1.5 active:scale-[0.98] ${isSpotlight ? SPOTLIGHT_TARGET_CLASS : ''}`}
                    >
                      <TradeFace cat={cat} label={displayName(cat)} pill />
                    </Link>
                  );
                })}
                <MoreTradesButton onClick={() => setEditingTrades(true)} label={t('home.moreTrades')} pill />
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

      {!needsPick && (
        <SpotlightOverlay
          open={showCategorySpotlight && visibleTrades.some((cat) => cat.id === suggestedCategoryId)}
          targetRef={spotlightRef}
          title={t('spotlight.homeTitle')}
          body={t('spotlight.homeBody')}
          skipLabel={t('spotlight.skip')}
          step={1}
          onDismiss={() => dismissPage('home')}
        />
      )}
    </main>
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
      <span className={pill || row ? 'truncate text-sm font-medium text-slate-900' : 'line-clamp-2 text-[13px] font-medium leading-tight text-stone-800'}>
        {label}
      </span>
    </>
  );
}

function MoreTradesButton({
  onClick,
  label,
  pill = false,
}: {
  onClick: () => void;
  label: string;
  pill?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        pill
          ? 'inline-flex items-center gap-2 rounded-full bg-[#f3f6fb] py-2 pe-4 ps-1.5 text-slate-800 active:scale-[0.98]'
          : tileClass
      }
    >
      <span className={`flex shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-800 ${pill ? 'size-9' : 'size-11'}`}>
        <Plus size={pill ? 16 : 20} aria-hidden />
      </span>
      <span className={pill ? 'text-sm font-medium' : 'line-clamp-2 text-[13px] font-medium leading-tight text-slate-800'}>
        {label}
      </span>
    </button>
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
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState('');

  const featured = FEATURED_TRADE_IDS.map((id) => trades.find((cat) => cat.id === id)).filter(
    (cat): cat is Category => Boolean(cat),
  );
  const featuredSet = new Set(featured.map((cat) => cat.id));
  const rest = [...trades.filter((cat) => !featuredSet.has(cat.id)), ...projects];
  const list = showAll ? [...featured, ...rest] : featured;
  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const matches = searching
    ? [...custom, ...trades].filter((cat) => {
        const name = displayName(cat).toLowerCase();
        return name.includes(q) || cat.name.toLowerCase().includes(q);
      })
    : null;
  const addHref = q
    ? `/request-profession?name=${encodeURIComponent(query.trim().slice(0, 60))}`
    : '/request-profession';

  const toggle = (id: string) => {
    setPicked((curr) => {
      const next = curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id];
      if (isEdit) onSave(next, false);
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
      <div key={cat.id} className={`${tileClass} relative ${on ? 'ring-2 ring-blue-800' : ''}`}>
        <button
          type="button"
          onClick={() => router.push(`/category/${cat.id}`)}
          className="flex w-full flex-col items-center justify-center gap-2.5"
        >
          <TradeFace cat={cat} label={displayName(cat)} />
        </button>
        <button
          type="button"
          aria-pressed={on}
          aria-label={on ? t('home.pickFavoriteRemove') : t('home.pickFavoriteAdd')}
          onClick={() => toggle(cat.id)}
          className="absolute top-2 start-2 flex size-8 items-center justify-center rounded-full bg-white/90"
        >
          <Star size={16} className={on ? 'fill-blue-800 text-blue-800' : 'text-slate-300'} aria-hidden />
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

      <label className="relative mt-5 block">
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

      {searching && matches && matches.length === 0 ? (
        <p className="mt-4 text-center text-sm text-slate-500">{t('home.pickNoTrade')}</p>
      ) : (
        <div className="mt-4" style={tradeGridStyle}>
          {(matches ?? [...custom, ...list]).map(tile)}
        </div>
      )}

      {!searching && rest.length > 0 && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-4 text-sm font-semibold text-blue-800"
        >
          {showAll ? t('home.pickLess') : t('home.pickMore')}
        </button>
      )}

      <Link
        href={addHref}
        className="mt-4 flex items-center gap-3 rounded-[28px] bg-white px-4 py-3.5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] ring-1 ring-white active:scale-[0.99]"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-800">
          <Plus size={20} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold leading-tight text-slate-900">{t('home.pickAddTitle')}</span>
          <span className="mt-0.5 block text-sm text-slate-500">{t('home.pickAddHint')}</span>
        </span>
      </Link>

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
      <button
        type="button"
        onClick={onSkip}
        className="mt-3 w-full py-2 text-sm font-medium text-stone-500"
      >
        {t('home.pickSkip')}
      </button>
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
  const addProfessionHref = search.trim()
    ? `/request-profession?name=${encodeURIComponent(search.trim().slice(0, 60))}`
    : '/request-profession';

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
                href={addProfessionHref}
                className="flex items-center justify-center gap-1.5 border-t border-slate-100 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-slate-50"
              >
                <Plus size={15} />
                {t('home.noResultsAddProfession')}
              </Link>
            </>
          ) : (
            <div className="px-4 py-4 space-y-3">
              <p className="text-sm text-slate-500 text-center">{t('home.noResults')}</p>
              <Link
                href="/quick-quote"
                className="flex items-center justify-center w-full px-4 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700"
              >
                {t('home.noResultsQuickQuote')}
              </Link>
              <Link
                href={addProfessionHref}
                className="flex items-center justify-center gap-1.5 w-full px-4 py-2 text-sm font-medium text-slate-600"
              >
                <Plus size={15} />
                {t('home.noResultsAddProfession')}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
