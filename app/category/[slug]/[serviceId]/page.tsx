'use client';

import { memo, useMemo, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { categories } from '../../../service/services';
import type { Question } from '../../../service/services';
import AddToBasketButton from '../../../components/AddToBasketButton';
import EditablePriceLabel from '../../../components/EditablePriceLabel';
import AddCustomQuestionModal from '../../../components/AddCustomQuestionModal';
import { usePriceOverrides } from '../../../contexts/PriceOverridesContext';
import { useCustomCatalog } from '../../../contexts/CustomCatalogContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import {
  SPOTLIGHT_ELEVATED_CLASS,
  SPOTLIGHT_TARGET_CLASS,
} from '@/lib/spotlight-onboarding';
import { useSpotlightOnboarding } from '../../../hooks/useSpotlightOnboarding';
import SpotlightOverlay from '../../../components/onboarding/SpotlightOverlay';
import {
  getQuestionDisplayText,
  getServiceDisplayName,
  isCustomQuestionId,
} from '../../../../lib/custom-catalog-types';
import { calculateQuestionExtraPrice, formatImpactLabel } from '../../../../lib/quote-pricing';
import { Plus, Trash2 } from 'lucide-react';

interface QuestionCardProps {
  q: Question;
  displayText: string;
  impactValue: number;
  impactLabel: string;
  isCustom: boolean;
  answer: boolean | undefined;
  showQuantityInput: boolean;
  quantityValue: string;
  quantityLabel: string;
  editHint: string;
  yesLabel: string;
  noLabel: string;
  quantityWord: string;
  myQuestionLabel: string;
  deleteAria: string;
  onToggle: (q: Question, value: boolean) => void;
  onDelete: (id: string) => void;
  onSaveImpact: (qId: string, value: number | '') => void;
  onQuantityChange: (qId: string, value: string) => void;
  onQuantityBlur: (qId: string) => void;
  focusEnd: (el: HTMLInputElement | null) => void;
}

/**
 * כרטיס שאלה ממומו (React.memo) – מונע רינדור מחדש של כל השאלות בכל לחיצת כן/לא,
 * ומחליף את אנימציית framer-motion באנימציית CSS קלה לשיפור תגובתיות (INP).
 */
