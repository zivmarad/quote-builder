'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { LANDING_FAQ_ITEMS } from './landing-faq-data';

export default function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-16 sm:py-20 bg-white" aria-labelledby="faq-heading" id="faq">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h2 id="faq-heading" className="text-2xl sm:text-3xl font-bold text-[#0F172A] text-center mb-8">
          שאלות נפוצות
        </h2>
        <div className="space-y-3">
          {LANDING_FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={item.question}
                className="rounded-2xl border border-slate-200 bg-[#F8FAFC] overflow-hidden"
              >
                <button
                  type="button"
                  id={`faq-q-${i}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-a-${i}`}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-4 text-right font-bold text-slate-900 hover:bg-slate-50/80 transition-colors"
                >
                  <span>{item.question}</span>
                  <ChevronDown
                    size={20}
                    className={`shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
                {isOpen && (
                  <div id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} className="px-4 pb-4 -mt-1">
                    <p className="text-slate-600 text-sm leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
