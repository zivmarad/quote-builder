'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  getSiteUrl,
  isAndroidDevice,
  isIosDevice,
  isLikelyInAppBrowser,
  isAppMarkedInstalled,
} from '../../lib/install-utils';

export default function InstallManualGuide() {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const inApp = isLikelyInAppBrowser();
  const ios = isIosDevice();
  const android = isAndroidDevice();
  const alreadyInstalled = isAppMarkedInstalled();
  const siteUrl = getSiteUrl();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(siteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback for older browsers */
      try {
        const ta = document.createElement('textarea');
        ta.value = siteUrl;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        /* ignore */
      }
    }
  };

  if (alreadyInstalled) {
    return (
      <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-right space-y-2">
        <p className="font-bold text-green-800 text-sm">{t('installPrompt.alreadyInstalledTitle')}</p>
        <p className="text-green-700 text-sm">{t('installPrompt.alreadyInstalledDesc')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-right space-y-4">
      <p className="font-bold text-slate-800 text-sm">{t('installPrompt.manualTitle')}</p>

      {inApp && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">
            {t('installPrompt.step1Label')}
          </p>
          <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            {t('installPrompt.step1InApp')}
          </p>
          <ul className="text-sm text-slate-700 space-y-1.5 list-none">
            {ios && <li>• {t('installPrompt.step1Ios')}</li>}
            {android && !ios && <li>• {t('installPrompt.step1Android')}</li>}
            {!ios && !android && (
              <>
                <li>• {t('installPrompt.step1Ios')}</li>
                <li>• {t('installPrompt.step1Android')}</li>
              </>
            )}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
          {inApp ? t('installPrompt.copyLinkLabel') : t('installPrompt.copyLinkLabelAlt')}
        </p>
        <p className="text-xs text-slate-500">{t('installPrompt.copyLinkHint')}</p>
        <div className="flex items-stretch gap-2">
          <div
            className="flex-1 min-w-0 px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 truncate font-mono"
            dir="ltr"
            title={siteUrl}
          >
            {siteUrl}
          </div>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex items-center gap-1.5 shrink-0 px-3 py-2.5 rounded-lg font-bold text-xs bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? t('installPrompt.copied') : t('installPrompt.copyLink')}
          </button>
        </div>
      </div>

      <div className="space-y-2 pt-1 border-t border-slate-200">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
          {t('installPrompt.step2Label')}
        </p>
        <ul className="text-sm text-slate-700 space-y-2 list-none">
          {ios && (
            <li className="bg-white rounded-lg px-3 py-2.5 border border-slate-200">
              <span className="font-bold text-slate-800 block mb-0.5">{t('installPrompt.step2IosTitle')}</span>
              {t('installPrompt.step2Ios')}
            </li>
          )}
          {android && (
            <li className="bg-white rounded-lg px-3 py-2.5 border border-slate-200">
              <span className="font-bold text-slate-800 block mb-0.5">{t('installPrompt.step2AndroidTitle')}</span>
              {t('installPrompt.step2Android')}
            </li>
          )}
          {!ios && !android && (
            <>
              <li className="bg-white rounded-lg px-3 py-2.5 border border-slate-200">
                <span className="font-bold text-slate-800 block mb-0.5">{t('installPrompt.step2IosTitle')}</span>
                {t('installPrompt.step2Ios')}
              </li>
              <li className="bg-white rounded-lg px-3 py-2.5 border border-slate-200">
                <span className="font-bold text-slate-800 block mb-0.5">{t('installPrompt.step2AndroidTitle')}</span>
                {t('installPrompt.step2Android')}
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