const QuestionCard = memo(function QuestionCard({
  q,
  displayText,
  impactValue,
  impactLabel,
  isCustom,
  answer,
  showQuantityInput,
  quantityValue,
  quantityLabel,
  editHint,
  yesLabel,
  noLabel,
  quantityWord,
  myQuestionLabel,
  deleteAria,
  onToggle,
  onDelete,
  onSaveImpact,
  onQuantityChange,
  onQuantityBlur,
  focusEnd,
}: QuestionCardProps) {
  return (
    <div className="question-card-in bg-white rounded-3xl border border-slate-100 shadow-sm px-5 py-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-bold text-slate-900 flex-1">{displayText}</span>
        {isCustom && (
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wide text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
              {myQuestionLabel}
            </span>
            <button
              type="button"
              onClick={() => onDelete(q.id)}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              aria-label={deleteAria}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onToggle(q, true)}
            className={`min-h-[44px] min-w-[56px] px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-black transition-all active:scale-[0.98] ${
              answer === true
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >{yesLabel}</button>
          <button
            type="button"
            onClick={() => onToggle(q, false)}
            className={`min-h-[44px] min-w-[56px] px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-black transition-all active:scale-[0.98] ${
              answer === false
                ? 'bg-slate-800 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >{noLabel}</button>
        </div>
        <EditablePriceLabel
          label={impactLabel}
          defaultValue={impactValue}
          onSave={(v) => onSaveImpact(q.id, v)}
          editHint={editHint}
        />
      </div>
      {showQuantityInput && answer === true && (
        <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
          <span className="text-xs text-slate-500">{quantityWord}:</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={quantityValue}
            onChange={(e) => onQuantityChange(q.id, e.target.value)}
            onFocus={(e) => focusEnd(e.currentTarget)}
            onBlur={() => onQuantityBlur(q.id)}
            placeholder="1"
            className="w-20 min-h-[40px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            dir="ltr"
          />
          <span className="text-xs text-slate-500">{quantityLabel}</span>
        </div>
      )}
    </div>
  );
});

export default function ServiceWizardPage() {
  const { slug, serviceId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { getBasePrice, getImpactValue, setBasePrice, setQuestionImpact } = usePriceOverrides();
  const { getMergedServices, getMergedQuestions, addQuestion, deleteQuestion, getCategoryById } =
    useCustomCatalog();
  const { t, dir } = useLanguage();
  const { shouldShow, dismissPage } = useSpotlightOnboarding();
  const addButtonRef = useRef<HTMLDivElement>(null);

  const categoryId = Array.isArray(slug) ? slug[0] : slug;
  const svcId = Array.isArray(serviceId) ? serviceId[0] : serviceId;

  const category = getCategoryById(categoryId ?? '', categories);
  const service = useMemo(() => {
    if (!category) return undefined;
    return getMergedServices(category.id, category.services).find((s) => s.id === svcId);
  }, [category, getMergedServices, svcId]);

  const questions = useMemo(() => {
    if (!service) return [];
    return getMergedQuestions(service.id, service.questions);
  }, [service, getMergedQuestions]);

  const [quantityInput, setQuantityInput] = useState<string>('1');
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [questionQuantities, setQuestionQuantities] = useState<Record<string, string>>({});
  const [showAddQuestion, setShowAddQuestion] = useState(false);

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
    return questions
      .filter((q) => answers[q.id] === true)
      .map((q) => {
        const impactValue = getImpactValue(service.id, q.id, q.impact.value);
        const price = calculateQuestionExtraPrice(q, impactValue, baseTotal, qty, questionQuantities);
        const hasQtyLabel = 'quantityLabel' in q.impact && q.impact.quantityLabel;
        const useQtyForFixed = q.impact.type === 'fixed' && hasQtyLabel && qty > 1;
        const qtyQ = q.impact.type === 'fixedWithQuantity'
          ? Math.max(1, parseInt(questionQuantities[q.id] || '1', 10) || 1)
          : useQtyForFixed
            ? Math.min(qty, Math.max(1, parseInt(questionQuantities[q.id] || '1', 10) || 1))
            : null;
        const label = hasQtyLabel ? q.impact.quantityLabel! : "יח'";
        const qText = getQuestionDisplayText(t, service.id, q);
        const text = qtyQ != null && qtyQ > 0
          ? `${qText} (${qtyQ} ${label})`
          : qText;
        return { text, price };
      });
  }, [service, questions, answers, baseTotal, qty, questionQuantities, t, getImpactValue]);

  const extrasTotal = useMemo(() => {
    return selectedExtrasList.reduce((sum, e) => sum + e.price, 0);
  }, [selectedExtrasList]);

  const total = baseTotal + extrasTotal;

  const focusEnd = useCallback((el: HTMLInputElement | null) => {
    if (!el) return;
    const len = (el.value || '').length;
    const setEnd = () => {
      el.setSelectionRange(len, len);
    };
    setEnd();
    requestAnimationFrame(setEnd);
  }, []);

  const handleAddQuestionClick = () => {
    if (!user) {
      router.push(`/login?from=${encodeURIComponent(`/category/${categoryId}/${svcId}`)}`);
      return;
    }
    setShowAddQuestion(true);
  };

  const handleDeleteQuestion = useCallback(async (questionId: string) => {
    if (!category || !service || !window.confirm(t('customCatalog.deleteQuestionConfirm'))) return;
    await deleteQuestion(category.id, service.id, questionId);
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  }, [category, service, t, deleteQuestion]);

  const handleToggle = useCallback((question: Question, value: boolean) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  }, []);

  const handleQuestionQuantityChange = useCallback((qId: string, value: string) => {
    const digits = value.replace(/[^\d]/g, '');
    setQuestionQuantities((prev) => ({
      ...prev,
      [qId]: digits === '' ? '' : digits,
    }));
  }, []);

  const handleQuestionQuantityBlur = useCallback((qId: string) => {
    const q = questions.find((x) => x.id === qId);
    const isFixedWithQty = q?.impact.type === 'fixed' && 'quantityLabel' in (q?.impact || {}) && qty > 1;
    const maxQty = isFixedWithQty ? qty : Infinity;
    setQuestionQuantities((prev) => {
      const val = prev[qId];
      const num = parseInt(val || '', 10);
      if (val === '' || Number.isNaN(num) || num < 1) {
        return { ...prev, [qId]: '1' };
      }
      return { ...prev, [qId]: String(Math.min(num, maxQty)) };
    });
  }, [questions, qty]);

  const handleSaveImpact = useCallback((qId: string, value: number | '') => {
    if (service) setQuestionImpact(service.id, qId, value);
  }, [service, setQuestionImpact]);

  if (!category || !service) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50" dir={dir}>
        <p className="text-slate-500 font-bold">{t('common.serviceNotFound')}</p>
      </main>
    );
  }

  const serviceName = getServiceDisplayName(t, service);
  const editHint = t('serviceWizard.tapToEditPrice');

  const showAddSpotlight = shouldShow('service');

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

  const hasQuantityInput = (q: Question) => {
    if (q.impact.type === 'fixedWithQuantity') return true;
    return q.impact.type === 'fixed' && 'quantityLabel' in q.impact && !!q.impact.quantityLabel && qty > 1;
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-28 sm:pb-28" dir={dir}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <button
          onClick={() => router.push(`/category/${category.id}`)}
          className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 min-h-[44px] px-2 -mr-2 rounded-xl active:bg-slate-100"
        >
          <span>{t('common.back')}</span>
          <span className="text-lg">↩</span>
        </button>

        <header className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center justify-between gap-2 flex-wrap">
            <span>{serviceName}</span>
            <span className="text-xl text-slate-500">{category.icon}</span>
          </h1>
          <div className="mt-2 flex items-center gap-2 flex-wrap text-sm text-slate-500">
            <span>{t('serviceWizard.basePrice')}:</span>
            <EditablePriceLabel
              label={`₪${effectiveBasePrice.toLocaleString('he-IL')} ${t('serviceWizard.perUnit')} ${service.unit}`}
              defaultValue={effectiveBasePrice}
              onSave={(v) => setBasePrice(service.id, v)}
              editHint={editHint}
            />
          </div>
        </header>

        {service.isCounter && (
          <section className="mb-4 sm:mb-6 bg-white p-4 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">{t('serviceWizard.quantityUnitsTitle')}</h2>
            <div className="flex items-center gap-3">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={quantityInput}
                onChange={(e) => handleQuantityChange(e.target.value)}
                onFocus={(e) => focusEnd(e.currentTarget)}
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
            <h2 className="text-sm font-semibold text-slate-700">{t('serviceWizard.customizeTitle')}</h2>
            <p className="text-xs text-slate-500">{t('serviceWizard.customizeHint')}</p>
          </div>

          {questions.map((q) => {
            const impactValue = getImpactValue(service.id, q.id, q.impact.value);
            return (
              <QuestionCard
                key={q.id}
                q={q}
                displayText={getQuestionDisplayText(t, service.id, q)}
                impactValue={impactValue}
                impactLabel={formatImpactLabel(q, impactValue, service.unit)}
                isCustom={isCustomQuestionId(q.id)}
                answer={answers[q.id]}
                showQuantityInput={hasQuantityInput(q)}
                quantityValue={questionQuantities[q.id] ?? '1'}
                quantityLabel={q.impact.quantityLabel ?? "יח'"}
                editHint={editHint}
                yesLabel={t('common.yes')}
                noLabel={t('common.no')}
                quantityWord={t('common.quantity')}
                myQuestionLabel={t('customCatalog.myQuestion')}
                deleteAria={t('customCatalog.deleteQuestion')}
                onToggle={handleToggle}
                onDelete={handleDeleteQuestion}
                onSaveImpact={handleSaveImpact}
                onQuantityChange={handleQuestionQuantityChange}
                onQuantityBlur={handleQuestionQuantityBlur}
                focusEnd={focusEnd}
              />
            );
          })}

          <button
            type="button"
            onClick={handleAddQuestionClick}
            className="group w-full flex items-center justify-center gap-2 px-4 py-4 rounded-3xl border-2 border-dashed border-slate-200 text-slate-500 font-bold text-sm hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/40 transition-colors active:scale-[0.99]"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
              <Plus size={16} />
            </span>
            {t('customCatalog.addQuestionButton')}
          </button>
        </section>
      </div>

      <div
        className={`bottom-bar-in fixed bottom-0 inset-x-0 p-2 sm:p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent ${showAddSpotlight ? SPOTLIGHT_ELEVATED_CLASS : 'z-30'}`}
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto max-w-md sm:max-w-3xl px-2 sm:px-1 flex justify-center">
          <div className="rounded-xl sm:rounded-[2.5rem] bg-slate-900 text-white px-3 py-2.5 sm:p-5 shadow-xl flex items-center justify-between gap-2 sm:gap-3 w-full max-w-sm sm:max-w-none">
            <div className="pr-1 sm:pr-2 min-w-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">{t('common.totalToPay')}</span>
              <span className="text-lg sm:text-2xl font-black tabular-nums tracking-tight">
                ₪{total.toLocaleString('he-IL')}
              </span>
            </div>
            <div
              ref={addButtonRef}
              className={`w-36 sm:w-48 shrink-0 min-w-0 ${showAddSpotlight ? `${SPOTLIGHT_TARGET_CLASS} rounded-2xl` : ''}`}
            >
              <AddToBasketButton
                service={{
                  name: serviceName,
                  category: category.id,
                  basePrice: baseTotal,
                  extras: selectedExtrasList,
                  description: selectedExtrasList.map((e) => e.text).join(', '),
                  quantity: qty > 1 ? qty : undefined,
                  unit: qty > 1 ? service.unit : undefined,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <SpotlightOverlay
        open={showAddSpotlight}
        targetRef={addButtonRef}
        title={t('spotlight.serviceTitle')}
        body={t('spotlight.serviceBody')}
        skipLabel={t('spotlight.skip')}
        step={3}
        onDismiss={() => dismissPage('service')}
      />

      <AddCustomQuestionModal
        open={showAddQuestion}
        onClose={() => setShowAddQuestion(false)}
        onSave={(input) => addQuestion(category.id, service.id, input)}
      />
    </main>
  );
}
