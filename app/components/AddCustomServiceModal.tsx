'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { UNIT_OPTIONS, type NewCustomServiceInput } from '../../lib/custom-catalog-types';

interface AddCustomServiceModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (input: NewCustomServiceInput) => Promise<boolean>;
}

export default function AddCustomServiceModal({ open, onClose, onSave }: AddCustomServiceModalProps) {
  const { t, dir } = useLanguage();
  const [name, setName] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [unit, setUnit] = useState<string>(UNIT_OPTIONS[0]);
  const [isCounter, setIsCounter] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError(t('customCatalog.nameRequired'));
      return;
    }
    const price = parseInt(basePrice, 10);
    if (Number.isNaN(price) || price < 0) {
      setError(t('customCatalog.priceRequired'));
      return;
    }
    setLoading(true);
    try {
      const ok = await onSave({ name: name.trim(), basePrice: price, unit, isCounter });
      if (ok) {
        setName('');
        setBasePrice('');
        setUnit(UNIT_OPTIONS[0]);
        setIsCounter(false);
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
          <h2 className="text-xl font-black text-slate-900">{t('customCatalog.addServiceTitle')}</h2>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <p className="text-slate-500 text-sm mb-5">{t('customCatalog.addServiceHint')}</p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t('customCatalog.serviceName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('customCatalog.serviceNamePlaceholder')}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t('customCatalog.basePrice')}</label>
            <input
              type="text"
              inputMode="numeric"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="ltr"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t('customCatalog.unit')}</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isCounter}
              onChange={(e) => setIsCounter(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">{t('customCatalog.isCounter')}</span>
          </label>
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
