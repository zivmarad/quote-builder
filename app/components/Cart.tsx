'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useQuoteBasket } from '../contexts/QuoteBasketContext';
import { useProfile } from '../contexts/ProfileContext';
import { useQuoteHistory } from '../contexts/QuoteHistoryContext';
import { useSettings } from '../contexts/SettingsContext';
import { saveDraft } from '../../lib/drafts-storage';
import { Trash2, Edit2, Check, X, ShoppingBag, Plus, FileText, Share2, Eye, Loader2, ChevronDown, ChevronUp, Save } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

const PENDING_DRAFT_KEY = 'quoteBuilder_pendingDraft';
import { generateQuotePDFAsBlob, getQuotePreviewHtml } from './utils/pdfExport';

export default function Cart() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    items,
    addItem,
    removeItem,
    removeExtraFromItem,
    updateItemPrice,
    clearItemPriceOverride,
    clearBasket,
    loadBasket,
    totalBeforeVAT,
    VAT: contextVAT,
    totalWithVAT: contextTotalWithVAT,
  } = useQuoteBasket();
  const { profile } = useProfile();
  const { addQuote } = useQuoteHistory();
  const { defaultQuoteTitle, nextQuoteNumber, setNextQuoteNumber, validityDays, vatRate } = useSettings();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCompanyId, setCustomerCompanyId] = useState('');
  const [notes, setNotes] = useState('');
  const lastShareBlobRef = useRef<Blob | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customExtras, setCustomExtras] = useState<Array<{ text: string; price: number }>>([]);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [showSaveDraftModal, setShowSaveDraftModal] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [showClearBasketConfirm, setShowClearBasketConfirm] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 0 && typeof window !== 'undefined' && window.innerWidth < 1024);
    setIsMobile(!!mobile);
  }, []);

  /** כשמורידים תת־שירות בעריכה – מעדכן את שדה המחיר לחישוב המעודכן כדי שלחיצה על ✓ תשמור חישוב אוטומטי */
  useEffect(() => {
    if (!editingId) return;
    const item = items.find((i) => i.id === editingId);
    if (!item) return;
    const extrasTotal = item.extras?.reduce((sum, e) => sum + e.price, 0) || 0;
    const calculated = item.basePrice + extrasTotal;
    const currentPrice = item.overridePrice !== undefined ? item.overridePrice : calculated;
    setEditPrice(currentPrice.toString());
  }, [editingId, items]);

  /** טעינת פרטי לקוח מטיוטה שנטענה מאיזור אישי */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = sessionStorage.getItem(PENDING_DRAFT_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as Record<string, string>;
      if (data.customerName !== undefined) setCustomerName(data.customerName || '');
      if (data.customerPhone !== undefined) setCustomerPhone(data.customerPhone || '');
      if (data.customerEmail !== undefined) setCustomerEmail(data.customerEmail || '');
      if (data.customerAddress !== undefined) setCustomerAddress(data.customerAddress || '');
      if (data.customerCompanyId !== undefined) setCustomerCompanyId(data.customerCompanyId || '');
      if (data.notes !== undefined) setNotes(data.notes || '');
    } catch {
      /* ignore */
    }
    sessionStorage.removeItem(PENDING_DRAFT_KEY);
  }, []);

  const handleSaveDraft = async () => {
    if (items.length === 0) return;
    const name = draftName.trim() || `טיוטה ${new Date().toLocaleDateString('he-IL')}`;
    try {
      await saveDraft(user?.id ?? null, {
        name,
        items,
        customerName,
        customerPhone,
        customerEmail,
        customerAddress,
        customerCompanyId,
        notes,
      });
      clearBasket();
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerAddress('');
      setCustomerCompanyId('');
      setNotes('');
      setToast('הטיוטה נשמרה והסל נוקה');
      setDraftName('');
      setShowSaveDraftModal(false);
    } catch {
      setToast('שגיאה בשמירת הטיוטה');
    }
  };


  const VAT = contextVAT;
  const totalWithVAT = contextTotalWithVAT;

  const handleStartEdit = (id: string, currentPrice: number) => {
    setEditingId(id);
    setEditPrice(currentPrice.toString());
  };

  const handleSaveEdit = (id: string) => {
    const item = items.find((i) => i.id === id);
    const calculated = item
      ? item.basePrice + (item.extras?.reduce((sum, e) => sum + e.price, 0) || 0)
      : 0;
    const trimmed = editPrice.trim();
    if (trimmed === '' || parseFloat(trimmed) === 0 || isNaN(parseFloat(trimmed))) {
      clearItemPriceOverride(id);
      setEditingId(null);
      setEditPrice('');
      return;
    }
    const newPrice = parseFloat(trimmed);
    if (newPrice < 0) {
      setEditingId(null);
      setEditPrice('');
      return;
    }
    if (newPrice === calculated) {
      clearItemPriceOverride(id);
    } else {
      updateItemPrice(id, newPrice);
    }
    setEditingId(null);
    setEditPrice('');
  };

  const getCustomerContact = () => ({
    customerPhone: customerPhone.trim() || undefined,
    customerEmail: customerEmail.trim() || undefined,
    customerAddress: customerAddress.trim() || undefined,
    customerCompanyId: customerCompanyId.trim() || undefined,
  });

  const handleExportPDF = async () => {
    if (!user) {
      router.push('/login?from=' + encodeURIComponent('/cart'));
      return;
    }
    const { customerPhone, customerEmail, customerAddress, customerCompanyId } = getCustomerContact();
    setIsDownloading(true);
    try {
      addQuote({
        items,
        totalBeforeVAT,
        VAT,
        totalWithVAT,
        customerName: customerName.trim() || undefined,
        customerPhone,
        customerEmail,
        customerAddress,
        customerCompanyId,
        notes: notes.trim() || undefined,
        quoteNumber: nextQuoteNumber,
        status: 'download',
        quoteStatus: 'draft',
      });
      const blob = await generateQuotePDFAsBlob(
        items,
        totalBeforeVAT,
        VAT,
        totalWithVAT,
        profile,
        customerName.trim() || undefined,
        notes.trim() || undefined,
        defaultQuoteTitle,
        nextQuoteNumber,
        customerPhone,
        customerEmail,
        customerAddress,
        customerCompanyId,
        validityDays ?? undefined,
        vatRate
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hatzaat-mechir-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setNextQuoteNumber(nextQuoteNumber + 1);
      clearBasket();
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerAddress('');
      setCustomerCompanyId('');
      setNotes('');
      setToast('ה-PDF הורד וההצעה נשמרה');
      setTimeout(() => router.push('/'), 2500);
    } finally {
      setIsDownloading(false);
    }
  };

  /** שלב 1: הכנת PDF. שלב 2: במודל – לחיצה על "שתף עכשיו" קוראת ל-navigator.share() במחווה ישירה, כך שמסך השיתוף נפתח במובייל. */
  const handleShareToWhatsApp = async () => {
    if (!user) {
      router.push('/login?from=' + encodeURIComponent('/cart'));
      return;
    }
    setIsSharing(true);
    const { customerPhone, customerEmail, customerAddress, customerCompanyId } = getCustomerContact();
    addQuote({
      items,
      totalBeforeVAT,
      VAT,
      totalWithVAT,
      customerName: customerName.trim() || undefined,
      customerPhone,
      customerEmail,
      customerAddress,
      customerCompanyId,
      notes: notes.trim() || undefined,
      quoteNumber: nextQuoteNumber,
      status: 'whatsapp',
      quoteStatus: 'sent',
    });
    try {
      const blob = await generateQuotePDFAsBlob(items, totalBeforeVAT, VAT, totalWithVAT, profile, customerName || undefined, notes || undefined, defaultQuoteTitle, nextQuoteNumber, customerPhone, customerEmail, customerAddress, customerCompanyId, validityDays ?? undefined, vatRate);
      setNextQuoteNumber(nextQuoteNumber + 1);
      lastShareBlobRef.current = blob;
      setShareError(null);
      setShowWhatsAppModal(true);
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      lastShareBlobRef.current = null;
    } finally {
      setIsSharing(false);
    }
  };

  /** נקרא בלחיצה ישירה – מחווה משתמש חדשה – כך שמסך השיתוף המקורי (וואטסאפ וכו') נפתח במובייל. */
  const handleOpenNativeShare = async () => {
    const blob = lastShareBlobRef.current;
    if (!blob) return;
    if (typeof navigator === 'undefined' || !navigator.share) {
      setShareError('שיתוף ישיר זמין כשהאתר נטען בכתובת מאובטחת (https). בינתיים הורד את ה-PDF למטה ושלח אותו.');
      return;
    }
    const file = new File([blob], 'hatzaat-mechir.pdf', { type: 'application/pdf' });
    const shareData: ShareData = {
      text: 'שלום, מצורף הצעת המחיר.',
      files: [file],
    };
    try {
      await navigator.share(shareData);
      lastShareBlobRef.current = null;
      setShareError(null);
      setShowWhatsAppModal(false);
      clearBasket();
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerAddress('');
      setCustomerCompanyId('');
      setNotes('');
      setToast('ההצעה נשלחה בהצלחה');
      setTimeout(() => router.push('/'), 2500);
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      setShareError('שיתוף ישיר זמין כשהאתר נטען בכתובת מאובטחת (https). בינתיים הורד את ה-PDF למטה ושלח אותו.');
    }
  };

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;
  /** במובייל תמיד מציגים "שתף עכשיו" כדי לנסות לפתוח מסך שיתוף; במחשב רק אם הדפדפן תומך. */
  const showShareNowButton = canNativeShare || isMobile;

  const handleDownloadFromModal = () => {
    const blob = lastShareBlobRef.current;
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hatzaat-mechir.pdf';
    a.click();
    URL.revokeObjectURL(url);
    lastShareBlobRef.current = null;
    setShareError(null);
    setShowWhatsAppModal(false);
    clearBasket();
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerAddress('');
    setCustomerCompanyId('');
    setNotes('');
    setToast('ה-PDF הורד וההצעה נשמרה');
    setTimeout(() => router.push('/'), 2500);
  };

  const handleDownloadAndOpenWhatsAppWeb = () => {
    const blob = lastShareBlobRef.current;
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hatzaat-mechir.pdf';
      a.click();
      URL.revokeObjectURL(url);
    }
    lastShareBlobRef.current = null;
    window.open('https://web.whatsapp.com', '_blank');
    setShareError(null);
    setShowWhatsAppModal(false);
    clearBasket();
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerAddress('');
    setCustomerCompanyId('');
    setNotes('');
    setToast('ה-PDF הורד – אפשר לשלוח בוואטסאפ Web');
    setTimeout(() => router.push('/'), 2500);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price || 0);
  };

  const handleAddCustomExtra = () => {
    setCustomExtras((prev) => [...prev, { text: '', price: 0 }]);
  };

  const handleUpdateCustomExtra = (idx: number, field: 'text' | 'price', value: string | number) => {
    setCustomExtras((prev) =>
      prev.map((e, i) =>
        i === idx
          ? field === 'text'
            ? { ...e, text: String(value) }
            : { ...e, price: typeof value === 'string' ? parseFloat(value) || 0 : value }
          : e
      )
    );
  };

  const handleRemoveCustomExtra = (idx: number) => {
    setCustomExtras((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddCustomItem = () => {
    const name = customName.trim();
    const priceVal = parseFloat(customPrice.replace(/,/g, ''));
    if (!name) {
      setToast('הזן שם פריט');
      return;
    }
    if (isNaN(priceVal) || priceVal < 0) {
      setToast('הזן מחיר בסיס תקין');
      return;
    }
    const validExtras = customExtras.filter((e) => e.text.trim() && e.price >= 0).map((e) => ({ text: e.text.trim(), price: e.price }));
    addItem({
      name,
      category: 'פריט חופשי',
      basePrice: priceVal,
      extras: validExtras.length > 0 ? validExtras : undefined,
    });
    setCustomName('');
    setCustomPrice('');
    setCustomExtras([]);
    setShowAddCustom(false);
    setToast('הפריט נוסף לסל');
  };

  const toastEl = toast ? (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl bg-slate-900 text-white font-medium shadow-xl border border-slate-700"
    >
      <span className="flex items-center gap-2">
        <Check size={20} className="shrink-0 text-green-400" />
        {toast}
      </span>
    </div>
  ) : null;

  if (items.length === 0) {
    return (
      <>
        <div className="max-w-2xl mx-auto px-3 sm:p-4" dir="rtl">
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center shadow-sm border border-slate-100 mb-6">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <ShoppingBag size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">הסל שלך ריק</h3>
            <p className="text-slate-500 mb-6">בחר תחום עבודה מהדף הבית או הוסף פריט חופשי כאן.</p>
            <button
              type="button"
              onClick={() => setShowAddCustom(!showAddCustom)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-blue-600 border-2 border-blue-200 hover:bg-blue-50 transition-colors"
            >
              <Plus size={20} />
              {showAddCustom ? 'סגור' : 'הוסף פריט חופשי'}
            </button>
          </div>
          {showAddCustom && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 border-dashed border-2 min-w-0 overflow-hidden">
              <h4 className="text-lg font-black text-slate-900 mb-4 text-right">הוסף פריט חופשי להצעה</h4>
              <div className="space-y-4 text-right max-w-md mr-auto">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">שם הפריט</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="למשל: התקנת מזגן, שיפוץ חדר אמבטיה"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">מחיר בסיס (₪)</label>
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="0"
                    min={0}
                    dir="ltr"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {customExtras.length > 0 && (
                  <div className="min-w-0 overflow-hidden">
                    <span className="block text-sm font-bold text-slate-700 mb-2">תוספות</span>
                    {customExtras.map((extra, idx) => (
                      <div key={idx} className="flex flex-wrap sm:flex-nowrap gap-2 mb-2 items-center">
                        <input
                          type="text"
                          value={extra.text}
                          onChange={(e) => handleUpdateCustomExtra(idx, 'text', e.target.value)}
                          placeholder="שם התוספת"
                          className="flex-1 min-w-0 w-full sm:w-auto px-3 py-2 rounded-lg border border-slate-200 text-sm"
                        />
                        <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-start">
                          <input
                            type="number"
                            value={extra.price || ''}
                            onChange={(e) => handleUpdateCustomExtra(idx, 'price', e.target.value)}
                            placeholder="מחיר"
                            min={0}
                            className="w-20 sm:w-24 px-3 py-2 rounded-lg border border-slate-200 text-sm text-left"
                          />
                          <button type="button" onClick={() => handleRemoveCustomExtra(idx)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg shrink-0" aria-label="הסר תוספת">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button type="button" onClick={handleAddCustomExtra} className="text-sm font-bold text-blue-600 hover:text-blue-700">
                  + הוסף תוספת
                </button>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleAddCustomItem}
                    className="w-full py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    הוסף לסל
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        {toastEl}
      </>
    );
  }

  return (
    <>
    <div className="max-w-4xl mx-auto px-3 sm:p-4 pb-24 sm:pb-4" dir="rtl">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-slate-900 px-4 sm:px-8 py-4 sm:py-5 flex justify-between items-center text-white gap-2">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-black truncate">הצעת המחיר שלי</h2>
            <p className="text-slate-400 text-xs font-medium italic">סה"כ {items.length} פריטים נבחרו</p>
          </div>
          <button
            type="button"
            onClick={() => setShowClearBasketConfirm(true)}
            className="text-slate-400 hover:text-red-400 text-xs font-bold bg-white/5 px-3 py-2.5 sm:py-2 rounded-lg transition-colors min-h-[44px] shrink-0"
            aria-label="נקה את כל פריטי הסל"
          >
            נקה הכל
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {items.map((item) => {
            const extrasTotal = item.extras?.reduce((sum, extra) => sum + extra.price, 0) || 0;
            const calculatedTotalPrice = item.basePrice + extrasTotal;
            const currentPrice = item.overridePrice !== undefined ? item.overridePrice : calculatedTotalPrice;
            const isEditing = editingId === item.id;
            const hasExtras = item.extras && item.extras.length > 0;

            return (
              <div key={item.id} className="p-4 sm:p-6 hover:bg-slate-50/50 transition-all">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1 text-right min-w-0">
                      <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${item.category === 'פריט חופשי' ? 'text-emerald-600' : 'text-blue-600'}`}>{item.category}</span>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                        {item.name}
                        {item.quantity != null && item.quantity > 1 && (
                          <span className="mr-2 text-sm font-semibold text-slate-500">
                            ×{item.quantity}{item.unit ? ` ${item.unit}` : ''}
                          </span>
                        )}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 justify-end sm:justify-start">
                      {isEditing ? (
                        <div className="flex flex-wrap items-center gap-2 bg-blue-50 p-1.5 rounded-xl border border-blue-100">
                          <input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            min={0}
                            placeholder={calculatedTotalPrice.toString()}
                            className="w-24 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-left font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                            title="מחיר ידני. השאר ריק או הזן 0 ואשר = חישוב אוטומטי"
                          />
                          <span className="text-[10px] text-blue-700 hidden sm:inline">ריק או 0 + ✓ = חישוב אוטומטי</span>
                          <button onClick={() => handleSaveEdit(item.id)} className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600" title="שמור מחיר"><Check size={18} /></button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300" title="סגור עריכה"><X size={18} /></button>
                        </div>
                      ) : (
                        <>
                          <div className="text-left min-w-[90px]">
                            <div className="text-lg font-black text-slate-900">{formatPrice(currentPrice)}</div>
                            {item.overridePrice !== undefined && <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-1.5 py-0.5 rounded block text-center mt-0.5">מחיר מותאם</span>}
                          </div>
                          <button onClick={() => handleStartEdit(item.id, currentPrice)} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg transition-colors" title="ערוך פריט"><Edit2 size={18} /></button>
                          <button onClick={() => setDeleteItemId(item.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors" title="הסר שירות"><Trash2 size={18} /></button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* עריכה: הסרת תת־שירות או הסרת שירות */}
                  {isEditing && (
                    <div className="bg-blue-50/80 rounded-xl p-4 border border-blue-100 text-right space-y-3">
                      <p className="text-xs font-bold text-blue-800 mb-2">מחיר ידני למעלה – השאר ריק או הזן 0 ולחץ ✓ לחישוב אוטומטי; להסרת תת־שירות או שירות – למטה.</p>
                      {hasExtras && (
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-slate-600 block">הסר תת־שירות:</span>
                          {item.extras!.map((extra, idx) => (
                            <div key={idx} className="flex justify-between items-center gap-2 bg-white rounded-lg px-3 py-2 border border-slate-200">
                              <span className="text-sm text-slate-700">+ {extra.text} — {formatPrice(extra.price)}</span>
                              <button
                                type="button"
                                onClick={() => removeExtraFromItem(item.id, idx)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                title="הסר תת־שירות"
                                aria-label={`הסר ${extra.text}`}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteItemId(item.id)}
                        className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-sm font-bold bg-red-100 text-red-700 hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                        title="הסר שירות מהסל"
                      >
                        <Trash2 size={18} />
                        הסר שירות מהסל
                      </button>
                    </div>
                  )}

                  {/* פירוט מחירים */}
                  <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 text-right">
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between items-center text-slate-700">
                        <span>מחיר בסיס</span>
                        <span className="font-semibold">{formatPrice(item.basePrice)}</span>
                      </div>
                      {hasExtras && item.extras!.map((extra, idx) => (
                        <div key={idx} className="flex justify-between items-center text-slate-600">
                          <span>+ {extra.text}</span>
                          <span className="font-semibold">{formatPrice(extra.price)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200 font-bold text-slate-900">
                        <span>סה"כ שורה</span>
                        <span>{formatPrice(currentPrice)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* הוסף פריט חופשי */}
        <div className="border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowAddCustom(!showAddCustom)}
            className="w-full px-6 py-4 flex items-center justify-center gap-2 text-slate-600 hover:bg-slate-50/80 hover:text-blue-600 transition-colors"
          >
            <Plus size={20} />
            <span className="font-bold">{showAddCustom ? 'סגור' : 'הוסף פריט חופשי'}</span>
          </button>
          {showAddCustom && (
            <div className="px-6 pb-6 pt-2 bg-slate-50/50 border-t border-slate-100 overflow-hidden">
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm max-w-lg mr-auto min-w-0 overflow-hidden">
                <h4 className="text-base font-black text-slate-900 mb-4 text-right">פריט חופשי – שם, מחיר ותוספות</h4>
                <div className="space-y-4 text-right">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">שם הפריט</label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="למשל: התקנת מזגן"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">מחיר בסיס (₪)</label>
                    <input
                      type="number"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      placeholder="0"
                      min={0}
                      dir="ltr"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {customExtras.length > 0 && (
                    <div className="min-w-0 overflow-hidden">
                      <span className="block text-sm font-bold text-slate-700 mb-2">תוספות</span>
                      {customExtras.map((extra, idx) => (
                        <div key={idx} className="flex flex-wrap sm:flex-nowrap gap-2 mb-2 items-center">
                          <input
                            type="text"
                            value={extra.text}
                            onChange={(e) => handleUpdateCustomExtra(idx, 'text', e.target.value)}
                            placeholder="שם התוספת"
                            className="flex-1 min-w-0 w-full sm:w-auto px-3 py-2 rounded-lg border border-slate-200 text-sm"
                          />
                          <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-start">
                            <input
                              type="number"
                              value={extra.price || ''}
                              onChange={(e) => handleUpdateCustomExtra(idx, 'price', e.target.value)}
                              placeholder="מחיר"
                              min={0}
                              className="w-20 sm:w-24 px-3 py-2 rounded-lg border border-slate-200 text-sm text-left"
                            />
                            <button type="button" onClick={() => handleRemoveCustomExtra(idx)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg shrink-0" aria-label="הסר תוספת">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button type="button" onClick={handleAddCustomExtra} className="text-sm font-bold text-blue-600 hover:text-blue-700">
                    + הוסף תוספת
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCustomItem}
                    className="w-full py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    הוסף לסל
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* פרטי לקוח – שם תמיד גלוי, השאר מתקפל */}
        <div className="px-6 py-4 bg-white border-t border-slate-100">
          <div className="flex flex-col gap-3">
            <label htmlFor="customerName" className="block text-sm font-bold text-slate-700 text-right">שם הלקוח</label>
            <input
              id="customerName"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="ישראל ישראלי או חברה בע״מ"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
            />
            <button
              type="button"
              onClick={() => setShowCustomerDetails((v) => !v)}
              className="flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              {showCustomerDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              {showCustomerDetails ? 'הסתר פרטים נוספים' : 'ח.פ, טלפון, אימייל, כתובת'}
            </button>
            {showCustomerDetails && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label htmlFor="customerCompanyId" className="block text-xs font-bold text-slate-600 mb-1 text-right">ח.פ</label>
                  <input
                    id="customerCompanyId"
                    type="text"
                    inputMode="numeric"
                    value={customerCompanyId}
                    onChange={(e) => setCustomerCompanyId(e.target.value)}
                    placeholder="123456789"
                    dir="ltr"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="customerPhone" className="block text-xs font-bold text-slate-600 mb-1 text-right">טלפון</label>
                  <input
                    id="customerPhone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="050-1234567"
                    dir="ltr"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="customerEmail" className="block text-xs font-bold text-slate-600 mb-1 text-right">אימייל</label>
                  <input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="example@email.com"
                    dir="ltr"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="customerAddress" className="block text-xs font-bold text-slate-600 mb-1 text-right">כתובת</label>
                  <input
                    id="customerAddress"
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="רחוב, עיר, מיקוד"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* הערות להצעה – לא חלק מפרטי הלקוח */}
        <div className="px-6 py-4 bg-white border-t border-slate-100">
          <label htmlFor="notes" className="block text-sm font-bold text-slate-700 mb-1.5 text-right">הערות להצעה</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="למשל: המחיר לא כולל חומרים, צפי לסיום, תנאי תשלום..."
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right resize-y"
          />
        </div>

        <div className="bg-slate-50 p-4 sm:p-8 border-t border-slate-100">
          <div className="max-w-xs mr-auto space-y-3 text-right">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-slate-500">סיכום ביניים</span>
              <span className="text-slate-900 font-bold">{formatPrice(totalBeforeVAT)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span className="text-slate-500">{vatRate === 0 ? 'עוסק פטור' : `מע"מ (${Math.round(vatRate * 100)}%)`}</span>
              <span className="text-slate-900 font-bold">{formatPrice(VAT)}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <span className="text-lg font-black text-slate-900">סה"כ לתשלום</span>
              <span className="text-2xl font-black text-blue-600">{formatPrice(totalWithVAT)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
        <button
          type="button"
          onClick={() => setShowCartPreview(true)}
          className="flex items-center justify-center gap-2 sm:gap-3 bg-white text-slate-700 border-2 border-slate-200 py-4 sm:py-5 px-4 sm:px-8 rounded-xl sm:rounded-2xl font-black text-base sm:text-xl hover:bg-slate-50 transition-all shadow-sm min-h-[52px] active:scale-[0.98]"
          aria-label="תצוגה מקדימה"
        >
          <Eye size={22} className="shrink-0 sm:w-6 sm:h-6" /> תצוגה מקדימה
        </button>
        <button
          type="button"
          onClick={handleShareToWhatsApp}
          disabled={isSharing}
          className="flex items-center justify-center gap-2 sm:gap-3 bg-blue-600 text-white py-4 sm:py-5 px-4 sm:px-8 rounded-xl sm:rounded-2xl font-black text-base sm:text-xl hover:bg-blue-700 shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed min-h-[52px] active:scale-[0.98]"
          aria-label="שתף הצעת מחיר"
        >
          {isSharing ? (
            <>מייצא...</>
          ) : (
            <>
              <Share2 size={22} className="shrink-0 sm:w-6 sm:h-6" /> שתף
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleExportPDF}
          disabled={isDownloading}
          className="flex items-center justify-center gap-2 sm:gap-3 bg-white text-slate-900 border-2 border-slate-200 py-4 sm:py-5 px-4 sm:px-8 rounded-xl sm:rounded-2xl font-black text-base sm:text-xl hover:bg-slate-50 transition-all shadow-sm min-h-[52px] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          aria-label="הורד הצעת מחיר כקובץ PDF"
        >
          <FileText size={22} className="shrink-0 sm:w-6 sm:h-6" />
          {isDownloading ? 'מוריד...' : 'הורד כ-PDF'}
        </button>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (!user) {
                router.push('/login?from=' + encodeURIComponent('/cart'));
                return;
              }
              setShowSaveDraftModal(true);
            }}
            className="flex items-center justify-center gap-2 sm:gap-3 bg-amber-50 text-amber-800 border-2 border-amber-200 py-4 sm:py-5 px-4 sm:px-8 rounded-xl sm:rounded-2xl font-black text-base sm:text-xl hover:bg-amber-100 transition-all shadow-sm min-h-[52px] active:scale-[0.98]"
            aria-label="שמור טיוטה"
          >
            <Save size={22} className="shrink-0 sm:w-6 sm:h-6" /> שמור טיוטה
          </button>
        )}
      </div>

      {showSaveDraftModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
          dir="rtl"
          onClick={() => { setShowSaveDraftModal(false); setDraftName(''); }}
          role="presentation"
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 border border-slate-200 sm:border-t"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-draft-modal-title"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 id="save-draft-modal-title" className="text-xl font-black text-slate-900">שמור טיוטה</h3>
              <button type="button" onClick={() => { setShowSaveDraftModal(false); setDraftName(''); }} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100" aria-label="סגור">
                <X size={22} />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-3">שמור את הסל הנוכחי להמשך – הטיוטות זמינות באיזור האישי</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder={`למשל: הצעת לקוח X, טיוטה ${new Date().toLocaleDateString('he-IL')}`}
                className="flex-1 px-3 py-2.5 rounded-xl border border-amber-300 bg-amber-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleSaveDraft}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-amber-600 text-white hover:bg-amber-700 shrink-0"
              >
                <Save size={18} /> שמור
              </button>
            </div>
          </div>
        </div>
      )}

      {(isDownloading || isSharing) && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
          dir="rtl"
          role="status"
          aria-live="polite"
          aria-label={isDownloading ? 'מוריד את ההצעה' : 'מייצא הצעת מחיר'}
        >
          <div className="bg-white rounded-2xl shadow-2xl px-8 py-6 flex flex-col items-center gap-4">
            <Loader2 size={40} className="animate-spin text-blue-600" />
            <p className="font-bold text-slate-800 text-lg">
              {isDownloading ? 'מוריד את ההצעה...' : 'מייצא הצעת מחיר...'}
            </p>
            <p className="text-slate-500 text-sm">זה יכול לקחת כמה שניות</p>
          </div>
        </div>
      )}

      {showCartPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          dir="rtl"
          onClick={(e) => e.target === e.currentTarget && setShowCartPreview(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-900">תצוגה מקדימה</h3>
              <button
                type="button"
                onClick={() => setShowCartPreview(false)}
                className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                סגור
              </button>
            </div>
            <div className="quote-preview-container p-4 bg-slate-100 min-h-0 flex-1 [&_.quote-preview-body]:shadow-lg [&_.quote-preview-body]:bg-white [&_.quote-preview-body]:my-0">
              <div
                className="min-w-0"
                dangerouslySetInnerHTML={{
                  __html: getQuotePreviewHtml({
                    items,
                    totalBeforeVAT,
                    totalWithVAT,
                    profile,
                    customerName: customerName.trim() || undefined,
                    customerPhone: customerPhone.trim() || undefined,
                    customerEmail: customerEmail.trim() || undefined,
                    customerAddress: customerAddress.trim() || undefined,
                    customerCompanyId: customerCompanyId.trim() || undefined,
                    notes: notes.trim() || undefined,
                    quoteTitle: defaultQuoteTitle,
                    quoteNumber: nextQuoteNumber,
                    validityDays: validityDays ?? undefined,
                    vatRate,
                  }),
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* מודל: במובייל – "שתף עכשיו" פותח את מסך השיתוף של המערכת. במחשב – הורד PDF או וואטסאפ Web. */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50" dir="rtl" onClick={() => { setShowWhatsAppModal(false); setShareError(null); }} role="presentation">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 border border-slate-200 sm:border-t" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="share-modal-title" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 id="share-modal-title" className="text-xl font-black text-slate-900">שתף הצעת מחיר</h3>
              <button type="button" onClick={() => { setShowWhatsAppModal(false); setShareError(null); }} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100" aria-label="סגור חלון">
                <X size={22} />
              </button>
            </div>
            {showShareNowButton ? (
              <p className="text-slate-600 text-sm mb-6">המסמך מוכן. לחץ למטה כדי לפתוח את מסך השיתוף – וואטסאפ, מייל ועוד.</p>
            ) : (
              <p className="text-slate-600 text-sm mb-6">במחשב אין מסך שיתוף – הורד את קובץ ההצעה ופתח וואטסאפ Web לשליחה.</p>
            )}
            {shareError && (
              <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm mb-4" role="alert">
                {shareError}
              </p>
            )}
            <div className="flex flex-col gap-3">
              {showShareNowButton && (
                <button type="button" onClick={handleOpenNativeShare} className="w-full py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2" aria-label="שתף – פתח מסך שיתוף">
                  <Share2 size={20} /> שתף עכשיו
                </button>
              )}
              {!showShareNowButton && (
                <button type="button" onClick={handleDownloadAndOpenWhatsAppWeb} className="w-full py-3 rounded-xl font-bold bg-[#25D366] text-white hover:bg-[#20bd5a] flex items-center justify-center gap-2">
                  <FileText size={20} /> הורד PDF ופתח וואטסאפ Web
                </button>
              )}
              <button type="button" onClick={handleDownloadFromModal} className="w-full py-3 rounded-xl font-bold border-2 border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2">
                <FileText size={20} /> הורד PDF בלבד
              </button>
              <button type="button" onClick={() => { setShowWhatsAppModal(false); setShareError(null); }} className="w-full py-3 rounded-xl font-bold border-2 border-slate-200 text-slate-700 hover:bg-slate-50">
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    <ConfirmDialog
      open={!!deleteItemId}
      title="הסרת שירות מהסל"
      message="האם להסיר את השירות מהסל? לא ניתן לשחזר."
      confirmLabel="הסר"
      cancelLabel="ביטול"
      danger
      onConfirm={() => {
        if (deleteItemId) {
          removeItem(deleteItemId);
          if (editingId === deleteItemId) setEditingId(null);
        }
      }}
      onCancel={() => setDeleteItemId(null)}
    />
    <ConfirmDialog
      open={showClearBasketConfirm}
      title="ניקוי הסל"
      message="לנקות את כל פריטי הסל? לא ניתן לשחזר."
      confirmLabel="נקה הכל"
      cancelLabel="ביטול"
      danger
      onConfirm={() => clearBasket()}
      onCancel={() => setShowClearBasketConfirm(false)}
    />
    {toastEl}
    </>
  );
}