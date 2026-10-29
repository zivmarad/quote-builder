'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const TERMS_ACCEPTED_KEY = 'quoteBuilder_termsAccepted';

export function useTermsAccepted() {
  const [accepted, setAccepted] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(TERMS_ACCEPTED_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (localStorage.getItem(TERMS_ACCEPTED_KEY) === '1') setAccepted(true);
    } catch {
      /* ignore */
    }
  }, []);

  const update = (value: boolean) => {
    setAccepted(value);
    try {
      if (value) localStorage.setItem(TERMS_ACCEPTED_KEY, '1');
      else localStorage.removeItem(TERMS_ACCEPTED_KEY);
    } catch {
      /* ignore */
    }
  };

  return { accepted, setAccepted: update };
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
