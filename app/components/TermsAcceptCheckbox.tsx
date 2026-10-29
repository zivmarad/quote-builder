'use client';

import { useCallback, useSyncExternalStore } from 'react';
import Link from 'next/link';

const TERMS_ACCEPTED_KEY = 'quoteBuilder_termsAccepted';

function readAccepted(): boolean {
  try {
    return localStorage.getItem(TERMS_ACCEPTED_KEY) === '1';
  } catch {
    return false;
  }
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  return () => window.removeEventListener('storage', onStoreChange);
}

export function useTermsAccepted() {
  const accepted = useSyncExternalStore(subscribe, readAccepted, () => false);

  const setAccepted = useCallback((value: boolean) => {
    try {
      if (value) localStorage.setItem(TERMS_ACCEPTED_KEY, '1');
      else localStorage.removeItem(TERMS_ACCEPTED_KEY);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new StorageEvent('storage', { key: TERMS_ACCEPTED_KEY }));
  }, []);

  return { accepted, setAccepted };
}

export default function TermsAcceptCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2 text-sm text-slate-600 leading-relaxed">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />
      <span>
        קראתי ואני מאשר/ת את{' '}
        <Link href="/terms" className="text-blue-600 font-medium hover:underline">
          תנאי השימוש
        </Link>{' '}
        ואת{' '}
        <Link href="/privacy" className="text-blue-600 font-medium hover:underline">
          מדיניות הפרטיות
        </Link>
      </span>
    </label>
  );
}
