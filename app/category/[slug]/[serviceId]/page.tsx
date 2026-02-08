'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { categories } from '../../../service/services';
import type { Question } from '../../../service/services';
import { motion, AnimatePresence } from 'framer-motion';
import AddToBasketButton from '../../../components/AddToBasketButton';
import RequireAuth from '../../../components/RequireAuth';
import { usePriceOverrides } from '../../../contexts/PriceOverridesContext';

export default function ServiceWizardPage() {
  const { slug, serviceId } = useParams();
  const router = useRouter();
  const { getBasePrice } = usePriceOverrides();

  const categoryId = Array.isArray(slug) ? slug[0] : slug;
  const svcId = Array.isArray(serviceId) ? serviceId[0] : serviceId;

  const category = categories.find((c) => c.id === categoryId);
  const service = category?.services.find((s) => s.id === svcId);

  const [quantityInput, setQuantityInput] = useState<string>('1');
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [questionQuantities, setQuestionQuantities] = useState<Record<string, string>>({});

  const qtyNum = Math.max(1, parseInt(quantityInput, 10) || 1);

  const effectiveBasePrice = service ? getBasePrice(service.id, service.basePrice) : 0;
  const baseTotal = useMemo(() => {
    if (!service) return 0;
    const qty = service.isCounter ? qtyNum : 1;
    return effectiveBasePrice * qty;
  }, [service, qtyNum, effectiveBasePrice]);

  const qty = service ? (service.isCounter ? qtyNum : 1) : 1;

  const selectedExtrasList = useMemo(() => {
    if (!service) return [];
    return service.questions
      .filter((q) => answers[q.id] === true)
      .map((q) => {
        let price: number;
        if (q.impact.type === 'percent') {
          price = (baseTotal * q.impact.value) / 100;
        } else if (q.impact.type === 'fixedPerUnit') {
          price = q.impact.value * qty;
        } else if (q.impact.type === 'fixedWithQuantity') {
          const qtyQ = Math.max(1, parseInt(questionQuantities[q.id] || '1', 10) || 1);
          price = q.impact.value * qtyQ;
        } else {
          price = q.impact.value;
        }
        const qtyQ = q.impact.type === 'fixedWithQuantity'
          ? Math.max(1, parseInt(questionQuantities[q.id] || '1', 10) || 1)
          : null;
        const label = 'quantityLabel' in q.impact && q.impact.quantityLabel ? q.impact.quantityLabel : "יח'";
        const text = qtyQ != null && qtyQ > 0
          ? `${q.text} (${qtyQ} ${label})`
          : q.text;
        return { text, price };
      });
  }, [service, answers, baseTotal, qty, questionQuantities]);

  const extrasTotal = useMemo(() => {
    return selectedExtrasList.reduce((sum, e) => sum + e.price, 0);
  }, [selectedExtrasList]);

  const total = baseTotal + extrasTotal;

  if (!category || !service) {
    return (
      <RequireAuth>
        <main className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
          <p className="text-slate-500 font-bold">השירות לא נמצא</p>
        </main>
      </RequireAuth>
    );
  }

  const handleToggle = (question: Question, value: boolean) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const handleQuantityChange = (value: string) => {
    const digits = value.replace(/[^\d]/g, '');
    setQuantityInput(digits === '' ? '' : digits);
  };

  const handleQuantityBlur = () => {
    const num = parseInt(quantityInput, 10);
    if (quantityInput === '' || Number.isNaN(num) || num < 1) {
      setQuantityInput('1');
    } else {
      setQuantityInput(String(num));
    }
  };

  const handleQuestionQuantityChange = (qId: string, value: string) => {
    const digits = value.replace(/[^\d]/g, '');
    setQuestionQuantities((prev) => ({
      ...prev,
      [qId]: digits === '' ? '' : digits,
    }));
  };

  const handleQuestionQuantityBlur = (qId: string) => {
    const val = questionQuantities[qId];
    const num = parseInt(val || '', 10);
    if (val === '' || Number.isNaN(num) || num < 1) {
      setQuestionQuantities((prev) => ({ ...prev, [qId]: '1' }));
    } else {
      setQuestionQuantities((prev) => ({ ...prev, [qId]: String(num) }));
    }
  };

  const hasQuantityInput = (q: Question) => q.impact.type === 'fixedWithQuantity';

  return (
    <RequireAuth>
    <main className="min-h-screen bg-slate-50 pb-28 sm:pb-28" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <button
          onClick={() => router.push(`/category/${category.id}`)}
          className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 min-h-[44px] px-2 -mr-2 rounded-xl active:bg-slate-100"
        >
          <span>חזרה</span>
          <span className="text-lg">↩</span>
        </button>

        <header className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center justify-between gap-2 flex-wrap">
            <span>{service.name}</span>
            <span className="text-xl text-slate-500">{category.icon}</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            מחיר בסיס: ₪{effectiveBasePrice.toLocaleString('he-IL')} לכל {service.unit}
          </p>
        </header>

        {service.isCounter && (
          <section className="mb-4 sm:mb-6 bg-white p-4 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">כמות יחידות</h2>
            <div className="flex items-center gap-3">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={quantityInput}
                onChange={(e) => handleQuantityChange(e.target.value)}
                onBlur={handleQuantityBlur}
                placeholder="1"
                className="w-24 min-h-[44px] rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-right text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                dir="ltr"
              />
              <span className="text-sm text-slate-500">({service.unit})</span>
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="mb-2">
            <h2 className="text-sm font-semibold text-slate-700">התאמת הצעת המחיר</h2>
            <p className="text-xs text-slate-500">סמן את האפשרויות הרלוונטיות לעבודה.</p>
          </div>

          <AnimatePresence>
            {service.questions.map((q, index) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm px-5 py-4 flex flex-col gap-3"
              >
                <span className="text-sm font-bold text-slate-900">{q.text}</span>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggle(q, true)}
                      className={`min-h-[44px] min-w-[56px] px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-black transition-all active:scale-[0.98] ${
                        answers[q.id] === true
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >כן</button>
                    <button
                      type="button"
                      onClick={() => handleToggle(q, false)}
                      className={`min-h-[44px] min-w-[56px] px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-black transition-all active:scale-[0.98] ${
                        answers[q.id] === false
                          ? 'bg-slate-800 text-white shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >לא</button>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                    {q.impact.type === 'percent' 
                      ? `+${q.impact.value}%` 
                      : q.impact.type === 'fixedPerUnit' 
                        ? `+₪${q.impact.value}/${service.unit}` 
                        : q.impact.type === 'fixedWithQuantity'
                          ? `+₪${q.impact.value}/${q.impact.quantityLabel ?? "יח'"}`
                          : `+₪${q.impact.value}`}
                  </span>
                </div>
                {hasQuantityInput(q) && answers[q.id] === true && (
                  <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
                    <span className="text-xs text-slate-500">כמות:</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={questionQuantities[q.id] ?? '1'}
                      onChange={(e) => handleQuestionQuantityChange(q.id, e.target.value)}
                      onBlur={() => handleQuestionQuantityBlur(q.id)}
                      placeholder="1"
                      className="w-20 min-h-[40px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      dir="ltr"
                    />
                    <span className="text-xs text-slate-500">{q.impact.quantityLabel ?? "יח'"}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </section>
      </div>

      <motion.div 
        initial={{ y: 100 }} 
        animate={{ y: 0 }} 
        className="fixed bottom-0 inset-x-0 z-30 p-2 sm:p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto max-w-md sm:max-w-3xl px-2 sm:px-1 flex justify-center">
          <div className="rounded-xl sm:rounded-[2.5rem] bg-slate-900 text-white px-3 py-2.5 sm:p-5 shadow-xl flex items-center justify-between gap-2 sm:gap-3 w-full max-w-sm sm:max-w-none">
            <div className="pr-1 sm:pr-2 min-w-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">סה"כ לתשלום</span>
              <span className="text-lg sm:text-2xl font-black tabular-nums tracking-tight">
                ₪{total.toLocaleString('he-IL')}
              </span>
            </div>
            <div className="w-36 sm:w-48 shrink-0 min-w-0">
              <AddToBasketButton 
                service={{
                  name: service.name,
                  category: category.id,
                  basePrice: baseTotal,
                  extras: selectedExtrasList,
                  description: selectedExtrasList.map(e => e.text).join(', '),
                  quantity: qty > 1 ? qty : undefined,
                  unit: qty > 1 ? service.unit : undefined,
                }} 
              />
            </div>
          </div>
        </div>
      </motion.div>
    </main>
    </RequireAuth>
  );
}