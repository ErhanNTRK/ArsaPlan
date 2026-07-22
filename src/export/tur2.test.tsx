/** Tur 2 duman testleri — Karma ve Ticari İşletme: UI render + PDF/Excel üretimi. */
import { describe, it, expect, beforeAll } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { ProjectInput } from '../engine';
import { analyze } from '../engine';
import { Result } from '../ui/Result';
import { Step3, Step4 } from '../ui/Steps';

let captured: { blob: Blob; name: string } | null = null;

beforeAll(() => {
  (globalThis as any).URL.createObjectURL = () => 'blob:test';
  (globalThis as any).URL.revokeObjectURL = () => {};
  (globalThis as any).document = {
    createElement: () => ({ set href(_v: string) {}, set download(v: string) { if (captured) captured.name = v; }, click() {} }),
    body: { appendChild: () => {}, removeChild: () => {} },
  };
  const OrigBlob = globalThis.Blob;
  (globalThis as any).Blob = class extends OrigBlob {
    constructor(parts: any[], opts?: any) { super(parts, opts); captured = { blob: this as any, name: '' }; }
  };
});

const BASE = {
  parcel: { il: 'İstanbul', ilce: 'Zeytinburnu', mahalle: 'Merkez', ada: '1954', parsel: '2', area: 1000, netArea: 1000 },
  zoning: { mode: 'taks-kaks' as const, lejant: 'Konut + Ticaret Alanı', taks: 0.30, kaks: 2.70, hmax: 27.5,
            directFootprint: 0, directEmsalArea: 0, planNotes: '' },
  emsal: { hasExtra: false, extraMode: 'oran' as const, extraRate: 0.10, extraArea: 0,
           hasAttic: false, atticMode: 'oran' as const, atticRate: 0.50, atticArea: 0, atticInEmsal: false,
           hasBasement: false, basementMode: 'oran' as const, basementRate: 1.0, basementArea: 0, basementInEmsal: false },
  villa: { villaType: 'mustakil' as const, unitCount: 0, floorsAboveGround: 2 },
  cost: { buildingClass: 'IV-A', unitCost: 30000, inflationRate: 0, extrasRate: 0.05 },
  site: { landscapeArea: 0, landscapeUnitCost: 0, gardenPricePerM2: 0 },
  residual: { profitRate: 0.25, financeRateOfCost: 0 },
  share: { enabled: false, ownerShare: 0.45 },
};

const karmaInput: ProjectInput = {
  ...BASE,
  assetType: 'karma', housingType: 'apartman-3-8', ticariMode: 'apartman',
  isletme: { buildings: [], inflationRate: 0, wallUnitCost: 0, landscapeUnitCost: 0, infraUnitCost: 0, otherCosts: [], salesTotal: 0 },
  apartment: {
    basementCount: 2,
    basements: [
      { use: 'ticari', area: null, lossRate: 0.10, saleable: null },
      { use: 'ortak', area: null, lossRate: 0.10, saleable: null },
      { use: 'ortak', area: null, lossRate: 0.10, saleable: null },
      { use: 'ortak', area: null, lossRate: 0.10, saleable: null },
    ],
    zeminArea: null, zeminLossRate: 0.15, zeminSaleable: null,
    normalCount: null,
    normalAreas: [null, null, null, null, null, null, null, null],
    normalSaleables: [null, null, null, null, null, null, null, null],
    normalCommonRate: 0.10,
    hasPiyes: true, piyesInEmsal: true, piyesRate: 0.30, piyesArea: null, piyesSaleable: null,
    asmaCount: 1, asmaInEmsal: true, asmaRate: 0.40,
    asmaAreas: [null, null, null, null], asmaSaleables: [null, null, null, null],
    hasExtraSaleable: true, extraMode: 'oran', extraRate: 0.20, extraArea: 0,
  },
  sales: { unitPrice: 0, apt: { bodrum: 60000, bodrumTicari: 120000, zemin: 150000, asma: 130000, normal: 100000, piyes: 90000 } },
};

