import Link from 'next/link';

export default function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer
      className="border-t border-slate-200 bg-white mt-auto"
      dir="rtl"
      style={{ paddingBottom: 'var(--safe-area-inset-bottom)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid sm:grid-cols-3 gap-6 mb-6">
          <div>
            <h3 className="font-bold text-slate-900 mb-3 text-sm">הצעת מחיר לפי ענף</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/הצעת-מחיר/אינסטלציה" className="hover:text-slate-900 transition-colors">
                  הצעת מחיר לאינסטלציה
                </Link>
              </li>
              <li>
                <Link href="/הצעת-מחיר/חשמל" className="hover:text-slate-900 transition-colors">
                  הצעת מחיר לחשמל
                </Link>
              </li>
              <li>
                <Link href="/הצעת-מחיר/צבע" className="hover:text-slate-900 transition-colors">
                  הצעת מחיר לצביעת דירה
                </Link>
              </li>
              <li>
                <Link href="/הצעת-מחיר/ריצוף" className="hover:text-slate-900 transition-colors">
                  הצעת מחיר לריצוף
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-3 text-sm">מדריכים ומחירונים</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/מדריכים/הצעת-מחיר-לשיפוץ" className="hover:text-slate-900 transition-colors">
                  הצעת מחיר לשיפוץ – דוגמה
                </Link>
              </li>
              <li>
                <Link href="/מדריכים/טופס-הצעת-מחיר" className="hover:text-slate-900 transition-colors">
                  טופס הצעת מחיר
                </Link>
              </li>
              <li>
                <Link href="/מחירון" className="hover:text-slate-900 transition-colors">
                  מחירונים לפי ענף
                </Link>
              </li>
              <li>
                <Link href="/מדריכים" className="hover:text-slate-900 transition-colors">
                  כל המדריכים
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-3 text-sm">כללי</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/landing#sample-quotes" className="hover:text-slate-900 transition-colors">
                  הצעות מחיר לדוגמא
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-slate-900 transition-colors">
                  צור קשר
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-slate-900 transition-colors">
                  תנאי שימוש
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-slate-900 transition-colors">
                  מדיניות פרטיות
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-100 pt-4 text-sm text-slate-500">
          © {year} בונה הצעות מחיר
        </div>
      </div>
    </footer>
  );
}
