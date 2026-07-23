import type { Category, PriceImpactType, Question, Service } from '../app/service/services';

export type CustomCategory = {
  id: string;
  name: string;
  /** אימוג'י או מפתח אייקון קצר */
  icon: string;
  createdAt: string;
};

export type CustomCatalogData = {
  servicesByCategory: Record<string, Service[]>;
  extraQuestions: Record<string, Question[]>;
  /** מקצועות שהמשתמש יצר לעצמו */
  customCategories: CustomCategory[];
};

export const EMPTY_CUSTOM_CATALOG: CustomCatalogData = {
  servicesByCategory: {},
  extraQuestions: {},
  customCategories: [],
};

export const CUSTOM_SERVICE_ID_PREFIX = 'custom-';
export const CUSTOM_CATEGORY_ID_PREFIX = 'ucat-';

export const UNIT_OPTIONS = [
  'יחידה',
  'מ"ר',
  'מטר רץ',
  'מטר',
  'מ"ק',
  'שעה',
  'ביקור',
  'חדר',
  'יום',
  'חודש',
  'תוכנית',
  'דו"ח',
  'הדרכה',
  'פרויקט',
] as const;

/** אימוג'ים נפוצים לבחירה במקצוע חדש */
export const PROFESSION_ICON_OPTIONS = [
  '🛡️',
  '🔧',
  '⚡',
  '🎨',
  '🏗️',
  '🪵',
  '🌿',
  '🚿',
  '🚪',
  '📡',
  '🧹',
  '📋',
  '👷',
  '🧰',
  '🏢',
  '🔨',
] as const;

export const IMPACT_TYPE_OPTIONS: { value: PriceImpactType; labelKey: string }[] = [
  { value: 'fixed', labelKey: 'customCatalog.impactFixed' },
  { value: 'fixedPerUnit', labelKey: 'customCatalog.impactFixedPerUnit' },
  { value: 'percent', labelKey: 'customCatalog.impactPercent' },
  { value: 'fixedWithQuantity', labelKey: 'customCatalog.impactFixedWithQuantity' },
];

