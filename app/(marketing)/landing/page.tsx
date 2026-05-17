import Link from 'next/link';
import type { Metadata } from 'next';
import {
  FileText,
  MessageCircle,
  LayoutGrid,
  CheckCircle2,
  Smartphone,
  Zap,
  Cloud,
  Building2,
  Ruler,
} from 'lucide-react';
import { absoluteUrl, getSiteUrl } from '../../../lib/site-url';
import { LandingImage } from './LandingImage';
import { LandingVideo } from './LandingVideo';
import { PhoneMockup } from './PhoneMockup';
import LandingFaq from './LandingFaq';
import LandingJsonLd from './LandingJsonLd';

const siteUrl = getSiteUrl();
const landingCanonical = absoluteUrl('/landing') ?? '/landing';
const ogImage = absoluteUrl('/landing/og-image.png') ?? '/landing/og-image.png';

export const metadata: Metadata = {
  title: 'מחולל הצעות מחיר לקבלנים ושיפוצניקים | הצעת מחיר לדוגמא',
  description:
    'מחולל הצעות מחיר לקבלנים ושיפוצניקים – צור PDF מקצועי וממותג ב-60 שניות מהשטח. תמחור דינמי, שליחה בוואטסאפ, הצעת מחיר לדוגמא בחינם.',
  alternates: {
    canonical: landingCanonical,
  },
  openGraph: {
    title: 'מחולל הצעות מחיר לקבלנים ושיפוצניקים',
    description:
      'הצעת מחיר מקצועית ב-60 שניות. PDF ממותג, שליחה בוואטסאפ – נסה בחינם.',
    locale: 'he_IL',
    type: 'website',
    url: landingCanonical,
    images: [{ url: ogImage, width: 1200, height: 630, alt: 'מחולל הצעות מחיר – תצוגת PDF' }],
  },
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
};

const steps = [
  {
    title: 'בוחרים ענף',
    text: 'צבע, אינסטלציה, חשמל, מיזוג, גבס, דלתות ועוד – כל התחומים במקום אחד.',
    img: '/landing/step-1-categories.png',
    imgAlt: 'מחולל הצעות מחיר – בחירת תחום עבודה',
  },
  {
    title: 'מסמנים אקסטרות ומעדכנים מחיר',
    text: 'מחיר בסיס ברור, שאלות רלוונטיות (כן/לא) ותוספות – הסה"כ מתעדכן בזמן אמת.',
    img: '/landing/step-2-pricing.png',
    imgAlt: 'מחולל הצעות מחיר – התאמת מחיר ותוספות',
  },
  {
    title: 'שולחים ללקוח בוואטסאפ',
    text: 'הצעה מסודרת עם הלוגו שלך – הורדה למכשיר או שיתוף ישיר ללקוח.',
    img: '/landing/step-3-pdf.png',
    imgAlt: 'מחולל הצעות מחיר – PDF ממותג מוכן לשליחה',
  },
];

const painSolutionCards = [
  {
    icon: Cloud,
    title: 'בלי ניירת',
    text: 'הכל נשמר בענן כשמתחברים – נגיש מכל מקום. בלי אקסל ובלי נייר.',
  },
  {
    icon: Building2,
    title: 'נראה כמו חברה גדולה',
    text: 'PDF עם לוגו, שם העסק ופרטי התקשורת – משדר מקצועיות ללקוח.',
  },
  {
    icon: Ruler,
    title: 'תמחור מדויק',
    text: 'מחירונים לענפי הבנייה – בסיס + תוספות בשקיפות בשטח.',
  },
];

const features = [
  {
    icon: LayoutGrid,
    title: 'תחומים רבים',
    text: 'צבע, אינסטלציה, חשמל, ריצוף, מיזוג, נגרות, גבס, דלתות ועוד.',
  },
  {
    icon: Zap,
    title: 'תמחור מהיר',
    text: 'שאלות לפי סוג העבודה ותוספות – הכל בזמן אמת.',
  },
  {
    icon: FileText,
    title: 'PDF עם הלוגו שלך',
    text: 'הצעה מקצועית מוכנה להורדה או לשליחה.',
  },
  {
    icon: MessageCircle,
    title: 'שליחה בוואטסאפ',
    text: 'שיתוף ישיר ללקוח מהמכשיר או מהמחשב.',
  },
  {
    icon: Smartphone,
    title: 'עובד בדפדפן',
    text: 'אפשר להוסיף למסך הבית ולעבוד מהשטח.',
  },
  {
    icon: CheckCircle2,
    title: 'היסטוריה וטיוטות',
    text: 'הצעות וטיוטות – הכל באיזור האישי.',
  },
];

