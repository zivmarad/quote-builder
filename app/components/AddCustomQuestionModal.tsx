'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { NewCustomQuestionInput } from '../../lib/custom-catalog-types';
import type { PriceImpactType } from '../service/services';

interface AddCustomQuestionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (input: NewCustomQuestionInput) => Promise<boolean>;
}

const IMPACT_CHOICES: { value: PriceImpactType; titleKey: string; descKey: string }[] = [
  { value: 'fixed', titleKey: 'customCatalog.impactFixedTitle', descKey: 'customCatalog.impactFixedDesc' },
  { value: 'percent', titleKey: 'customCatalog.impactPercentTitle', descKey: 'customCatalog.impactPercentDesc' },
  { value: 'fixedPerUnit', titleKey: 'customCatalog.impactFixedPerUnitTitle', descKey: 'customCatalog.impactFixedPerUnitDesc' },
  { value: 'fixedWithQuantity', titleKey: 'customCatalog.impactFixedWithQuantityTitle', descKey: 'customCatalog.impactFixedWithQuantityDesc' },
];

const UNIT_SUGGESTIONS = ['נקודה', 'ספוט', 'מטר', 'מ"ר', 'חדר', 'יחידה'];

export default function AddCustomQuestionModal({ open, onClose, onSave }: AddCustomQuestionModalProps) {
  const { t, dir } = useLanguage();
  const [text, setText] = useState('');
  const [impactType, setImpactType] = useState<PriceImpactType>('fixed');
  const [impactValue, setImpactValue] = useState('');
  const [quantityLabel, setQuantityLabel] = useState('מטר');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  // תווית כמות רלוונטית רק כשהשאלה שואלת כמות נפרדת.
  // (ב"מחיר ליחידת השירות" הכמות נלקחת מהשירות עצמו, אז אין צורך בתווית.)
  const showQuantityLabel = impactType === 'fixedWithQuantity';
  const isPercent = impactType === 'percent';

  const parsedValue = parseInt(impactValue, 10);
  const hasValue = !Number.isNaN(parsedValue);
  const previewChip = !hasValue
    ? null
    : isPercent
      ? `${parsedValue >= 0 ? '+' : ''}${parsedValue}%`
      : impactType === 'fixedPerUnit'
        ? `+₪${parsedValue} / ${t('common.unit', 'יחידה')}`
        : impactType === 'fixedWithQuantity'
          ? `+₪${parsedValue} / ${quantityLabel.trim() || 'יחידה'}`
          : `+₪${parsedValue}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!text.trim()) {
      setError(t('customCatalog.questionRequired'));
      return;
    }
    const value = parseInt(impactValue, 10);
    if (Number.isNaN(value)) {
      setError(t('customCatalog.impactValueRequired'));
      return;
    }
    setLoading(true);
    try {
      const ok = await onSave({
        text: text.trim(),
        impactType,
        impactValue: value,
        quantityLabel: showQuantityLabel ? quantityLabel.trim() || 'יחידה' : undefined,
      });
      if (ok) {
        setText('');
        setImpactValue('');
        setImpactType('fixed');
        onClose();
      } else {
        setError(t('customCatalog.saveFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      dir={dir}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-slate-900">{t('customCatalog.addQuestionTitle')}</h2>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <p className="text-slate-500 text-sm mb-5">{t('customCatalog.addQuestionHint')}</p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t('customCatalog.questionText')}</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('customCatalog.questionPlaceholder')}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t('customCatalog.whenYesQuestion')}</label>
            <div className="grid grid-cols-2 gap-2">
              {IMPACT_CHOICES.map((opt) => {
                const selected = impactType === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setImpactType(opt.value)}
                    aria-pressed={selected}
                    className={`text-right rounded-2xl border-2 p-3 transition-colors ${
                      selected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className={`block text-sm font-bold ${selected ? 'text-blue-700' : 'text-slate-800'}`}>
                      {t(opt.titleKey)}
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5 leading-tight">
                      {t(opt.descKey)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              {isPercent ? t('customCatalog.amountLabelPercent') : t('customCatalog.amountLabelMoney')}
            </label>
            <div className="flex items-stretch w-full rounded-xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
              <span className="flex items-center px-4 bg-slate-50 text-slate-500 font-black text-lg border-l border-slate-200">
                {isPercent ? '%' : '₪'}
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={impactValue}
                onChange={(e) => setImpactValue(e.target.value.replace(/[^\d-]/g, ''))}
                placeholder={isPercent ? t('customCatalog.amountPlaceholderPercent') : t('customCatalog.amountPlaceholderMoney')}
                className="flex-1 min-w-0 px-4 py-3 focus:outline-none text-left font-bold"
                dir="ltr"
                required
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">{t('customCatalog.amountHintNegative')}</p>
          </div>

          {showQuantityLabel && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">{t('customCatalog.unitNameLabel')}</label>
              <input
                type="text"
                value={quantityLabel}
                onChange={(e) => setQuantityLabel(e.target.value)}
                placeholder={t('customCatalog.unitNamePlaceholder')}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {UNIT_SUGGESTIONS.map((u) => (
                  <button
                    type="button"
                    key={u}
                    onClick={() => setQuantityLabel(u)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                      quantityLabel.trim() === u
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              {t('customCatalog.previewTitle')}
            </span>
            {previewChip ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-slate-800 flex-1 min-w-0">
                  {text.trim() || t('customCatalog.previewQuestionFallback')}
                </span>
                <span className="shrink-0 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-black tabular-nums">
                  {previewChip}
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-400">{t('customCatalog.previewEmpty')}</p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              {loading ? t('customCatalog.saving') : t('customCatalog.save')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl font-bold border-2 border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              {t('customCatalog.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
