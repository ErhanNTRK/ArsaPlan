/**
 * GOLDEN TEST — Karma Kullanım / Ticari Apartman / Ticari İşletme
 * Kurallar Salih ile madde madde kilitlenen mutabakat metnine dayanır.
 *
 * Karma TAKS/KAKS referansı (konut örneğinin karma uyarlaması):
 *   1.000 m² parsel · TAKS 0,30 · KAKS 2,70 · Hmax 27,50 · ilave %20 → havuz 3.240
 *   2 bodrum (2.B ortak · 1.B TİCARİ %10 kayıp → 270) · zemin (ticari) %15 → 255
 *   1 asma kat: alan = zemin 300 × %40 = 120, satılabilir 120, EMSALE DAHİL → havuzdan düşer
 *   Kalan: 3240 − 270 − 255 − 120 = 2595 → 8 normal + 0,3 piyes = 8,3 birim → 313
 *   Piyes 313 × 0,3 = 94 · kat alanları ×1,10: normal 344, piyes 103
 *
 * İşletme referansı (Salih'in örneği): Ahır 1.000 m² · tebliğ II-B · enflasyon %0 ·
 *   yıpranma %10 → birim tebliğ×0,90 → maliyet alan×birim.
 */
import { describe, it, expect } from 'vitest';
import { analyze, computeApartment, computeIsletme } from './index';
import type { ProjectInput, ApartmentInput, Parcel, Zoning, IsletmeInput } from './types';
import { YAPI_SINIFLARI } from '../data/yapiSiniflari';

const parcel: Parcel = {
  il: 'İstanbul', ilce: 'Zeytinburnu', mahalle: 'Merkez', ada: '1954', parsel: '2',
  area: 1000, netArea: 1000,
};
const zoningTK: Zoning = {
  mode: 'taks-kaks', lejant: 'Konut + Ticaret Alanı', taks: 0.30, kaks: 2.70, hmax: 27.5,
  directFootprint: 0, directEmsalArea: 0, planNotes: '',
};

const APT_KARMA: ApartmentInput = {
  basementCount: 2,
  basements: [
    { use: 'ticari', area: null, lossRate: 0.10, saleable: null },  // 1.B ticari
    { use: 'ortak', area: null, lossRate: 0.10, saleable: null },   // 2.B ortak
    { use: 'ortak', area: null, lossRate: 0.10, saleable: null },
    { use: 'ortak', area: null, lossRate: 0.10, saleable: null },
  ],
  zeminArea: null, zeminLossRate: 0.15, zeminSaleable: null,
  normalCount: null,
  normalAreas: Array(8).fill(null),
  normalSaleables: Array(8).fill(null),
  normalCommonRate: 0.10,
  hasPiyes: true, piyesInEmsal: true, piyesRate: 0.30,
  piyesArea: null, piyesSaleable: null,
  asmaCount: 1, asmaInEmsal: true, asmaRate: 0.40,
  asmaAreas: [null, null, null, null],
  asmaSaleables: [null, null, null, null],
  hasExtraSaleable: true, extraMode: 'oran', extraRate: 0.20, extraArea: 0,
};

