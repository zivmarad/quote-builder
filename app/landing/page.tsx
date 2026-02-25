import Link from 'next/link';
import type { Metadata } from 'next';
import { FileText, MessageCircle, LayoutGrid, CheckCircle2, Smartphone, Zap, Cloud, Building2, Ruler } from 'lucide-react';
import { LandingImage } from './LandingImage';

export const metadata: Metadata = {
  title: 'בונה הצעות מחיר לקבלנים ושיפוצניקים | הפקת PDF מהירה',
  description: 'הכלי המוביל בישראל לבעלי מקצוע: יצירת הצעות מחיר מקצועיות ב-PDF לאינסטלטורים, חשמלאים, וקבלני שיפוצים. נסה עכשיו בחינם.',
  openGraph: {
    title: 'בונה הצעות מחיר לקבלנים ושיפוצניקים | הפקת PDF מהירה',
    description: 'הצעת מחיר מקצועית ב-60 שניות. צור PDF ממותג, שלח בוואטסאפ וסגור יותר עסקאות. נסה בחינם.',
  },
};

const steps = [
  {
    title: 'בחר תחום עבודה',
    text: 'צבע, אינסטלציה, חשמל, מיזוג, גבס, דלתות ועוד – כל התחומים במקום אחד.',
    img: '/landing/home-grid.png',
    imgAlt: 'אפליקציה לבניית הצעת מחיר – בחירת תחום עבודה מהדף הראשי',
  },
  {
    title: 'תמחר והתאם ללקוח',
    text: 'מחיר בסיס ברור, שאלות רלוונטיות ותוספות – הסה"כ מתעדכן בזמן אמת.',
    img: '/landing/customize-quote.png',
    imgAlt: 'אפליקציה לבניית הצעת מחיר – התאמת הצעת מחיר לצביעת דירה',
  },
  {
    title: 'PDF ושליחה ללקוח',
    text: 'הצעה מסודרת עם הלוגו שלך – הורדה או שליחה ישירה בוואטסאפ ומייל.',
    img: '/landing/hero-categories.png',
    imgAlt: 'אפליקציה לבניית הצעת מחיר – קטגוריות שירותים',
  },
];

const painSolutionCards = [
  {
    icon: Cloud,
    title: 'בלי ניירת',
    text: 'הכל נשמר במכשיר ובענן – נגיש מכל מקום כשמתחברים לחשבון. אין צורך בנייר או באקסל.',
  },
  {
    icon: Building2,
    title: 'נראה כמו חברה גדולה',
    text: 'הצעות PDF עם לוגו אישי, שם העסק ופרטי התקשורת – משדרות אמינות ומקצועיות ללקוח.',
  },
  {
    icon: Ruler,
    title: 'תמחור מדויק',
    text: 'מחירונים מובנים לכל ענפי הבנייה – אינסטלציה, חשמל, צבע, ריצוף, מיזוג ועוד. מחיר בסיס + תוספות בשקיפות.',
  },
];

