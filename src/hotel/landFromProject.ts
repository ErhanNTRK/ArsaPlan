/**
 * PROJEDEN ARSA DEĞERİ (ARTIK / RESIDUAL DEĞER) — otel projesi üzerinden arsaya dönüş.
 *
 * Mantık, arsa modülündeki Gelir Projeksiyonu ile aynıdır; hasılat yerine otelin
 * (ve varsa dükkânın) tamamlanmış, istikrara kavuşmuş değeri esas alınır:
 *   Arsa = Tamamlanmış proje değeri − Yatırım maliyetleri (arsa hariç) − Girişimci kârı
 * Süre ve indirgeme oranı girilirse arsa modülündeki formül uygulanır:
 *   Arsa = (Tamamlanmış değer − Kâr) × dSon − Maliyetler × dOrta
 *
 * Mevcut yapının değeri hesaba katılmaz (güçlendirme projesinde bina arsaya dahil kabul edilir);
 * bu varsayım raporda açıkça yazılmalıdır.
 */
import type { HotelIncomeInput, HotelLandFromProject, HotelLandProjectInput } from './types';

export function defaultLandProject(): HotelLandProjectInput {
  return {
    enabled: true,
    basis: 'ina',
    costs: [
      { id: 'c1', name: 'Güçlendirme ve tadilat inşaat maliyeti', amount: 0 },
      { id: 'c2', name: 'Otel donanımı (FF&E) ve açılış öncesi giderler', amount: 0 },
      { id: 'c3', name: 'Proje, ruhsat, harç ve müşavirlik', amount: 0 },
      { id: 'c4', name: 'Finansman gideri', amount: 0 },
    ],
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

  const investment = lp.costs.reduce((s, c) => s + Math.max(0, c.amount || 0), 0);
  const profitRate = Math.max(0, lp.profitRate || 0);
  const profit = investment * profitRate;
  const months = Math.max(0, lp.months || 0);
  const rate = Math.max(0, lp.discountRate ?? 0);
  const discountOn = months > 0 && rate > 0;

  const landBeforeDiscount = completedValue - investment - profit;
  let landValue = landBeforeDiscount;
  if (discountOn) {
    const years = months / 12;
    const dEnd = Math.pow(1 + rate, -years);
    const dMid = Math.pow(1 + rate, -years / 2);
    landValue = (completedValue - profit) * dEnd - investment * dMid;
  }
  const landValueRounded = R5(landValue);
  const area = input.costParcelArea ?? 0;

  return {
    basisName, completedValue, investment, profitRate, profit,
    discountOn, months, rate,
    landBeforeDiscount, landBeforeDiscountRounded: R5(landBeforeDiscount),
    landValue, landValueRounded,
    unitValue: area > 0 ? landValueRounded / area : null,
    parcelArea: area > 0 ? area : null,
    appraisedLandValue: v.costLandValue != null && v.costLandValue > 0 ? v.costLandValue : null,
    negative: landValue <= 0,
  };
}