describe('Karma — TAKS/KAKS asma katlı referans', () => {
  const c = computeApartment(parcel, zoningTK, APT_KARMA, 'karma');

  it('asma kat zeminin %40\'ı olarak türer ve satılabilir = alan', () => {
    const asma = c.floors.find((f) => f.kind === 'asma')!;
    expect(asma.area).toBe(120);        // 300 × 0,40
    expect(asma.saleable).toBe(120);    // kayıpsız
    expect(asma.label).toContain('ticari');
  });

  it('emsale dahil asma havuzdan SABİT düşer, orana katılmaz', () => {
    // Kalan 2595 ÷ 8,3 = 312,65 → 313
    const n1 = c.floors.find((f) => f.kind === 'normal' && f.index === 1)!;
    expect(n1.saleable).toBe(313);
    expect(n1.area).toBe(Math.round(313 * 1.1));   // 344
    const piyes = c.floors.find((f) => f.kind === 'piyes')!;
    expect(piyes.saleable).toBe(Math.round(313 * 0.3));  // 94
  });

  it('kat sırası: bodrumlar → zemin → asma → normaller → piyes', () => {
    const kinds = c.floors.map((f) => f.kind);
    expect(kinds.slice(0, 4)).toEqual(['bodrum', 'bodrum', 'zemin', 'asma']);
    expect(kinds[kinds.length - 1]).toBe('piyes');
  });

  it('zemin ve ticari bodrum etiketlenir', () => {
    expect(c.floors.find((f) => f.kind === 'zemin')!.label).toBe('Zemin Kat (ticari)');
    expect(c.floors.find((f) => f.kind === 'bodrum' && f.index === 1)!.label).toContain('(ticari)');
  });

  it('bodrum kullanım kırılımı doğru toplanır', () => {
    expect(c.bodrumSaleableByUse.ticari).toBe(270);
    expect(c.bodrumSaleableByUse.konut).toBe(0);
  });

  it('emsale dahil OLMAYAN asma havuza dokunmaz, üstüne ekler', () => {
    const o = computeApartment(parcel, zoningTK, { ...APT_KARMA, asmaInEmsal: false }, 'karma');
    // Havuz: 3240 − 270 − 255 = 2715 → 2715 ÷ 8,3 = 327 (konut örneğiyle aynı)
    expect(o.floors.find((f) => f.kind === 'normal' && f.index === 1)!.saleable).toBe(327);
    expect(o.floors.find((f) => f.kind === 'asma')!.saleable).toBe(120);
    expect(o.saleableTotal).toBe(270 + 255 + 120 + 8 * 327 + 98);
  });

  it('asma alanı elle değiştirilirse sabit kalır', () => {
    const areas = [...APT_KARMA.asmaAreas]; areas[0] = 150;
    const o = computeApartment(parcel, zoningTK, { ...APT_KARMA, asmaAreas: areas }, 'karma');
    const asma = o.floors.find((f) => f.kind === 'asma')!;
    expect(asma.area).toBe(150);
    expect(asma.saleable).toBe(150);   // satılabilir hâlâ = alan (override yoksa)
  });

  it('konut varyantında asma üretilmez (konut hesabı korunur)', () => {
    const o = computeApartment(parcel, zoningTK, APT_KARMA, 'konut');
    expect(o.floors.some((f) => f.kind === 'asma')).toBe(false);
    expect(o.floors.find((f) => f.kind === 'zemin')!.label).toBe('Zemin Kat');
  });
});

describe('Karma — analyze() kullanım kırılımlı gelir', () => {
  const input: ProjectInput = {
    assetType: 'karma',
    housingType: 'apartman-3-8',
    ticariMode: 'apartman',
    isletme: { buildings: [], inflationRate: 0, wallUnitCost: 0, landscapeUnitCost: 0, infraUnitCost: 0, otherCosts: [], salesTotal: 0 },
    parcel, zoning: zoningTK,
    emsal: {
      hasExtra: false, extraMode: 'oran', extraRate: 0.10, extraArea: 0,
      hasAttic: false, atticMode: 'oran', atticRate: 0.50, atticArea: 0, atticInEmsal: false,
      hasBasement: false, basementMode: 'oran', basementRate: 1.0, basementArea: 0, basementInEmsal: false,
    },
    villa: { villaType: 'mustakil', unitCount: 0, floorsAboveGround: 2 },
    apartment: APT_KARMA,
    cost: { buildingClass: 'IV-A', unitCost: 30000, inflationRate: 0, extrasRate: 0 },
    site: { landscapeArea: 0, landscapeUnitCost: 0, gardenPricePerM2: 0 },
    sales: {
      unitPrice: 0,
      apt: { bodrum: 60000, bodrumTicari: 120000, zemin: 150000, asma: 130000, normal: 100000, piyes: 90000 },
    },
    residual: { profitRate: 0.25, financeRateOfCost: 0 },
    share: { enabled: true, ownerShare: 0.45 },
  };
  const r = analyze(input);

  it('gelir altı birim değerle, bodrum kullanım kırılımıyla hesaplanır', () => {
    const beklenen =
      270 * 120000 +          // ticari bodrum
      0 * 60000 +             // konut bodrum yok
      255 * 150000 +          // zemin (ticari)
      120 * 130000 +          // asma
      8 * 313 * 100000 +      // normal
      94 * 90000;             // piyes
    expect(r.financial.buildingRevenue).toBe(beklenen);
  });

  it('ticari apartman aynı sonucu verir (karma ile birebir)', () => {
    const t = analyze({ ...input, assetType: 'ticari', ticariMode: 'apartman' });
    expect(t.financial.buildingRevenue).toBe(r.financial.buildingRevenue);
    expect(t.apartment!.floors).toEqual(r.apartment!.floors);
  });

  it('gelir projeksiyonu formülü korunur', () => {
    const f = r.financial;
    expect(f.residualLandValue).toBeCloseTo(f.revenue - f.totalCost - f.developerProfit, 6);
  });
});