export function generateCustomServiceId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${CUSTOM_SERVICE_ID_PREFIX}${crypto.randomUUID()}`;
  }
  return `${CUSTOM_SERVICE_ID_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function generateCustomQuestionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `cq-${crypto.randomUUID()}`;
  }
  return `cq-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function generateCustomCategoryId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${CUSTOM_CATEGORY_ID_PREFIX}${crypto.randomUUID()}`;
  }
  return `${CUSTOM_CATEGORY_ID_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export type NewCustomServiceInput = {
  name: string;
  basePrice: number;
  unit: string;
  isCounter: boolean;
};

export type NewCustomQuestionInput = {
  text: string;
  impactType: Question['impact']['type'];
  impactValue: number;
  quantityLabel?: string;
};

export type NewCustomCategoryInput = {
  name: string;
  icon?: string;
};

export function isCustomQuestionId(questionId: string): boolean {
  return questionId.startsWith('cq-');
}

export function isCustomServiceId(serviceId: string): boolean {
  return serviceId.startsWith(CUSTOM_SERVICE_ID_PREFIX);
}

export function isCustomCategoryId(categoryId: string): boolean {
  return categoryId.startsWith(CUSTOM_CATEGORY_ID_PREFIX);
}

function isValidQuestion(q: unknown): q is Question {
  if (!q || typeof q !== 'object') return false;
  const o = q as Question;
  if (typeof o.id !== 'string' || typeof o.text !== 'string') return false;
  if (!o.impact || typeof o.impact !== 'object') return false;
  const types: PriceImpactType[] = ['fixed', 'fixedPerUnit', 'percent', 'fixedWithQuantity'];
  if (!types.includes(o.impact.type)) return false;
  if (typeof o.impact.value !== 'number') return false;
  if (o.impact.quantityLabel != null && typeof o.impact.quantityLabel !== 'string') return false;
  return true;
}

function isValidService(s: unknown): s is Service {
  if (!s || typeof s !== 'object') return false;
  const o = s as Service;
  if (typeof o.id !== 'string' || !isCustomServiceId(o.id)) return false;
  if (typeof o.name !== 'string' || !o.name.trim()) return false;
  if (typeof o.basePrice !== 'number' || o.basePrice < 0) return false;
  if (typeof o.unit !== 'string' || !o.unit.trim()) return false;
  if (typeof o.isCounter !== 'boolean') return false;
  if (!Array.isArray(o.questions) || !o.questions.every(isValidQuestion)) return false;
  return true;
}

function isValidCustomCategory(c: unknown): c is CustomCategory {
  if (!c || typeof c !== 'object') return false;
  const o = c as CustomCategory;
  if (typeof o.id !== 'string' || !isCustomCategoryId(o.id)) return false;
  if (typeof o.name !== 'string' || !o.name.trim()) return false;
  if (typeof o.icon !== 'string' || !o.icon.trim()) return false;
  if (typeof o.createdAt !== 'string' || !o.createdAt.trim()) return false;
  return true;
}

/** האם יש תוכן אמיתי בקטלוג (לא אובייקט ריק) */
export function isCustomCatalogEmpty(data: CustomCatalogData): boolean {
  return (
    data.customCategories.length === 0 &&
    Object.keys(data.servicesByCategory).length === 0 &&
    Object.keys(data.extraQuestions).length === 0
  );
}

export function parseCustomCatalog(raw: unknown): CustomCatalogData {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_CUSTOM_CATALOG, customCategories: [] };
  const o = raw as Partial<CustomCatalogData>;
  const servicesByCategory: Record<string, Service[]> = {};
  const extraQuestions: Record<string, Question[]> = {};
  let customCategories: CustomCategory[] = [];

  if (o.servicesByCategory && typeof o.servicesByCategory === 'object') {
    for (const [catId, list] of Object.entries(o.servicesByCategory)) {
      if (!Array.isArray(list)) continue;
      const valid = list.filter(isValidService);
      if (valid.length > 0) servicesByCategory[catId] = valid;
    }
  }

  if (o.extraQuestions && typeof o.extraQuestions === 'object') {
    for (const [serviceId, list] of Object.entries(o.extraQuestions)) {
      if (!Array.isArray(list)) continue;
      const valid = list.filter(isValidQuestion);
      if (valid.length > 0) extraQuestions[serviceId] = valid;
    }
  }

  if (Array.isArray(o.customCategories)) {
    customCategories = o.customCategories.filter(isValidCustomCategory);
  }

  return { servicesByCategory, extraQuestions, customCategories };
}

export function mergeCategoryServices(builtIn: Service[], custom: Service[] | undefined): Service[] {
  if (!custom?.length) return builtIn;
  return [...builtIn, ...custom];
}

export function mergeServiceQuestions(builtIn: Question[], extra: Question[] | undefined): Question[] {
  if (!extra?.length) return builtIn;
  return [...builtIn, ...extra];
}

export function customCategoryToCategory(c: CustomCategory): Category {
  return {
    id: c.id,
    name: c.name,
    icon: c.icon,
    services: [],
  };
}

export function getServiceDisplayName(
  t: (key: string, fallback?: string) => string,
  service: Service
): string {
  if (isCustomServiceId(service.id)) return service.name;
  return t(`service.${service.id}`, service.name);
}

export function getQuestionDisplayText(
  t: (key: string, fallback?: string) => string,
  serviceId: string,
  question: Question
): string {
  if (isCustomQuestionId(question.id)) return question.text;
  return t(`question.${serviceId}.${question.id}`, question.text);
}

export function getCategoryDisplayName(
  t: (key: string, fallback?: string) => string,
  category: { id: string; name: string }
): string {
  if (isCustomCategoryId(category.id)) return category.name;
  return t(`categoryName.${category.id}`, category.name);
}
