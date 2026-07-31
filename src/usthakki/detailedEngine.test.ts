/** Ayrıntılı Üst Hakkı Değer Analizi — golden testler (2026-07-30, madde 24-40). */
import { describe, it, expect } from 'vitest';
import { computeDetailedUstHakki, computeRoomIncome, type DetailedUstHakkiInput, type DetailedRoomRow } from './detailedEngine';

const rooms: DetailedRoomRow[] = [
  { id: 'r1', name: 'Standart', count: 30, price: 3750, occupancyPct: 55, days: 365 },
];

const base: DetailedUstHakkiInput = {
  hotelName: 'Örnek Otel', ada: '10', parsel: '3', parcelArea: 5000, fromKml: false,
  sureUnit: 'yil', kalanSureYil: 5, toplamSureYil: 49,
  currency: 'TL', fxRate: 1,
  rooms, roomGrowthPct: 5,
  foodPct: 10, otherPct: 5, meetingPct: 3, shopPct: 2,
  roomExpensePct: 30, foodExpensePct: 40, otherExpensePct: 25, generalMgmtPct: 8, energyPct: 6, repairPct: 3,
  totalCost: 50000000, operatorPremiumPct: 5, propertyTaxPct: 0.4, insurancePct: 0.2,
  renewalFundBase: 0, renewalFundGrowthPct: 0,
  ecrimisilBase: 0, ecrimisilGrowthPct: 0,
  ustHakkiOdemeBase: 200000, ustHakkiOdemeGrowthPct: 2,
  bayilikBase: 0, bayilikGrowthPct: 0,
  riskFreeRatePct: 7.5, riskPremiumPct: 3.5,
  donemSonuIndirgemePct: 0,
};

describe('computeRoomIncome — Adet × Fiyat × Doluluk × Gün', () => {
  it('golden: 30 oda × 3750 TL × %55 × 365 gün = 22.584.375 TL', () => {
    expect(computeRoomIncome(rooms)).toBeCloseTo(22584375, 0);
  });
});

describe('Gelir zinciri — Oda payı = 100 − diğerlerinin toplamı', () => {
  it('toplam gelir, oda gelirinden geriye türetilir', () => {
    const r = computeDetailedUstHakki(base);
    const roomPct = 100 - (10 + 5 + 3 + 2); // 80
    expect(r.years[0].totalRevenue).toBeCloseTo(r.years[0].roomIncome / (roomPct / 100), 0);
  });
  it('diğer kalemler toplam gelirin doğru yüzdesidir', () => {
    const r = computeDetailedUstHakki(base);
    const y1 = r.years[0];
    expect(y1.foodIncome).toBeCloseTo(y1.totalRevenue * 0.10, 0);
    expect(y1.meetingIncome).toBeCloseTo(y1.totalRevenue * 0.03, 0);
  });
  it('tüm kalemler Oda Fiyat Artış Oranı ile aynı oranda büyür (mix sabit kalır)', () => {
    const r = computeDetailedUstHakki(base);
    const ratio1 = r.years[1].totalRevenue / r.years[0].totalRevenue;
    expect(ratio1).toBeCloseTo(1.05, 3);
    const mixY1 = r.years[0].foodIncome / r.years[0].totalRevenue;
    const mixY2 = r.years[1].foodIncome / r.years[1].totalRevenue;
    expect(mixY1).toBeCloseTo(mixY2, 6);
  });
});

describe('Gider zinciri — her kalem doğru tabana göre hesaplanır', () => {
  it('Oda/Yiyecek/Diğer giderleri kendi gelirleri üzerinden', () => {
    const r = computeDetailedUstHakki(base);
    const y = r.years[0];
    expect(y.roomExpense).toBeCloseTo(y.roomIncome * 0.30, 0);
    expect(y.foodExpense).toBeCloseTo(y.foodIncome * 0.40, 0);
    expect(y.otherExpense).toBeCloseTo(y.otherIncome * 0.25, 0);
  });
  it('Genel Yönetim ve Basit Tamirat toplam gelir üzerinden', () => {
    const r = computeDetailedUstHakki(base);
    const y = r.years[0];
    expect(y.generalMgmtExpense).toBeCloseTo(y.totalRevenue * 0.08, 0);
    expect(y.repairExpense).toBeCloseTo(y.totalRevenue * 0.03, 0);
  });
  it('Enerji (Oda+Toplantı) üzerinden', () => {
    const r = computeDetailedUstHakki(base);
    const y = r.years[0];
    expect(y.energyExpense).toBeCloseTo((y.roomIncome + y.meetingIncome) * 0.06, 0);
  });
  it('Brüt İşletme Kârı = Toplam Gelir − Toplam İşletme Gideri', () => {
    const r = computeDetailedUstHakki(base);
    const y = r.years[0];
    expect(y.grossOperatingProfit).toBeCloseTo(y.totalRevenue - y.totalOperatingExpense, 0);
  });
});

