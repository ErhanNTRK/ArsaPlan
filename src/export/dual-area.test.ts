/** Kalem 6 — Tapu Alanı ile Net Alan farklıysa Excel'de ayrı satırlar gösterilir. */
import { describe, it, expect, beforeAll } from 'vitest';
import type { ProjectInput } from '../engine';
import { analyze } from '../engine';

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

function makeInput(area: number, netArea: number): ProjectInput {
  return {
    assetType: 'konut', housingType: 'villa',
    ticariMode: 'apartman',
    isletme: { buildings: [], inflationRate: 0, wallUnitCost: 0, landscapeUnitCost: 0, infraUnitCost: 0, otherCosts: [], salesTotal: 0 },
    parcel: { il: 'İstanbul', ilce: 'Beykoz', mahalle: 'Çavuşbaşı', ada: '1245', parsel: '17', area, netArea },
    zoning: { mode: 'taks-kaks', lejant: 'Az Yoğunluklu Konut Alanı', taks: 0.40, kaks: 0.80, hmax: 9.5,
              directFootprint: 0, directEmsalArea: 0, cekmeFront: 5, cekmeSide: 3, cekmeRear: 3, cekmeFrontEdge: null,
              planNotes: '' },
    emsal: { hasExtra: true, extraMode: 'oran', extraRate: 0.10, extraArea: 0,
             hasAttic: true, atticMode: 'oran', atticRate: 0.50, atticArea: 0, atticInEmsal: false,
             hasBasement: true, basementMode: 'oran', basementRate: 1.0, basementArea: 0, basementInEmsal: false },
    villa: { villaType: 'mustakil', unitCount: 6, floorsAboveGround: 2 },
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
    cost: { buildingClass: 'III-C', unitCost: 23400, inflationRate: 0, extrasRate: 0 },
    site: { landscapeArea: 0, landscapeUnitCost: 0, gardenPricePerM2: 0 },
    sales: { unitPrice: 105000, apt: { bodrum: 0, bodrumTicari: 0, zemin: 0, asma: 0, normal: 0, piyes: 0 } },
    residual: { profitRate: 0.25, financeRateOfCost: 0.10 },
    share: { enabled: true, ownerShare: 0.40 },
  };
}

describe('Kalem 6 — Excel: Tapu Alanı / Net Alan ayrı gösterimi', () => {
  it('Tapu Alanı ≠ Net Alan iken (DOP/terk senaryosu) iki ayrı satır gösteriliyor', async () => {
    captured = null;
    const input = makeInput(1000, 850); // 150 m² terk senaryosu
    const { downloadExcel } = await import('./excel');
    await downloadExcel(input, analyze(input), 'test-v1');
    const buf = Buffer.from(await captured!.blob.arrayBuffer());

    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as any);
    const rapor = wb.getWorksheet('RAPOR')!;
    const values: string[] = [];
    rapor.eachRow((row) => row.eachCell((c) => values.push(String(c.value))));
    const joined = values.join(' ');
    expect(joined).toContain('Tapu Alanı → Birim Değer');
    expect(joined).toContain('Net Alan (terk sonrası) → Birim Değer');
    expect(joined).toContain('1.000 m²');
    expect(joined).toContain('850 m²');
  });

  it('Tapu Alanı = Net Alan iken (terk yok) ayrı satırlar EKLENMİYOR, gereksiz tekrar olmuyor', async () => {
    captured = null;
    const input = makeInput(1000, 1000);
    const { downloadExcel } = await import('./excel');
    await downloadExcel(input, analyze(input), 'test-v1');
    const buf = Buffer.from(await captured!.blob.arrayBuffer());

    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as any);
    const rapor = wb.getWorksheet('RAPOR')!;
    const values: string[] = [];
    rapor.eachRow((row) => row.eachCell((c) => values.push(String(c.value))));
    const joined = values.join(' ');
    expect(joined).not.toContain('Tapu Alanı → Birim Değer');
    expect(joined).not.toContain('Net Alan (terk sonrası) → Birim Değer');
  });
});
