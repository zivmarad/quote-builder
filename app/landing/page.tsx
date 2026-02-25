import Link from 'next/link';
import type { Metadata } from 'next';
import { FileText, MessageCircle, LayoutGrid, CheckCircle2, Smartphone, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'בונה הצעות מחיר – תמחור והצעות מקצועיות לבעלי מקצוע',
  description: 'בחר שירות, תמחר, צור PDF עם הלוגו שלך ושלוח ללקוח בוואטסאפ. חינם בדפדפן.',
  openGraph: {
    title: 'בונה הצעות מחיר – תמחור והצעות מקצועיות',
    description: 'בחר תחום, תמחר, צור PDF ושלוח ללקוח. בלי אקסל, בלי בלגן.',
  },
};

const steps = [
  {
    title: 'בחר תחום עבודה',
    text: 'צבע, אינסטלציה, חשמל, מיזוג, גבס, דלתות ועוד – כל התחומים במקום אחד.',
    img: '/landing/home-grid.png',
  },
  {
    title: 'תמחר והתאם ללקוח',
    text: 'מחיר בסיס ברור, שאלות רלוונטיות ותוספות – הסה"כ מתעדכן בזמן אמת.',
    img: '/landing/customize-quote.png',
  },
  {
    title: 'PDF ושליחה ללקוח',
    text: 'הצעה מסודרת עם הלוגו שלך – הורדה או שליחה ישירה בוואטסאפ ומייל.',
    img: '/landing/hero-categories.png',
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
    text: 'מחירי בסיס ברורים, שאלות לפי סוג העבודה, תוספות ותשלום – הכל בשקיפות.',
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
    text: 'אין צורך בהתקנה. אפשר להוסיף למסך הבית ולעבוד כמו מאפליקציה.',
  },
  {
    icon: CheckCircle2,
    title: 'היסטוריה וטיוטות',
    text: 'הצעות שנשלחו וטיוטות שנשמרו – הכל במקום אחד באיזור האישי.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir="rtl">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/80 to-transparent pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-16 sm:pb-24">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="text-center lg:text-right order-2 lg:order-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] leading-tight mb-4">
                בונה הצעות מחיר
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 mb-2 max-w-xl mx-auto lg:mx-0 lg:mr-0">
                בחר תחום, תמחר, צור PDF עם הלוגו שלך ושלוח ללקוח בוואטסאפ.
              </p>
              <p className="text-slate-500 mb-8">
                בלי אקסל, בלי בלגן. כלי עבודה אחד לבעלי מקצוע וקבלנים.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all text-lg shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30"
              >
                התחל לבנות הצעה – חינם
              </Link>
            </div>
            <div className="order-1 lg:order-2 flex justify-center">
              <div className="relative w-[280px] sm:w-[320px] aspect-[9/19] rounded-[2.5rem] border-[10px] border-slate-800 shadow-2xl bg-white overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-6 bg-slate-800 rounded-b-xl z-10" />
                <img
                  src="/landing/home-grid.png"
                  alt="מסך הבית – בחירת תחום עבודה"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] text-center mb-4">
            איך זה עובד
          </h2>
          <p className="text-slate-600 text-center max-w-2xl mx-auto mb-12">
            שלושה צעדים פשוטים מהבחירה עד לשליחה ללקוח.
          </p>
          <div className="space-y-16 sm:space-y-24">
            {steps.map((step, i) => (
              <div key={step.title} className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold text-lg mb-4">
                    {i + 1}
                  </span>
                  <h3 className="text-xl font-bold text-[#0F172A] mb-2">{step.title}</h3>
                  <p className="text-slate-600">{step.text}</p>
                </div>
                <div className="flex justify-center">
                  <div className="w-[240px] sm:w-[260px] aspect-[9/19] rounded-[2rem] border-8 border-slate-700 shadow-xl bg-white overflow-hidden">
                    <img
                      src={step.img}
                      alt={step.title}
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
      <section className="py-16 sm:py-24 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] text-center mb-4">
            מה תקבל
          </h2>
          <p className="text-slate-600 text-center max-w-2xl mx-auto mb-12">
            כל מה שצריך כדי להציע ללקוח במהירות ובמקצועיות.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 text-blue-600">
                  <f.icon size={24} />
                </div>
                <h3 className="font-bold text-[#0F172A] mb-2">{f.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-4">
            מוכן להתחיל?
          </h2>
          <p className="text-slate-600 mb-8">
            חינם. בלי כרטיס אשראי. עובד בדפדפן – אפשר גם להוסיף למסך הבית כאפליקציה.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-10 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all text-lg shadow-lg shadow-blue-600/25"
          >
            התחל לבנות הצעה
          </Link>
        </div>
      </section>

    </div>
  );
}
