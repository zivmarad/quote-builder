import Link from 'next/link';
import type { Metadata } from 'next';
import { Phone, MessageCircle, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'צור קשר | בונה הצעות מחיר',
  description: 'צור קשר עם בונה הצעות מחיר – שאלות, תמיכה ועזרה.',
};

const PHONE = '0502218880';
const PHONE_LINK = 'tel:0502218880';
const WHATSAPP_LINK = `https://wa.me/972502218880`;

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] p-4 md:p-8" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-block text-slate-600 hover:text-slate-900 font-medium mb-6">
          ← חזרה לדף הבית
        </Link>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8">
            <h1 className="text-2xl font-black text-slate-900 mb-2">צור קשר</h1>
            <p className="text-slate-500 mb-8">יש שאלה או בעיה? נשמח לעזור.</p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <a
                href={PHONE_LINK}
                className="flex items-center gap-3 px-5 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors font-bold text-slate-800"
                dir="ltr"
              >
                <Phone size={24} />
                {PHONE}
              </a>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-5 py-4 rounded-xl bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25 transition-colors font-bold"
              >
                <MessageCircle size={24} />
                וואטסאפ
              </a>
            </div>

            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <HelpCircle size={22} />
              שאלות נפוצות
            </h2>
            <dl className="space-y-4 text-slate-700">
              <div>
                <dt className="font-bold text-slate-800 mb-1">איפה נשמרים הנתונים שלי?</dt>
                <dd className="text-sm">
                  כרגע הכל נשמר רק במכשיר שלך (בדפדפן). אין שליחה לשרת. ראה <Link href="/privacy" className="text-blue-600 hover:underline">מדיניות פרטיות</Link>.
                </dd>
              </div>
              <div>
                <dt className="font-bold text-slate-800 mb-1">איך מוסיפים לוגו להצעת המחיר?</dt>
                <dd className="text-sm">
                  נכנסים לאיזור אישי → פרטים → לוחצים על אזור הלוגו ומעלים קובץ תמונה (PNG או JPG).
                </dd>
              </div>
              <div>
                <dt className="font-bold text-slate-800 mb-1">איך שולחים הצעה ללקוח?</dt>
                <dd className="text-sm">
                  בסל ההצעות לוחצים &quot;שתף&quot; – במחשב תורידו PDF ותשלחו בוואטסאפ Web או במייל. בטלפון (כשהאתר ב-HTTPS) ייפתח מסך השיתוף של הטלפון עם וואטסאפ וכו&#39;.
                </dd>
              </div>
              <div>
                <dt className="font-bold text-slate-800 mb-1">אפשר לשכפל הצעה קודמת?</dt>
                <dd className="text-sm">
                  כן. באיזור אישי → היסטוריית הצעות, ליד כל הצעה יש כפתור &quot;שכפל&quot; – זה יטען את הפריטים לסל ותוכלו לערוך ולשלוח מחדש.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </main>
  );
}