describe('Sabit giderler — İşletmeci Prim/Emlak Vergisi/Sigorta formüllü, diğerleri elle', () => {
  it('İşletmeci Prim brüt kâr üzerinden', () => {
    const r = computeDetailedUstHakki(base);
    const y = r.years[0];
    expect(y.operatorPremium).toBeCloseTo(y.grossOperatingProfit * 0.05, 0);
  });
  it('Emlak Vergisi ve Sigorta Toplam Maliyet üzerinden', () => {
    const r = computeDetailedUstHakki(base);
    const y = r.years[0];
    expect(y.propertyTax).toBeCloseTo(base.totalCost * 0.004, 0);
    expect(y.insurance).toBeCloseTo(base.totalCost * 0.002, 0);
  });
  it('Üst Hakkı Ödemesi elle+büyüme ile ilerler', () => {
    const r = computeDetailedUstHakki(base);
    expect(r.years[0].ustHakkiOdeme).toBe(200000);
    expect(r.years[1].ustHakkiOdeme).toBeCloseTo(200000 * 1.02, 1);
  });
});

describe('Net İşletme Kârı ve Nakit Akış Bugünkü Değer', () => {
  it('Net İşletme Kârı = Toplam Gelir − Toplam Gider', () => {
    const r = computeDetailedUstHakki(base);
    const y = r.years[0];
    expect(y.netOperatingProfit).toBeCloseTo(y.totalRevenue - y.totalExpense, 0);
  });
  it('1. dönem İNDİRGENMEZ (bugünkü değer = net kâr)', () => {
    const r = computeDetailedUstHakki(base);
    expect(r.years[0].presentValue).toBe(r.years[0].netOperatingProfit);
  });
  it('2. dönemden itibaren iskonto oranıyla indirgenir', () => {
    const r = computeDetailedUstHakki(base);
    const y2 = r.years[1];
    expect(y2.presentValue).toBeCloseTo(y2.netOperatingProfit / (1 + r.discountRate), 0);
  });
});

describe('Taşınmaz Değeri — Dönem Sonu İndirgeme + 5.000 TL yuvarlama', () => {
  it('indirgeme %0 iken sonuç = PV toplamı (yuvarlanmış)', () => {
    const r = computeDetailedUstHakki(base);
    expect(r.propertyValueLocal).toBeCloseTo(r.sumPresentValue, 0);
    expect(r.propertyValueRounded % 5000).toBe(0);
  });
  it('indirgeme %10 iken sonuç %10 azalır', () => {
    const withHaircut = computeDetailedUstHakki({ ...base, donemSonuIndirgemePct: 10 });
    const without = computeDetailedUstHakki(base);
    expect(withHaircut.propertyValueLocal).toBeCloseTo(without.sumPresentValue * 0.9, 0);
  });
});

describe('Döviz — TL karşılığı kur ile hesaplanır', () => {
  it('currency=TL iken propertyValueTl = propertyValueRounded', () => {
    const r = computeDetailedUstHakki(base);
    expect(r.propertyValueTl).toBe(r.propertyValueRounded);
  });
  it('currency=EUR iken propertyValueTl kur ile çarpılır', () => {
    const eurInput: DetailedUstHakkiInput = { ...base, currency: 'EUR', fxRate: 50 };
    const r = computeDetailedUstHakki(eurInput);
    expect(r.propertyValueTl).toBeCloseTo(r.propertyValueRounded * 50, -3);
  });
});

describe('Dönem sayısı — kalan süre kadar (sabit değil)', () => {
  it.each([3, 10, 22, 31])('kalan süre %i ise %i dönem üretir', (n) => {
    const r = computeDetailedUstHakki({ ...base, kalanSureYil: n });
    expect(r.years).toHaveLength(n);
  });
});
