'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  IMPACT_TYPE_OPTIONS,
  type NewCustomQuestionInput,
} from '../../lib/custom-catalog-types';
import type { PriceImpactType } from '../service/services';

interface AddCustomQuestionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (input: NewCustomQuestionInput) => Promise<boolean>;
}

export default function AddCustomQuestionModal({ open, onClose, onSave }: AddCustomQuestionModalProps) {
  const { t, dir } = useLanguage();
  const [text, setText] = useState('');
  const [impactType, setImpactType] = useState<PriceImpactType>('fixed');
  const [impactValue, setImpactValue] = useState('');
  const [quantityLabel, setQuantityLabel] = useState('מטר');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const showQuantityLabel =
    impactType === 'fixedWithQuantity' || impactType === 'fixedPerUnit';

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t('customCatalog.questionText')}</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('customCatalog.questionPlaceholder')}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t('customCatalog.impactType')}</label>
            <select
              value={impactType}
              onChange={(e) => setImpactType(e.target.value as PriceImpactType)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {IMPACT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t('customCatalog.impactValue')}</label>
            <input
              type="text"
              inputMode="numeric"
              value={impactValue}
              onChange={(e) => setImpactValue(e.target.value.replace(/[^\d-]/g, ''))}
              placeholder={impactType === 'percent' ? '15' : '100'}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="ltr"
              required
            />
            <p className="text-xs text-slate-400 mt-1">{t('customCatalog.impactValueHint')}</p>
          </div>
          {showQuantityLabel && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">{t('customCatalog.quantityLabel')}</label>
              <input
                type="text"
                value={quantityLabel}
                onChange={(e) => setQuantityLabel(e.target.value)}
                placeholder="מטר / מ&quot;ר / יחידה"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <div className="flex gap-3 pt-2">
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
