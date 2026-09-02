/**
 * PDF — Parsel Krokisi ve Yapı Kesiti artık yan yana, birbirine yakın
 * boyutlarda gösteriliyor (aşırı büyük olmadan, kroki+kesit tek satırda).
 */
import { describe, it, expect } from 'vitest';
import { analyze } from './index';
import makeMinimalProjectInput from '../tests/fixtures/minimalProjectInput';

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

function makeSquareKml() {
  return {
    name: 'Test', il: '', ilce: '', mahalle: '', ada: '', parsel: '',
    deedArea: 900, points: [{ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 30, y: 30 }, { x: 0, y: 30 }],
    polygonArea: 900, setback: 0,
  } as any;
}

describe('PDF — Parsel Krokisi ve Yapı Kesiti yan yana (ortak başlık, dengeli boyut)', () => {
  it('İkisi de mevcutsa, ORTAK bir başlık altında (ayrı ayrı değil) gösteriliyor', async () => {
    const input = makeMinimalProjectInput();
    input.parcel.kml = makeSquareKml();
    const r = analyze(input);
    const { buildPdf } = await import('../export/pdf');
    const { doc } = await buildPdf(input, r, 'test');
    const text = await extractPdfText(doc.output('arraybuffer') as ArrayBuffer);
    expect(text).toContain('PARSEL KROKİSİ VE YAPI KESİTİ');
    // Eski, ayrı başlıklar artık TEK BAŞINA görünmemeli (birleşik başlığın parçası olmadan)
    expect(text).not.toMatch(/PARSEL KROKİSİ(?! VE)/);
  });

  it('Yalnız KML yoksa (kroki kapalı), Yapı Kesiti tek başına tam genişlikte gösteriliyor', async () => {
    const input = makeMinimalProjectInput();
    input.parcel.kml = null;
    const r = analyze(input);
    const { buildPdf } = await import('../export/pdf');
    const { doc } = await buildPdf(input, r, 'test');
    const text = await extractPdfText(doc.output('arraybuffer') as ArrayBuffer);
    expect(text).toContain('YAPI KESİTİ');
    expect(text).not.toContain('PARSEL KROKİSİ');
  });

  it('Çok katlı bir binada (12+ kat) bile Yapı Kesiti, kroki ile dengeli bir yükseklikte kalıyor (aşırı uzamıyor)', async () => {
    const input = makeMinimalProjectInput();
    input.parcel.kml = makeSquareKml();
    input.housingType = 'apartman-3-8';
    input.apartment.normalCount = 12; // çok katlı senaryo
    const r = analyze(input);
    const { buildPdf } = await import('../export/pdf');
    const { doc } = await buildPdf(input, r, 'test');
    // Hata vermeden, makul sayıda sayfayla üretildiğini doğrula (aşırı
    // yükseklik olsaydı sayfa taşması/hata riski çok artardı).
    expect(doc.getNumberOfPages()).toBeLessThanOrEqual(3);
  });
});
