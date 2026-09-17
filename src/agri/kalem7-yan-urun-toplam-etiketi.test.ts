/**
 * DÜZELTME (Erhan'ın PDF ekran görüntüsüyle bulduğu sorun): "Mısır" satırında
 * kalın gösterilen rakam, önceden zaten netWithByproduct'tı (ana + yan ürün
 * toplamı) — ama hemen altında AYRI bir satırda yan ürünün kendi neti de
 * ayrıca gösterildiği için, "40.389 TL'nin 403.886'nın ÜSTÜNE eklenmesi
 * gerekiyor" gibi yanlış bir izlenim veriyordu. Hesabın kendisi hep doğruydu
 * (403.886 zaten 363.497+40.389'un toplamıydı) — sorun yalnızca sunumdaydı.
 *
 * Düzeltme: ana ürün satırı artık yalnızca KENDİ net gelirini gösteriyor,
 * toplam ise açıkça "Toplam (ana + yan ürün)" etiketli, ayrı bir satırda.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { computeAgri } from './engine';

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

function extractPdfText(buf: ArrayBuffer): Promise<string> {
  return import('pdfjs-dist/legacy/build/pdf.mjs').then(async (pdfjs: any) => {
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    let full = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const content = await (await doc.getPage(i)).getTextContent();
      full += content.items.map((it: any) => it.str).join(' ') + '\n';
    }
    return full;
  });
}

function misirInput() {
  return {
    parcelArea: 57698, arablePct: 100,
    rows: [{
      id: 'r1', kind: 'ekili' as const, name: 'Mısır',
      areaM2: 57698, treeCount: 0,
      yieldPerUnit: 1050, price: 10, expensePct: 40,
      byproduct: { name: 'Mısır Sapı / Koçanı', yieldPerUnit: 250, price: 3.5, expensePct: 20 },
      economicLifeYears: 0,
    }],
    amortYears: 30,
  };
}

describe('Hesabın kendisi — yan ürün geliri her zaman doğru toplanıyordu', () => {
  it('netWithByproduct = ana ürün net + yan ürün net (403.886 = 363.497 + 40.389)', () => {
    const r = computeAgri(misirInput());
    const row = r.rows[0];
    expect(row.net).toBeCloseTo(363497.4, 1);
    expect(row.byproductResult!.net).toBeCloseTo(40388.6, 1);
    expect(row.netWithByproduct).toBeCloseTo(403886, 0);
    expect(r.totalNet).toBeCloseTo(403886, 0);
    expect(r.value).toBe(12115000); // 403.886 x 30, 5000'e yuvarlanmış
  });
});

describe('DÜZELTME — PDF artık ana ürün ve toplamı ayrı, açık etiketlerle gösteriyor', () => {
  it('Ana ürün satırı yalnızca kendi netini gösteriyor (403.886 değil, 363.497)', async () => {
    const input = misirInput();
    const r = computeAgri(input);
    const { buildAgriPdf } = await import('./pdf');
    const doc = await buildAgriPdf(input, r);
    const text = await extractPdfText(doc.output('arraybuffer') as ArrayBuffer);
    expect(text).toContain('363.497');
  });

  it('"Toplam (ana + yan ürün)" etiketi ve 403.886 rakamı açıkça görünüyor', async () => {
    const input = misirInput();
    const r = computeAgri(input);
    const { buildAgriPdf } = await import('./pdf');
    const doc = await buildAgriPdf(input, r);
    const text = await extractPdfText(doc.output('arraybuffer') as ArrayBuffer);
    expect(text).toContain('Toplam (ana');
    expect(text).toContain('403.886');
  });
});

describe('DÜZELTME — Excel de aynı düzeltmeyi içeriyor', () => {
  it('Excel çalışma kitabında hem ana ürün neti (363.497) hem toplam (403.886) ayrı hücrelerde var', async () => {
    captured = null;
    const input = misirInput();
    const r = computeAgri(input);
    const { downloadAgriExcel } = await import('./excel');
    await downloadAgriExcel(input, r);
    const buf = Buffer.from(await captured!.blob.arrayBuffer());

    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as any);
    const ws = wb.worksheets[0];
    const values: number[] = [];
    ws.eachRow((row) => {
      const v = row.getCell(7).value;
      if (typeof v === 'number') values.push(Math.round(v));
    });
    expect(values).toContain(363497);
    expect(values).toContain(403886);
  });
});
