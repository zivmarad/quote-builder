'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { requestOpenInstallPrompt } from '../../lib/first-quote-install';
import { promptNativeInstall } from '../../lib/deferred-install';
import { clearAppInstalledMark, isStandaloneDisplay, shouldOfferInstall } from '../../lib/install-utils';

interface InstallAppButtonProps {
  className?: string;
  showLabel?: boolean;
  showHint?: boolean;
  label?: string;
  labelClassName?: string;
}

export default function InstallAppButton({
  className = 'inline-flex items-center justify-center shrink-0 gap-1.5 w-10 h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-2 rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 font-bold text-xs sm:text-sm transition-colors',
  showLabel = true,
  showHint = false,
  label,
  labelClassName = 'hidden sm:inline',
}: InstallAppButtonProps) {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isStandaloneDisplay()) clearAppInstalledMark();
    const update = () => setShow(shouldOfferInstall());
    update();
    const mql = window.matchMedia?.('(display-mode: standalone)');
    mql?.addEventListener?.('change', update);
    const onInstalled = () => {
      setShow(false);
    };
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      mql?.removeEventListener?.('change', update);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!show) return null;

  const button = (
    <button
      type="button"
      onClick={() => {
        void (async () => {
          const outcome = await promptNativeInstall();
          if (outcome === 'accepted') {
            setShow(false);
            return;
          }
          if (outcome === 'unavailable') requestOpenInstallPrompt('manual');
        })();
      }}
      className={className}
      aria-label={t('header.installApp')}
      title={t('header.installApp')}
    >
      <Download size={18} className="shrink-0" />
      {showLabel && <span className={labelClassName}>{label ?? t('header.installApp')}</span>}
    </button>
  );

  if (!showHint) return button;

  return (
    <div className="flex flex-col items-center gap-0.5 shrink-0">
      {button}
      <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium leading-tight text-center">
        {t('home.installHint')}
      </span>
    </div>
  );
}
