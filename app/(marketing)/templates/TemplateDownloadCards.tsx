'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { FileText, FileSpreadsheet, Printer, ArrowLeft, Check, Loader2 } from 'lucide-react';

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

/**
 * כרטיסי הורדה – כל הכרטיס לחיץ (אייקון + כותרת + טקסט), עם משוב ויזואלי מיידי.
 * הורדות משתמשות ב-<a> רגיל (לא Next Link) כדי שהדפדפן יוריד את הקובץ ולא ינסה ניווט SPA.
 */
export default function TemplateDownloadCards({ cards }: { cards: TemplateCard[] }) {
  const [activeHref, setActiveHref] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDownloadClick = (href: string) => {
    setActiveHref(href);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setActiveHref(null), 2500);
  };

  return (
    <div className="grid sm:grid-cols-3 gap-4 mb-4">
      {cards.map((card) => {
        const { href, download, icon, title, desc, cta } = card;
        const Icon = ICONS[icon];
        const isActive = activeHref === href;

        const inner = (
          <>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb] mb-3">
              {isActive ? <Check size={22} aria-hidden /> : <Icon size={22} aria-hidden />}
            </span>
            <h2 className="text-base font-bold text-[#0F172A] mb-1">{title}</h2>
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
          </>
        );

        if (download) {
          return (
            <a
              key={href}
              href={href}
              download
              onClick={() => handleDownloadClick(href)}
              aria-live="polite"
              className={cardClassName}
            >
              {inner}
            </a>
          );
        }

        return (
          <Link key={href} href={href} className={cardClassName}>
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
