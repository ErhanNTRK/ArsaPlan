/**
 * SENARYO ANALİZİ — kötümser / baz / iyimser varsayımlarla arsa değeri.
 * Her senaryo, satış birim değerlerini ve yapım birim maliyetini yüzde olarak
 * değiştirip hesap motorunu aynen çalıştırır. Asıl girdi değişmez.
 */
import { analyze } from './index';
import type { ProjectInput, Scenario } from './types';

export const DEFAULT_SCENARIOS: Scenario[] = [
  { name: 'Kötümser', priceDelta: -0.10, costDelta: 0.10 },
  { name: 'Baz', priceDelta: 0, costDelta: 0 },
  { name: 'İyimser', priceDelta: 0.10, costDelta: -0.05 },
];

export interface ScenarioRow {
  name: string;
  priceDelta: number;
  costDelta: number;
  revenue: number;
  totalCost: number;
  landValue: number;
  /** Tapu alanı başına ₺ */
  unitValue: number;
  /** landValue indirgemeli mi? (proje süresi + oran girilmişse evet) */
  discounted: boolean;
}

function scaleSales(sales: ProjectInput['sales'], k: number): ProjectInput['sales'] {
  const apt = { ...sales.apt };
  (Object.keys(apt) as (keyof typeof apt)[]).forEach((key) => { apt[key] = apt[key] * k; });
  return { ...sales, unitPrice: sales.unitPrice * k, apt };
}

export function buildScenarios(input: ProjectInput, scenarios?: Scenario[]): ScenarioRow[] {
  const list = scenarios && scenarios.length === 3 ? scenarios : DEFAULT_SCENARIOS;
  const discounted = (input.residual.projectMonths ?? 0) > 0 && (input.residual.timeDiscountRate ?? 0) > 0;
  return list.map((sc) => {
    const r = analyze({
      ...input,
      sales: scaleSales(input.sales, 1 + sc.priceDelta),
      cost: { ...input.cost, unitCost: input.cost.unitCost * (1 + sc.costDelta) },
    });
    const f = r.financial;
    const land = discounted ? f.discountedLandValueRounded : f.residualLandValueRounded;
    return {
      name: sc.name, priceDelta: sc.priceDelta, costDelta: sc.costDelta,
      revenue: f.revenue, totalCost: f.totalCost,
      landValue: land,
      unitValue: input.parcel.area > 0 ? land / input.parcel.area : 0,
      discounted,
    };
  });
}
