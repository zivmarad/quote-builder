import type { Question } from '../app/service/services';

export function calculateQuestionExtraPrice(
  q: Question,
  impactValue: number,
  baseTotal: number,
  qty: number,
  questionQuantities: Record<string, string>
): number {
  const hasQtyLabel = 'quantityLabel' in q.impact && q.impact.quantityLabel;
  const useQtyForFixed = q.impact.type === 'fixed' && hasQtyLabel && qty > 1;

  if (q.impact.type === 'percent') {
    return (baseTotal * impactValue) / 100;
  }
  if (q.impact.type === 'fixedPerUnit') {
    return impactValue * qty;
  }
  if (q.impact.type === 'fixedWithQuantity') {
    const qtyQ = Math.max(1, parseInt(questionQuantities[q.id] || '1', 10) || 1);
    return impactValue * qtyQ;
  }
  if (useQtyForFixed) {
    const qtyQ = Math.min(qty, Math.max(1, parseInt(questionQuantities[q.id] || '1', 10) || 1));
    return impactValue * qtyQ;
  }
  return impactValue;
}

export function formatImpactLabel(
  q: Question,
  impactValue: number,
  unit: string
): string {
  if (q.impact.type === 'percent') {
    const sign = impactValue >= 0 ? '+' : '';
    return `${sign}${impactValue}%`;
  }
  if (q.impact.type === 'fixedPerUnit') {
    return `+₪${impactValue}/${unit}`;
  }
  if (q.impact.type === 'fixedWithQuantity' || (q.impact.type === 'fixed' && 'quantityLabel' in q.impact && q.impact.quantityLabel)) {
    return `+₪${impactValue}/${q.impact.quantityLabel ?? "יח'"}`;
  }
  return `+₪${impactValue}`;
}
