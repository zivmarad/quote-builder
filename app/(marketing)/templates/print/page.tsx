'use client';

/**
 * תבנית הצעת מחיר להדפסה / שמירה כ-PDF.
 * עמוד נקי בעיצוב A4 שאפשר למלא ולהדפיס, או לשמור כ-PDF דרך חלון ההדפסה של הדפדפן.
 */
export default function PrintableQuoteTemplate() {
  return (
    <main className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 print:px-0 print:max-w-none">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 print:hidden">
          <p className="text-slate-600 text-sm">
            מלאו את הפרטים, ולחצו על הכפתור כדי להדפיס או לשמור כ-PDF (בחלון ההדפסה בחרו יעד: שמירה כ-PDF).
          </p>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-6 py-3 rounded-xl font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] transition-colors shadow-lg shadow-blue-600/25"
          >
            הדפס / שמור כ-PDF
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 print:shadow-none print:border-0 print:p-0 print:rounded-none">
          <div className="border-b-2 border-[#2563eb] pb-4 mb-6">
            <h1 className="text-3xl font-black text-[#0F172A]">הצעת מחיר</h1>
            <p className="text-slate-500 text-sm mt-1">
              מס&apos; הצעה: ______ &nbsp;|&nbsp; תאריך: ____ / ____ / ______
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="font-bold text-slate-900 mb-2">פרטי העסק</h2>
              <div className="space-y-1.5 text-sm text-slate-700">
                <p>שם העסק: ____________________</p>
                <p>איש קשר: ____________________</p>
                <p>טלפון: ____________________</p>
                <p>ח.פ / ע.מ: ____________________</p>
              </div>
            </div>
            <div>
              <h2 className="font-bold text-slate-900 mb-2">פרטי הלקוח</h2>
              <div className="space-y-1.5 text-sm text-slate-700">
                <p>שם הלקוח: ____________________</p>
                <p>טלפון: ____________________</p>
                <p>כתובת האתר: ____________________</p>
                <p>אימייל: ____________________</p>
              </div>
            </div>
          </div>

          <table className="w-full border-collapse text-sm mb-6">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="border border-slate-300 px-2 py-2 text-right w-10">#</th>
                <th className="border border-slate-300 px-2 py-2 text-right">תיאור העבודה</th>
                <th className="border border-slate-300 px-2 py-2 text-right w-16">כמות</th>
                <th className="border border-slate-300 px-2 py-2 text-right w-28">מחיר ליחידה</th>
                <th className="border border-slate-300 px-2 py-2 text-right w-28">סה&quot;כ</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <tr key={n}>
                  <td className="border border-slate-300 px-2 py-3 text-slate-700">{n}</td>
                  <td className="border border-slate-300 px-2 py-3">&nbsp;</td>
                  <td className="border border-slate-300 px-2 py-3">&nbsp;</td>
                  <td className="border border-slate-300 px-2 py-3">&nbsp;</td>
                  <td className="border border-slate-300 px-2 py-3">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-start mb-6">
            <table className="text-sm w-full sm:w-72">
              <tbody>
                <tr>
                  <td className="py-1 text-slate-600">סכום ביניים:</td>
                  <td className="py-1 text-left">______________ ₪</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-600">מע&quot;מ (18%):</td>
                  <td className="py-1 text-left">______________ ₪</td>
                </tr>
                <tr className="font-bold text-base">
                  <td className="py-1 text-slate-900 border-t border-slate-300">סה&quot;כ לתשלום:</td>
                  <td className="py-1 text-left border-t border-slate-300">______________ ₪</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="text-sm text-slate-700 space-y-1.5 mb-8">
            <h2 className="font-bold text-slate-900 mb-1">תנאים</h2>
            <p>תנאי תשלום: ____________________________________</p>
            <p>לוח זמנים: ____________________________________</p>
            <p>תוקף ההצעה: ______ ימים מתאריך ההנפקה.</p>
            <p>סעיף חריגות: ייתכנו תוספות של עד כ-5% בגין עבודות בלתי צפויות שיתגלו בשטח.</p>
          </div>

          <div className="flex justify-between text-sm text-slate-700 pt-6">
            <span>חתימת בעל המקצוע: ________________</span>
            <span>אישור הלקוח: ________________</span>
          </div>

          <p className="text-xs text-slate-400 mt-8 text-center">
            תבנית חינמית מבית בונה הצעות המחיר · hatzaot.co.il
          </p>
        </div>
      </div>
    </main>
  );
}
