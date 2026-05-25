'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ProfileProvider } from '../contexts/ProfileContext';
import { QuoteHistoryProvider } from '../contexts/QuoteHistoryContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { PriceOverridesProvider } from '../contexts/PriceOverridesContext';
import { CustomCatalogProvider } from '../contexts/CustomCatalogContext';
import { CustomersProvider } from '../contexts/CustomersContext';
import { syncDraftsForLoggedInUser } from '../../lib/drafts-storage';

/** מעביר את מזהה המשתמש לפרופיל, היסטוריה, הגדרות ומחירי בסיס – כל משתמש רואה את הנתונים שלו. */
export default function UserDataProviders({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) return;
    void syncDraftsForLoggedInUser(userId);
  }, [userId]);

  return (
    <ProfileProvider userId={userId}>
      <QuoteHistoryProvider userId={userId}>
        <SettingsProvider userId={userId}>
          <PriceOverridesProvider userId={userId}>
            <CustomCatalogProvider userId={userId}>
              <CustomersProvider userId={userId}>{children}</CustomersProvider>
            </CustomCatalogProvider>
          </PriceOverridesProvider>
        </SettingsProvider>
      </QuoteHistoryProvider>
    </ProfileProvider>
  );
}
