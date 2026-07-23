'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Plus, Sparkles, Trash2, Wrench } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useCustomCatalog } from '../contexts/CustomCatalogContext';
import { PROFESSION_ICON_OPTIONS } from '../../lib/custom-catalog-types';

export default function RequestProfessionPage() {
  const router = useRouter();
  const { t, dir } = useLanguage();
  const { user } = useAuth();
  const {
    isLoaded,
    customCategories,
    getCustomServices,
    addCustomCategory,
    deleteCustomCategory,
  } = useCustomCatalog();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>(PROFESSION_ICON_OPTIONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      router.push(`/login?from=${encodeURIComponent('/request-profession')}`);
      return;
    }

    if (!name.trim()) {
      setError(t('requestProfession.nameRequired'));
      return;
    }

    setLoading(true);
    try {
      const created = await addCustomCategory({ name: name.trim(), icon });
      if (!created) {
        setError(t('requestProfession.saveFailed'));
        return;
      }
      setName('');
      router.push(`/category/${created.id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId: string, categoryName: string) => {
    if (!window.confirm(t('requestProfession.deleteConfirm', `למחוק את המקצוע "${categoryName}" ואת כל השירותים שלו?`))) {
      return;
    }
    await deleteCustomCategory(categoryId);
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC]" dir={dir}>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/90 to-transparent pointer-events-none" />
        <div className="relative max-w-lg mx-auto px-5 py-8 sm:py-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium mb-8 min-h-[44px]"
          >
            <ArrowRight size={20} /> {t('requestProfession.backHome')}
          </Link>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden mb-6">
            <div className="bg-gradient-to-l from-blue-600 to-blue-500 px-6 py-8 text-white text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                <Wrench size={32} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black mb-2">{t('requestProfession.title')}</h1>
              <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
                {t('requestProfession.subtitle')}
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <Sparkles size={22} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-slate-600 text-sm leading-relaxed">
                  {t('requestProfession.explanation')}
                </p>
              </div>

              {!user ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 text-center">
                    {t('requestProfession.loginRequired')}
                  </p>
                  <Link
                    href={`/login?from=${encodeURIComponent('/request-profession')}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] transition-all"
                  >
                    {t('requestProfession.loginButton')}
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleCreate} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      {t('requestProfession.nameLabel')}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('requestProfession.namePlaceholder')}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={60}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      {t('requestProfession.iconLabel')}
                    </label>
                    <div className="grid grid-cols-8 gap-2">
                      {PROFESSION_ICON_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setIcon(opt)}
                          className={`h-10 rounded-xl text-xl flex items-center justify-center border transition-all ${
                            icon === opt
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                          aria-label={opt}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading || !isLoaded}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-60 transition-all shadow-lg shadow-blue-600/20"
                  >
                    <Plus size={20} />
                    {loading ? t('requestProfession.saving') : t('requestProfession.createButton')}
                  </button>

                  <p className="text-center text-xs text-slate-400">{t('requestProfession.note')}</p>
                </form>
              )}
            </div>
          </div>

          {user && customCategories.length > 0 && (
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                {t('requestProfession.myProfessions')}
              </h2>
              <ul className="space-y-3">
                {customCategories.map((cat) => {
                  const serviceCount = getCustomServices(cat.id).length;
                  return (
                    <li
                      key={cat.id}
                      className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                    >
                      <Link
                        href={`/category/${cat.id}`}
                        className="flex-1 flex items-center gap-3 min-w-0"
                      >
                        <span className="text-2xl shrink-0" aria-hidden>
                          {cat.icon}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-bold text-slate-900 truncate">{cat.name}</span>
                          <span className="block text-xs text-slate-500">
                            {t('requestProfession.servicesCount', `${serviceCount} שירותים`).replace(
                              '{{count}}',
                              String(serviceCount)
                            )}
                          </span>
                        </span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        aria-label={t('requestProfession.delete')}
                      >
                        <Trash2 size={18} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
