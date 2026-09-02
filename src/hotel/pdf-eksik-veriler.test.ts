/**
 * Otel Gelir Analizi PDF — üç düzeltme:
 * 1) Kapitalizasyon Oranı, Nihai Değer olarak Direkt Kap seçilmese bile
 *    ikincil yöntemler listesinde artık görünüyor.
 * 2) Manuel değer seçiliyken artık yanıltıcı NOI/Kap Oranı gösterilmiyor.
 * 3) İNA Yıllık Projeksiyon Tablosu'nun üstünde Gelir/Gider Artış Oranı ve
 *    Yenileme Fonu Oranı artık açıkça yazıyor.
 */
import { describe, it, expect } from 'vitest';
import { analyzeHotel, createDefaultHotelInput } from './engine';

async function extractPdfText(input: ReturnType<typeof createDefaultHotelInput>, r: ReturnType<typeof analyzeHotel>) {
  const { buildHotelPdf } = await import('./pdf');
  const { doc } = await buildHotelPdf(input, r);
  const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const pdfDoc = await pdfjs.getDocument({ data: doc.output('arraybuffer') }).promise;
  let full = '';
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const content = await (await pdfDoc.getPage(i)).getTextContent();
    full += content.items.map((it: any) => it.str).join(' ') + '\n';
  }
  return full;
}

function baseInput() {
  const input = createDefaultHotelInput();
  input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 20, adr: 5000, occupancy: 0.65, operatingDays: 365 }];
  input.projection.capRate = 0.09;
  input.projection.years = 10;
  input.projection.incomeGrowthRate = 0.15;
  input.projection.expenseGrowthRate = 0.12;
  input.projection.renewalFundRate = 0.04;
  input.projection.discountRate = 0.25;
  return input;
}

describe('Otel PDF — Kapitalizasyon Oranı, İNA seçiliyken bile görünüyor', () => {
  it('finalMethod="ina" iken, ikincil yöntemler listesinde Kapitalizasyon Oranı gerçekten yazıyor', async () => {
    const input = baseInput();
    input.finalMethod = 'ina';
    const r = analyzeHotel(input);
    const text = await extractPdfText(input, r);
    expect(text).toMatch(/Direkt Kapitalizasyon, %9/);
  });
});

describe('Otel PDF — Manuel değerde artık yanıltıcı Kapitalizasyon Oranı gösterilmiyor', () => {
  it('finalMethod="manuel" iken hero kutusunda "KAPİTALİZASYON ORANI" etiketi YOK', async () => {
    const input = baseInput();
    input.finalMethod = 'manuel';
    input.finalManualValue = 500000000;
    const r = analyzeHotel(input);
    const text = await extractPdfText(input, r);
    expect(text).not.toContain('KAPİTALİZASYON ORANI');
    expect(text).toContain('TOPLAM GELİR');
  });
});

describe('Otel PDF — İNA varsayımları (Gelir/Gider Artış, Yenileme Fonu) artık yazıyor', () => {
  it('Yıllık Projeksiyon Tablosu\'nun üstünde üç oran da gerçekten görünüyor', async () => {
    const input = baseInput();
    const r = analyzeHotel(input);
    const text = await extractPdfText(input, r);
    expect(text).toMatch(/Gelir Artış Oranı.*%15/);
    expect(text).toMatch(/Gider Artış Oranı.*%12/);
    expect(text).toMatch(/Yenileme Fonu Oranı.*%4/);
  });
});
