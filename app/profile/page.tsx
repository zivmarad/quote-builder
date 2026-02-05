'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProfile } from '../contexts/ProfileContext';
import { useQuoteHistory, type QuoteStatus } from '../contexts/QuoteHistoryContext';
import { useQuoteBasket } from '../contexts/QuoteBasketContext';
import { useSettings } from '../contexts/SettingsContext';
import { generateQuotePDFAsBlob } from '../components/utils/pdfExport';
import RequireAuth from '../components/RequireAuth';
import { useAuth } from '../contexts/AuthContext';
import { usePriceOverrides } from '../contexts/PriceOverridesContext';
import { categories } from '../service/services';
import { ArrowRight, UserCircle, History, Settings, FileText, ChevronLeft, Download, Trash2, Copy, DollarSign, KeyRound } from 'lucide-react';

type SectionId = 'details' | 'history' | 'settings';

const sections: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: 'details', label: 'פרטים', icon: <UserCircle size={22} /> },
  { id: 'history', label: 'היסטוריית הצעות', icon: <History size={22} /> },
  { id: 'settings', label: 'הגדרות', icon: <Settings size={22} /> },
];

const formatPrice = (price: number) =>
  new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);

const statusLabels: Record<QuoteStatus, string> = {
  download: 'הורד למחשב',
  whatsapp: 'נשלח בוואטסאפ',
  email: 'נשלח במייל',
};

