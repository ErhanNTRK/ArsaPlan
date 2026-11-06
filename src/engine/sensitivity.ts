/**
 * DUYARLILIK ANALİZİ — satış fiyatı ve müteahhit kâr oranı değiştiğinde
 * arsa değerinin (Gelir Projeksiyonu, 5.000'e yuvarlı) nasıl değiştiğini gösterir.
 * Proje süresi + indirgeme oranı girilmişse değerler İNDİRGEMELİ arsa değeridir
 * (rapordaki ana değerle tutarlı); girilmemişse indirgemesiz klasik değerdir.
 * Hesap motoru aynen çalıştırılır; girdi kopyası üzerinde oynanır, asıl girdi değişmez.
 */
import { analyze } from './index';
import type { ProjectInput } from './types';

export interface SensitivityGrid {
  /** Satış fiyatı çarpanları: 0.9 = −%10 */
  priceFactors: number[];
  /** Müteahhit kâr oranları (0.25 = %25) */
  profitRates: number[];
  /** values[i][j]: priceFactors[i] ve profitRates[j] için arsa değeri (₺) */
  values: number[][];
  baseValue: number;
  /** Değerler indirgemeli mi? */
  discounted: boolean;
}

const PRICE_FACTORS = [0.9, 0.95, 1, 1.05, 1.1];
const PROFIT_DELTAS = [-0.05, -0.025, 0, 0.025, 0.05];

function scaledSales(sales: ProjectInput['sales'], k: number): ProjectInput['sales'] {
  const apt = { ...sales.apt };
  (Object.keys(apt) as (keyof typeof apt)[]).forEach((key) => { apt[key] = apt[key] * k; });
  return { ...sales, unitPrice: sales.unitPrice * k, apt };
}

export function buildSensitivity(input: ProjectInput): SensitivityGrid {
  const discounted = (input.residual.projectMonths ?? 0) > 0 && (input.residual.timeDiscountRate ?? 0) > 0;
  const base = input.residual.profitRate;
  const profitRates = PROFIT_DELTAS.map((d) => Math.max(0, Math.round((base + d) * 10000) / 10000));
  const values = PRICE_FACTORS.map((k) =>
    profitRates.map((pr) => {
      const r = analyze({
        ...input,
        sales: scaledSales(input.sales, k),
        residual: { ...input.residual, profitRate: pr },
      });
      return discounted ? r.financial.discountedLandValueRounded : r.financial.residualLandValueRounded;
    }));
  return { priceFactors: PRICE_FACTORS, profitRates, values, baseValue: values[2][2], discounted };
}
