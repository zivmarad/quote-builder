'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { isStandaloneDisplay, requestOpenInstallPrompt } from '../../lib/first-quote-install';

interface InstallAppButtonProps {
  className?: string;
  showLabel?: boolean;
  showHint?: boolean;
}

export default function InstallAppButton({
  className = 'inline-flex items-center justify-center shrink-0 gap-1.5 w-10 h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-2 rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 font-bold text-xs sm:text-sm transition-colors',
  showLabel = true,
  showHint = false,
}: InstallAppButtonProps) {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const update = () => setShow(!isStandaloneDisplay());
    update();
    const mql = window.matchMedia?.('(display-mode: standalone)');
    mql?.addEventListener?.('change', update);
    window.addEventListener('appinstalled', update);
    return () => {
      mql?.removeEventListener?.('change', update);
      window.removeEventListener('appinstalled', update);
    };
  }, []);

  if (!show) return null;

  const button = (
    <button
      type="button"
      onClick={() => requestOpenInstallPrompt('manual')}
      className={className}
      aria-label={t('header.installApp')}
      title={t('header.installApp')}
    >
      <Download size={18} className="shrink-0" />
      {showLabel && <span className="hidden sm:inline">{t('header.installApp')}</span>}
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
