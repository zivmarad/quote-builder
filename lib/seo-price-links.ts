import { categories } from '@/app/service/services';
import type { PriceRow } from '@/lib/seo-content';

function normalizeForMatch(s: string): string {
  return s
    .replace(/\s*\/\s*/g, '/')
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** מיפוי ידני לשורות SEO שהשם שלהן לא תואם 1:1 לשירות באפליקציה. */
const ROW_SERVICE_ALIASES: Record<string, Record<string, string>> = {
  plumbing: {
    'נקודת מים': 'plumbing-water-point',
    'החלפת אסלה': 'plumbing-toilet',
    'ניאגרה סמויה': 'plumbing-hidden-cistern',
    'פתיחת סתימה': 'plumbing-clog',
    'מערכות חימום מים': 'plumbing-heaters',
    'שיפוץ חדר רחצה קומפלט': 'plumbing-bathroom-complete',
    'פירוק והכנה': 'plumbing-bathroom-renovation',
    'איטום מקלחת': 'plumbing-bathroom-renovation',
  },
  electricity: {
    'נקודת חשמל': 'electric-point',
    'נקודת כוח': 'electric-power-point',
    'לוח חשמל': 'electric-panel',
    'גופי תאורה': 'electric-lighting',
    'עמדת טעינה': 'electric-ev-charger',
    'חימום תת-רצפתי': 'electric-floor-heating',
    'תקשורת': 'electric-communication',
  },
  ac: {
    'התקנת מזגן': 'ac-wall-small',
    'ניקוי': 'ac-deep-clean',
    'תחזוקה': 'ac-diagnosis',
    'מיני מרכזי': 'ac-mini-central',
  },
  tiling: {
    'ריצוף רצפה': 'tiling-glue',
    'חיפוי קירות': 'tiling-wall-covering',
    'פירוק ריצוף': 'tiling-demolition',
    'רובה': 'tiling-grout',
  },
  carpentry: {
    'מטבח': 'carpentry-kitchen-kit',
    'ארון': 'carpentry-closet',
    'פרגולה': 'carpentry-pergola',
  },
  drywall: {
    'קיר גבס': 'drywall-walls',
    'תקרת גבס': 'drywall-ceiling',
  },
  aluminium: {
    'חלון': 'aluminium-room-window',
    'דלת': 'aluminium-sliding',
    'תריס': 'aluminium-rolling-shutters',
  },
  welder: {
    'מעקה': 'welder-railing',
    'שער': 'welder-gate',
    'סורג': 'welder-grill',
  },
  sealing: {
    'איטום גג': 'sealing-roof-bitumen',
    'איטום מרפסת': 'sealing-balcony',
    'איטום מקלחת': 'sealing-shower',
  },
  doors: {
    'דלת כניסה': 'doors-entry',
    'דלת פנים': 'doors-interior',
    'מנעול': 'doors-locks',
  },
  handyman: {
    'טלוויזיה': 'handyman-tv',
    'מדף': 'handyman-shelves',
    'איקאה': 'handyman-ikea',
  },
  'sofa-cleaning': {
    'ספה': 'sofa-3-seater',
    'מזרן': 'sofa-mattress',
    'שטיח': 'sofa-carpet',
  },
  concrete: {
    'יציקת': 'concrete-floor',
    'ריצוף בטון': 'concrete-floor',
  },
  communications: {
    'מצלמה': 'comm-cctv',
    'אינטרקום': 'comm-intercom',
    'רשת': 'comm-data-cabling',
    'תקשורת': 'comm-data-cabling',
  },
  earthwork: {
    'חפירה': 'earthwork-excavation',
    'פינוי': 'earthwork-soil-removal',
    'יישור': 'earthwork-grading',
  },
  'shower-renovation': {
    'פירוק והריסה': 'shower-reno-demolition',
    'תשתית אינסטלציה': 'shower-reno-plumbing',
    'ניאגרה סמויה': 'shower-reno-concealed-cistern',
    'תשתית חשמל': 'shower-reno-electricity',
    'איטום רטוב': 'shower-reno-waterproofing',
    'ריצוף וחיפוי': 'shower-reno-floor-tiling',
    'כלים סניטריים': 'shower-reno-sanitary',
    'מקלחון': 'shower-reno-shower-cabin',
  },
  'home-renovation': {
    'פירוק והריסה': 'home-reno-demolition',
    'תשתית אינסטלציה': 'home-reno-plumbing',
    'תשתית חשמל': 'home-reno-electricity',
    'ריצוף כללי': 'home-reno-flooring',
    'מטבח': 'home-reno-kitchen',
    'דלתות פנים': 'home-reno-interior-doors',
    'צביעה': 'home-reno-painting',
    'נגרות': 'home-reno-carpentry',
    'אלומיניום': 'home-reno-aluminum',
  },
};

function findServiceId(categoryId: string, rowName: string): string | undefined {
  const category = categories.find((c) => c.id === categoryId);
  if (!category) return undefined;

  const normalizedRow = normalizeForMatch(rowName);

  if (ROW_SERVICE_ALIASES[categoryId]) {
    for (const [pattern, serviceId] of Object.entries(ROW_SERVICE_ALIASES[categoryId])) {
      if (normalizedRow.includes(normalizeForMatch(pattern))) {
        const exists = category.services.some((s) => s.id === serviceId);
        if (exists) return serviceId;
      }
    }
  }

  for (const service of category.services) {
    if (normalizeForMatch(service.name) === normalizedRow) {
      return service.id;
    }
  }

  let best: { id: string; score: number } | undefined;
  for (const service of category.services) {
    const normalizedService = normalizeForMatch(service.name);
    const rowIncludesService = normalizedRow.includes(normalizedService);
    const serviceIncludesRow = normalizedService.includes(normalizedRow);
    if (rowIncludesService || serviceIncludesRow) {
      const score = Math.min(normalizedRow.length, normalizedService.length);
      if (score >= 6 && (!best || score > best.score)) {
        best = { id: service.id, score };
      }
    }
  }

  return best?.id;
}

/** קישור לבניית הצעה – אשף שירות אם נמצא מיפוי, אחרת דף הקטגוריה. */
export function resolvePriceRowHref(categoryId: string | undefined, row: PriceRow): string | null {
  if (!categoryId) return null;

  const serviceId = row.serviceId ?? findServiceId(categoryId, row.name);
  const base = serviceId
    ? `/category/${categoryId}/${serviceId}`
    : `/category/${categoryId}`;

  return `${base}?try=1`;
}
