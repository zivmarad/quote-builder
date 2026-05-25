'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { fetchSync, postSync } from '../../lib/sync';
import type { Question, Service } from '../service/services';
import {
  type CustomCatalogData,
  EMPTY_CUSTOM_CATALOG,
  generateCustomQuestionId,
  generateCustomServiceId,
  isCustomServiceId,
  mergeCategoryServices,
  mergeServiceQuestions,
  parseCustomCatalog,
  type NewCustomServiceInput,
  type NewCustomQuestionInput,
} from '../../lib/custom-catalog-types';

export type { NewCustomServiceInput, NewCustomQuestionInput };

const getStorageKey = (userId: string | null | undefined) =>
  `quoteBuilder_customCatalog_${userId ?? 'guest'}`;

interface CustomCatalogContextType {
  isLoaded: boolean;
  getCustomServices: (categoryId: string) => Service[];
  getMergedServices: (categoryId: string, builtIn: Service[]) => Service[];
  getExtraQuestions: (serviceId: string) => Question[];
  getMergedQuestions: (serviceId: string, builtIn: Question[]) => Question[];
  getAllCustomServices: () => Service[];
  addCustomService: (categoryId: string, input: NewCustomServiceInput) => Promise<boolean>;
  deleteCustomService: (categoryId: string, serviceId: string) => Promise<boolean>;
  addQuestion: (
    categoryId: string,
    serviceId: string,
    input: NewCustomQuestionInput
  ) => Promise<boolean>;
  deleteQuestion: (categoryId: string, serviceId: string, questionId: string) => Promise<boolean>;
}

const CustomCatalogContext = createContext<CustomCatalogContextType | undefined>(undefined);

function buildQuestion(input: NewCustomQuestionInput): Question {
  const impact: Question['impact'] = {
    type: input.impactType,
    value: input.impactValue,
  };
  if (input.impactType === 'fixedWithQuantity' && input.quantityLabel?.trim()) {
    impact.quantityLabel = input.quantityLabel.trim();
  }
  return {
    id: generateCustomQuestionId(),
    text: input.text.trim(),
    impact,
  };
}

