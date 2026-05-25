'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Plus, Smartphone, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  clearInstallPromptSession,
  dismissInstallPrompt,
  shouldShowInstallPrompt,
} from '../../lib/first-quote-install';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallAppPrompt() {
  const { t, dir } = useLanguage();
  const [open, setOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [installLoading, setInstallLoading] = useState(false);

  const close = useCallback(() => {
    dismissInstallPrompt();
    setOpen(false);
  }, []);

  useEffect(() => {
    if (shouldShowInstallPrompt()) setOpen(true);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    const onInstalled = () => {
      setInstallSuccess(true);
      clearInstallPromptSession();
      dismissInstallPrompt();
    };
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    setInstallLoading(true);
    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallSuccess(true);
        clearInstallPromptSession();
        dismissInstallPrompt();
      }
    } finally {
      setInstallLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      dir={dir}
      role="dialog"
      aria-labelledby="install-prompt-title"
      aria-modal="true"
    >
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-md w-full p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Smartphone size={24} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <h2 id="install-prompt-title" className="text-xl font-black text-slate-900">
                {t('installPrompt.title')}
              </h2>
              <p className="text-slate-500 text-sm mt-1">{t('installPrompt.subtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 shrink-0"
            aria-label={t('installPrompt.close')}
          >
            <X size={20} />
          </button>
        </div>

        {installSuccess ? (
          <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 font-medium">
            <Check size={20} /> {t('profile.addedToHomeScreen')}
          </div>
        ) : installPrompt ? (
          <button
            type="button"
            onClick={handleInstall}
            disabled={installLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm"
          >
            <Plus size={20} />
            {installLoading ? t('profile.installing') : t('profile.addToHomeScreen')}
          </button>
        ) : (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
            <p className="font-bold text-slate-700 text-sm">{t('profile.howToAddTitle')}</p>
            <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm">
              {t('profile.howToAddImportant')}
            </p>
            <ul className="text-sm text-slate-600 space-y-1.5">
              <li><strong>{t('profile.howToAddAndroid')}</strong></li>
              <li><strong>{t('profile.howToAddIos')}</strong></li>
            </ul>
            <p className="text-slate-500 text-xs">{t('profile.installFailedHint')}</p>
          </div>
        )}

        <button
          type="button"
          onClick={close}
          className="w-full py-3 rounded-xl font-bold border-2 border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
        >
          {t('installPrompt.later')}
        </button>
      </div>
    </div>
  );
}
