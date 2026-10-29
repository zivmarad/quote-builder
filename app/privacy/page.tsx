import Link from 'next/link';
import type { Metadata } from 'next';
import { withSiteMetadata } from '@/lib/site-metadata';

export const metadata: Metadata = withSiteMetadata('/privacy', {
  title: 'מדיניות פרטיות | בונה הצעות מחיר',
  description: 'מדיניות הפרטיות של בונה הצעות מחיר – אילו נתונים נשמרים ואיך.',
});

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] p-4 md:p-8" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-block text-slate-600 hover:text-slate-900 font-medium mb-6">
          ← חזרה לדף הבית
        </Link>
        <article className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 text-right">
          <h1 className="text-2xl font-black text-slate-900 mb-6">מדיניות פרטיות</h1>
          <p className="text-slate-500 text-sm mb-8">עדכון אחרון: אוקטובר 2026</p>

          <section className="space-y-6 text-slate-700">
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">1. כללי</h2>
              <p className="mb-2">
                &quot;בונה הצעות מחיר&quot; מכבד את פרטיות המשתמשים. מדיניות זו מתארת אילו מידע נשמר ואיך הוא משמש.
              </p>
              <p>
                בעל המאגר: זיו מראד. לפניות בנושא פרטיות: טלפון וואטסאפ 050-221-8880, או מייל zivmarad@gmail.com, וגם דרך <Link href="/contact" className="text-blue-600 hover:underline font-medium">צור קשר</Link>.
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
                <li>נתוני חשבון: שם משתמש וכתובת אימייל לצורכי התחברות. הסיסמה נשמרת כגיבוב, לא כטקסט.</li>
                <li>כניסה עם גוגל: מתקבלים האימייל והשם מחשבון גוגל, כדי לפתוח את החשבון.</li>
                <li>לקוחות ששמרת: שם, טלפון, אימייל, כתובת והערות, לצורך ההצעות שלך.</li>
                <li>לוגו העסק וקובצי PDF של הצעות. מי שיש לו את הקישור יכול לפתוח את הקובץ.</li>
                <li>קודי אימות זמניים (להרשמה או שחזור סיסמה) נמחקים אחרי שימוש או אחרי 10 דקות.</li>
              </ul>
              <p className="mt-2">
                נשלחים מיילים תפעוליים בלבד: קוד אימות, שחזור סיסמה, שם משתמש, ומייל ברכה חד־פעמי אחרי הרשמה. אין דיוור שיווקי. דוחות תקלה טכניים יכולים להישלח ל־Sentry כדי לתקן באגים, בלי שימוש לפרסום.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">3. עוגיות וטכנולוגיות</h2>
              <p className="mb-2">
                האתר משתמש ב-localStorage ו־IndexedDB לשמירת הנתונים במכשיר, ובעוגיית סשן (cookie) מאובטחת לצורכי התחברות בלבד.
              </p>
              <p className="mb-2">
                <strong>סטטיסטיקה:</strong> אנו משתמשים ב-Vercel Analytics לספירת ביקורים ואירועי שימוש כלליים (למשל כניסה לאפליקציה, הוספה לסל). הנתונים אנונימיים ברמת דפדפן ולא משמשים לפרסום מותאם.
              </p>
              <p>
                <strong>Microsoft Clarity:</strong> לשיפור חוויית המשתמש אנו משתמשים ב-Clarity להקלטת סשנים ומפת חום. באפליקציה עצמה (הצעות, פרופיל, לקוחות וניהול) תוכן המסך מוסתר בהקלטה. בדפי התוכן הציבוריים עשויות להיקלט תנועות ולחיצות. אין שימוש בפרסום מותאם אישית.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">4. שיתוף ושליחת הצעות</h2>
              <p>
                כאשר נשלחת הצעת מחיר (PDF או מסך השיתוף), העותק נשמר בחשבון כדי שאפשר יהיה לפתוח אותו שוב. הקישור לקובץ ניתן לפתיחה לכל מי שמחזיק בו. השליחה ללקוח שלך נעשית באמצעי שבחרת.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">5. מחיקת נתונים</h2>
              <p>
                הצעות בודדות נמחקות מההיסטוריה באיזור האישי. מחיקת כל החשבון, כולל הצעות, לקוחות, פרופיל וקבצים בענן, נעשית באיזור האישי תחת הגדרות, בכפתור «מחיקת החשבון». הנתונים נשמרים כל עוד החשבון קיים. אם המחיקה מהמסך לא עברה, אפשר לפנות דרך <Link href="/contact" className="text-blue-600 hover:underline font-medium">צור קשר</Link> ונמחק את החשבון.
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
