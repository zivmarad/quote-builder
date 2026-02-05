'use client';

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ProfileProvider } from '../contexts/ProfileContext';
import { QuoteHistoryProvider } from '../contexts/QuoteHistoryContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { PriceOverridesProvider } from '../contexts/PriceOverridesContext';

/** מעביר את מזהה המשתמש לפרופיל, היסטוריה, הגדרות ומחירי בסיס – כל משתמש רואה את הנתונים שלו. */
export default function UserDataProviders({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  return (
    <ProfileProvider userId={userId}>
      <QuoteHistoryProvider userId={userId}>
        <SettingsProvider userId={userId}>
          <PriceOverridesProvider userId={userId}>
            {children}
          </PriceOverridesProvider>
        </SettingsProvider>
      </QuoteHistoryProvider>
    </ProfileProvider>
  );
}
