'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Sparkles, X } from 'lucide-react';
import type { TemplateCard } from './TemplateDownloadCards';

const FORMAT_LABEL: Record<TemplateCard['icon'], string> = {
  word: 'Word',
  excel: 'Excel',
  print: 'PDF להדפסה',
};

type TemplateChoiceSheetProps = {
  card: TemplateCard;
  builderHref?: string;
  onChooseBuilder: () => void;
  onChoosePlain: () => void;
  onClose: () => void;
};

export default function TemplateChoiceSheet({
  card,
  builderHref = '/?try=1',
  onChooseBuilder,
  onChoosePlain,
  onClose,
}: TemplateChoiceSheetProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const formatLabel = FORMAT_LABEL[card.icon];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
      dir="rtl"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 border border-slate-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-choice-title"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 id="template-choice-title" className="text-xl font-black text-slate-900 leading-snug">
            טופס ריק, או הצעה ממותגת?
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -m-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 shrink-0"
            aria-label="סגור"
          >
            <X size={22} />
          </button>
        </div>
        <p className="text-slate-600 text-sm leading-relaxed mb-4">
          אפשר להוריד תבנית {formatLabel} ולמלא ידנית — או לבנות הצעה מוכנה עם לוגו, פרטי לקוח וחישוב
          אוטומטי. בלי כרטיס אשראי.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href={builderHref}
            onClick={onChooseBuilder}
            className="w-full text-right rounded-2xl border-2 border-blue-200 bg-blue-50/80 p-4 hover:bg-blue-50 hover:border-blue-300 transition-colors active:scale-[0.99]"
          >
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-white border border-blue-100 rounded-full px-2 py-0.5 mb-2">
              <Sparkles size={12} aria-hidden />
              מומלץ
            </span>
            <span className="flex items-start justify-between gap-3">
              <span>
                <span className="block text-base font-black text-slate-900">הצעה עם לוגו וכל הפרטים</span>
                <span className="block text-sm text-slate-600 mt-1 leading-relaxed">
                  לוגו, פרטי לקוח, מע״מ אוטומטי, ו-PDF מוכן לוואטסאפ. אפשר להתחיל בלי הרשמה.
                </span>
              </span>
              <ArrowLeft size={18} className="text-blue-600 shrink-0 mt-1" aria-hidden />
            </span>
          </Link>

          {card.download ? (
            <button
              type="button"
              onClick={onChoosePlain}
              className="w-full text-right rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:bg-slate-50 transition-colors active:scale-[0.99]"
            >
              <span className="flex items-start justify-between gap-3">
                <span>
                  <span className="inline-flex items-center gap-1.5 text-base font-bold text-slate-800">
                    <FileText size={18} className="text-slate-400" aria-hidden />
                    תבנית ריקה ({formatLabel})
                  </span>
                  <span className="block text-sm text-slate-500 mt-1 leading-relaxed">
                    הורדה מיידית למילוי ידני. בלי הרשמה.
                  </span>
                </span>
                <ArrowLeft size={18} className="text-slate-400 shrink-0 mt-1" aria-hidden />
              </span>
            </button>
          ) : (
            <Link
              href={card.href}
              onClick={onChoosePlain}
              className="w-full text-right rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:bg-slate-50 transition-colors active:scale-[0.99]"
            >
              <span className="flex items-start justify-between gap-3">
                <span>
                  <span className="inline-flex items-center gap-1.5 text-base font-bold text-slate-800">
                    <FileText size={18} className="text-slate-400" aria-hidden />
                    תבנית ריקה ({formatLabel})
                  </span>
                  <span className="block text-sm text-slate-500 mt-1 leading-relaxed">
                    פתיחה מיידית להדפסה או שמירה כ-PDF. בלי הרשמה.
                  </span>
                </span>
                <ArrowLeft size={18} className="text-slate-400 shrink-0 mt-1" aria-hidden />
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
