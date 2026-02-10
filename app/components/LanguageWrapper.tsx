'use client';

import { LanguageProvider, LanguageDirectionSync } from '../contexts/LanguageContext';

export default function LanguageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <LanguageDirectionSync />
      {children}
    </LanguageProvider>
  );
}
