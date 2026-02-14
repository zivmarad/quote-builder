import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'מדיניות פרטיות | בונה הצעות מחיר',
  description: 'מדיניות הפרטיות של בונה הצעות מחיר – אילו נתונים נשמרים ואיך.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] p-4 md:p-8" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-block text-slate-600 hover:text-slate-900 font-medium mb-6">
          ← חזרה לדף הבית
        </Link>
        <article className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 text-right">
          <h1 className="text-2xl font-black text-slate-900 mb-6">מדיניות פרטיות</h1>
          <p className="text-slate-500 text-sm mb-8">עדכון אחרון: פברואר 2025</p>

          <section className="space-y-6 text-slate-700">
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">1. כללי</h2>
              <p>
                &quot;בונה הצעות מחיר&quot; מכבד את פרטיות המשתמשים. מדיניות זו מתארת אילו מידע נשמר ואיך הוא משמש.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">2. אילו נתונים נשמרים</h2>
              <p className="mb-2">
                <strong>במכשיר שלך (דפדפן):</strong> נתונים נשמרים ב-localStorage ו־IndexedDB – פרופיל העסק (שם, לוגו, טלפון, אימייל, כתובת), תוכן הסל, היסטוריית הצעות והגדרות.
              </p>
              <p className="mb-2">
                <strong>בשרת (Supabase):</strong> כאשר אתה מתחבר עם חשבון, אנו מסנכרנים חלק מהנתונים לענן כדי לאפשר גישה מכמה מכשירים:
              </p>
              <ul className="list-disc list-inside mr-2 mt-2 space-y-1">
                <li>פרופיל, סל הצעות, היסטוריית הצעות, הגדרות ומחירי בסיס מותאמים – משויכים למשתמש המחובר</li>
                <li>נתוני חשבון (שם משתמש, אימייל מוצפן) – לצורכי התחברות וזיהוי</li>
                <li>קודי אימות זמניים (להרשמה/שחזור סיסמה) – נמחקים לאחר שימוש או פקיעת תוקף</li>
              </ul>
              <p className="mt-2">
                שליחת מייל (קודי אימות, שחזור סיסמה, שליחת שם משתמש) מתבצעת דרך שרתינו; כתובת המייל שלך משמעת רק למטרות אלה ולא לשיווק.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">3. עוגיות וטכנולוגיות</h2>
              <p>
                האתר משתמש ב-localStorage ו־IndexedDB לשמירת הנתונים במכשיר, ובעגינת סשן (cookie) מאובטחת לצורכי התחברות בלבד. אין שימוש בעוגיות מעקב או בפרסום מותאם.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">4. שיתוף ושליחת הצעות</h2>
              <p>
                כאשר אתה שולח הצעת מחיר (למשל כ-PDF או דרך מסך השיתוף), הנתונים עוברים רק לאמצעי שבחרת (וואטסאפ, אימייל וכו&#39;) ואינם נשמרים אצלנו מעבר לכך.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">5. מחיקת נתונים</h2>
              <p>
                ניתן למחוק הצעות מהיסטוריה מתוך האיזור האישי. ניקוי נתונים במכשיר (פרופיל, היסטוריה, הגדרות) מתבצע דרך הגדרות הדפדפן (פרטיות → ניקוי נתונים לאתר זה). מחיקת נתונים המשויכים לחשבון בענן דורשת מחיקת החשבון – ניתן לפנות אלינו דרך <Link href="/contact" className="text-blue-600 hover:underline font-medium">צור קשר</Link>.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">6. שינויים ויצירת קשר</h2>
              <p>
                מדיניות זו עשויה להשתנות. לשאלות: <Link href="/contact" className="text-blue-600 hover:underline font-medium">צור קשר</Link>.
              </p>
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}
