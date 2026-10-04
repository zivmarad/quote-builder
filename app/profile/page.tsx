'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProfile } from '../contexts/ProfileContext';
import { useQuoteHistory, type QuoteWorkflowStatus, type SavedQuote } from '../contexts/QuoteHistoryContext';
import { getQuoteListBadge } from '../../lib/quote-badge';
import { useQuoteBasket } from '../contexts/QuoteBasketContext';
import { useSettings } from '../contexts/SettingsContext';
import { getQuotePreviewHtml } from '../components/utils/quotePreview';
import RequireAuth from '../components/RequireAuth';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePriceOverrides } from '../contexts/PriceOverridesContext';
import { useCustomCatalog } from '../contexts/CustomCatalogContext';
import { useCustomers } from '../contexts/CustomersContext';
import { getOrderedCategories } from '../service/services';
import { getServiceDisplayName, isCustomServiceId } from '../../lib/custom-catalog-types';
import { getDrafts, deleteDraft, syncDraftsForLoggedInUser, type QuoteDraft } from '../../lib/drafts-storage';
import { ArrowRight, UserCircle, Settings, ChevronLeft, Download, Trash2, Copy, DollarSign, KeyRound, Eye, ChevronDown, Check, Loader2, Smartphone, Plus, Search, Users } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import InstallManualGuide from '../components/InstallManualGuide';
import { markAppInstalled } from '../../lib/install-utils';
import { recordProductMetric } from '../../lib/product-metrics-client';

const PENDING_DRAFT_KEY = 'quoteBuilder_pendingDraft';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type DeskView = 'desk' | 'details' | 'settings' | 'prices';

function viewFromParam(value: string | null): DeskView {
  if (value === 'details' || value === 'settings' || value === 'prices') return value;
  return 'desk';
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);