export default function ProfilePage() {
  const router = useRouter();
  const { profile, setProfile } = useProfile();
  const { quotes, deleteQuote } = useQuoteHistory();
  const { loadBasket } = useQuoteBasket();
  const { defaultQuoteTitle, nextQuoteNumber, validityDays, setDefaultQuoteTitle, setNextQuoteNumber, setValidityDays } = useSettings();
  const { getBasePrice, setBasePrice } = usePriceOverrides();
  const { user: authUser, changePassword } = useAuth();
  const [activeSection, setActiveSection] = useState<SectionId>('details');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleDuplicateQuote = (quoteId: string) => {
    const quote = quotes.find((q) => q.id === quoteId);
    if (!quote?.items?.length) return;
    loadBasket(quote.items);
    router.push('/cart');
  };

  const handleDeleteQuote = (quoteId: string) => {
    if (!window.confirm('למחוק הצעה זו מההיסטוריה? לא ניתן לשחזר.')) return;
    deleteQuote(quoteId);
  };

  const handleDownloadQuote = async (quoteId: string) => {
    const quote = quotes.find((q) => q.id === quoteId);
    if (!quote) return;
    setDownloadingId(quoteId);
    try {
      const blob = await generateQuotePDFAsBlob(
        quote.items,
        quote.totalBeforeVAT,
        quote.VAT,
        quote.totalWithVAT,
        profile,
        quote.customerName ?? undefined,
        quote.notes ?? undefined,
        undefined,
        quote.quoteNumber ?? undefined,
        quote.customerPhone ?? undefined,
        quote.customerEmail ?? undefined,
        quote.customerAddress ?? undefined,
        validityDays
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hatzaat-mechir-${quote.createdAt.slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setProfile({ logo: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    if (newPassword !== confirmNewPassword) {
      setPasswordError('הסיסמאות לא תואמות');
      return;
    }
    if (newPassword.length < 4) {
      setPasswordError('הסיסמה החדשה חייבת לפחות 4 תווים');
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
      } else setPasswordError(result.error ?? 'שגיאה בשינוי סיסמה');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <RequireAuth>
    <main className="min-h-screen bg-[#F8FAFC] px-3 py-4 sm:p-4 md:p-8" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium mb-4 sm:mb-6 min-h-[44px] items-center"
        >
          <ArrowRight size={20} /> חזרה לדף הבית
        </Link>

        <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8">
          <nav className="md:w-56 shrink-0">
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-100 bg-slate-50/80">
                <h2 className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">איזור אישי</h2>
              </div>
              <ul className="p-1.5 sm:p-2 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible">
                {sections.map((section) => (
                  <li key={section.id} className="shrink-0 md:shrink">
                    <button
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-right font-medium text-sm transition-colors min-h-[44px] ${
                        activeSection === section.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                      }`}
                    >
                      <span className="text-slate-400 [.button:focus_&]:text-blue-500">
                        {section.icon}
                      </span>
                      {section.label}
                      {activeSection === section.id && (
                        <ChevronLeft size={18} className="mr-auto text-blue-500" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* תוכן – גלילה לפי צורך */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {activeSection === 'details' && (
                <div className="p-6 md:p-8">
                  <h1 className="text-xl font-black text-slate-900 mb-1">פרטים</h1>
                  <p className="text-slate-500 text-sm mb-6">הפרטים והלוגו שיופיעו בהצעת המחיר</p>
                  {authUser?.email && (
                    <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-xs font-bold text-slate-500 block mb-1">אימייל החשבון (להתחברות)</span>
                      <span className="text-slate-800 font-medium" dir="ltr">{authUser.email}</span>
                    </div>
                  )}
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">לוגו</label>
                      <div className="flex items-start gap-4">
                        <div
                          className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                        >
                          {profile.logo ? (
                            <img src={profile.logo} alt="לוגו" className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-slate-400 text-xs px-2">העלה לוגו</span>
                          )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                        <p className="text-slate-500 text-sm">לחץ להעלאת לוגו (PNG, JPG)</p>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="businessName" className="block text-sm font-bold text-slate-700 mb-2">שם העסק / שם מלא</label>
                      <input
                        id="businessName"
                        type="text"
                        value={profile.businessName}
                        onChange={(e) => setProfile({ businessName: e.target.value })}
                        placeholder="למשל: משה שירותי מיזוג"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="contactName" className="block text-sm font-bold text-slate-700 mb-2">שם ליצירת קשר (אופציונלי)</label>
                      <input
                        id="contactName"
                        type="text"
                        value={profile.contactName ?? ''}
                        onChange={(e) => setProfile({ contactName: e.target.value || undefined })}
                        placeholder="למשל: משה כהן"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-bold text-slate-700 mb-2">טלפון</label>
                      <input
                        id="phone"
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ phone: e.target.value })}
                        placeholder="050-1234567"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">אימייל (אופציונלי)</label>
                      <input
                        id="email"
                        type="email"
                        value={profile.email ?? ''}
                        onChange={(e) => setProfile({ email: e.target.value || undefined })}
                        placeholder="example@email.com"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label htmlFor="address" className="block text-sm font-bold text-slate-700 mb-2">כתובת (אופציונלי)</label>
                      <input
                        id="address"
                        type="text"
                        value={profile.address ?? ''}
                        onChange={(e) => setProfile({ address: e.target.value || undefined })}
                        placeholder="רחוב, עיר"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-slate-500 text-sm pt-2">הפרטים נשמרים אוטומטית ויופיעו בהצעת המחיר.</p>
                  </form>
                </div>
              )}

              {activeSection === 'history' && (
                <div className="p-6 md:p-8">
                  <h1 className="text-xl font-black text-slate-900 mb-1">היסטוריית הצעות</h1>
                  <p className="text-slate-500 text-sm mb-8">ההצעות ששמרת – הורדה מחדש או מחיקה</p>
                  {quotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50/50 rounded-2xl border border-slate-100">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
                        <FileText size={32} />
                      </div>
                      <p className="text-slate-500 text-sm max-w-xs">
                        עדיין לא נשמרו הצעות. כל הצעה שתוריד כ-PDF או תשלח בוואטסאפ תישמר כאן אוטומטית.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {quotes.map((q) => {
                        const dateStr = new Date(q.createdAt).toLocaleDateString('he-IL', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                        return (
                          <li
                            key={q.id}
                            className="flex flex-wrap items-center gap-3 md:gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900">
                                  {q.customerName?.trim() || '— ללא שם לקוח'}
                                </span>
                                {q.quoteNumber != null && (
                                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                    #{q.quoteNumber}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-slate-500">{dateStr}</div>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-sm font-semibold text-blue-600">
                                  {formatPrice(q.totalWithVAT)} סה"כ
                                </span>
                                {q.status && (
                                  <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                    {statusLabels[q.status]}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleDuplicateQuote(q.id)}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm border-2 border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                                title="שכפל לסל"
                              >
                                <Copy size={18} />
                                שכפל
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadQuote(q.id)}
                                disabled={downloadingId === q.id}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
                              >
                                <Download size={18} />
                                {downloadingId === q.id ? 'מוריד...' : 'הורד PDF'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuote(q.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                title="מחק מההיסטוריה"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}

              {activeSection === 'settings' && (
                <div className="p-6 md:p-8">
                  <h1 className="text-xl font-black text-slate-900 mb-1">הגדרות</h1>
                  <p className="text-slate-500 text-sm mb-8">כותרת הצעת המחיר ומספר הצעה – נשמר אוטומטית</p>
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-5 max-w-md">
                    <div>
                      <label htmlFor="defaultQuoteTitle" className="block text-sm font-bold text-slate-700 mb-2">
                        כותרת ברירת מחדל להצעת המחיר
                      </label>
                      <input
                        id="defaultQuoteTitle"
                        type="text"
                        value={defaultQuoteTitle}
                        onChange={(e) => setDefaultQuoteTitle(e.target.value)}
                        placeholder="הצעת מחיר"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="nextQuoteNumber" className="block text-sm font-bold text-slate-700 mb-2">
                        מספר הצעה הבא (להצגה בראש ההצעה)
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
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label htmlFor="validityDays" className="block text-sm font-bold text-slate-700 mb-2">
                        תוקף הצעה (ימים)
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
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        dir="ltr"
                      />
                      <p className="text-slate-500 text-xs mt-1">יופיע ב-PDF: &quot;הצעת מחיר זו תקפה ל-X יום&quot;</p>
                    </div>
                    <p className="text-slate-500 text-sm pt-2">ההגדרות נשמרות אוטומטית ומשמשות בעת יצירת הצעות חדשות.</p>
                  </form>

                  <div className="mt-10 pt-8 border-t border-slate-200">
                    <h2 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
                      <KeyRound size={22} /> שינוי סיסמה
                    </h2>
                    <p className="text-slate-500 text-sm mb-4">הזן סיסמה נוכחית ובחר סיסמה חדשה</p>
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                      {passwordError && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
                          {passwordError}
                        </div>
                      )}
                      {passwordSuccess && (
                        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm" role="status">
                          הסיסמה עודכנה בהצלחה
                        </div>
                      )}
                      <div>
                        <label htmlFor="current-password" className="block text-sm font-bold text-slate-700 mb-2">סיסמה נוכחית</label>
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
                        <label htmlFor="new-password" className="block text-sm font-bold text-slate-700 mb-2">סיסמה חדשה</label>
                        <input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="לפחות 4 תווים"
                          className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          dir="ltr"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="confirm-new-password" className="block text-sm font-bold text-slate-700 mb-2">אימות סיסמה חדשה</label>
                        <input
                          id="confirm-new-password"
                          type="password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="הזן שוב את הסיסמה החדשה"
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
                        {passwordLoading ? 'מעדכן...' : 'עדכן סיסמה'}
                      </button>
                    </form>
                  </div>

                  <div className="mt-10 pt-8 border-t border-slate-200">
                    <h2 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
                      <DollarSign size={22} /> מחירי בסיס מותאמים
                    </h2>
                    <p className="text-slate-500 text-sm mb-4">הגדר מחיר בסיס משלך לכל שירות. השאר ריק כדי להשתמש במחיר ברירת המחדל.</p>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                      {categories.map((cat) => (
                        <div key={cat.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <h3 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
                            <span>{cat.icon}</span> {cat.name}
                          </h3>
                          <ul className="space-y-2">
                            {cat.services.map((svc) => {
                              const effective = getBasePrice(svc.id, svc.basePrice);
                              const isOverridden = effective !== svc.basePrice;
                              return (
                                <li key={svc.id} className="flex flex-wrap items-center gap-2 sm:gap-4 py-2 border-b border-slate-100 last:border-0">
                                  <span className="flex-1 min-w-0 text-sm text-slate-800">{svc.name}</span>
                                  <span className="text-xs text-slate-500 shrink-0">ברירת מחדל: ₪{svc.basePrice.toLocaleString('he-IL')}</span>
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
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
    </RequireAuth>
  );
}
