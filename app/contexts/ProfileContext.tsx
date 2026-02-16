'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { fetchSync, postSync } from '../../lib/sync';

const getStorageKey = (userId: string | null | undefined) =>
  `quoteBuilderProfile_${userId ?? 'guest'}`;

const getLogoStorageKey = (userId: string | null | undefined) =>
  `quoteBuilderProfile_logo_${userId ?? 'guest'}`;

export interface UserProfile {
  businessName: string;
  contactName?: string;
  companyId?: string; // ח.פ של העסק
  phone: string;
  email?: string;
  address?: string;
  logo?: string; // base64 data URL
}

const defaultProfile: UserProfile = {
  businessName: '',
  contactName: '',
  companyId: '',
  phone: '',
  email: '',
  address: '',
  logo: '',
};

export type ProfileSyncStatus = 'idle' | 'saving' | 'saved' | 'error';

interface ProfileContextType {
  profile: UserProfile;
  setProfile: (p: Partial<UserProfile>) => void;
  isLoaded: boolean;
  syncStatus: ProfileSyncStatus;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children, userId }: { children: React.ReactNode; userId?: string | null }) {
  const [profile, setProfileState] = useState<UserProfile>(defaultProfile);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<ProfileSyncStatus>('idle');
  const lastLoadedForUserIdRef = useRef<string | null | undefined>(undefined);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoaded(true);
      return;
    }
    const key = getStorageKey(userId);
    const loadFromStorage = (): UserProfile => {
      let raw = localStorage.getItem(key);
      if (!raw) {
        const legacy = localStorage.getItem('quoteBuilderProfile');
        if (legacy) {
          try {
            localStorage.setItem(key, legacy);
            localStorage.removeItem('quoteBuilderProfile');
            raw = legacy;
          } catch {
            raw = legacy;
          }
        }
      }
      if (!raw) {
        const logoKey = getLogoStorageKey(userId);
        const logoOnly = localStorage.getItem(logoKey);
        if (logoOnly) {
          try {
            const data = JSON.parse(logoOnly) as string;
            if (typeof data === 'string' && data.startsWith('data:')) {
              return { ...defaultProfile, logo: data };
            }
          } catch {
            /* ignore */
          }
        }
        return defaultProfile;
      }
      try {
        const parsed = JSON.parse(raw) as Partial<UserProfile>;
        const profile = { ...defaultProfile, ...parsed };
        if (!profile.logo || profile.logo === '') {
          const logoKey = getLogoStorageKey(userId);
          const logoOnly = localStorage.getItem(logoKey);
          if (logoOnly) {
            try {
              const data = JSON.parse(logoOnly) as string;
              if (typeof data === 'string' && data.startsWith('data:')) profile.logo = data;
            } catch {
              /* ignore */
            }
          }
        }
        return profile;
      } catch {
        return defaultProfile;
      }
    };

    // טעינה מיידית מ־localStorage כדי שהפרטים יופיעו מיד ולא יימחקו
    const initial = loadFromStorage();
    lastLoadedForUserIdRef.current = userId;
    setProfileState(initial);
    setIsLoaded(true);

    if (!userId) return;

    let cancelled = false;
    (async () => {
      const data = await fetchSync<{ profile: UserProfile }>('/profile', userId);
      if (cancelled) return;

      let fromLocal = loadFromStorage();
      const guestKey = getStorageKey(null);
      if (guestKey !== key) {
        const guestRaw = localStorage.getItem(guestKey);
        if (guestRaw) {
          try {
            const guest = JSON.parse(guestRaw) as Partial<UserProfile>;
            fromLocal = { ...defaultProfile, ...fromLocal, ...guest };
            localStorage.removeItem(guestKey);
          } catch {
            /* ignore */
          }
        }
      }

      const fromApi = data?.profile && typeof data.profile === 'object' ? (data.profile as Partial<UserProfile>) : null;
      // תמיד העדף ערכים מקומיים לא־ריקים – פרטים ולוגו לא יימחקו גם אם השרת ריק או נכשל
      const merged: UserProfile = { ...defaultProfile, ...(fromApi ?? {}) };
      (Object.keys(fromLocal) as (keyof UserProfile)[]).forEach((k) => {
        const v = fromLocal[k];
        if (v !== undefined && v !== null && v !== '') (merged as unknown as Record<string, unknown>)[k] = v;
      });
      setProfileState(merged);
      try {
        localStorage.setItem(key, JSON.stringify(merged));
        try {
          localStorage.removeItem(getLogoStorageKey(userId));
        } catch {
          /* ignore */
        }
      } catch (e) {
        console.warn('Profile localStorage full, trying without logo', e);
        const withoutLogo = { ...merged, logo: '' };
        try {
          localStorage.setItem(key, JSON.stringify(withoutLogo));
          if (merged.logo) {
            try {
              localStorage.setItem(getLogoStorageKey(userId), JSON.stringify(merged.logo));
            } catch {
              /* logo key also full */
            }
          }
          setProfileState(merged);
        } catch {
          if (merged.logo) {
            try {
              localStorage.setItem(getLogoStorageKey(userId), JSON.stringify(merged.logo));
              setProfileState(merged);
            } catch {
              setProfileState(withoutLogo);
            }
          } else {
            setProfileState(withoutLogo);
          }
        }
        // גם כש־localStorage מלא – שומרים את הפרופיל המלא (כולל לוגו) בשרת כדי שיסונכרן בין מכשירים
        if (userId) void postSync('/profile', userId, { profile: merged });
      }
      if (fromApi && JSON.stringify(merged) !== JSON.stringify(fromApi)) {
        void postSync('/profile', userId, { profile: merged });
      } else if (!fromApi) {
        void postSync('/profile', userId, { profile: merged });
      }
    })();
    return () => {
      cancelled = true;
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [userId]);

  const setProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfileState((prev) => {
      const next = { ...prev, ...patch };
      if (typeof window !== 'undefined') {
        const key = getStorageKey(userId);
        let syncedInCatch = false;
        try {
          localStorage.setItem(key, JSON.stringify(next));
          try {
            localStorage.removeItem(getLogoStorageKey(userId));
          } catch {
            /* ignore */
          }
        } catch (e) {
          console.warn('Profile save failed (quota?), retrying without logo', e);
          try {
            const withoutLogo = { ...next, logo: '' };
            localStorage.setItem(key, JSON.stringify(withoutLogo));
            if (next.logo) {
              try {
                localStorage.setItem(getLogoStorageKey(userId), JSON.stringify(next.logo));
              } catch {
                /* logo key also full */
              }
            }
          } catch {
            /* keep in memory only */
          }
          // גם כש־localStorage מלא – שומרים את הפרופיל המלא (כולל לוגו) בשרת כדי שיסונכרן בין מכשירים
          if (userId && lastLoadedForUserIdRef.current === userId) {
            syncedInCatch = true;
            setSyncStatus('saving');
            postSync('/profile', userId, { profile: next }).then((ok) => {
              setSyncStatus(ok ? 'saved' : 'error');
              if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
              syncTimeoutRef.current = setTimeout(() => setSyncStatus('idle'), 4000);
            });
          }
        }
        if (userId && lastLoadedForUserIdRef.current === userId && !syncedInCatch) {
          const nextForSync = next;
          setSyncStatus('saving');
          if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
          postSync('/profile', userId, { profile: nextForSync }).then((ok) => {
            setSyncStatus(ok ? 'saved' : 'error');
            syncTimeoutRef.current = setTimeout(() => setSyncStatus('idle'), 4000);
          });
        }
      }
      return next;
    });
  }, [userId]);

  return (
    <ProfileContext.Provider value={{ profile, setProfile, isLoaded, syncStatus }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (ctx === undefined) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
