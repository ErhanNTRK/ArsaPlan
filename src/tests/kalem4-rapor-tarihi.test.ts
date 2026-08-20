/**
 * Kalem 4 — Üç modülün PDF'inde "Rapor Tarihi" artık opsiyonel, varsayılan
 * kapalı. Üretilen PDF'in gerçek metnini pdfjs-dist ile çıkarıp doğruluyoruz
 * (jsPDF'in text() metodu her örnekte ayrı tanımlandığı için prototip
 * spy'lama işe yaramıyor — bu yöntem daha güvenilir, gerçek çıktıyı okuyor).
 */
import { describe, it, expect } from 'vitest';

async function extractPdfText(buf: ArrayBuffer): Promise<string> {
  const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let full = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    full += content.items.map((it: any) => it.str).join(' ') + '\n';
  }
  return full;
}

describe('Kalem 4 — Rapor Tarihi opsiyonel gösterimi (üç modül)', () => {
  it('Bağımsız Maliyet Yaklaşımı: showReportDate kapalıysa "Rapor Tarihi" hiç yazılmaz', async () => {
    const { analyzeCostApproach, createDefaultCostInput } = await import('../cost/engine');
    const input = createDefaultCostInput();
    input.netParcelArea = 500; input.landUnitValue = 10000;
    input.showReportDate = false;
    const r = analyzeCostApproach(input);
    const { buildCostApproachPdf } = await import('../cost/pdf');
    const { doc } = await buildCostApproachPdf(input, r);
    const text = await extractPdfText(doc.output('arraybuffer') as ArrayBuffer);
    expect(text).not.toContain('Rapor Tarihi');
  });

  it('Bağımsız Maliyet Yaklaşımı: showReportDate açıksa ve tarih girilmişse o tarih yazılır', async () => {
    const { analyzeCostApproach, createDefaultCostInput } = await import('../cost/engine');
    const input = createDefaultCostInput();
    input.netParcelArea = 500; input.landUnitValue = 10000;
    input.showReportDate = true;
    input.reportDate = '2026-03-15';
    const r = analyzeCostApproach(input);
    const { buildCostApproachPdf } = await import('../cost/pdf');
    const { doc } = await buildCostApproachPdf(input, r);
    const text = await extractPdfText(doc.output('arraybuffer') as ArrayBuffer);
    expect(text).toContain('Rapor Tarihi: 15.03.2026');
  });

  it('Otel Gelir Hesabı: showReportDate kapalıysa "Rapor Tarihi" hiç yazılmaz', async () => {
    const { analyzeHotel, createDefaultHotelInput } = await import('../hotel/engine');
    const input = createDefaultHotelInput();
    input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 10, adr: 5000, occupancy: 0.6, operatingDays: 365 }];
    input.showReportDate = false;
    const r = analyzeHotel(input);
    const { buildHotelPdf } = await import('../hotel/pdf');
    const { doc } = await buildHotelPdf(input, r);
    const text = await extractPdfText(doc.output('arraybuffer') as ArrayBuffer);
    expect(text).not.toContain('Rapor Tarihi');
  });

  it('Otel Gelir Hesabı: showReportDate açıksa ve tarih boşsa bugünün tarihi yazılır', async () => {
    const { analyzeHotel, createDefaultHotelInput } = await import('../hotel/engine');
    const input = createDefaultHotelInput();
    input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 10, adr: 5000, occupancy: 0.6, operatingDays: 365 }];
    input.showReportDate = true;
    input.reportDate = null;
    const r = analyzeHotel(input);
    const { buildHotelPdf } = await import('../hotel/pdf');
    const { doc } = await buildHotelPdf(input, r);
    const text = await extractPdfText(doc.output('arraybuffer') as ArrayBuffer);
    const bugun = new Date().toLocaleDateString('tr-TR');
    expect(text).toContain(`Rapor Tarihi: ${bugun}`);
  });

  it('Ana Arsa Gelir Projeksiyonu: showReportDate kapalıysa "Rapor Tarihi" hiç yazılmaz', async () => {
    const { analyze } = await import('../engine');
    const { default: makeInput } = await import('./fixtures/minimalProjectInput');
    const input = { ...makeInput(), showReportDate: false } as any;
    const r = analyze(input);
    const { buildPdf } = await import('../export/pdf');
    const { doc } = await buildPdf(input, r, 'test');
    const text = await extractPdfText(doc.output('arraybuffer') as ArrayBuffer);
    expect(text).not.toContain('Rapor Tarihi');
  });

  it('Ana Arsa Gelir Projeksiyonu: showReportDate açıksa ve tarih girilmişse o tarih yazılır', async () => {
    const { analyze } = await import('../engine');
    const { default: makeInput } = await import('./fixtures/minimalProjectInput');
    const input = { ...makeInput(), showReportDate: true, reportDate: '2026-06-01' } as any;
    const r = analyze(input);
    const { buildPdf } = await import('../export/pdf');
    const { doc } = await buildPdf(input, r, 'test');
    const text = await extractPdfText(doc.output('arraybuffer') as ArrayBuffer);
    expect(text).toContain('Rapor Tarihi: 01.06.2026');
  });
});
