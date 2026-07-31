/** Ayrıntılı Üst Hakkı Değer Analizi — golden testler (2026-07-30/31). */
import { describe, it, expect } from 'vitest';
import { computeDetailedUstHakki, computeRoomIncome, computeCostApproach, type DetailedUstHakkiInput, type DetailedRoomRow, type BuildingCostRow } from './detailedEngine';

const rooms: DetailedRoomRow[] = [
  { id: 'r1', name: 'Standart', count: 30, price: 3750, occupancyPct: 55, days: 365 },
];
const buildings: BuildingCostRow[] = [
  { id: 'b1', type: 'Standart Bloklar', area: 8000, unitCost: 20000 },
  { id: 'b2', type: 'Lobi ve Resepsiyon Binası', area: 500, unitCost: 25000 },
];

const base: DetailedUstHakkiInput = {
  hotelName: 'Örnek Otel', ada: '10', parsel: '3', parcelArea: 5000, fromKml: false,
  sureUnit: 'yil', kalanSureYil: 5, toplamSureYil: 49,
  currency: 'TL', fxRate: 1,
  rooms, roomGrowthPct: 5,
  foodPct: 10, otherPct: 5, meetingPct: 3, shopPct: 2,
  roomExpensePct: 30, foodExpensePct: 40, otherExpensePct: 25, generalMgmtPct: 8, energyPct: 6, repairPct: 3,
  landUnitValue: 4000, buildings, showCostApproachInPdf: true,
  operatorPremiumPct: 5, propertyTaxPct: 0.4, insurancePct: 0.2, renewalFundPct: 4,
  ecrimisilBase: 0, ecrimisilGrowthPct: 0,
  ustHakkiOdemeBase: 200000, ustHakkiOdemeGrowthPct: 2,
  bayilikBase: 0, bayilikGrowthPct: 0,
  discountRatePct: 11,
  donemSonuIndirgemePct: 0,
};

describe('computeRoomIncome — Adet × Fiyat × Doluluk × Gün', () => {
  it('golden: 30 oda × 3750 TL × %55 × 365 gün = 22.584.375 TL', () => {
    expect(computeRoomIncome(rooms)).toBeCloseTo(22584375, 0);
  });
});

describe('computeCostApproach — Arsa Değeri + Yapı Maliyetleri (2026-07-31 yeni model)', () => {
  it('Arsa Değeri = Arsa Alanı × Arsa m² Birim Değeri', () => {
    const c = computeCostApproach({ parcelArea: 5000, landUnitValue: 4000, buildings: [] });
    expect(c.landValue).toBe(20000000);
  });
  it('Yapı Maliyetleri = Σ (Alan × Yapı Birim Maliyeti)', () => {
    const c = computeCostApproach({ parcelArea: 5000, landUnitValue: 4000, buildings });
    // 8000×20000 + 500×25000 = 160.000.000 + 12.500.000 = 172.500.000
    expect(c.buildingsCost).toBe(172500000);
  });
  it('Toplam Maliyet = Arsa Değeri + Yapı Maliyetleri', () => {
    const c = computeCostApproach({ parcelArea: 5000, landUnitValue: 4000, buildings });
    expect(c.totalCost).toBe(20000000 + 172500000);
  });
  it('en yakın 5.000\'e yuvarlanmış hali de üretilir', () => {
    const c = computeCostApproach({ parcelArea: 5001, landUnitValue: 4000.5, buildings: [] });
    expect(c.totalCostRounded % 5000).toBe(0);
  });
});

describe('Gelir zinciri — Oda payı = 100 − diğerlerinin toplamı', () => {
  it('toplam gelir, oda gelirinden geriye türetilir', () => {
    const r = computeDetailedUstHakki(base);
    const roomPct = 100 - (10 + 5 + 3 + 2);
    expect(r.years[0].totalRevenue).toBeCloseTo(r.years[0].roomIncome / (roomPct / 100), 0);
  });
  it('tüm kalemler Oda Fiyat Artış Oranı ile aynı oranda büyür', () => {
    const r = computeDetailedUstHakki(base);
    expect(r.years[1].totalRevenue / r.years[0].totalRevenue).toBeCloseTo(1.05, 3);
  });
});

describe('Maliyet tabanlı giderler — Emlak Vergisi/Sigorta/Yenileme Fonu artık TOPLAM MALİYET üzerinden (Arsa m² değil)', () => {
  it('Emlak Vergisi = Toplam Maliyet × oran', () => {
    const r = computeDetailedUstHakki(base);
    expect(r.years[0].propertyTax).toBeCloseTo(r.cost.totalCost * 0.004, 0);
  });
  it('Bina Sigortası = Toplam Maliyet × oran', () => {
    const r = computeDetailedUstHakki(base);
    expect(r.years[0].insurance).toBeCloseTo(r.cost.totalCost * 0.002, 0);
  });
  it('Yenileme Fonu = Toplam Maliyet × oran (varsayılan %4)', () => {
    const r = computeDetailedUstHakki(base);
    expect(r.years[0].renewalFund).toBeCloseTo(r.cost.totalCost * 0.04, 0);
  });
  it('Ecrimisil/Üst Hakkı/Bayilik hâlâ elle + büyüme (Toplam Maliyet\'ten bağımsız)', () => {
    const r = computeDetailedUstHakki(base);
    expect(r.years[0].ustHakkiOdeme).toBe(200000);
    expect(r.years[1].ustHakkiOdeme).toBeCloseTo(200000 * 1.02, 1);
  });
});

describe('Tek iskonto oranı (2026-07-31: risksiz+prim ayrımı kaldırıldı)', () => {
  it('discountRatePct doğrudan kullanılır', () => {
    const r = computeDetailedUstHakki(base);
    expect(r.discountRate).toBeCloseTo(0.11, 4);
  });
  it('1. dönem İNDİRGENMEZ, 2. dönemden itibaren uygulanır', () => {
    const r = computeDetailedUstHakki(base);
    expect(r.years[0].presentValue).toBe(r.years[0].netOperatingProfit);
    expect(r.years[1].presentValue).toBeCloseTo(r.years[1].netOperatingProfit / 1.11, 0);
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