describe('Ticari İşletme — Salih\'in ahır örneği ve kurallar', () => {
  const ahirTeblig = YAPI_SINIFLARI.find((x) => x.code === 'II-B')!.unitCost;

  const base: IsletmeInput = {
    buildings: [
      { type: 'Ahır', buildingClass: 'II-B', area: 1000, depreciation: 0.10, unitCostOverride: null },
    ],
    inflationRate: 0,
    wallUnitCost: 0, landscapeUnitCost: 0, infraUnitCost: 0,
    otherCosts: [],
    salesTotal: 40000000,
  };

  it('satır maliyeti: alan × tebliğ × (1+enf) × (1−yıpranma)', () => {
    const r = computeIsletme(parcel, base);
    const birim = Math.round(ahirTeblig * 0.90);
    expect(r.rows[0].effectiveUnitCost).toBe(birim);
    expect(r.rows[0].cost).toBe(1000 * birim);
    expect(r.buildingsCost).toBe(1000 * birim);
  });

  it('enflasyon tüm satırlara ortak uygulanır', () => {
    const r = computeIsletme(parcel, {
      ...base,
      inflationRate: 0.20,
      buildings: [
        ...base.buildings,
        { type: 'Depo', buildingClass: 'II-C', area: 500, depreciation: 0, unitCostOverride: null },
      ],
    });
    const depoTeblig = YAPI_SINIFLARI.find((x) => x.code === 'II-C')!.unitCost;
    expect(r.rows[0].effectiveUnitCost).toBe(Math.round(ahirTeblig * 1.20 * 0.90));
    expect(r.rows[1].effectiveUnitCost).toBe(Math.round(depoTeblig * 1.20));
  });

  it('birim maliyet elle sabitlenebilir', () => {
    const r = computeIsletme(parcel, {
      ...base,
      buildings: [{ ...base.buildings[0], unitCostOverride: 17820 }],
    });
    expect(r.rows[0].effectiveUnitCost).toBe(17820);
    expect(r.rows[0].cost).toBe(17820000);   // Salih'in örneği birebir
    expect(r.rows[0].overridden).toBe(true);
  });

  it('ilave maliyetler parsel alanı üzerinden + serbest kalemler', () => {
    const r = computeIsletme(parcel, {
      ...base,
      wallUnitCost: 500, landscapeUnitCost: 300, infraUnitCost: 200,
      otherCosts: [{ name: 'Trafo', amount: 750000 }],
    });
    expect(r.wallCost).toBe(500000);
    expect(r.landscapeCost).toBe(300000);
    expect(r.infraCost).toBe(200000);
    expect(r.otherCost).toBe(750000);
    expect(r.extrasTotal).toBe(1750000);
    expect(r.totalCost).toBe(r.buildingsCost + 1750000);
  });

  it('arsa değeri = satış − maliyet; müteahhit kârı KESİLMEZ', () => {
    const r = computeIsletme(parcel, base);
    expect(r.landValue).toBe(40000000 - r.totalCost);
    expect(r.landUnitValue).toBeCloseTo(r.landValue / 1000, 6);
  });

  it('analyze() işletme hattı: kâr 0, kat karşılığı yok, uzman yorumu yok', () => {
    const input: ProjectInput = {
      assetType: 'ticari', housingType: 'villa', ticariMode: 'isletme',
      isletme: base, parcel, zoning: zoningTK,
      emsal: {
        hasExtra: false, extraMode: 'oran', extraRate: 0.1, extraArea: 0,
        hasAttic: false, atticMode: 'oran', atticRate: 0.5, atticArea: 0, atticInEmsal: false,
        hasBasement: false, basementMode: 'oran', basementRate: 1, basementArea: 0, basementInEmsal: false,
      },
      villa: { villaType: 'mustakil', unitCount: 0, floorsAboveGround: 2 },
      apartment: APT_KARMA,
      cost: { buildingClass: 'IV-A', unitCost: 30000, inflationRate: 0, extrasRate: 0 },
      site: { landscapeArea: 0, landscapeUnitCost: 0, gardenPricePerM2: 0 },
      sales: { unitPrice: 0, apt: { bodrum: 0, bodrumTicari: 0, zemin: 0, asma: 0, normal: 0, piyes: 0 } },
      residual: { profitRate: 0.25, financeRateOfCost: 0 },
      share: { enabled: true, ownerShare: 0.45 },
    };
    const r = analyze(input);
    expect(r.isletme).toBeDefined();
    expect(r.financial.developerProfit).toBe(0);
    expect(r.financial.residualLandValue).toBe(r.isletme!.landValue);
    expect(r.advice).toHaveLength(0);
    expect(r.share.shareLandValue).toBe(0);
  });

  it('maliyet satışı aşarsa uyarı üretir', () => {
    const r = computeIsletme(parcel, { ...base, salesTotal: 1000000 });
    expect(r.warnings.some((w) => w.includes('negatif'))).toBe(true);
  });
});