function HeroCtas() {
  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-md mx-auto lg:mx-0 lg:items-start">
      <Link
        href="/signup?from=%2Fcategory%2Fpaint"
        className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] transition-all text-lg shadow-lg shadow-blue-600/25 hover:shadow-xl"
      >
        התחל עכשיו בחינם
      </Link>
      <Link
        href="/category/paint"
        className="text-sm text-slate-500 hover:text-blue-600 underline underline-offset-2 transition-colors"
      >
        או: נסה קודם בלי הרשמה
      </Link>
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      <LandingJsonLd />
      <main className="min-h-screen bg-[#F8FAFC]" dir="rtl">
        <header className="relative overflow-hidden border-b border-slate-100/80">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/90 to-transparent pointer-events-none" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-10 sm:pb-16">
            <div className="flex flex-col items-center text-center lg:items-start lg:text-right max-w-xl mx-auto lg:mx-0 lg:max-w-none">
              <h1 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-black text-[#0F172A] leading-tight mb-4 w-full">
                מחולל הצעות מחיר לקבלנים ושיפוצניקים
              </h1>
              <p className="text-base sm:text-lg text-slate-600 mb-6 leading-relaxed w-full">
                צור הצעת מחיר מקצועית ב-60 שניות – ישר מהשטח. תפסיק לבזבז שעות על אקסלים בערב ותתחיל
                להרוויח יותר.
              </p>
              <HeroCtas />
            </div>

            <div className="mt-10 flex justify-center lg:mt-12">
              <PhoneMockup>
                <LandingVideo className="w-full h-full object-cover object-top scale-[1.02]" />
              </PhoneMockup>
            </div>
          </div>
        </header>

        <section className="py-14 sm:py-20 bg-white" aria-labelledby="pain-solution-heading">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 id="pain-solution-heading" className="sr-only">
              למה מחולל הצעות מחיר
            </h2>
            <div className="grid sm:grid-cols-3 gap-6 lg:gap-8">
              {painSolutionCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="bg-[#F8FAFC] rounded-2xl p-6 border border-slate-100 text-center"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4 text-[#2563eb]">
                      <Icon size={28} />
                    </div>
                    <h3 className="font-bold text-[#0F172A] text-lg mb-2">{card.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{card.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section
          className="py-14 sm:py-24 bg-[#F8FAFC]"
          aria-labelledby="how-heading"
          id="how-it-works"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 id="how-heading" className="text-2xl sm:text-3xl font-bold text-[#0F172A] text-center mb-4">
              איך זה עובד
            </h2>
            <p className="text-slate-600 text-center max-w-2xl mx-auto mb-12">
              שלושה צעדים מהבחירה עד לשליחה ללקוח.
            </p>
            <div className="space-y-14 sm:space-y-20">
              {steps.map((step, i) => (
                <div
                  key={step.title}
                  className={`grid md:grid-cols-2 gap-8 items-center ${i % 2 === 1 ? 'md:[&>div:first-child]:order-2' : ''}`}
                >
                  <div className="text-center md:text-right">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-[#2563eb] font-bold text-lg mb-4">
                      {i + 1}
                    </span>
                    <h3 className="text-xl font-bold text-[#0F172A] mb-2">{step.title}</h3>
                    <p className="text-slate-600">{step.text}</p>
                  </div>
                  <div className="flex justify-center">
                    <PhoneMockup className="w-[240px] sm:w-[260px]">
                      <LandingImage
                        src={step.img}
                        alt={step.imgAlt}
                        loading="lazy"
                        className="w-full h-full object-cover object-top"
                      />
                    </PhoneMockup>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-24 bg-white" aria-labelledby="features-heading">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 id="features-heading" className="text-2xl sm:text-3xl font-bold text-[#0F172A] text-center mb-4">
              מה תקבל
            </h2>
            <p className="text-slate-600 text-center max-w-2xl mx-auto mb-12">
              כל מה שצריך כדי להציע ללקוח במהירות ובמקצועיות.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="bg-[#F8FAFC] rounded-2xl p-6 border border-slate-100"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 text-[#2563eb]">
                      <Icon size={24} />
                    </div>
                    <h3 className="font-bold text-[#0F172A] mb-2">{f.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{f.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <LandingFaq />

        <section className="py-14 sm:py-20 bg-gradient-to-b from-slate-50 to-white" aria-labelledby="cta-heading">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 id="cta-heading" className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-4">
              מוכן להתחיל?
            </h2>
            <p className="text-slate-600 mb-8">
              חינם. בלי כרטיס אשראי. עובד בדפדפן – אפשר גם להוסיף למסך הבית.
            </p>
            <HeroCtas />
          </div>
        </section>
      </main>
    </>
  );
}
