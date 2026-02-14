'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { fetchSync, postSync } from '../../lib/sync';

const getStorageKey = (userId: string | null | undefined) =>
  `quoteBuilderProfile_${userId ?? 'guest'}`;

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

interface ProfileContextType {
  profile: UserProfile;
  setProfile: (p: Partial<UserProfile>) => void;
  isLoaded: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children, userId }: { children: React.ReactNode; userId?: string | null }) {
  const [profile, setProfileState] = useState<UserProfile>(defaultProfile);
  const [isLoaded, setIsLoaded] = useState(false);
  const lastLoadedForUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoaded(true);
      return;
    }
    setIsLoaded(false);
    lastLoadedForUserIdRef.current = undefined;
    let cancelled = false;
    const key = getStorageKey(userId);
    const loadFromStorage = (): UserProfile => {
      let raw = localStorage.getItem(key);
      if (!raw) {
        const legacy = localStorage.getItem('quoteBuilderProfile');
        if (legacy) {
          localStorage.setItem(key, legacy);
          localStorage.removeItem('quoteBuilderProfile');
          raw = legacy;
        }
      }
      if (!raw) return defaultProfile;
      try {
        const parsed = JSON.parse(raw) as Partial<UserProfile>;
        return { ...defaultProfile, ...parsed };
      } catch {
        return defaultProfile;
      }
    };

    (async () => {
      if (userId) {
        const data = await fetchSync<{ profile: UserProfile }>('/profile', userId);
        if (!cancelled && data && data.profile && typeof data.profile === 'object') {
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
          const fromApi = data.profile as Partial<UserProfile>;
          // התחל מהשרת, אחר כך העדף ערכים מקומיים לא־ריקים – כדי שפרטים ולוגו שנשמרו מקומית לא יימחקו
          const merged: UserProfile = { ...defaultProfile, ...fromApi };
          (Object.keys(fromLocal) as (keyof UserProfile)[]).forEach((k) => {
            const v = fromLocal[k];
            if (v !== undefined && v !== null && v !== '') (merged as unknown as Record<string, unknown>)[k] = v;
          });
          lastLoadedForUserIdRef.current = userId;
          setProfileState(merged);
          localStorage.setItem(key, JSON.stringify(merged));
          if (JSON.stringify(merged) !== JSON.stringify(fromApi)) {
            void postSync('/profile', userId, { profile: merged });
          }
          setIsLoaded(true);
          return;
        }
      }
      if (!cancelled) {
        lastLoadedForUserIdRef.current = userId;
        setProfileState(loadFromStorage());
      }
      setIsLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const setProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfileState((prev) => {
      const next = { ...prev, ...patch };
      if (typeof window !== 'undefined') {
        try {
          const key = getStorageKey(userId);
          localStorage.setItem(key, JSON.stringify(next));
          if (userId && lastLoadedForUserIdRef.current === userId) void postSync('/profile', userId, { profile: next });
        } catch (e) {
          console.error('Failed to save profile', e);
        }
      }
      return next;
    });
  }, [userId]);

  return (
    <ProfileContext.Provider value={{ profile, setProfile, isLoaded }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (ctx === undefined) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
