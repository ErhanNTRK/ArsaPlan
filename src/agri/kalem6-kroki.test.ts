/**
 * Tarımsal Ürün Gelir Hesabı — KML yüklendiğinde artık diğer modüllerle
 * (Arsa Gelir Projeksiyonu, Otel, Akaryakıt) aynı stilde bir Parsel Krokisi
 * gösteriliyor.
 */
import { describe, it, expect } from 'vitest';
import { computeAgri } from './engine';

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

describe('Tarımsal Ürün Gelir Hesabı — Parsel Krokisi', () => {
  it('KML yüklenmişse PDF\'te gerçekten "PARSEL KROKİSİ" bölümü çıkıyor', async () => {
    const input = {
      parcelArea: 10000, arablePct: 100,
      rows: [{ id: 'r1', kind: 'ekili' as const, name: 'Buğday', areaM2: 10000, byproduct: null,
               yieldPerUnit: 400, price: 12, expensePct: 35, treeCount: 0, economicLifeYears: 0 }],
      amortYears: 25,
      kml: { points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }] },
    };
    const r = computeAgri(input);
    const { buildAgriPdf } = await import('./pdf');
    const doc = await buildAgriPdf(input, r);
    const text = await extractPdfText(doc.output('arraybuffer') as ArrayBuffer);
    expect(text).toContain('PARSEL KROKİSİ');
  });

  it('KML yoksa (yalnız elle alan girilmişse) Parsel Krokisi hiç görünmüyor, hata da vermiyor', async () => {
    const input = {
      parcelArea: 10000, arablePct: 100,
      rows: [{ id: 'r1', kind: 'ekili' as const, name: 'Buğday', areaM2: 10000, byproduct: null,
               yieldPerUnit: 400, price: 12, expensePct: 35, treeCount: 0, economicLifeYears: 0 }],
      amortYears: 25,
    };
    const r = computeAgri(input);
    const { buildAgriPdf } = await import('./pdf');
    const doc = await buildAgriPdf(input, r);
    const text = await extractPdfText(doc.output('arraybuffer') as ArrayBuffer);
    expect(text).not.toContain('PARSEL KROKİSİ');
  });
});
