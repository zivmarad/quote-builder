import type { PriceImpactType, Question, Service } from '../app/service/services';

export type CustomCatalogData = {
  servicesByCategory: Record<string, Service[]>;
  extraQuestions: Record<string, Question[]>;
};

export const EMPTY_CUSTOM_CATALOG: CustomCatalogData = {
  servicesByCategory: {},
  extraQuestions: {},
};

export const CUSTOM_SERVICE_ID_PREFIX = 'custom-';

export const UNIT_OPTIONS = [
  'יחידה',
  'מ"ר',
  'מטר רץ',
  'מטר',
  'מ"ק',
  'שעה',
  'ביקור',
  'חדר',
  'כיסא',
  'מזרן',
  'רכב',
  'משאית',
  'מדרגה',
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

export function isCustomQuestionId(questionId: string): boolean {
  return questionId.startsWith('cq-');
}

export function isCustomServiceId(serviceId: string): boolean {
  return serviceId.startsWith(CUSTOM_SERVICE_ID_PREFIX);
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

export function parseCustomCatalog(raw: unknown): CustomCatalogData {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_CUSTOM_CATALOG };
  const o = raw as Partial<CustomCatalogData>;
  const servicesByCategory: Record<string, Service[]> = {};
  const extraQuestions: Record<string, Question[]> = {};

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

  return { servicesByCategory, extraQuestions };
}

export function mergeCategoryServices(builtIn: Service[], custom: Service[] | undefined): Service[] {
  if (!custom?.length) return builtIn;
  return [...builtIn, ...custom];
}

export function mergeServiceQuestions(builtIn: Question[], extra: Question[] | undefined): Question[] {
  if (!extra?.length) return builtIn;
  return [...builtIn, ...extra];
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
