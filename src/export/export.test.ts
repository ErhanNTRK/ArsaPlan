/** Excel ve PDF çıktısının gerçekten üretildiğini doğrular (tarayıcı API'leri taklit edilir). */
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

const input: ProjectInput = {
  assetType: 'konut', housingType: 'villa',
  parcel: { il: 'İstanbul', ilce: 'Beykoz', mahalle: 'Çavuşbaşı', ada: '101', parsel: '5',
            area: 2500, netArea: 2350, width: 50, depth: 50 },
  zoning: { mode: 'taks-kaks', lejant: 'Konut Alanı', useSetbacks: true, taks: 0.30, kaks: 0.60, hmax: 9.5, floors: 2,
            directTotalArea: 0, directFootprint: 0,
            setbackFront: 5, setbackRear: 3, setbackSideLeft: 3, setbackSideRight: 3,
            planNotes: 'Çatı arası piyesleri son kat ile irtibatlı olmak kaydıyla emsale dahil değildir.' },
  emsal: { hasBasement: true, basementInEmsal: false, basementPerUnit: 0, basementSaleable: false,
           hasAttic: true, atticInEmsal: false, atticPerUnit: 0, atticSaleable: true,
           extraSaleablePerUnit: 0 },
  villa: { mode: 'alan', unitCountManual: 0, villaType: 'mustakil', grossPerVilla: 240, floorsPerVilla: 3, layoutEfficiency: 0.70 },
  cost: { buildingClass: 'III-C', unitCost: 23400, inflationRate: 0.15, extrasRate: 0.12 },
  site: { landscapeArea: 0, landscapeUnitCost: 1200, gardenPricePerM2: 4000 },
  sales: { unitPrice: 90000 },
  residual: { profitRate: 0.25, financeRateOfCost: 0.15 },
  share: { enabled: true, ownerShare: 0.45 },
};

describe('Excel çıktısı', () => {
  it('geçerli bir xlsx üretir ve içeriği okunabilir', async () => {
    captured = null;
    const { downloadExcel } = await import('./excel');
    await downloadExcel(input, analyze(input), 'test-v1');
    expect(captured).not.toBeNull();
    const buf = Buffer.from(await captured!.blob.arrayBuffer());
    expect(buf.length).toBeGreaterThan(5000);
    expect(buf.subarray(0, 2).toString()).toBe('PK');   // zip imzası

    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as any);
    expect(wb.worksheets.map((w) => w.name)).toEqual(['RAPOR', 'GİRDİLER', 'UZMAN GÖRÜŞÜ']);
    const rapor = wb.getWorksheet('RAPOR')!;
    const values: string[] = [];
    rapor.eachRow((row) => row.eachCell((c) => values.push(String(c.value))));
    expect(values.join(' ')).toContain('ARTIK ARSA DEĞERİ');
    expect(values.join(' ')).toContain('Bağlayıcı Kısıt');
    expect(values.join(' ')).toContain('Beykoz');
    const gorus = wb.getWorksheet('UZMAN GÖRÜŞÜ')!;
    expect(gorus.rowCount).toBeGreaterThan(4);
  });
});

describe('PDF çıktısı', () => {
  it('geçerli bir PDF üretir', async () => {
    captured = null;
    const { downloadPdf } = await import('./pdf');
    await downloadPdf(input, analyze(input), 'test-v1');
    expect(captured).not.toBeNull();
    const buf = Buffer.from(await captured!.blob.arrayBuffer());
    expect(buf.subarray(0, 4).toString()).toBe('%PDF');
    expect(buf.length).toBeGreaterThan(20000);          // gömülü font dahil
  });

  it('negatif senaryoda da üretir', async () => {
    captured = null;
    const kotu = { ...input, sales: { unitPrice: 15000 } };
    const { downloadPdf } = await import('./pdf');
    await downloadPdf(kotu, analyze(kotu), 'test-v1');
    const buf = Buffer.from(await captured!.blob.arrayBuffer());
    expect(buf.subarray(0, 4).toString()).toBe('%PDF');
  });
});
