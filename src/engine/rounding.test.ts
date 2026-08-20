/**
 * Kalem 5 — Final arsa değerleri 5.000 ve katlarına yuvarlanarak gösterilir.
 * Ham (yuvarlanmamış) değerler diğer hesaplarda (birim m² değeri, fark oranı
 * vb.) bozulmadan kullanılmaya devam eder — yalnız FİNAL rapor rakamları
 * yuvarlanır.
 */
import { describe, it, expect } from 'vitest';
import { analyze } from './index';
import type { ProjectInput } from './types';

const base: ProjectInput = {
  assetType: 'konut',
  housingType: 'villa',
  ticariMode: 'apartman',
  isletme: { buildings: [], inflationRate: 0, wallUnitCost: 0, landscapeUnitCost: 0, infraUnitCost: 0, otherCosts: [], salesTotal: 0 },
  parcel: { il: 'İstanbul', ilce: 'Pendik', mahalle: 'Kurtköy', ada: '101', parsel: '5', area: 1850, netArea: 1850 },
  zoning: { mode: 'taks-kaks', lejant: 'Konut Alanı', taks: 0.30, kaks: 1.65, hmax: 18.5,
            directFootprint: 0, directEmsalArea: 0, cekmeFront: 5, cekmeSide: 3, cekmeRear: 3, cekmeFrontEdge: null, planNotes: '' },
  emsal: { hasExtra: true, extraMode: 'oran', extraRate: 0.08, extraArea: 0,
           hasAttic: false, atticMode: 'oran', atticRate: 0.50, atticArea: 0, atticInEmsal: false,
           hasBasement: false, basementMode: 'oran', basementRate: 1.0, basementArea: 0, basementInEmsal: false },
  villa: { villaType: 'mustakil', unitCount: 0, floorsAboveGround: 2 },
  apartment: {
    basementCount: 0,
    basements: [
      { use: 'konut', area: null, lossRate: 0.10, saleable: null },
      { use: 'ortak', area: null, lossRate: 0.10, saleable: null },
      { use: 'ortak', area: null, lossRate: 0.10, saleable: null },
      { use: 'ortak', area: null, lossRate: 0.10, saleable: null },
    ],
    zeminArea: null, zeminLossRate: 0.15, zeminSaleable: null,
    normalCount: null,
    normalAreas: [null, null, null, null, null, null, null, null],
    normalSaleables: [null, null, null, null, null, null, null, null],
    normalCommonRate: 0.10,
    hasPiyes: false, piyesInEmsal: true, piyesRate: 0.30,
    piyesArea: null, piyesSaleable: null,
    asmaCount: 0, asmaInEmsal: true, asmaRate: 0.40,
    asmaAreas: [null, null, null, null],
    asmaSaleables: [null, null, null, null],
    hasExtraSaleable: false, extraMode: 'oran', extraRate: 0.10, extraArea: 0,
  },
  cost: { buildingClass: 'III-C', unitCost: 19500, inflationRate: 0, extrasRate: 0.06 },
  site: { landscapeArea: 0, landscapeUnitCost: 0, gardenPricePerM2: 0 },
  sales: { unitPrice: 62000, apt: { bodrum: 0, bodrumTicari: 0, zemin: 0, asma: 0, normal: 0, piyes: 0 } },
  residual: { profitRate: 0.20, financeRateOfCost: 0.08 },
  share: { enabled: true, ownerShare: 0.35 },
};

describe('Kalem 5 — final arsa değerleri 5.000\'e yuvarlanır', () => {
  it('residualLandValueRounded gerçekten en yakın 5.000 katına yuvarlanmış', () => {
    const r = analyze(base);
    const raw = r.financial.residualLandValue;
    const rounded = r.financial.residualLandValueRounded;
    expect(rounded % 5000).toBe(0);
    expect(Math.abs(rounded - raw)).toBeLessThanOrEqual(2500);
  });

  it('shareLandValueRounded (Kat Karşılığı) de aynı şekilde yuvarlanmış', () => {
    const r = analyze(base);
    const raw = r.share.shareLandValue;
    const rounded = r.share.shareLandValueRounded;
    expect(rounded % 5000).toBe(0);
    expect(Math.abs(rounded - raw)).toBeLessThanOrEqual(2500);
  });

  it('ham (yuvarlanmamış) landUnitValue hâlâ tam hassasiyetle, yuvarlanmış değerden TÜRETİLMEDEN hesaplanıyor', () => {
    const r = analyze(base);
    // landUnitValue = residualLandValue (ham) / parcel.area — yuvarlanmış değeri değil.
    const expected = r.financial.residualLandValue / base.parcel.area;
    expect(r.financial.landUnitValue).toBeCloseTo(expected, 6);
  });

  it('gerçekçi bir örnekte (Pendik/Kurtköy, bu sohbette daha önce elle doğrulanan senaryo) doğru büyüklükte sonuç üretir', () => {
    const r = analyze(base);
    // Bu sohbette Python ile elle hesapladığımız değer ~89.920.000 TL idi (Gelir Projeksiyonu).
    expect(r.financial.residualLandValueRounded).toBeGreaterThan(80_000_000);
    expect(r.financial.residualLandValueRounded).toBeLessThan(100_000_000);
  });
});
