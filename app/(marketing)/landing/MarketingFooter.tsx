import Link from 'next/link';

/** מחירונים מובילים לפי נפח חיפוש (GSC) – בראש הרשימה כדי לחזק אותם. */
const FOOTER_PRICING = [
  { slug: 'home-renovation', label: 'מחירון שיפוץ דירה' },
  { slug: 'electrical', label: 'מחירון חשמלאים' },
  { slug: 'painting', label: 'מחירון צבע' },
  { slug: 'doors', label: 'מחירון דלתות' },
  { slug: 'plumbing', label: 'מחירון אינסטלציה' },
  { slug: 'tiling', label: 'מחירון ריצוף' },
  { slug: 'air-conditioning', label: 'מחירון מיזוג אוויר' },
  { slug: 'drywall', label: 'מחירון גבס' },
];

/** הצעות מחיר לפי ענף – ממוקד כלי. */
const FOOTER_INDUSTRIES = [
  { slug: 'home-renovation', label: 'הצעת מחיר לשיפוץ דירה' },
  { slug: 'electrical', label: 'הצעת מחיר לחשמל' },
  { slug: 'painting', label: 'הצעת מחיר לצביעת דירה' },
  { slug: 'plumbing', label: 'הצעת מחיר לאינסטלציה' },
  { slug: 'gardening', label: 'הצעת מחיר לגינון' },
  { slug: 'handyman', label: 'הצעת מחיר להנדימן' },
  { slug: 'sofa-cleaning', label: 'הצעת מחיר לניקוי ספות' },
  { slug: 'aluminum', label: 'הצעת מחיר לאלומיניום' },
];

export default function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer
      className="border-t border-slate-200 bg-white mt-auto"
      dir="rtl"
      style={{ paddingBottom: 'var(--safe-area-inset-bottom)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
          <div>
            <h3 className="font-bold text-slate-900 mb-3 text-sm">מחירונים 2026</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              {FOOTER_PRICING.map(({ slug, label }) => (
                <li key={slug}>
                  <Link href={`/pricing/${slug}`} className="hover:text-slate-900 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/pricing" className="font-medium text-[#2563eb] hover:text-[#1d4ed8] transition-colors">
                  כל המחירונים ←
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-3 text-sm">הצעת מחיר לפי ענף</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              {FOOTER_INDUSTRIES.map(({ slug, label }) => (
                <li key={slug}>
                  <Link href={`/price-quote/${slug}`} className="hover:text-slate-900 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-3 text-sm">מדריכים וטפסים</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/templates" className="hover:text-slate-900 transition-colors">
                  טופס הצעת מחיר להורדה
                </Link>
              </li>
              <li>
                <Link href="/guides/price-quote-template" className="hover:text-slate-900 transition-colors">
                  מדריך: טופס הצעת מחיר
                </Link>
              </li>
              <li>
                <Link href="/guides/renovation-price-quote" className="hover:text-slate-900 transition-colors">
                  הצעת מחיר לשיפוץ – דוגמה
                </Link>
              </li>
              <li>
                <Link href="/guides/how-to-price-a-job" className="hover:text-slate-900 transition-colors">
                  איך מתמחרים עבודה
                </Link>
              </li>
              <li>
                <Link href="/guides" className="font-medium text-[#2563eb] hover:text-[#1d4ed8] transition-colors">
                  כל המדריכים ←
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
