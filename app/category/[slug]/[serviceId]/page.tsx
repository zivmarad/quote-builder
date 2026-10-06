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
  isCustomCategoryId,
  isCustomQuestionId,
} from '../../../../lib/custom-catalog-types';
import { calculateQuestionExtraPrice, formatImpactLabel } from '../../../../lib/quote-pricing';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';

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
    <div className="question-card-in flex flex-col gap-3 border-b border-slate-100 px-5 py-4">
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
            className={`min-h-[40px] min-w-[52px] rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-[0.98] ${
              answer === true
                ? 'bg-blue-800 text-white'
                : 'bg-[#f3f6fb] text-slate-600'
            }`}
          >{yesLabel}</button>
          <button
            type="button"
            onClick={() => onToggle(q, false)}
            className={`min-h-[40px] min-w-[52px] rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-[0.98] ${
              answer === false
                ? 'bg-slate-700 text-white'
                : 'bg-[#f3f6fb] text-slate-600'
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
  const ownProfession = isCustomCategoryId(category.id);

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
    <main className="min-h-screen bg-[#f3f6fb] pb-32" dir={dir}>
      <div className="mx-auto max-w-md text-slate-900">
        <div className="px-5 pt-4">
          <button
            type="button"
            onClick={() => router.push(`/category/${category.id}`)}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500"
          >
            <ArrowRight size={18} />
            {t('common.back')}
          </button>
          <p className="text-sm text-slate-500">{t(`categoryName.${category.id}`, category.name)}</p>
          <h1 className="mt-0.5 text-2xl font-semibold leading-tight tracking-tight text-slate-900">{serviceName}</h1>
        </div>

        <div className="px-4 pt-5">
          <section className="overflow-hidden rounded-[28px] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <span className="text-sm font-medium text-slate-500">{t('serviceWizard.basePrice')}</span>
              <EditablePriceLabel
                label={`₪${effectiveBasePrice.toLocaleString('he-IL')} ${t('serviceWizard.perUnit')} ${service.unit}`}
                defaultValue={effectiveBasePrice}
                onSave={(v) => setBasePrice(service.id, v)}
                editHint={editHint}
              />
            </div>

            {service.isCounter && (
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <span className="text-sm font-medium text-slate-700">{t('serviceWizard.quantityUnitsTitle')}</span>
                <span className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={quantityInput}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    onFocus={(e) => focusEnd(e.currentTarget)}
                    onBlur={handleQuantityBlur}
                    placeholder="1"
                    className="w-16 rounded-full bg-[#f3f6fb] px-3 py-2 text-center text-sm font-semibold text-slate-900 focus:outline-none"
                    dir="ltr"
                  />
                  <span className="text-sm text-slate-500">{service.unit}</span>
                </span>
              </div>
            )}

            {!ownProfession && (
            <div className="px-5 pb-1 pt-4">
              <h2 className="text-sm font-semibold text-slate-700">{t('serviceWizard.customizeTitle')}</h2>
              <p className="mt-0.5 text-xs text-slate-500">{t('serviceWizard.customizeHint')}</p>
            </div>
            )}

            {!ownProfession && questions.map((q) => {
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

            {!ownProfession && (
            <button
              type="button"
              onClick={handleAddQuestionClick}
              className="flex w-full items-center gap-3 px-5 py-4 text-right text-sm font-semibold text-slate-700"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-800">
                <Plus size={16} aria-hidden />
              </span>
              {t('customCatalog.addQuestionButton')}
            </button>
            )}
          </section>
        </div>
      </div>

      <div
        className={`bottom-bar-in fixed bottom-0 inset-x-0 bg-gradient-to-t from-[#f3f6fb] via-[#f3f6fb] to-transparent p-4 ${showAddSpotlight ? SPOTLIGHT_ELEVATED_CLASS : 'z-30'}`}
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto flex max-w-md justify-center">
          <div className="flex w-full items-center justify-between gap-3 rounded-full bg-blue-900 px-5 py-3 text-white shadow-lg">
            <div className="min-w-0">
              <span className="block text-[11px] font-medium text-white/70">{t('common.totalToPay')}</span>
              <span className="text-lg font-semibold tabular-nums">
                ₪{total.toLocaleString('he-IL')}
              </span>
            </div>
            <div
              ref={addButtonRef}
              className={`min-w-0 flex-1 ${showAddSpotlight ? `${SPOTLIGHT_TARGET_CLASS} rounded-full` : ''}`}
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