const quoteStatusKeys: Record<QuoteWorkflowStatus, string> = {
  draft: 'profile.quoteStatusDraft',
  sent: 'profile.quoteStatusSent',
  approved: 'profile.quoteStatusApproved',
  paid: 'profile.quoteStatusPaid',
};

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, setProfile, syncStatus } = useProfile();
  const { quotes, deleteQuote, updateQuoteStatus } = useQuoteHistory();
  const { loadBasket } = useQuoteBasket();
  const { defaultQuoteTitle, nextQuoteNumber, validityDays, vatRate, setDefaultQuoteTitle, setNextQuoteNumber, setValidityDays, setVatRate } = useSettings();
  const { getBasePrice, setBasePrice } = usePriceOverrides();
  const { getMergedServices, customCategories } = useCustomCatalog();
  const { customers } = useCustomers();
  const { user: authUser, changePassword } = useAuth();
  const { t, dir } = useLanguage();
  const quoteStatusLabels: Record<QuoteWorkflowStatus, string> = { draft: t(quoteStatusKeys.draft), sent: t(quoteStatusKeys.sent), approved: t(quoteStatusKeys.approved), paid: t(quoteStatusKeys.paid) };
  const quoteBadgeLabels = {
    downloaded: t('profile.statusDownloadedToDevice'),
    sent: t('profile.quoteStatusSent'),
    draft: t('profile.quoteStatusDraft'),
    approved: t('profile.quoteStatusApproved'),
    paid: t('profile.quoteStatusPaid'),
  };
  const [view, setView] = useState<DeskView>(() => viewFromParam(searchParams.get('view')));
  const [showAllWork, setShowAllWork] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [previewQuoteId, setPreviewQuoteId] = useState<string | null>(null);
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState(false);
  const saveToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [installLoading, setInstallLoading] = useState(false);
  const [drafts, setDrafts] = useState<QuoteDraft[]>([]);
  const [deleteDraftId, setDeleteDraftId] = useState<string | null>(null);
  const [deleteQuoteId, setDeleteQuoteId] = useState<string | null>(null);
  const [quoteSearch, setQuoteSearch] = useState('');
  const [workPage, setWorkPage] = useState(1);
  const [openQuoteId, setOpenQuoteId] = useState<string | null>(null);
  const WORK_PAGE_SIZE = 12;

  const sortedQuotes = useMemo(
    () => [...quotes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [quotes]
  );
  const filteredQuotes = useMemo(() => {
    const q = quoteSearch.trim().toLowerCase();
    if (!q) return sortedQuotes;
    return sortedQuotes.filter((quote) => {
      const haystack = [
        quote.customerName,
        quote.customerPhone,
        quote.customerEmail,
        quote.customerAddress,
        quote.customerCompanyId,
        quote.notes,
        quote.quoteNumber != null ? String(quote.quoteNumber) : '',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [sortedQuotes, quoteSearch]);
  const sortedDrafts = useMemo(
    () => [...drafts].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()),
    [drafts]
  );
  const filteredDrafts = useMemo(() => {
    const q = quoteSearch.trim().toLowerCase();
    if (!q) return sortedDrafts;
    return sortedDrafts.filter((draft) => {
      const haystack = [draft.name, draft.customerName, draft.customerPhone, draft.customerEmail, draft.notes]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [sortedDrafts, quoteSearch]);
  const workRows = useMemo(() => {
    const rows = [
      ...filteredQuotes.map((quote) => ({
        kind: 'quote' as const,
        id: quote.id,
        at: new Date(quote.createdAt).getTime(),
        quote,
      })),
      ...filteredDrafts.map((draft) => ({
        kind: 'draft' as const,
        id: draft.id,
        at: new Date(draft.savedAt).getTime(),
        draft,
      })),
    ];
    return rows.sort((a, b) => b.at - a.at);
  }, [filteredQuotes, filteredDrafts]);
  const workTotalPages = Math.max(1, Math.ceil(workRows.length / WORK_PAGE_SIZE));
  const pagedWork = useMemo(() => {
    const start = (workPage - 1) * WORK_PAGE_SIZE;
    return workRows.slice(start, start + WORK_PAGE_SIZE);
  }, [workRows, workPage]);
  const sentCount = useMemo(
    () => quotes.filter((quote) => {
      const workflow = quote.quoteStatus ?? 'draft';
      if (workflow === 'approved' || workflow === 'paid') return false;
      return quote.status === 'whatsapp' || quote.status === 'email' || workflow === 'sent';
    }).length,
    [quotes]
  );
  const approvedCount = useMemo(
    () => quotes.filter((quote) => quote.quoteStatus === 'approved').length,
    [quotes]
  );
  const businessTitle = profile.businessName?.trim() || profile.contactName?.trim() || t('profile.deskFallback');
  const attentionRows = workRows.filter((row) => {
    if (row.kind === 'draft') return true;
    const workflow = row.quote.quoteStatus ?? 'draft';
    return workflow === 'sent' || workflow === 'approved';
  });

  useEffect(() => {
    setWorkPage(1);
  }, [quoteSearch]);

  useEffect(() => {
    setWorkPage((prev) => Math.min(prev, workTotalPages));
  }, [workTotalPages]);

  useEffect(() => {
    setOpenQuoteId((id) => {
      if (!id) return null;
      const start = (workPage - 1) * WORK_PAGE_SIZE;
      return workRows.slice(start, start + WORK_PAGE_SIZE).some((row) => row.kind === 'quote' && row.id === id) ? id : null;
    });
  }, [workPage, workRows]);

  useEffect(() => () => { if (saveToastTimeoutRef.current) clearTimeout(saveToastTimeoutRef.current); }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const uid = authUser?.id ?? null;
    if (uid) {
      syncDraftsForLoggedInUser(uid).then(setDrafts);
    } else {
      getDrafts(null).then(setDrafts);
    }
  }, [authUser?.id]);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    const appInstalled = () => {
      markAppInstalled();
      setInstallSuccess(true);
    };
    window.addEventListener('appinstalled', appInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', appInstalled);
    };
  }, []);

  const showSaveToast = () => {
    if (saveToastTimeoutRef.current) clearTimeout(saveToastTimeoutRef.current);
    setSaveToast(true);
    saveToastTimeoutRef.current = setTimeout(() => {
      setSaveToast(false);
      saveToastTimeoutRef.current = null;
    }, 2500);
  };

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    setInstallLoading(true);
    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        markAppInstalled();
        setInstallSuccess(true);
      }
    } finally {
      setInstallLoading(false);
    }
  };

  const handleDuplicateQuote = (quoteId: string) => {
    const quote = quotes.find((q) => q.id === quoteId);
    if (!quote?.items?.length) return;
    loadBasket(quote.items);
    router.push('/cart');
  };

  const handleLoadDraft = (draft: QuoteDraft) => {
    sessionStorage.setItem(PENDING_DRAFT_KEY, JSON.stringify({
      customerName: draft.customerName || '',
      customerPhone: draft.customerPhone || '',
      customerEmail: draft.customerEmail || '',
      customerAddress: draft.customerAddress || '',
      customerCompanyId: draft.customerCompanyId || '',
      notes: draft.notes || '',
      discountType: draft.discount?.type,
      discountValue: draft.discount?.value != null ? String(draft.discount.value) : '',
    }));
    loadBasket(draft.items, draft.discount);
    router.push('/cart');
  };

  const handleDeleteDraft = async (draftId: string) => {
    await deleteDraft(authUser?.id ?? null, draftId);
    setDrafts((prev) => prev.filter((d) => d.id !== draftId));
  };

  const formatDraftDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getDraftSummary = (d: QuoteDraft) => {
    const names = d.items.slice(0, 2).map((i) => i.name);
    return names.length > 0 ? names.join(', ') : '—';
  };

  const getDraftTotal = (d: QuoteDraft) => {
    return d.items.reduce((sum, item) => {
      const extras = item.extras?.reduce((s, e) => s + e.price, 0) ?? 0;
      return sum + (item.overridePrice ?? item.basePrice + extras);
    }, 0);
  };

  const handleDeleteQuote = (quoteId: string) => {
    deleteQuote(quoteId);
  };

  const getQuoteSnapshot = (quote: SavedQuote) => {
    const raw = ((quote as unknown as { quote_data?: SavedQuote['quoteData'] }).quote_data ?? quote.quoteData) as SavedQuote['quoteData'] | undefined;
    return raw;
  };

  const handleDownloadQuote = async (quoteId: string) => {
    const quote = quotes.find((q) => q.id === quoteId);
    if (!quote) return;
    const snap = getQuoteSnapshot(quote);
    setDownloadingId(quoteId);
    try {
      const { generateQuotePDFAsBlob } = await import('../components/utils/pdfExport');
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
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hatzaat-mechir-${quote.createdAt.slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      recordProductMetric('quote_pdf');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const input = e.target;
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = async () => {
        const max = 220;
        let w = img.width;
        let h = img.height;
        if (w > max || h > max) {
          if (w > h) {
            h = Math.round((h * max) / w);
            w = max;
          } else {
            w = Math.round((w * max) / h);
            h = max;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        let compressed = dataUrl;
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          try {
            compressed = canvas.toDataURL('image/jpeg', 0.78);
          } catch {
            compressed = dataUrl;
          }
        }

        if (authUser?.id) {
          setLogoUploading(true);
          try {
            const res = await fetch('/api/upload/profile-logo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ dataUrl: compressed }),
            });
            const j = (await res.json()) as { ok?: boolean; url?: string };
            if (res.ok && j?.ok && typeof j.url === 'string' && j.url.startsWith('http')) {
              setProfile({ logo: j.url });
            } else {
              setProfile({ logo: compressed });
            }
          } catch {
            setProfile({ logo: compressed });
          } finally {
            setLogoUploading(false);
          }
        } else {
          setProfile({ logo: compressed });
        }
        input.value = '';
      };
      img.onerror = () => {
        setProfile({ logo: dataUrl });
        input.value = '';
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    if (newPassword !== confirmNewPassword) {
      setPasswordError(t('profile.passwordMismatch'));
      return;
    }
    if (newPassword.length < 4) {
      setPasswordError(t('profile.passwordMinLength'));
      return;
    }
    setPasswordLoading(true);
    try {
      const result = await changePassword(currentPassword, newPassword);
      if (result.ok) {
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else setPasswordError(result.error ?? t('profile.passwordChangeError'));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <RequireAuth>
    <main className="min-h-screen bg-[#f3f6fb] pb-12" dir={dir}>
      <div className="mx-auto max-w-md px-4 pt-4">
        {view === 'desk' ? (
          <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500">
            <ArrowRight size={18} /> {t('profile.backHome')}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              const next = view === 'prices' ? 'settings' : 'desk';
              setView(next);
              router.replace(next === 'desk' ? '/profile' : `/profile?view=${next}`);
            }}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500"
          >
            <ArrowRight size={18} /> {t('profile.backToDesk')}
          </button>
        )}

        {view === 'desk' && (
          <div id="profile-section-quotes">
            <section className="rounded-[28px] bg-white px-5 py-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-4">
                <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-slate-400 ring-1 ring-slate-200">
                  {profile.logo ? (
                    <img
                      src={profile.logo}
                      alt=""
                      className="size-full object-cover"
                      {...(profile.logo.startsWith('http') ? { crossOrigin: 'anonymous' as const } : {})}
                    />
                  ) : (
                    <UserCircle size={34} aria-hidden />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-400">{t('profile.area')}</p>
                  <h1 className="truncate text-[1.65rem] font-semibold leading-tight tracking-tight text-slate-900">{businessTitle}</h1>
                  {profile.contactName?.trim() && profile.contactName.trim() !== businessTitle && (
                    <p className="mt-0.5 truncate text-sm text-slate-600">{profile.contactName.trim()}</p>
                  )}
                  {profile.phone?.trim() && (
                    <p className="mt-1 text-sm font-medium text-slate-500" dir="ltr">{profile.phone.trim()}</p>
                  )}
                </div>
              </div>
            </section>

            <div className="mt-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button type="button" onClick={() => setView('details')} className="flex min-h-[112px] flex-col items-start justify-between rounded-[24px] bg-white p-4 text-right shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
                <UserCircle className="text-blue-800" size={22} aria-hidden />
                <span>
                  <span className="block text-base font-semibold text-slate-900">{t('profile.details')}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-slate-500">{t('profile.detailsShort')}</span>
                </span>
              </button>
              <Link href="/customers" className="flex min-h-[112px] flex-col items-start justify-between rounded-[24px] bg-white p-4 text-right shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
                <Users className="text-blue-800" size={22} aria-hidden />
                <span>
                  <span className="block text-base font-semibold text-slate-900">{t('profile.recentCustomers')}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-slate-500">{customers.length > 0 ? `${customers.length}` : t('profile.customersNone')}</span>
                </span>
              </Link>
              <button type="button" onClick={() => setView('settings')} className="flex min-h-[112px] flex-col items-start justify-between rounded-[24px] bg-white p-4 text-right shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
                <Settings className="text-slate-600" size={22} aria-hidden />
                <span>
                  <span className="block text-base font-semibold text-slate-900">{t('profile.settings')}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-slate-500">{t('profile.settingsShort')}</span>
                </span>
              </button>
              <button type="button" onClick={() => setView('prices')} className="flex min-h-[112px] flex-col items-start justify-between rounded-[24px] bg-white p-4 text-right shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
                <DollarSign className="text-emerald-700" size={22} aria-hidden />
                <span>
                  <span className="block text-base font-semibold text-slate-900">{t('profile.myPrices')}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-slate-500">{t('profile.pricesShort')}</span>
                </span>
              </button>
            </div>

            <div className="mb-3 mt-8 flex items-end justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-700">
                {showAllWork ? t('profile.allWork') : t('profile.openWork')}
                {!showAllWork && attentionRows.length > 0 ? ` · ${attentionRows.length}` : ''}
              </h2>
              {workRows.length > 0 && (
                <button type="button" onClick={() => setShowAllWork((v) => !v)} className="text-sm font-semibold text-blue-800">
                  {showAllWork ? t('profile.hideWork') : t('profile.allWork')}
                </button>
              )}
            </div>
            {showAllWork && (
            <label className="relative mb-3 block">
              <span className="sr-only">{t('profile.quoteSearchPlaceholder')}</span>
              <Search className="pointer-events-none absolute end-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                type="search"
                value={quoteSearch}
                onChange={(e) => setQuoteSearch(e.target.value)}
                placeholder={t('profile.quoteSearchPlaceholder')}
                className="w-full rounded-full border border-white bg-white py-3.5 pe-12 ps-4 text-sm text-slate-900 shadow-[0_8px_24px_rgba(15,23,42,0.06)] placeholder:text-slate-400 focus:border-blue-700 focus:outline-none"
                dir={dir}
                autoComplete="off"
              />
            </label>
            )}

            {(showAllWork ? workRows : attentionRows).length === 0 ? (
              <p className="mt-3 rounded-[28px] bg-white px-4 py-8 text-center text-sm leading-relaxed text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                {t('profile.workEmpty')}
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {(showAllWork ? pagedWork : attentionRows.slice(0, 3)).map((row) => {
                  if (row.kind === 'draft') {
                    const d = row.draft;
                    return (
                      <li key={d.id} className="flex items-center gap-2 rounded-[28px] bg-white px-3 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                        <button type="button" onClick={() => handleLoadDraft(d)} className="min-w-0 flex-1 text-right">
                          <span className="block truncate font-semibold text-slate-900">{d.customerName?.trim() || d.name}</span>
                          <span className="mt-0.5 block text-xs text-slate-500">
                            {formatDraftDate(d.savedAt)} · {formatPrice(getDraftTotal(d))}
                          </span>
                        </button>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{t('profile.draftLabel')}</span>
                        <button
                          type="button"
                          onClick={() => setDeleteDraftId(d.id)}
                          className="shrink-0 rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title={t('profile.deleteDraft')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </li>
                    );
                  }
                  const q = row.quote;
                  const isOpen = openQuoteId === q.id;
                  const listBadge = getQuoteListBadge(q, quoteBadgeLabels);
                  const dateStr = new Date(q.createdAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
                  return (
                    <li key={q.id} className="overflow-hidden rounded-[28px] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => {
                          setOpenQuoteId((prev) => (prev === q.id ? null : q.id));
                          setStatusDropdownId(null);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-right"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-slate-900">
                            {q.customerName?.trim() || t('profile.noCustomerName')}
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-500">
                            {dateStr} · {formatPrice(q.totalWithVAT)}
                          </span>
                        </span>
                        <span className={`max-w-[6.5rem] shrink-0 truncate rounded-full px-2.5 py-1 text-xs font-semibold ${listBadge.colorClass}`}>
                          {listBadge.label}
                        </span>
                        <ChevronDown size={18} className={`shrink-0 text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
                      </button>
                      {isOpen && (
                        <div className="border-t border-slate-100 px-4 pb-4 pt-3">
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setStatusDropdownId(statusDropdownId === q.id ? null : q.id)}
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${listBadge.colorClass}`}
                            >
                              {listBadge.label}
                              <ChevronDown size={14} />
                            </button>
                            {statusDropdownId === q.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setStatusDropdownId(null)} aria-hidden />
                                <div className="absolute top-full z-50 mt-1 min-w-[120px] rounded-2xl border border-slate-100 bg-white py-1 shadow-lg">
                                  {(['draft', 'sent', 'approved', 'paid'] as const).map((st) => (
                                    <button
                                      key={st}
                                      type="button"
                                      onClick={() => {
                                        updateQuoteStatus(q.id, st);
                                        setStatusDropdownId(null);
                                      }}
                                      className={`block w-full px-3 py-2 text-right text-sm ${q.quoteStatus === st ? 'font-bold text-blue-700' : 'text-slate-700'}`}
                                    >
                                      {quoteStatusLabels[st]}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button type="button" onClick={() => setPreviewQuoteId(q.id)} className="inline-flex items-center gap-1.5 rounded-full bg-[#f3f6fb] px-3 py-2 text-sm font-semibold text-slate-700">
                              <Eye size={15} /> {t('profile.preview')}
                            </button>
                            <button type="button" onClick={() => handleDuplicateQuote(q.id)} className="inline-flex items-center gap-1.5 rounded-full bg-[#f3f6fb] px-3 py-2 text-sm font-semibold text-slate-700">
                              <Copy size={15} /> {t('profile.duplicate')}
                            </button>
                            <button type="button" onClick={() => handleDownloadQuote(q.id)} disabled={downloadingId === q.id} className="inline-flex items-center gap-1.5 rounded-full bg-blue-800 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
                              <Download size={15} /> {downloadingId === q.id ? t('profile.downloading') : t('profile.downloadPdf')}
                            </button>
                            <button type="button" onClick={() => setDeleteQuoteId(q.id)} className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" title={t('profile.deleteFromHistory')}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {showAllWork && workTotalPages > 1 && (
              <div className="mt-4 flex items-center justify-between gap-3">
                <button type="button" onClick={() => setWorkPage((p) => Math.max(1, p - 1))} disabled={workPage <= 1} className="rounded-full bg-white px-3 py-2 text-sm disabled:opacity-40">
                  {t('profile.paginationPrev')}
                </button>
                <span className="text-sm text-slate-500">{workPage} / {workTotalPages}</span>
                <button type="button" onClick={() => setWorkPage((p) => Math.min(workTotalPages, p + 1))} disabled={workPage >= workTotalPages} className="rounded-full bg-white px-3 py-2 text-sm disabled:opacity-40">
                  {t('profile.paginationNext')}
                </button>
              </div>
            )}

          </div>
        )}

        {view === 'details' && (
          <section>
            <h1 className="text-2xl font-semibold text-slate-900">{t('profile.details')}</h1>
            <p className="mt-1 text-sm text-slate-500">{t('profile.detailsSubtitle')}</p>
            {authUser?.email && (
              <div className="mt-4 rounded-[24px] bg-white px-4 py-3">
                <span className="block text-xs font-medium text-slate-500">{t('profile.accountEmailLabel')}</span>
                <span className="font-medium text-slate-800" dir="ltr">{authUser.email}</span>
              </div>
            )}
            <div className="mt-4">
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">{t('profile.logo')}</label>
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 ${logoUploading ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
                          onClick={() => !logoUploading && fileInputRef.current?.click()}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && !logoUploading && fileInputRef.current?.click()}
                        >
                          {logoUploading ? (
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" aria-hidden />
                          ) : profile.logo ? (
                            <img
                              src={profile.logo}
                              alt={t('profile.logo')}
                              className="w-full h-full object-contain"
                              {...(profile.logo.startsWith('http') ? { crossOrigin: 'anonymous' as const } : {})}
                            />
                          ) : (
                            <span className="text-slate-400 text-xs px-2">{t('profile.uploadLogo')}</span>
                          )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} disabled={logoUploading} className="hidden" />
                        <div>
                          <p className="text-slate-500 text-sm">{t('profile.uploadLogoHint')}</p>
                          {logoUploading && (
                            <p className="text-sm text-blue-600 mt-1 font-medium">{t('profile.logoUploading')}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="businessName" className="block text-sm font-bold text-slate-700 mb-2">{t('profile.businessName')}</label>
                      <input
                        id="businessName"
                        type="text"
                        value={profile.businessName}
                        onChange={(e) => setProfile({ businessName: e.target.value })}
                        onBlur={showSaveToast}
                        placeholder={t('profile.businessNamePlaceholder')}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="contactName" className="block text-sm font-bold text-slate-700 mb-2">{t('profile.contactName')}</label>
                      <input
                        id="contactName"
                        type="text"
                        value={profile.contactName ?? ''}
                        onChange={(e) => setProfile({ contactName: e.target.value || undefined })}
                        onBlur={showSaveToast}
                        placeholder={t('profile.contactNamePlaceholder')}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="companyId" className="block text-sm font-bold text-slate-700 mb-2">{t('profile.companyId')}</label>
                      <input
                        id="companyId"
                        type="text"
                        value={profile.companyId ?? ''}
                        onChange={(e) => setProfile({ companyId: e.target.value || undefined })}
                        onBlur={showSaveToast}
                        placeholder={t('profile.companyIdPlaceholder')}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-bold text-slate-700 mb-2">{t('profile.phone')}</label>
                      <input
                        id="phone"
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ phone: e.target.value })}
                        onBlur={showSaveToast}
                        placeholder={t('profile.phonePlaceholder')}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">{t('profile.email')}</label>
                      <input
                        id="email"
                        type="email"
                        value={profile.email ?? ''}
                        onChange={(e) => setProfile({ email: e.target.value || undefined })}
                        onBlur={showSaveToast}
                        placeholder={t('profile.emailPlaceholder')}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label htmlFor="address" className="block text-sm font-bold text-slate-700 mb-2">{t('profile.address')}</label>
                      <input
                        id="address"
                        type="text"
                        value={profile.address ?? ''}
                        onChange={(e) => setProfile({ address: e.target.value || undefined })}
                        onBlur={showSaveToast}
                        placeholder={t('profile.addressPlaceholder')}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-slate-500 text-sm pt-2">{t('profile.detailsAutoSave')}</p>
                    {syncStatus === 'saving' && (
                      <p className="text-blue-600 text-sm font-medium pt-2" role="status">{t('profile.saving')}</p>
                    )}
                    {syncStatus === 'saved' && (
                      <p className="text-green-600 text-sm font-medium pt-2" role="status">{t('profile.savedLocalAndServer')}</p>
                    )}
                    {syncStatus === 'error' && (
                      <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-sm font-medium mt-2" role="alert">
                        {t('profile.syncError')}
                      </p>
                    )}
                    <p className="text-slate-400 text-xs pt-3 mt-3 border-t border-slate-100">
                      {t('profile.detailsNote')}
                    </p>
                  </form>

            </div>
          </section>
        )}

        {view === 'settings' && (
          <section>
            <h1 className="text-2xl font-semibold text-slate-900">{t('profile.settingsTitle')}</h1>
            <p className="mt-1 mb-4 text-sm text-slate-500">{t('profile.settingsSubtitle')}</p>
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-5 max-w-md">
                    <div>
                      <label htmlFor="defaultQuoteTitle" className="block text-sm font-bold text-slate-700 mb-2">
                        {t('profile.defaultQuoteTitleLabel')}
                      </label>
                      <input
                        id="defaultQuoteTitle"
                        type="text"
                        value={defaultQuoteTitle}
                        onChange={(e) => setDefaultQuoteTitle(e.target.value)}
                        onBlur={showSaveToast}
                        placeholder={t('profile.defaultQuoteTitlePlaceholder')}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="nextQuoteNumber" className="block text-sm font-bold text-slate-700 mb-2">
                        {t('profile.nextQuoteNumberLabel')}
                      </label>
                      <input
                        id="nextQuoteNumber"
                        type="number"
                        min={1}
                        value={nextQuoteNumber}
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10);
                          if (!isNaN(n) && n >= 1) setNextQuoteNumber(n);
                        }}
                        onBlur={showSaveToast}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label htmlFor="validityDays" className="block text-sm font-bold text-slate-700 mb-2">
                        {t('profile.validityDaysLabel')}
                      </label>
                      <input
                        id="validityDays"
                        type="number"
                        min={1}
                        value={validityDays}
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10);
                          if (!isNaN(n) && n >= 1) setValidityDays(n);
                        }}
                        onBlur={showSaveToast}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        dir="ltr"
                      />
                      <p className="text-slate-500 text-xs mt-1">{t('profile.validityDaysHint')}</p>
                    </div>
                    <div>
                      <label htmlFor="vatRate" className="block text-sm font-bold text-slate-700 mb-2">
                        {t('profile.vatLabel')}
                      </label>
                      <select
                        id="vatRate"
                        value={vatRate}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          if (!isNaN(v) && v >= 0) setVatRate(v);
                        }}
                        onBlur={showSaveToast}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={0}>{t('profile.vatOptionExempt')}</option>
                        <option value={0.17}>{t('profile.vatOption17')}</option>
                        <option value={0.18}>{t('profile.vatOption18')}</option>
                      </select>
                      <p className="text-slate-500 text-xs mt-1">{t('profile.vatHint')}</p>
                    </div>
                    <p className="text-slate-500 text-sm pt-2">{t('profile.settingsAutoSave')}</p>
                  </form>

            <button
              type="button"
              onClick={() => setView('prices')}
              className="mt-4 flex w-full items-center gap-3 rounded-[28px] bg-white px-4 py-4 text-right shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <DollarSign size={20} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-slate-900">{t('profile.myPrices')}</span>
                <span className="mt-0.5 block text-sm text-slate-500">{t('profile.basePricesDesc')}</span>
              </span>
              <ChevronLeft className="shrink-0 text-slate-300" size={18} aria-hidden />
            </button>
            <div className="mt-8 space-y-8 text-slate-600">
                  <div className="mt-10 pt-8 border-t border-slate-200">
                    <h2 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
                      <Smartphone size={22} /> {t('profile.addToHomeScreenTitle')}
                    </h2>
                    <p className="text-slate-500 text-sm mb-4">
                      {t('profile.addToHomeScreenDesc')}
                    </p>
                    <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
                      <p className="font-bold text-slate-700">{t('profile.compatibility')}:</p>
                      <p>• <strong>{t('profile.compatibilityAndroid')}</strong></p>
                      <p>• <strong>{t('profile.compatibilityIos')}</strong></p>
                    </div>
                    {installSuccess ? (
                      <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 font-medium">
                        <Check size={20} /> {t('profile.addedToHomeScreen')}
                      </div>
                    ) : installPrompt ? (
                      <button
                        type="button"
                        onClick={handleInstallApp}
                        disabled={installLoading}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm"
                      >
                        <Plus size={20} />
                        {installLoading ? t('profile.installing') : t('profile.addToHomeScreen')}
                      </button>
                    ) : (
                      <div className="max-w-md">
                        <InstallManualGuide />
                      </div>
                    )}
                  </div>

                  <div className="mt-10 pt-8 border-t border-slate-200">
                    <h2 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
                      <KeyRound size={22} /> {t('profile.changePasswordTitle')}
                    </h2>
                    <p className="text-slate-500 text-sm mb-4">{t('profile.changePasswordDesc')}</p>
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                      {passwordError && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
                          {passwordError}
                        </div>
                      )}
                      {passwordSuccess && (
                        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm" role="status">
                          {t('profile.passwordUpdated')}
                        </div>
                      )}
                      <div>
                        <label htmlFor="current-password" className="block text-sm font-bold text-slate-700 mb-2">{t('profile.currentPassword')}</label>
                        <input
                          id="current-password"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          dir="ltr"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="new-password" className="block text-sm font-bold text-slate-700 mb-2">{t('profile.newPassword')}</label>
                        <input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder={t('profile.newPasswordPlaceholder')}
                          className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          dir="ltr"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="confirm-new-password" className="block text-sm font-bold text-slate-700 mb-2">{t('profile.confirmNewPassword')}</label>
                        <input
                          id="confirm-new-password"
                          type="password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder={t('profile.confirmNewPasswordPlaceholder')}
                          className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          dir="ltr"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={passwordLoading}
                        className="py-3 px-6 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-60"
                      >
                        {passwordLoading ? t('profile.updatingPassword') : t('profile.updatePassword')}
                      </button>
                    </form>
                  </div>

            </div>
          </section>
        )}

        {view === 'prices' && (
          <section>
            <h1 className="text-2xl font-semibold text-slate-900">{t('profile.basePricesTitle')}</h1>
            <p className="mt-1 mb-4 text-sm text-slate-500">{t('profile.basePricesDesc')}</p>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                      {[
                        ...getOrderedCategories(),
                        ...customCategories.map((c) => ({
                          id: c.id,
                          name: c.name,
                          icon: c.icon,
                          services: [] as import('../service/services').Service[],
                        })),
                      ].map((cat) => {
                        const services = getMergedServices(cat.id, cat.services);
                        if (services.length === 0) return null;
                        return (
                        <div key={cat.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <h3 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
                            <span>{cat.icon}</span> {t(`categoryName.${cat.id}`, cat.name)}
                          </h3>
                          <ul className="space-y-2">
                            {services.map((svc) => {
                              const effective = getBasePrice(svc.id, svc.basePrice);
                              const isOverridden = effective !== svc.basePrice;
                              const displayName = getServiceDisplayName(t, svc);
                              return (
                                <li key={svc.id} className="flex flex-wrap items-center gap-2 sm:gap-4 py-2 border-b border-slate-100 last:border-0">
                                  <span className="flex-1 min-w-0 text-sm text-slate-800 flex items-center gap-2">
                                    {displayName}
                                    {isCustomServiceId(svc.id) && (
                                      <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full">
                                        {t('customCatalog.myService')}
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-xs text-slate-500 shrink-0">{t('profile.defaultPrice')}: ₪{svc.basePrice.toLocaleString('he-IL')}</span>
                                  <input
                                    type="number"
                                    min={0}
                                    value={isOverridden ? effective : ''}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      if (v === '') setBasePrice(svc.id, '');
                                      else {
                                        const n = parseInt(v, 10);
                                        if (!isNaN(n) && n >= 0) setBasePrice(svc.id, n);
                                      }
                                    }}
                                    onBlur={showSaveToast}
                                    placeholder={svc.basePrice.toString()}
                                    className="w-24 px-2 py-1.5 rounded-lg border border-slate-200 text-left text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    dir="ltr"
                                  />
                                  <span className="text-xs text-slate-400">₪</span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                        );
                      })}
                    </div>

          </section>
        )}
      </div>

      {downloadingId && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60"
          dir={dir}
          role="status"
          aria-live="polite"
          aria-label={t('profile.downloadingQuote')}
        >
          <div className="bg-white rounded-2xl shadow-2xl px-8 py-6 flex flex-col items-center gap-4">
            <Loader2 size={40} className="animate-spin text-blue-600" />
            <p className="font-bold text-slate-800 text-lg">{t('profile.downloadingQuote')}</p>
          </div>
        </div>
      )}

      {saveToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl bg-slate-900 text-white font-medium shadow-xl border border-slate-700 flex items-center gap-2"
        >
          <Check size={20} className="shrink-0 text-green-400" />
          {t('profile.savedToast')}
        </div>
      )}

      {previewQuoteId && (() => {
        const q = quotes.find((x) => x.id === previewQuoteId);
        if (!q) return null;
        const snap = getQuoteSnapshot(q);
        const html = getQuotePreviewHtml({
          items: q.items,
          totalBeforeVAT: q.totalBeforeVAT,
          totalWithVAT: q.totalWithVAT,
          profile: snap?.profile ?? profile,
          customerName: q.customerName,
          customerPhone: q.customerPhone,
          customerEmail: q.customerEmail,
          customerAddress: q.customerAddress,
          customerCompanyId: q.customerCompanyId,
          notes: q.notes,
          quoteTitle: snap?.quoteTitle ?? defaultQuoteTitle,
          quoteNumber: q.quoteNumber,
          validityDays: snap?.validityDays ?? validityDays,
          vatRate: snap?.vatRate ?? vatRate,
        });
        return (
          <div
            className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4"
            dir={dir}
            onClick={(e) => e.target === e.currentTarget && setPreviewQuoteId(null)}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
                <h3 className="font-bold text-slate-900">{t('profile.previewTitle').replace('{name}', q.customerName || t('profile.quoteLabel'))}</h3>
                <button
                  type="button"
                  onClick={() => setPreviewQuoteId(null)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  {t('profile.closePreview')}
                </button>
              </div>
              <div className="quote-preview-container p-4 bg-slate-100 min-h-0 flex-1 [&_.quote-preview-body]:shadow-lg [&_.quote-preview-body]:bg-white [&_.quote-preview-body]:my-0">
                <div dangerouslySetInnerHTML={{ __html: html }} className="min-w-0" />
              </div>
            </div>
          </div>
        );
      })()}
      <ConfirmDialog
        open={!!deleteDraftId}
        title={t('profile.deleteDraftConfirmTitle')}
        message={t('profile.deleteDraftConfirmMessage')}
        confirmLabel={t('profile.confirmDelete')}
        cancelLabel={t('profile.cancel')}
        danger
        onConfirm={() => {
          if (deleteDraftId) handleDeleteDraft(deleteDraftId);
        }}
        onCancel={() => setDeleteDraftId(null)}
      />
      <ConfirmDialog
        open={!!deleteQuoteId}
        title={t('profile.deleteQuoteConfirmTitle')}
        message={t('profile.deleteQuoteConfirmMessage')}
        confirmLabel={t('profile.confirmDelete')}
        cancelLabel={t('profile.cancel')}
        danger
        onConfirm={() => {
          if (deleteQuoteId) handleDeleteQuote(deleteQuoteId);
        }}
        onCancel={() => setDeleteQuoteId(null)}
      />
    </main>
    </RequireAuth>
  );
}
