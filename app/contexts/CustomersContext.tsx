'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { fetchSync, postSync, deleteSync } from '../../lib/sync';

export interface Customer {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type CustomerInput = {
  id?: string;
  full_name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
};

interface CustomersContextType {
  customers: Customer[];
  isLoaded: boolean;
  refresh: () => Promise<void>;
  saveCustomer: (input: CustomerInput) => Promise<boolean>;
  deleteCustomer: (id: string) => Promise<boolean>;
}

const CustomersContext = createContext<CustomersContextType | undefined>(undefined);

export function CustomersProvider({ children, userId }: { children: React.ReactNode; userId?: string | null }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const lastLoadedForUserIdRef = useRef<string | null | undefined>(undefined);

  const refresh = useCallback(async () => {
    if (!userId) {
      setCustomers([]);
      setIsLoaded(true);
      lastLoadedForUserIdRef.current = userId;
      return;
    }
    const data = await fetchSync<{ customers: Customer[] }>('/customers', userId);
    lastLoadedForUserIdRef.current = userId;
    setCustomers(Array.isArray(data?.customers) ? data!.customers : []);
    setIsLoaded(true);
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    setIsLoaded(false);
    lastLoadedForUserIdRef.current = undefined;
    void (async () => {
      if (!userId) {
        if (!cancelled) {
          setCustomers([]);
          setIsLoaded(true);
          lastLoadedForUserIdRef.current = null;
        }
        return;
      }
      const data = await fetchSync<{ customers: Customer[] }>('/customers', userId);
      if (cancelled) return;
      lastLoadedForUserIdRef.current = userId;
      setCustomers(Array.isArray(data?.customers) ? data!.customers : []);
      setIsLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const saveCustomer = useCallback(
    async (input: CustomerInput): Promise<boolean> => {
      if (!userId || lastLoadedForUserIdRef.current !== userId) return false;
      const ok = await postSync('/customers', userId, {
        customer: {
          id: input.id,
          full_name: input.full_name,
          phone: input.phone ?? '',
          email: input.email ?? '',
          address: input.address ?? '',
          city: input.city ?? '',
          notes: input.notes ?? '',
        },
      });
      if (ok) await refresh();
      return ok;
    },
    [userId, refresh]
  );

  const deleteCustomer = useCallback(
    async (id: string): Promise<boolean> => {
      if (!userId || lastLoadedForUserIdRef.current !== userId) return false;
      const ok = await deleteSync('/customers', { id });
      if (ok) await refresh();
      return ok;
    },
    [userId, refresh]
  );

  const value = useMemo(
    () => ({ customers, isLoaded, refresh, saveCustomer, deleteCustomer }),
    [customers, isLoaded, refresh, saveCustomer, deleteCustomer]
  );

  return <CustomersContext.Provider value={value}>{children}</CustomersContext.Provider>;
}

export function useCustomers(): CustomersContextType {
  const ctx = useContext(CustomersContext);
  if (!ctx) {
    throw new Error('useCustomers must be used within CustomersProvider');
  }
  return ctx;
}
