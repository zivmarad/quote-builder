import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'תנאי שימוש | בונה הצעות מחיר',
  description: 'תנאי השימוש בשירות בונה הצעות מחיר.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] p-4 md:p-8" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-block text-slate-600 hover:text-slate-900 font-medium mb-6">
          ← חזרה לדף הבית
        </Link>
        <article className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 text-right">
          <h1 className="text-2xl font-black text-slate-900 mb-6">תנאי שימוש</h1>
          <p className="text-slate-500 text-sm mb-8">עדכון אחרון: פברואר 2025</p>

          <section className="space-y-6 text-slate-700">
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">1. כללי</h2>
              <p>
                השימוש באתר &quot;בונה הצעות מחיר&quot; כפוף לתנאים המפורטים להלן. גישה לאתר ו/או שימוש בו מהווים הסכמה לתנאים אלה.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">2. מטרת השירות</h2>
              <p>
                האתר מספק כלי לבניית הצעות מחיר, תמחור, ייצוא PDF ושמירת היסטוריה. השירות ניתן &quot;כמות שהוא&quot; (as is) לצורכי שימוש אישי ומקצועי.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">3. אחריות</h2>
              <p>
                בעל האתר לא יהיה אחראי לכל נזק ישיר או עקיף הנובע משימוש או אי-שימוש בשירות. המחירים והתוכן המוצגים באתר הם להמחשה ותמחור בלבד, ואינם מחליפים ייעוץ מקצועי או התחייבות משפטית.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">4. חשבון וסנכרון</h2>
              <p>
                ניתן ליצור חשבון (שם משתמש וסיסמה ו/או אימייל) כדי לסנכרן נתונים בין מכשירים. הנתונים המשויכים לחשבון (פרופיל, סל, היסטוריה, הגדרות) נשמרים במכשיר ובענן בהתאם למדיניות הפרטיות. אתה אחראי לשמירה על סודיות פרטי ההתחברות.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">5. שימוש הוגן</h2>
              <p>
                אסור להשתמש באתר למטרות בלתי חוקיות, להפרת זכויות צד שלישי, או להעלאת תוכן פוגעני.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">6. שינויים</h2>
              <p>
                תנאי שימוש אלה עשויים להשתנות מעת לעת. המשך שימוש באתר לאחר עדכון מהווה הסכמה לתנאים המעודכנים.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">7. יצירת קשר</h2>
              <p>
                לשאלות בנוגע לתנאי השימוש ניתן לפנות דרך <Link href="/contact" className="text-blue-600 hover:underline font-medium">דף צור קשר</Link>.
              </p>
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}
