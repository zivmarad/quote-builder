import { FileText, ExternalLink } from 'lucide-react';

const SAMPLES = [
  {
    title: 'צבע ושיפוצים',
    description: 'הצעת מחיר לעבודות צבע – מחיר בסיס, תוספות וסיכום מסודר.',
    href: '/landing/sample-quote-paint.pdf',
    label: 'פתח PDF – צבע',
  },
  {
    title: 'אינסטלציה',
    description: 'הצעת מחיר לאינסטלציה – פירוט שורות, מע"מ וסה"כ לתשלום.',
    href: '/landing/sample-quote-plumbing.pdf',
    label: 'פתח PDF – אינסטלציה',
  },
] as const;

export default function LandingSampleQuotes() {
  return (
    <section
      className="py-14 sm:py-24 bg-[#F8FAFC]"
      aria-labelledby="sample-quotes-heading"
      id="sample-quotes"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          id="sample-quotes-heading"
          className="text-2xl sm:text-3xl font-bold text-[#0F172A] text-center mb-4"
        >
          הצעות מחיר לדוגמא
        </h2>
        <p className="text-slate-600 text-center max-w-2xl mx-auto mb-10">
          כך נראית הצעה מוכנה לשליחה ללקוח – PDF ממותג עם פירוט מחירים.
        </p>
        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {SAMPLES.map((sample) => (
            <a
              key={sample.href}
              href={sample.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-blue-200 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 text-[#2563eb]">
                <FileText size={24} aria-hidden />
              </div>
              <h3 className="font-bold text-[#0F172A] text-lg mb-2">{sample.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed flex-1 mb-4">{sample.description}</p>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-[#2563eb] group-hover:underline">
                {sample.label}
                <ExternalLink size={16} aria-hidden />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