export function CustomCatalogProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId?: string | null;
}) {
  const [catalog, setCatalog] = useState<CustomCatalogData>(EMPTY_CUSTOM_CATALOG);
  const [isLoaded, setIsLoaded] = useState(false);
  const lastLoadedForUserIdRef = useRef<string | null | undefined>(undefined);

  const persist = useCallback(
    async (next: CustomCatalogData) => {
      setCatalog(next);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(getStorageKey(userId), JSON.stringify(next));
        } catch {
          /* ignore */
        }
      }
      if (userId && lastLoadedForUserIdRef.current === userId) {
        await postSync('/custom-catalog', userId, { catalog: next });
      }
    },
    [userId]
  );

  useEffect(() => {
    let cancelled = false;
    const key = getStorageKey(userId);
    const loadFromStorage = (): CustomCatalogData => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return { ...EMPTY_CUSTOM_CATALOG };
        return parseCustomCatalog(JSON.parse(raw));
      } catch {
        return { ...EMPTY_CUSTOM_CATALOG };
      }
    };

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setIsLoaded(false);
      lastLoadedForUserIdRef.current = undefined;

      if (!userId) {
        lastLoadedForUserIdRef.current = userId;
        setCatalog(EMPTY_CUSTOM_CATALOG);
        setIsLoaded(true);
        return;
      }

      const data = await fetchSync<{ catalog: unknown }>('/custom-catalog', userId);
      if (!cancelled && data?.catalog) {
        const parsed = parseCustomCatalog(data.catalog);
        lastLoadedForUserIdRef.current = userId;
        setCatalog(parsed);
        try {
          localStorage.setItem(key, JSON.stringify(parsed));
        } catch {
          /* ignore */
        }
        setIsLoaded(true);
        return;
      }

      if (!cancelled) {
        lastLoadedForUserIdRef.current = userId;
        setCatalog(loadFromStorage());
        setIsLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const getCustomServices = useCallback(
    (categoryId: string) => catalog.servicesByCategory[categoryId] ?? [],
    [catalog]
  );

  const getMergedServices = useCallback(
    (categoryId: string, builtIn: Service[]) =>
      mergeCategoryServices(builtIn, catalog.servicesByCategory[categoryId]),
    [catalog]
  );

  const getExtraQuestions = useCallback(
    (serviceId: string) => catalog.extraQuestions[serviceId] ?? [],
    [catalog]
  );

  const getMergedQuestions = useCallback(
    (serviceId: string, builtIn: Question[]) =>
      mergeServiceQuestions(builtIn, catalog.extraQuestions[serviceId]),
    [catalog]
  );

  const getAllCustomServices = useCallback(() => {
    const all: Service[] = [];
    for (const list of Object.values(catalog.servicesByCategory)) {
      all.push(...list);
    }
    return all;
  }, [catalog]);

  const addCustomService = useCallback(
    async (categoryId: string, input: NewCustomServiceInput): Promise<boolean> => {
      if (!userId || !input.name.trim()) return false;
      const service: Service = {
        id: generateCustomServiceId(),
        name: input.name.trim(),
        basePrice: Math.max(0, input.basePrice),
        unit: input.unit.trim() || 'יחידה',
        isCounter: input.isCounter,
        questions: [],
      };
      const next: CustomCatalogData = {
        ...catalog,
        servicesByCategory: {
          ...catalog.servicesByCategory,
          [categoryId]: [...(catalog.servicesByCategory[categoryId] ?? []), service],
        },
      };
      await persist(next);
      return true;
    },
    [catalog, persist, userId]
  );

  const deleteCustomService = useCallback(
    async (categoryId: string, serviceId: string): Promise<boolean> => {
      if (!userId || !isCustomServiceId(serviceId)) return false;
      const list = catalog.servicesByCategory[categoryId] ?? [];
      const nextServices = list.filter((s) => s.id !== serviceId);
      const nextServicesByCategory = { ...catalog.servicesByCategory };
      if (nextServices.length > 0) nextServicesByCategory[categoryId] = nextServices;
      else delete nextServicesByCategory[categoryId];

      const nextExtra = { ...catalog.extraQuestions };
      delete nextExtra[serviceId];

      await persist({
        servicesByCategory: nextServicesByCategory,
        extraQuestions: nextExtra,
      });
      return true;
    },
    [catalog, persist, userId]
  );

  const addQuestion = useCallback(
    async (
      categoryId: string,
      serviceId: string,
      input: NewCustomQuestionInput
    ): Promise<boolean> => {
      if (!userId || !input.text.trim()) return false;
      const question = buildQuestion(input);

      if (isCustomServiceId(serviceId)) {
        const list = catalog.servicesByCategory[categoryId] ?? [];
        const idx = list.findIndex((s) => s.id === serviceId);
        if (idx === -1) return false;
        const updated = [...list];
        updated[idx] = {
          ...updated[idx],
          questions: [...updated[idx].questions, question],
        };
        await persist({
          ...catalog,
          servicesByCategory: { ...catalog.servicesByCategory, [categoryId]: updated },
        });
        return true;
      }

      await persist({
        ...catalog,
        extraQuestions: {
          ...catalog.extraQuestions,
          [serviceId]: [...(catalog.extraQuestions[serviceId] ?? []), question],
        },
      });
      return true;
    },
    [catalog, persist, userId]
  );

  const deleteQuestion = useCallback(
    async (categoryId: string, serviceId: string, questionId: string): Promise<boolean> => {
      if (!userId) return false;

      if (isCustomServiceId(serviceId)) {
        const list = catalog.servicesByCategory[categoryId] ?? [];
        const idx = list.findIndex((s) => s.id === serviceId);
        if (idx === -1) return false;
        const updated = [...list];
        updated[idx] = {
          ...updated[idx],
          questions: updated[idx].questions.filter((q) => q.id !== questionId),
        };
        await persist({
          ...catalog,
          servicesByCategory: { ...catalog.servicesByCategory, [categoryId]: updated },
        });
        return true;
      }

      const extra = catalog.extraQuestions[serviceId] ?? [];
      const filtered = extra.filter((q) => q.id !== questionId);
      const nextExtra = { ...catalog.extraQuestions };
      if (filtered.length > 0) nextExtra[serviceId] = filtered;
      else delete nextExtra[serviceId];

      await persist({ ...catalog, extraQuestions: nextExtra });
      return true;
    },
    [catalog, persist, userId]
  );

  return (
    <CustomCatalogContext.Provider
      value={{
        isLoaded,
        getCustomServices,
        getMergedServices,
        getExtraQuestions,
        getMergedQuestions,
        getAllCustomServices,
        addCustomService,
        deleteCustomService,
        addQuestion,
        deleteQuestion,
      }}
    >
      {children}
    </CustomCatalogContext.Provider>
  );
}

export function useCustomCatalog() {
  const ctx = useContext(CustomCatalogContext);
  if (ctx === undefined) {
    throw new Error('useCustomCatalog must be used within CustomCatalogProvider');
  }
  return ctx;
}
