import type { Metadata } from 'next';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { withSiteMetadata } from '@/lib/site-metadata';
import { absoluteUrl } from '@/lib/site-url';
import {
  CONTRACTOR_LANDING_DAYS,
  CONTRACTOR_LANDING_EXTRA_ROUND,
  CONTRACTOR_LANDING_PRICE,
  contractorLandingWhatsAppLink,
  formatOfferShekels,
} from '@/lib/contractor-landing';
import { JsonLd } from '../_seo/SeoComponents';
import FloatingTalkButton from './FloatingTalkButton';
import WebsiteVisitTracker from './WebsiteVisitTracker';

const PRICE_LABEL = formatOfferShekels(CONTRACTOR_LANDING_PRICE);
const EXTRA_ROUND_LABEL = formatOfferShekels(CONTRACTOR_LANDING_EXTRA_ROUND);
const WHATSAPP = contractorLandingWhatsAppLink();

const included = [
  'עמוד אחד, לטלפון ולמחשב',
  'השירותים, תמונות העבודות והמלצות',
  'כפתור וואטסאפ עם הודעה מוכנה',
  'כתיבה ועיצוב לפי העסק, לא תבנית מוכנה',
  'שני סבבים של תיקונים',
  'חיבור לדומיין, אם כבר יש לכם אחד',
];

const faq = [
  {
    question: 'למי הדף מתאים?',
    answer:
      'לכל עסק שצריך מקום אחד ברור לשלוח אליו לקוחות. זה יכול להיות קבלן, מטפל, יועץ, חנות, או כל עצמאי אחר.',
  },
  {
    question: `האם ${PRICE_LABEL} זה המחיר הסופי?`,
    answer: `כן. ${PRICE_LABEL}, בלי מע״מ נוסף ובלי דמי שימוש חודשיים על הדף.`,
  },
  {
    question: 'מה עם הדומיין?',
    answer:
      'הדומיין הוא תשלום שנתי, בנפרד ממחיר הדף. אפשר לשלם אותו דרכנו, או ישירות באתרים שמוכרים דומיינים. החיבור של הדומיין לדף כלול במחיר.',
  },
  {
    question: 'איך משלמים?',
    answer: 'בשני חלקים. את הראשון בתחילת העבודה, ואת השני לפני שהדף עולה.',
  },
  {
    question: 'תוך כמה זמן הדף מוכן?',
    answer: `${CONTRACTOR_LANDING_DAYS} ימי עסקים מהרגע שיש תשלום ראשון ותשובות לשאלון.`,
  },
  {
    question: 'מה אם נרצה עוד סבב תיקונים?',
    answer: `שני סבבים כלולים במחיר. סבב נוסף עולה ${EXTRA_ROUND_LABEL}.`,
  },
];

export const metadata: Metadata = withSiteMetadata('/website', {
  title: `דף נחיתה לעסק | ${PRICE_LABEL}`,
  description: `דף נחיתה מקצועי לעסק: השירותים, תמונות, המלצות וכפתור וואטסאפ. מותאם לנייד. ${PRICE_LABEL} מחיר סופי, בלי מע״מ נוסף.`,
  openGraph: {
    title: `דף נחיתה לעסק, ${PRICE_LABEL}`,
    description: `מקום אחד לשלוח אליו לקוחות. עמוד מותאם לנייד, עם כפתור וואטסאפ ישיר.`,
  },
});