const isletmeInput: ProjectInput = {
  ...BASE,
  assetType: 'ticari', housingType: 'villa', ticariMode: 'isletme',
  apartment: karmaInput.apartment,
  isletme: {
    buildings: [
      { type: 'Ahır', buildingClass: 'II-B', area: 1000, depreciation: 0.10, unitCostOverride: 17820 },
      { type: 'Depo', buildingClass: 'II-C', area: 400, depreciation: 0, unitCostOverride: null },
    ],
    inflationRate: 0,
    wallUnitCost: 500, landscapeUnitCost: 0, infraUnitCost: 0,
    otherCosts: [{ name: 'Trafo', amount: 750000 }],
    salesTotal: 40000000,
  },
  sales: { unitPrice: 0, apt: { bodrum: 0, bodrumTicari: 0, zemin: 0, asma: 0, normal: 0, piyes: 0 } },
};

describe('Karma — ekranlar', () => {
  it('Adım 3 asma kartı ve ticari bodrum ile açılır', () => {
    const html = renderToString(
      <Step3 input={karmaInput} upd={() => {}} setTop={() => {}} />);
    expect(html).toContain('Asma Kat');
    expect(html).toContain('Zemin Kat (ticari)');
  });
  it('Adım 4 altı birim değeri gösterir', () => {
    const html = renderToString(
      <Step4 input={karmaInput} upd={() => {}} setTop={() => {}} />);
    expect(html).toContain('Bodrum Kat (ticari)');
    expect(html).toContain('Asma Kat (ticari)');
    expect(html).toContain('Normal Kat');
  });
  it('Sonuç ekranı karma satırlarını basar', () => {
    const html = renderToString(
      <Result input={karmaInput} result={analyze(karmaInput)} version="test" />);
    expect(html).toContain('Karma Kullanım');
    expect(html).toContain('Asma Kat');
    expect(html).toContain('Bodrum (ticari) Satış Birim Değeri');
    expect(html).toContain('Uzman Notu PDF');
  });
});

describe('İşletme — ekranlar', () => {
  it('Adım 3 yapı satırlarını ve ilave maliyetleri basar', () => {
    const html = renderToString(
      <Step3 input={isletmeInput} upd={() => {}} setTop={() => {}} />);
    expect(html).toContain('Ahır');
    expect(html).toContain('İlave Maliyetler');
    expect(html).toContain('Güncelleme Oranı');
  });
  it('Adım 4 satış değeri ve kâr notunu basar', () => {
    const html = renderToString(
      <Step4 input={isletmeInput} upd={() => {}} setTop={() => {}} />);
    expect(html).toContain('Öngörülen Satış Değeri');
    expect(html).toContain('müteahhit kârı kesilmez');
  });
  it('Sonuç ekranı sade işletme görünümünü basar; uzman ve kat karşılığı yok', () => {
    const html = renderToString(
      <Result input={isletmeInput} result={analyze(isletmeInput)} version="test" />);
    expect(html).toContain('Ticari İşletme');
    expect(html).toContain('YAPI MALİYETLERİ');
    expect(html).toContain('müteahhit kârı kesilmemiştir');
    expect(html).not.toContain('Uzman Değerlendirmesi');
    expect(html).not.toContain('Yöntem Karşılaştırması');
    expect(html).not.toContain('Uzman Notu PDF');
  });
});

describe('Tur 2 — dışa aktarma', () => {
  it('karma PDF üretilir', async () => {
    captured = null;
    const { downloadPdf } = await import('./pdf');
    await downloadPdf(karmaInput, analyze(karmaInput), 'test');
    expect(captured).not.toBeNull();
    expect((captured as any).blob.size).toBeGreaterThan(30000);
  });
  it('karma Excel üretilir', async () => {
    captured = null;
    const { downloadExcel } = await import('./excel');
    await downloadExcel(karmaInput, analyze(karmaInput), 'test');
    expect((captured as any).blob.size).toBeGreaterThan(10000);
  });
  it('işletme PDF üretilir', async () => {
    captured = null;
    const { downloadPdf } = await import('./pdf');
    await downloadPdf(isletmeInput, analyze(isletmeInput), 'test');
    expect((captured as any).blob.size).toBeGreaterThan(20000);
  });
  it('işletme Excel üretilir', async () => {
    captured = null;
    const { downloadExcel } = await import('./excel');
    await downloadExcel(isletmeInput, analyze(isletmeInput), 'test');
    expect((captured as any).blob.size).toBeGreaterThan(8000);
  });
});
