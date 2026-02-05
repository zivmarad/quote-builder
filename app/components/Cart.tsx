'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuoteBasket } from '../contexts/QuoteBasketContext';
import { useProfile } from '../contexts/ProfileContext';
import { useQuoteHistory } from '../contexts/QuoteHistoryContext';
import { useSettings } from '../contexts/SettingsContext';
import { Trash2, Edit2, Check, X, ShoppingBag, Plus, FileText, Share2 } from 'lucide-react';
import { generateQuotePDF, generateQuotePDFAsBlob } from './utils/pdfExport';

export default function Cart() {
  const router = useRouter();
  const {
    items,
    addItem,
    removeItem,
    removeExtraFromItem,
    updateItemPrice,
    clearItemPriceOverride,
    clearBasket,
    totalBeforeVAT,
    VAT: contextVAT,
    totalWithVAT: contextTotalWithVAT,
  } = useQuoteBasket();
  const { profile } = useProfile();
  const { addQuote } = useQuoteHistory();
  const { defaultQuoteTitle, nextQuoteNumber, setNextQuoteNumber, validityDays } = useSettings();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [contactType, setContactType] = useState<'none' | 'phone' | 'email' | 'address'>('none');
  const [contactValue, setContactValue] = useState('');
  const [notes, setNotes] = useState('');
  const lastShareBlobRef = useRef<Blob | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customExtras, setCustomExtras] = useState<Array<{ text: string; price: number }>>([]);

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
    customerPhone: contactType === 'phone' ? contactValue.trim() : undefined,
    customerEmail: contactType === 'email' ? contactValue.trim() : undefined,
    customerAddress: contactType === 'address' ? contactValue.trim() : undefined,
  });

  const handleExportPDF = () => {
    const { customerPhone, customerEmail, customerAddress } = getCustomerContact();
    addQuote({
      items,
      totalBeforeVAT,
      VAT,
      totalWithVAT,
      customerName: customerName.trim() || undefined,
      customerPhone,
      customerEmail,
      customerAddress,
      notes: notes.trim() || undefined,
      quoteNumber: nextQuoteNumber,
      status: 'download',
    });
    generateQuotePDF(items, totalBeforeVAT, VAT, totalWithVAT, profile, customerName || undefined, notes || undefined, defaultQuoteTitle, nextQuoteNumber, customerPhone, customerEmail, customerAddress, validityDays ?? undefined);
    setNextQuoteNumber(nextQuoteNumber + 1);
    clearBasket();
    setCustomerName('');
    setContactType('none');
    setContactValue('');
    setNotes('');
    setToast('ה-PDF הורד וההצעה נשמרה');
    setTimeout(() => router.push('/'), 2500);
  };

  /** שלב 1: הכנת PDF. שלב 2: במודל – לחיצה על "שתף עכשיו" קוראת ל-navigator.share() במחווה ישירה, כך שמסך השיתוף נפתח במובייל. */
  const handleShareToWhatsApp = async () => {
    setIsSharing(true);
    const { customerPhone, customerEmail, customerAddress } = getCustomerContact();
    addQuote({
      items,
      totalBeforeVAT,
      VAT,
      totalWithVAT,
      customerName: customerName.trim() || undefined,
      customerPhone,
      customerEmail,
      customerAddress,
      notes: notes.trim() || undefined,
      quoteNumber: nextQuoteNumber,
      status: 'whatsapp',
    });
    try {
      const blob = await generateQuotePDFAsBlob(items, totalBeforeVAT, VAT, totalWithVAT, profile, customerName || undefined, notes || undefined, defaultQuoteTitle, nextQuoteNumber, customerPhone, customerEmail, customerAddress, validityDays ?? undefined);
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
      setContactType('none');
      setContactValue('');
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
    setContactType('none');
    setContactValue('');
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
    setContactType('none');
    setContactValue('');
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
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 border-dashed border-2">
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
                  <div>
                    <span className="block text-sm font-bold text-slate-700 mb-2">תוספות</span>
                    {customExtras.map((extra, idx) => (
                      <div key={idx} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={extra.text}
                          onChange={(e) => handleUpdateCustomExtra(idx, 'text', e.target.value)}
                          placeholder="שם התוספת"
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                        />
                        <input
                          type="number"
                          value={extra.price || ''}
                          onChange={(e) => handleUpdateCustomExtra(idx, 'price', e.target.value)}
                          placeholder="מחיר"
                          min={0}
                          className="w-24 px-3 py-2 rounded-lg border border-slate-200 text-sm text-left"
                        />
                        <button type="button" onClick={() => handleRemoveCustomExtra(idx)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 size={18} />
                        </button>
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
            onClick={() => window.confirm('לנקות את כל פריטי הסל? לא ניתן לשחזר.') && clearBasket()}
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
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">{item.name}</h3>
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
                          <button onClick={() => removeItem(item.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors" title="הסר שירות"><Trash2 size={18} /></button>
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
                        onClick={() => { removeItem(item.id); setEditingId(null); }}
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
            <div className="px-6 pb-6 pt-2 bg-slate-50/50 border-t border-slate-100">
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm max-w-lg mr-auto">
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
                    <div>
                      <span className="block text-sm font-bold text-slate-700 mb-2">תוספות</span>
                      {customExtras.map((extra, idx) => (
                        <div key={idx} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={extra.text}
                            onChange={(e) => handleUpdateCustomExtra(idx, 'text', e.target.value)}
                            placeholder="שם התוספת"
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                          />
                          <input
                            type="number"
                            value={extra.price || ''}
                            onChange={(e) => handleUpdateCustomExtra(idx, 'price', e.target.value)}
                            placeholder="מחיר"
                            min={0}
                            className="w-24 px-3 py-2 rounded-lg border border-slate-200 text-sm text-left"
                          />
                          <button type="button" onClick={() => handleRemoveCustomExtra(idx)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 size={18} />
                          </button>
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

        {/* פרטי לקוח והערות – מופיעים בהצעת המחיר: רק שם + אמצעי קשר מרשימה */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 space-y-4">
          <div>
            <label htmlFor="customerName" className="block text-sm font-bold text-slate-700 mb-2 text-right">
              שם הלקוח
            </label>
            <input
              id="customerName"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="למשל: ישראל ישראלי"
              className="w-full max-w-xs mr-0 ml-auto block px-4 py-3 min-h-[48px] rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end max-w-md mr-0 ml-auto">
            <div className="flex-1 min-w-0">
              <label htmlFor="contactType" className="block text-sm font-bold text-slate-700 mb-2 text-right">
                אמצעי ליצירת קשר
              </label>
              <select
                id="contactType"
                value={contactType}
                onChange={(e) => {
                  setContactType(e.target.value as 'none' | 'phone' | 'email' | 'address');
                  setContactValue('');
                }}
                className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right bg-white"
              >
                <option value="none">לא צוין</option>
                <option value="phone">טלפון</option>
                <option value="email">אימייל</option>
                <option value="address">כתובת</option>
              </select>
            </div>
            {contactType !== 'none' && (
              <div className="flex-1 min-w-0">
                <label htmlFor="contactValue" className="block text-sm font-bold text-slate-700 mb-2 text-right">
                  {contactType === 'phone' && 'מספר טלפון'}
                  {contactType === 'email' && 'כתובת אימייל'}
                  {contactType === 'address' && 'כתובת'}
                </label>
                <input
                  id="contactValue"
                  type={contactType === 'email' ? 'email' : 'text'}
                  value={contactValue}
                  onChange={(e) => setContactValue(e.target.value)}
                  placeholder={
                    contactType === 'phone' ? '050-1234567' :
                    contactType === 'email' ? 'customer@example.com' : 'רחוב, עיר'
                  }
                  className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  dir={contactType === 'phone' || contactType === 'email' ? 'ltr' : 'rtl'}
                />
              </div>
            )}
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-bold text-slate-700 mb-2 text-right">
              הערות (אופציונלי)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="למשל: המחיר לא כולל חומרים, צפי לסיום..."
              rows={3}
              className="w-full max-w-md mr-0 ml-auto block px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right resize-y"
            />
          </div>
        </div>

        <div className="bg-slate-50 p-4 sm:p-8 border-t border-slate-100">
          <div className="max-w-xs mr-auto space-y-3 text-right">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-slate-500">סיכום ביניים</span>
              <span className="text-slate-900 font-bold">{formatPrice(totalBeforeVAT)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span className="text-slate-500">מע"מ (18%)</span>
              <span className="text-slate-900 font-bold">{formatPrice(VAT)}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <span className="text-lg font-black text-slate-900">סה"כ לתשלום</span>
              <span className="text-2xl font-black text-blue-600">{formatPrice(totalWithVAT)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-6 sm:mt-8">
        <button
          type="button"
          onClick={handleShareToWhatsApp}
          disabled={isSharing}
          className="flex items-center justify-center gap-2 sm:gap-3 bg-blue-600 text-white py-4 sm:py-5 px-6 sm:px-8 rounded-xl sm:rounded-2xl font-black text-lg sm:text-xl hover:bg-blue-700 shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed min-h-[52px] active:scale-[0.98]"
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
          className="flex items-center justify-center gap-2 sm:gap-3 bg-white text-slate-900 border-2 border-slate-200 py-4 sm:py-5 px-6 sm:px-8 rounded-xl sm:rounded-2xl font-black text-lg sm:text-xl hover:bg-slate-50 transition-all shadow-sm min-h-[52px] active:scale-[0.98]"
          aria-label="הורד הצעת מחיר כקובץ PDF"
        >
          <FileText size={22} className="shrink-0 sm:w-6 sm:h-6" /> הורד כ-PDF
        </button>
      </div>

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
    {toastEl}
    </>
  );
}