const features = [
  {
    icon: LayoutGrid,
    title: 'תחומים רבים',
    text: 'צבע ודקורציה, איטום, בטון, אינסטלציה, ריצוף, חשמל, מיזוג, נגרות, אלומיניום, גינון, הנדימן, מסגר, גבס, דלתות, תקשורת ועוד.',
  },
  {
    icon: Zap,
    title: 'תמחור מהיר ומדויק',
    text: 'מחירי בסיס ברורים, שאלות לפי סוג העבודה, תוספות – הכל בשקיפות ובזמן אמת.',
  },
  {
    icon: FileText,
    title: 'PDF עם הלוגו שלך',
    text: 'הצעת מחיר מקצועית עם שם העסק, לוגו ופרטי התקשורת – מוכנה לשליחה.',
  },
  {
    icon: MessageCircle,
    title: 'שליחה בוואטסאפ ומייל',
    text: 'הורדת קובץ או שליחה ישירה ללקוח – מהמכשיר או מהמחשב.',
  },
  {
    icon: Smartphone,
    title: 'עובד בדפדפן – גם כאפליקציה',
    text: 'אין צורך בהתקנה. אפשר להוסיף למסך הבית ולעבוד מהשטח כמו מאפליקציה.',
  },
  {
    icon: CheckCircle2,
    title: 'היסטוריה וטיוטות',
    text: 'הצעות שנשלחו וטיוטות שנשמרו – הכל במקום אחד באיזור האישי.',
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC]" dir="rtl">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/80 to-transparent pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-16 sm:pb-24">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="text-center lg:text-right order-2 lg:order-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] leading-tight mb-4">
                הצעת מחיר מקצועית ב-60 שניות – ישר מהשטח
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 mb-2 max-w-xl mx-auto lg:mx-0">
                תפסיק לאבד זמן על אקסל. צור הצעות מחיר ממותגות ב-PDF, שלח בוואטסאפ וסגור יותר עסקאות.
              </p>
              <p className="text-slate-500 mb-8">
                כלי עבודה אחד לבעלי מקצוע וקבלנים – אינסטלטורים, חשמלאים, צבעים ועוד.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] transition-all text-lg shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30"
              >
                התחל עכשיו בחינם
              </Link>
            </div>
            <div className="order-1 lg:order-2 flex justify-center">
              <div className="relative w-[280px] sm:w-[320px] aspect-[9/19] rounded-[2.5rem] border-[10px] border-slate-800 shadow-2xl bg-white overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-6 bg-slate-800 rounded-b-xl z-10" />
                <img
                  src="/landing/customize-quote.png"
                  alt="אפליקציה לבניית הצעת מחיר – מסך התאמת הצעה לצביעת דירה 5 חדרים"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Pain & Solution */}
      <section className="py-16 sm:py-24 bg-white" aria-labelledby="pain-solution-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="pain-solution-heading" className="sr-only">
            למה בונה הצעות מחיר
          </h2>
          <div className="grid sm:grid-cols-3 gap-6 lg:gap-8">
            {painSolutionCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="bg-[#F8FAFC] rounded-2xl p-6 lg:p-8 border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all text-center"
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

      {/* How it works */}
      <section className="py-16 sm:py-24 bg-[#F8FAFC]" aria-labelledby="how-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="how-heading" className="text-2xl sm:text-3xl font-bold text-[#0F172A] text-center mb-4">
            איך זה עובד
          </h2>
          <p className="text-slate-600 text-center max-w-2xl mx-auto mb-12">
            שלושה צעדים פשוטים מהבחירה עד לשליחה ללקוח.
          </p>
          <div className="space-y-16 sm:space-y-24">
            {steps.map((step, i) => (
              <div key={step.title} className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-[#2563eb] font-bold text-lg mb-4">
                    {i + 1}
                  </span>
                  <h3 className="text-xl font-bold text-[#0F172A] mb-2">{step.title}</h3>
                  <p className="text-slate-600">{step.text}</p>
                </div>
                <div className="flex justify-center">
                  <div className="w-[240px] sm:w-[260px] aspect-[9/19] rounded-[2rem] border-8 border-slate-700 shadow-xl bg-white overflow-hidden">
                    <LandingImage
                      src={step.img}
                      alt={step.imgAlt}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 bg-white" aria-labelledby="features-heading">
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
                  className="bg-[#F8FAFC] rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all"
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

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-slate-50 to-white" aria-labelledby="cta-heading">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 id="cta-heading" className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-4">
            מוכן להתחיל?
          </h2>
          <p className="text-slate-600 mb-8">
            חינם. בלי כרטיס אשראי. עובד בדפדפן – אפשר גם להוסיף למסך הבית כאפליקציה.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-10 py-4 rounded-xl font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] transition-all text-lg shadow-lg shadow-blue-600/25"
          >
            התחל עכשיו בחינם
          </Link>
        </div>
      </section>
    </main>
  );
}
