export type ServicePriceOverride = {
  basePrice?: number;
  questions?: Record<string, number>;
};

/** JSON stored in Supabase / localStorage — supports legacy `{ serviceId: number }`. */
export type PriceOverridesStorage = Record<string, number | ServicePriceOverride>;

export function normalizeOverrideEntry(raw: unknown): ServicePriceOverride | null {
  if (typeof raw === 'number' && raw >= 0) return { basePrice: raw };
  if (!raw || typeof raw !== 'object') return null;
  const entry = raw as ServicePriceOverride;
  const result: ServicePriceOverride = {};
  if (typeof entry.basePrice === 'number' && entry.basePrice >= 0) {
    result.basePrice = entry.basePrice;
  }
  if (entry.questions && typeof entry.questions === 'object') {
    const questions: Record<string, number> = {};
    for (const [k, v] of Object.entries(entry.questions)) {
      if (typeof v === 'number') questions[k] = v;
    }
    if (Object.keys(questions).length > 0) result.questions = questions;
  }
  if (result.basePrice == null && !result.questions) return null;
  return result;
}

export function parseOverridesStorage(raw: unknown): Record<string, ServicePriceOverride> {
  if (!raw || typeof raw !== 'object') return {};
  const result: Record<string, ServicePriceOverride> = {};
  for (const [serviceId, value] of Object.entries(raw as PriceOverridesStorage)) {
    const entry = normalizeOverrideEntry(value);
    if (entry) result[serviceId] = entry;
  }
  return result;
}

export function serializeOverridesStorage(map: Record<string, ServicePriceOverride>): PriceOverridesStorage {
  const out: PriceOverridesStorage = {};
  for (const [serviceId, entry] of Object.entries(map)) {
    const hasQuestions = entry.questions && Object.keys(entry.questions).length > 0;
    if (!hasQuestions && entry.basePrice != null && entry.questions == null) {
      out[serviceId] = entry.basePrice;
    } else {
      const serialized: ServicePriceOverride = {};
      if (entry.basePrice != null) serialized.basePrice = entry.basePrice;
      if (hasQuestions) serialized.questions = { ...entry.questions };
      out[serviceId] = serialized;
    }
  }
  return out;
}

export function getOverrideBasePrice(entry: ServicePriceOverride | undefined, defaultPrice: number): number {
  if (entry?.basePrice != null && entry.basePrice >= 0) return entry.basePrice;
  return defaultPrice;
}

export function getOverrideQuestionValue(
  entry: ServicePriceOverride | undefined,
  questionId: string,
  defaultValue: number
): number {
  const v = entry?.questions?.[questionId];
  return typeof v === 'number' ? v : defaultValue;
}
