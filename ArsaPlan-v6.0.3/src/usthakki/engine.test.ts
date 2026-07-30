/** Üst Hakkı motoru — golden testler (2026-07-30 oturumu, Denizbank örneği doğrulaması). */
import { describe, it, expect } from 'vitest';
import { computeUstHakki, pvaf, suggestRemainingYears, type UstHakkiInput } from './engine';

const base: UstHakkiInput = {
  referenceValue: 10000000, ilkSureYil: 49, kalanSureYil: 31,
  baseIncome: 1000000, incomeGrowthPct: 2,
  paymentEnabled: false, basePayment: 0, paymentGrowthPct: 2,
  ecrimisilEnabled: false, baseEcrimisil: 0, ecrimisilGrowthPct: 0,
  riskFreeRatePct: 7.5, riskPremiumPct: 3.5,
  hasTerminalValue: false, terminalValue: 0,
  costApproachValue: null, marketApproachValue: null, manualValue: null,
  finalMethod: 'dcf',
};

describe('dönem sayısı — hiçbir zaman sabit değil, kalan süre kadar', () => {
  it.each([10, 22, 31, 47, 49])('kalan süre %i ise tam %i dönem üretir', (n) => {
    const r = computeUstHakki({ ...base, kalanSureYil: n });
    expect(r.years).toHaveLength(n);
    expect(r.years[r.years.length - 1].year).toBe(n);
  });
  it('kalan süre 0 ise DCF boş döner ve uyarı verir', () => {
    const r = computeUstHakki({ ...base, kalanSureYil: 0 });
    expect(r.years).toHaveLength(0);
    expect(r.dcfValue).toBe(0);
    expect(r.warnings.some((w) => w.includes('Kalan süre'))).toBe(true);
  });
});

describe('DCF — gelir büyümesi ve iskonto', () => {
  it('yıl 1 gelir tam baseIncome; yıl 2 %2 büyümüş olur', () => {
    const r = computeUstHakki(base);
    expect(r.years[0].income).toBe(1000000);
    expect(r.years[1].income).toBeCloseTo(1020000, 1);
  });
  it('iskonto oranı risksiz+prim toplamıdır (%11)', () => {
    const r = computeUstHakki(base);
    expect(r.discountRate).toBeCloseTo(0.11, 4);
  });
  it('bugünkü değer 1/(1+i)^t ile küçülür', () => {
    const r = computeUstHakki(base);
    expect(r.years[0].presentValue).toBeCloseTo(1000000 / 1.11, 1);
    expect(r.years[1].presentValue).toBeCloseTo(1020000 / (1.11 ** 2), 1);
  });
});

describe('Terminal değer — varsayılan YOK, sözleşmeyle açılır', () => {
  it('hasTerminalValue false iken dcfValue yalnız yıllık PV toplamıdır', () => {
    const r = computeUstHakki(base);
    const manualSum = r.years.reduce((s, y) => s + y.presentValue, 0);
    expect(r.dcfValue).toBeCloseTo(manualSum, 1);
  });
  it('hasTerminalValue true iken son yıla indirgenmiş terminal eklenir', () => {
    const withTerm = { ...base, hasTerminalValue: true, terminalValue: 5000000 };
    const r = computeUstHakki(withTerm);
    const withoutTermR = computeUstHakki(base);
    const expectedTerminalPv = 5000000 / (1.11 ** 31);
    expect(r.dcfValue).toBeCloseTo(withoutTermR.dcfValue + expectedTerminalPv, 0);
  });
});

describe('Üst hakkı ödemesi ve ecrimisil — ayrı, opsiyonel satırlar', () => {
  it('ödeme etkinse net nakit akışından düşülür', () => {
    const withPay = { ...base, paymentEnabled: true, basePayment: 50000, paymentGrowthPct: 2 };
    const r = computeUstHakki(withPay);
    expect(r.years[0].payment).toBe(50000);
    expect(r.years[0].netCashFlow).toBe(1000000 - 50000);
  });
  it('ecrimisil de ayrı satır olarak düşer (Denizbank formatı: ikisi ayrı kalem)', () => {
    const withBoth = { ...base, paymentEnabled: true, basePayment: 50000,
      ecrimisilEnabled: true, baseEcrimisil: 20000, ecrimisilGrowthPct: 0 };
    const r = computeUstHakki(withBoth);
    expect(r.years[0].payment).toBe(50000);
    expect(r.years[0].ecrimisil).toBe(20000);
    expect(r.years[0].netCashFlow).toBe(1000000 - 50000 - 20000);
  });
  it('kapalıyken (varsayılan) hiçbir etkisi yok', () => {
    const r = computeUstHakki(base);
    expect(r.years[0].payment).toBe(0);
    expect(r.years[0].ecrimisil).toBe(0);
  });
});

describe('pvaf — anüite bugünkü değer faktörü', () => {
  it('i=0 iken faktör dönem sayısına eşittir', () => {
    expect(pvaf(10, 0)).toBe(10);
  });
  it('standart formülle örtüşür (elle hesap: n=5, i=%10 → 3.7908)', () => {
    expect(pvaf(5, 0.10)).toBeCloseTo(3.7908, 3);
  });
});

describe('Referans Üst Hakkı Hesabı — K = PVAF(kalan)/PVAF(ilk)', () => {
  it('kalan süre ilk süreye eşitse K=1, referans değer aynı çıkar', () => {
    const r = computeUstHakki({ ...base, ilkSureYil: 31, kalanSureYil: 31 });
    expect(r.referenceFactor).toBeCloseTo(1, 4);
    expect(r.referenceValue).toBeCloseTo(base.referenceValue, 0);
  });
  it('kalan süre ilk sürenin altındaysa K<1, referans değer küçülür', () => {
    const r = computeUstHakki(base);   // 31/49
    expect(r.referenceFactor).toBeLessThan(1);
    expect(r.referenceValue).toBeLessThan(base.referenceValue);
  });
});

describe('Nihai değer seçimi — kullanıcı seçer, sistem dayatmaz', () => {
  it('finalMethod=dcf iken finalValue=dcfValue', () => {
    const r = computeUstHakki({ ...base, finalMethod: 'dcf' });
    expect(r.finalValue).toBe(r.dcfValue);
  });
  it('finalMethod=reference iken finalValue=referenceValue', () => {
    const r = computeUstHakki({ ...base, finalMethod: 'reference' });
    expect(r.finalValue).toBe(r.referenceValue);
  });
  it('finalMethod=manual iken elle girilen değer aynen kullanılır', () => {
    const r = computeUstHakki({ ...base, finalMethod: 'manual', manualValue: 7654321 });
    expect(r.finalValue).toBe(7654321);
  });
  it('finalMethod=cost/market iken null ise 0 döner (hata fırlatmaz)', () => {
    const r = computeUstHakki({ ...base, finalMethod: 'cost', costApproachValue: null });
    expect(r.finalValue).toBe(0);
  });
});

describe('suggestRemainingYears — tesis tarihinden otomatik öneri', () => {
  it('49 yıl önce başlamış 49 yıllık hak → kalan süre yaklaşık 0', () => {
    const y = suggestRemainingYears('1977-01-01', 49, '2026-01-01');
    expect(y).not.toBeNull();
    expect(y!).toBeLessThan(1);
  });
  it('bugün başlayan 49 yıllık hak → kalan süre 49', () => {
    const y = suggestRemainingYears('2026-01-01', 49, '2026-01-01');
    expect(y).toBeCloseTo(49, 0);
  });
  it('geçersiz tarihte null döner', () => {
    expect(suggestRemainingYears('gecersiz', 49)).toBeNull();
  });
});
