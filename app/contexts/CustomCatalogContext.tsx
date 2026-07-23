'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { fetchSync, postSync } from '../../lib/sync';
import type { Category, Question, Service } from '../service/services';
import {
  type CustomCatalogData,
  type CustomCategory,
  EMPTY_CUSTOM_CATALOG,
  customCategoryToCategory,
  generateCustomCategoryId,
  generateCustomQuestionId,
  generateCustomServiceId,
  isCustomCatalogEmpty,
  isCustomCategoryId,
  isCustomServiceId,
  mergeCategoryServices,
  mergeServiceQuestions,
  parseCustomCatalog,
  type NewCustomServiceInput,
  type NewCustomQuestionInput,
  type NewCustomCategoryInput,
} from '../../lib/custom-catalog-types';

export type { NewCustomServiceInput, NewCustomQuestionInput, NewCustomCategoryInput };

const getStorageKey = (userId: string | null | undefined) =>
  `quoteBuilder_customCatalog_${userId ?? 'guest'}`;

interface CustomCatalogContextType {
  isLoaded: boolean;
  customCategories: CustomCategory[];
  getCustomCategory: (categoryId: string) => CustomCategory | undefined;
  getCategoryById: (categoryId: string, builtIn: Category[]) => Category | undefined;
  getCustomServices: (categoryId: string) => Service[];
  getMergedServices: (categoryId: string, builtIn: Service[]) => Service[];
  getExtraQuestions: (serviceId: string) => Question[];
  getMergedQuestions: (serviceId: string, builtIn: Question[]) => Question[];
  getAllCustomServices: () => Service[];
  addCustomCategory: (input: NewCustomCategoryInput) => Promise<CustomCategory | null>;
  renameCustomCategory: (categoryId: string, name: string) => Promise<boolean>;
  deleteCustomCategory: (categoryId: string) => Promise<boolean>;
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
  const [catalog, setCatalog] = useState<CustomCatalogData>({
    ...EMPTY_CUSTOM_CATALOG,
    customCategories: [],
  });
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
        if (!raw) return { ...EMPTY_CUSTOM_CATALOG, customCategories: [] };
        return parseCustomCatalog(JSON.parse(raw));
      } catch {
        return { ...EMPTY_CUSTOM_CATALOG, customCategories: [] };
      }
    };

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setIsLoaded(false);
      lastLoadedForUserIdRef.current = undefined;

      if (!userId) {
        lastLoadedForUserIdRef.current = userId;
        setCatalog({ ...EMPTY_CUSTOM_CATALOG, customCategories: [] });
        setIsLoaded(true);
        return;
      }

      const local = loadFromStorage();
      const data = await fetchSync<{ catalog: unknown }>('/custom-catalog', userId);
      if (cancelled) return;

      if (data?.catalog != null) {
        const parsed = parseCustomCatalog(data.catalog);
        // אל תדרוס נתונים מקומיים עם קטלוג שרת ריק (מניעת אובדן מידע)
        const useServer = !isCustomCatalogEmpty(parsed) || isCustomCatalogEmpty(local);
        const chosen = useServer ? parsed : local;
        lastLoadedForUserIdRef.current = userId;
        setCatalog(chosen);
        try {
          localStorage.setItem(key, JSON.stringify(chosen));
        } catch {
          /* ignore */
        }
        // אם השתמשנו בלוקאלי כי השרת היה ריק – סנכרן חזרה לשרת
        if (!useServer && !isCustomCatalogEmpty(local)) {
          await postSync('/custom-catalog', userId, { catalog: local });
        }
        setIsLoaded(true);
        return;
      }

      lastLoadedForUserIdRef.current = userId;
      setCatalog(local);
      setIsLoaded(true);
      if (!isCustomCatalogEmpty(local)) {
        await postSync('/custom-catalog', userId, { catalog: local });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const getCustomCategory = useCallback(
    (categoryId: string) => catalog.customCategories.find((c) => c.id === categoryId),
    [catalog.customCategories]
  );

  const getCategoryById = useCallback(
    (categoryId: string, builtIn: Category[]): Category | undefined => {
      const fromBuiltIn = builtIn.find((c) => c.id === categoryId);
      if (fromBuiltIn) return fromBuiltIn;
      const custom = catalog.customCategories.find((c) => c.id === categoryId);
      return custom ? customCategoryToCategory(custom) : undefined;
    },
    [catalog.customCategories]
  );

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

  const addCustomCategory = useCallback(
    async (input: NewCustomCategoryInput): Promise<CustomCategory | null> => {
      if (!userId || !input.name.trim()) return null;
      const category: CustomCategory = {
        id: generateCustomCategoryId(),
        name: input.name.trim(),
        icon: (input.icon?.trim() || '🧰').slice(0, 8),
        createdAt: new Date().toISOString(),
      };
      const next: CustomCatalogData = {
        ...catalog,
        customCategories: [...catalog.customCategories, category],
      };
      await persist(next);
      return category;
    },
    [catalog, persist, userId]
  );

  const renameCustomCategory = useCallback(
    async (categoryId: string, name: string): Promise<boolean> => {
      if (!userId || !isCustomCategoryId(categoryId) || !name.trim()) return false;
      const idx = catalog.customCategories.findIndex((c) => c.id === categoryId);
      if (idx === -1) return false;
      const updated = [...catalog.customCategories];
      updated[idx] = { ...updated[idx], name: name.trim() };
      await persist({ ...catalog, customCategories: updated });
      return true;
    },
    [catalog, persist, userId]
  );

  const deleteCustomCategory = useCallback(
    async (categoryId: string): Promise<boolean> => {
      if (!userId || !isCustomCategoryId(categoryId)) return false;
      const nextServicesByCategory = { ...catalog.servicesByCategory };
      const removedServices = nextServicesByCategory[categoryId] ?? [];
      delete nextServicesByCategory[categoryId];

      const nextExtra = { ...catalog.extraQuestions };
      for (const svc of removedServices) {
        delete nextExtra[svc.id];
      }

      await persist({
        servicesByCategory: nextServicesByCategory,
        extraQuestions: nextExtra,
        customCategories: catalog.customCategories.filter((c) => c.id !== categoryId),
      });
      return true;
    },
    [catalog, persist, userId]
  );

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
        ...catalog,
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
        customCategories: catalog.customCategories,
        getCustomCategory,
        getCategoryById,
        getCustomServices,
        getMergedServices,
        getExtraQuestions,
        getMergedQuestions,
        getAllCustomServices,
        addCustomCategory,
        renameCustomCategory,
        deleteCustomCategory,
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
