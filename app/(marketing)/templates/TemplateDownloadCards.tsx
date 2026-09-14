'use client';

import { useState, useRef } from 'react';
import { FileText, FileSpreadsheet, Printer, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { AnalyticsEvents, trackEvent } from '@/lib/analytics';
import TemplateChoiceSheet from './TemplateChoiceSheet';

type IconKey = 'word' | 'excel' | 'print';

const ICONS = {
  word: FileText,
  excel: FileSpreadsheet,
  print: Printer,
} as const;

export interface TemplateCard {
  href: string;
  download: boolean;
  icon: IconKey;
  title: string;
  desc: string;
  cta: string;
}

const cardClassName =
  'group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 cursor-pointer hover:border-blue-300 hover:shadow-md active:scale-[0.99] transition-all';

function startFileDownload(href: string) {
  const a = document.createElement('a');
  a.href = href;
  a.setAttribute('download', '');
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * כרטיסי הורדה – כל הכרטיס לחיץ.
 * לפני ההורדה נפתח מסך בחירה: תבנית ריקה או הצעה ממותגת בבונה.
 */
export default function TemplateDownloadCards({ cards }: { cards: TemplateCard[] }) {
  const [activeHref, setActiveHref] = useState<string | null>(null);
  const [pendingCard, setPendingCard] = useState<TemplateCard | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markDownloadStarted = (href: string) => {
    setActiveHref(href);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setActiveHref(null), 2500);
  };

  const openChoice = (card: TemplateCard) => {
    setPendingCard(card);
    trackEvent(AnalyticsEvents.TemplateChoiceShown, { format: card.icon });
  };

  const chooseBuilder = () => {
    if (!pendingCard) return;
    trackEvent(AnalyticsEvents.TemplateBuilderChosen, { format: pendingCard.icon });
  };

  const choosePlain = () => {
    if (!pendingCard) return;
    const card = pendingCard;
    trackEvent(AnalyticsEvents.TemplatePlainChosen, { format: card.icon });
    setPendingCard(null);
    if (card.download) {
      startFileDownload(card.href);
      markDownloadStarted(card.href);
    }
  };

  return (
    <>
      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        {cards.map((card) => {
          const { href, icon, title, desc, cta } = card;
          const Icon = ICONS[icon];
          const isActive = activeHref === href;

          return (
            <button
              key={href}
              type="button"
              onClick={() => openChoice(card)}
              aria-live="polite"
              className={`${cardClassName} text-right`}
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb] mb-3">
                {isActive ? <Check size={22} aria-hidden /> : <Icon size={22} aria-hidden />}
              </span>
              <span className="text-base font-bold text-[#0F172A] mb-1">{title}</span>
              <p className="text-slate-600 text-sm leading-relaxed mb-3 flex-1">{desc}</p>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2563eb]">
                {isActive ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden />
                    ההורדה החלה…
                  </>
                ) : (
                  <>
                    {cta}
                    <ArrowLeft size={16} aria-hidden />
                  </>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {pendingCard && (
        <TemplateChoiceSheet
          card={pendingCard}
          onChooseBuilder={chooseBuilder}
          onChoosePlain={choosePlain}
          onClose={() => setPendingCard(null)}
        />
      )}
    </>
  );
}
