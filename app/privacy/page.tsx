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
              <p>
                כרגע האתר פועל ללא שרת: כל הנתונים נשמרים <strong>רק במכשיר שלך</strong> (localStorage בדפדפן):
              </p>
              <ul className="list-disc list-inside mr-2 mt-2 space-y-1">
                <li>פרופיל העסק (שם, לוגו, טלפון, אימייל, כתובת)</li>
                <li>תוכן הסל וההצעות שבנית</li>
                <li>היסטוריית הצעות ששמרת</li>
                <li>הגדרות (כותרת הצעה, מספר הצעה, תוקף)</li>
              </ul>
              <p className="mt-2">אין העברת נתונים אלה לשרת חיצוני במצב הנוכחי של האתר.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">3. עוגיות וטכנולוגיות</h2>
              <p>
                האתר משתמש ב-localStorage לשמירת הנתונים שציינו לעיל. אין שימוש בעוגיות מעקב או בפרסום מותאם. אם בעתיד יתווספן שירותים (כגון התחברות או גיבוי בענן), יפורסם עדכון במדיניות זו.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">4. שיתוף ושליחת הצעות</h2>
              <p>
                כאשר אתה שולח הצעת מחיר (למשל כ-PDF או דרך מסך השיתוף), הנתונים עוברים רק לאמצעי שבחרת (וואטסאפ, אימייל וכו&#39;) ואינם נשמרים אצלנו.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">5. מחיקת נתונים</h2>
              <p>
                ניתן למחוק הצעות מהיסטוריה מתוך האיזור האישי. ניקוי נתונים מלא (פרופיל, היסטוריה, הגדרות) מתבצע על ידי ניקוי אחסון האתר בדפדפן (הגדרות → פרטיות → ניקוי נתונים לאתר זה).
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
