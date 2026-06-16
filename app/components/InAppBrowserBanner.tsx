'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  getSiteUrl,
  isAndroidDevice,
  isIosDevice,
  isLikelyInAppBrowser,
} from '../../lib/install-utils';

const DISMISS_KEY = 'quoteBuilder_inAppBanner_dismissed';

/**
 * באנר שמנחה לפתוח את האתר בדפדפן כשנכנסים מדפדפן מובנה (וואטסאפ וכו').
 */
export default function InAppBrowserBanner() {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(DISMISS_KEY)) return;
    if (!isLikelyInAppBrowser()) return;
    const id = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleCopy = async () => {
    const url = getSiteUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setShow(false);
  };

  if (!show) return null;

  const message = isIosDevice()
    ? t('inAppBanner.messageIos')
    : isAndroidDevice()
      ? t('inAppBanner.messageAndroid')
      : t('inAppBanner.messageGeneric');

  return (
    <div
      role="alert"
      className="bg-amber-50 border-b border-amber-200 px-3 py-3 text-sm text-amber-900"
      dir="rtl"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <p className="font-medium flex-1 text-right">{message}</p>
        <div className="flex items-center gap-2 shrink-0 justify-end">
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="px-3 py-1.5 rounded-lg font-bold text-xs bg-amber-900 text-amber-50 hover:bg-black transition-colors"
          >
            {copied ? t('inAppBanner.copied') : t('inAppBanner.copyLink')}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-amber-600 hover:text-amber-900 rounded-lg"
            aria-label={t('installPrompt.close')}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