function WhatsAppButton({ className = '' }: { className?: string }) {
  return (
    <a
      href={WHATSAPP}
      target="_blank"
      rel="noopener noreferrer"
      data-contact-cta=""
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-[#128C7E] px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#0e7569] ${className}`}
    >
      <MessageCircle size={18} aria-hidden />
      לדבר איתנו בוואטסאפ
    </a>
  );
}

function ExamplePhone() {
  return (
    <div className="w-[158px] rounded-[1.7rem] bg-black p-[6px] shadow-[0_18px_40px_rgba(40,28,16,0.28)] sm:w-[196px] sm:rounded-[2rem] sm:p-2">
      <div className="relative flex h-[250px] flex-col overflow-hidden rounded-[1.35rem] bg-[#f7f4ef] sm:h-[330px] sm:rounded-[1.55rem]">
        <div className="pointer-events-none absolute left-1/2 top-1.5 z-10 h-3.5 w-14 -translate-x-1/2 rounded-full bg-black sm:h-4 sm:w-16" />
        <div className="relative h-[104px] shrink-0 sm:h-[142px]">
          <img src="/website/alon-kitchen.jpg" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 p-2.5 text-white sm:p-3">
            <p className="text-[8px] text-white/80 sm:text-[10px]">נגרות בהתאמה אישית</p>
            <p className="text-base font-black leading-none sm:text-xl">סדנת אלון</p>
          </div>
        </div>
        <div className="flex flex-1 flex-col px-2 pb-2 pt-2 sm:px-2.5 sm:pb-2.5">
          <p className="text-[9px] leading-4 text-neutral-700 sm:text-[11px]">
            מטבחים, ספריות ושולחנות מעץ מלא.
          </p>
          <div className="mt-1.5 flex gap-1 sm:mt-2 sm:gap-1.5">
            <img
              src="/website/alon-detail.jpg"
              alt=""
              className="h-9 min-w-0 flex-1 rounded-md object-cover sm:h-11"
            />
            <img
              src="/website/alon-library.jpg"
              alt=""
              className="h-9 min-w-0 flex-1 rounded-md object-cover sm:h-11"
            />
          </div>
          <div className="mt-auto flex items-center justify-center gap-1 rounded-full bg-black py-1.5 text-[10px] font-bold text-white sm:py-2 sm:text-xs">
            <MessageCircle size={12} aria-hidden />
            וואטסאפ
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkshopSite() {
  return (
    <div className="flex h-full flex-col bg-[#f7f4ef]" dir="rtl">
      <div className="relative min-h-0 flex-[1.35]">
        <img src="/website/alon-kitchen.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-6">
          <p className="text-[9px] text-white/80 sm:text-xs">נגרות בהתאמה אישית</p>
          <p className="mt-1 text-xl font-black leading-none sm:text-4xl">סדנת אלון</p>
          <p className="mt-1 hidden max-w-xs text-sm leading-5 text-white/85 sm:block">
            מטבחים, ספריות ושולחנות מעץ מלא.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 sm:gap-4 sm:px-6 sm:py-4">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-semibold text-neutral-500 sm:text-xs">עבודות</p>
          <div className="mt-1 flex gap-1.5 sm:mt-2 sm:gap-2">
            <img
              src="/website/alon-detail.jpg"
              alt=""
              className="h-10 min-w-0 flex-1 rounded-md object-cover sm:h-20 sm:rounded-xl"
            />
            <img
              src="/website/alon-library.jpg"
              alt=""
              className="h-10 min-w-0 flex-1 rounded-md object-cover sm:h-20 sm:rounded-xl"
            />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-black px-2.5 py-1.5 text-[9px] font-bold text-white sm:px-4 sm:py-2 sm:text-xs">
          <MessageCircle size={12} aria-hidden />
          וואטסאפ
        </div>
      </div>
    </div>
  );
}

function ExampleDevices() {
  return (
    <figure className="mx-auto mt-12 max-w-4xl sm:mt-16">
      <div className="relative">
        <div className="mx-auto w-[90%] sm:w-full">
          <div className="rounded-[1rem] bg-[#161616] p-2 shadow-[0_24px_50px_rgba(20,16,12,0.18)] sm:rounded-[1.25rem] sm:p-3">
            <div className="mb-2 flex justify-center sm:mb-2.5">
              <div className="h-1 w-8 rounded-full bg-white/25 sm:h-1.5 sm:w-10" />
            </div>
            <div className="h-[230px] overflow-hidden rounded-md sm:h-[390px] sm:rounded-lg">
              <WorkshopSite />
            </div>
          </div>
          <div className="mx-auto h-4 w-20 bg-[#1c1c1c] sm:h-6 sm:w-28" />
          <div className="mx-auto h-2.5 w-36 rounded-b-xl bg-[#111] sm:h-3 sm:w-52" />
        </div>
        <div className="absolute bottom-8 left-0 z-10 sm:bottom-12 sm:left-6">
          <ExamplePhone />
        </div>
      </div>
      <figcaption className="mt-4 text-center text-sm text-neutral-500">
        סדנת אלון היא דוגמה. אותו דף נפתח בטלפון ובמחשב.
      </figcaption>
    </figure>
  );
}

export default function ContractorLandingPage() {
  const pageUrl = absoluteUrl('/website') ?? '';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'דף נחיתה לעסק',
    serviceType: 'בניית דף נחיתה',
    areaServed: 'IL',
    description: 'דף נחיתה מקצועי לעסק, מותאם לנייד, עם כפתור וואטסאפ ישיר ומחיר סופי.',
    provider: { '@type': 'Organization', name: 'בונה הצעות מחיר' },
    ...(pageUrl ? { url: pageUrl } : {}),
    offers: {
      '@type': 'Offer',
      price: String(CONTRACTOR_LANDING_PRICE),
      priceCurrency: 'ILS',
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className="bg-[#f3f0ea] text-black" dir="rtl">
        <div className="mx-auto max-w-5xl px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
          <header className="text-center">
            <h1 className="mx-auto max-w-4xl text-[2.7rem] font-black leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
              דף נחיתה מקצועי
              <br />
              לעסק שלכם
            </h1>
            <p className="mx-auto mt-6 max-w-md text-base text-neutral-600 sm:text-lg">
              כל מה שלקוח צריך לדעת, במקום אחד.
            </p>
          </header>

          <ExampleDevices />

          <div className="mt-8 flex justify-center">
            <WhatsAppButton className="w-full max-w-xs sm:w-auto" />
          </div>

          <section className="mx-auto mt-16 max-w-2xl sm:mt-24" aria-labelledby="fit-heading">
            <h2 id="fit-heading" className="text-3xl font-black leading-tight sm:text-5xl">
              הדף נבנה במיוחד עבור העסק שלכם
            </h2>
            <div className="mt-6 space-y-4 text-lg leading-8 text-neutral-700">
              <p>לקוחות רוצים להבין במהירות מי אתם, מה אתם מציעים, ולמה כדאי להם לבחור דווקא בכם.</p>
              <p>
                דף נחיתה עושה את זה. מקום אחד שאפשר לשלוח אליו כל לקוח שמתעניין, והוא נפתח טוב
                בטלפון ובמחשב.
              </p>
              <p>
                אנחנו מתאימים את התוכן, העיצוב והתמונות לתחום שלכם. אתם שולחים את המידע והחומרים,
                ואנחנו הופכים אותם לדף שמציג את העסק כמו שצריך.
              </p>
            </div>
          </section>

          <section className="mx-auto mt-16 max-w-2xl sm:mt-24" aria-labelledby="price-heading">
            <p className="max-w-xl text-2xl font-black leading-tight sm:text-3xl">
              מחיר אחד, תשלום חד-פעמי, בלי הוצאות חודשיות.
            </p>
            <p className="mt-5 text-5xl font-black tracking-tight sm:text-7xl">{PRICE_LABEL}</p>
            <p className="mt-5 max-w-md text-lg leading-8 text-neutral-700">
              העסק שלך מקבל בית מקצועי באינטרנט.
            </p>

            <h2 id="price-heading" className="mt-14 text-2xl font-black">
              מה כלול
            </h2>
            <ul className="mt-4 divide-y divide-black/10 border-y border-black/10">
              {included.map((item) => (
                <li key={item} className="py-3.5 text-lg leading-7">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="mx-auto mt-16 max-w-2xl" aria-labelledby="steps-heading">
            <h2 id="steps-heading" className="text-3xl font-black leading-tight sm:text-5xl">
              איך זה עובד בפועל
            </h2>
            <ol className="space-y-8 border-t border-black/10 pt-8">
              <li>
                <p className="text-sm font-bold">01</p>
                <p className="mt-2 text-lg leading-8 text-neutral-700">
                  כותבים לנו בוואטסאפ. אם זה מתאים, אתם שולחים בקצרה מה העסק עושה, למי הוא פונה,
                  ומספר טלפון. תמונות והמלצות עוזרות, אבל אפשר להתחיל גם בלעדיהן.
                </p>
              </li>
              <li>
                <p className="text-sm font-bold">02</p>
                <p className="mt-2 text-lg leading-8 text-neutral-700">
                  אנחנו בונים את העמוד ומעבירים לכם לראות. יש שני סבבים של תיקונים. אחרי האישור,
                  ואחרי החלק השני של התשלום, הדף עולה לאוויר. זה לוקח {CONTRACTOR_LANDING_DAYS}{' '}
                  ימי עסקים מהרגע שיש תשלום ראשון ותשובות לשאלון.
                </p>
              </li>
            </ol>
            <WhatsAppButton className="mt-8 w-full sm:w-auto" />
          </section>

          <section className="mx-auto mt-20 max-w-2xl" aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="text-3xl font-black">
              שאלות שעולות בדרך כלל
            </h2>
            <div className="mt-4 divide-y divide-black/10 border-y border-black/10">
              {faq.map((item) => (
                <details key={item.question} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                    <span>{item.question}</span>
                    <span className="text-xl leading-none text-neutral-400 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-2 leading-8 text-neutral-700">{item.answer}</p>
                </details>
              ))}
            </div>
            <p className="mt-10 text-neutral-600">
              להוציא הצעת מחיר ללקוח{' '}
              <Link href="/?try=1" className="font-semibold text-black underline">
                אפשר כאן
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
      <FloatingTalkButton href={WHATSAPP} />
      <WebsiteVisitTracker />
    </>
  );
}
