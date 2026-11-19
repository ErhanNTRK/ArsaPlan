/**
 * PROJEDEN ARSA DEĞERİ (ARTIK / RESIDUAL DEĞER) — otel projesi üzerinden arsaya dönüş.
 *
 * Tamamlanmış (istikrara kavuşmuş) proje değerinden:
 *   • yapı maliyeti (alan × birim maliyet × maliyete esas oran),
 *   • diğer yatırım maliyetleri (FF&E, proje/ruhsat, finansman…),
 *   • şerefiye / düzeltme bedeli,
 *   • girişimci kârı (yapı + diğer maliyetler üzerinden)
 * düşülerek arsa değerine dönülür. Gelir projenin bitiminde oluşacağı için süre ve yıllık reel
 * oran girilirse arsa modülündeki indirgeme mantığı uygulanır:
 *   Arsa = (Tamamlanmış değer − Kâr − Şerefiye) × dSon − (Yapı + Diğer maliyetler) × dOrta
 * Mevcut yapının değeri hesaba katılmaz (bina arsaya dahil kabul edilir); bu raporda yazılmalıdır.
 */
import type { HotelIncomeInput, HotelLandFromProject, HotelLandProjectInput } from './types';

export function defaultLandProject(): HotelLandProjectInput {
  return {
    enabled: true,
    basis: 'ina',
    buildings: [],
    costs: [
      { id: 'c2', name: 'Otel donanımı (FF&E) ve açılış öncesi giderler', amount: 0 },
      { id: 'c3', name: 'Proje, ruhsat, harç ve müşavirlik', amount: 0 },
      { id: 'c4', name: 'Finansman gideri', amount: 0 },
    ],
    goodwill: 0,
    profitRate: 0,
    months: 0,
    discountRate: null,
  };
}

const R5 = (v: number) => Math.round(v / 5000) * 5000;

export function computeLandFromProject(
  input: HotelIncomeInput,
  v: { capitalizedValue: number; prospectiveValue: number | null; inaNpv: number | null; costLandValue: number | null },
): HotelLandFromProject | null {
  const lp = input.landProject;
  if (!lp || !lp.enabled) return null;

  const useIna = lp.basis === 'ina' && v.inaNpv != null;
  const completedValue = useIna ? (v.inaNpv as number) : (v.prospectiveValue ?? v.capitalizedValue);
  const basisName = useIna
    ? 'İNA (NBD)'
    : v.prospectiveValue != null ? 'Direkt Kapitalizasyon (oturma indirgemeli)' : 'Direkt Kapitalizasyon';

  const buildingRows = (lp.buildings ?? []).map((b) => {
    const ratePct = b.ratePct > 0 ? Math.min(100, b.ratePct) : 100;
    return { type: b.type, area: Math.max(0, b.area || 0), unitCost: Math.max(0, b.unitCost || 0), ratePct,
      amount: Math.max(0, b.area || 0) * Math.max(0, b.unitCost || 0) * ratePct / 100 };
  });
  const buildingCost = buildingRows.reduce((s, b) => s + b.amount, 0);
  const otherCosts = (lp.costs ?? []).reduce((s, c) => s + Math.max(0, c.amount || 0), 0);
  const goodwill = Math.max(0, lp.goodwill || 0);
  const investment = buildingCost + otherCosts;
  const profitRate = Math.max(0, lp.profitRate || 0);
  const profit = investment * profitRate;
  const months = Math.max(0, lp.months || 0);
  const rate = Math.max(0, lp.discountRate ?? 0);
  const discountOn = months > 0 && rate > 0;

  const landBeforeDiscount = completedValue - investment - goodwill - profit;
  let landValue = landBeforeDiscount;
  if (discountOn) {
    const years = months / 12;
    const dEnd = Math.pow(1 + rate, -years);
    const dMid = Math.pow(1 + rate, -years / 2);
    landValue = (completedValue - profit - goodwill) * dEnd - investment * dMid;
  }
  const landValueRounded = R5(landValue);
  const area = input.costParcelArea ?? 0;

  return {
    basisName, completedValue, buildingRows, buildingCost, otherCosts, goodwill, investment, profitRate, profit,
    discountOn, months, rate,
    landBeforeDiscount, landBeforeDiscountRounded: R5(landBeforeDiscount),
    landValue, landValueRounded,
    unitValue: area > 0 ? landValueRounded / area : null,
    parcelArea: area > 0 ? area : null,
    appraisedLandValue: v.costLandValue != null && v.costLandValue > 0 ? v.costLandValue : null,
    negative: landValue <= 0,
  };
}
