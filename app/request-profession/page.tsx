'use client';

import Link from 'next/link';
import { ArrowRight, MessageCircle, Sparkles, Wrench } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { buildWhatsAppLink } from '../../lib/contact-links';

const WHATSAPP_MESSAGE = 'שלום, אני מבקש להוסיף מקצוע חדש לאפליקציה בונה הצעות מחיר. המקצוע שאני צריך: ';

export default function RequestProfessionPage() {
  const { t, dir } = useLanguage();
  const whatsappHref = buildWhatsAppLink(WHATSAPP_MESSAGE);

  return (
    <main className="min-h-screen bg-[#F8FAFC]" dir={dir}>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/90 to-transparent pointer-events-none" />
        <div className="relative max-w-lg mx-auto px-5 py-8 sm:py-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium mb-8 min-h-[44px]"
          >
            <ArrowRight size={20} /> {t('requestProfession.backHome')}
          </Link>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-l from-blue-600 to-blue-500 px-6 py-8 text-white text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                <Wrench size={32} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black mb-2">{t('requestProfession.title')}</h1>
              <p className="text-blue-100 text-sm sm:text-base leading-relaxed">{t('requestProfession.subtitle')}</p>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <Sparkles size={22} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-slate-600 text-sm leading-relaxed">{t('requestProfession.explanation')}</p>
              </div>

              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">1</span>
                  {t('requestProfession.step1')}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">2</span>
                  {t('requestProfession.step2')}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">3</span>
                  {t('requestProfession.step3')}
                </li>
              </ul>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] transition-all shadow-lg shadow-green-600/20 active:scale-[0.98]"
              >
                <MessageCircle size={24} />
                {t('requestProfession.whatsappButton')}
              </a>

              <p className="text-center text-xs text-slate-400">{t('requestProfession.note')}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
