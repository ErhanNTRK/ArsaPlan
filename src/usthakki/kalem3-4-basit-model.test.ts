/**
 * Basit Üst Hakkı modelleri (Toplam Değer Esaslı / Arsa Değeri Esaslı) —
 * Kalem 3 (sonuç en başta) ve Kalem 4 (hesap adımları şeffaf) doğrulaması.
 */
import { describe, it, expect } from 'vitest';
import { computeWholeValueMethod, computeLandOnlyMethod, type SimpleCostInput } from './simpleCostEngine';
import { buildSimpleUstHakkiPdf } from './simplePdf';

function baseCost(): SimpleCostInput {
  return {
    parcelArea: 1000, landUnitValue: 8000,
    buildings: [{ id: 'b1', type: 'Otel Binası', area: 500, unitCost: 20000, depreciationPct: 100 }],
  };
}

async function extractText(doc: Awaited<ReturnType<typeof buildSimpleUstHakkiPdf>>) {
  const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const pdfDoc = await pdfjs.getDocument({ data: doc.output('arraybuffer') }).promise;
  let full = '';
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const content = await (await pdfDoc.getPage(i)).getTextContent();
    full += content.items.map((it: any) => it.str).join(' ') + '\n';
  }
  return full;
}

describe('Kalem 3 — Basit modellerde sonuç artık raporun başında', () => {
  it('"Toplam Değer Esaslı" — "ÜST HAKKI DEĞERİ" ifadesi "PARSEL BİLGİLERİ"nden ÖNCE geçiyor', async () => {
    const cost = baseCost();
    const whole = computeWholeValueMethod(cost, 20, 30);
    const land = computeLandOnlyMethod(cost, 20, 30);
    const input = { hotelName: 'Test', mahalle: '', ada: '1', parsel: '1', parcelArea: 1000, fromKml: false,
      currency: 'TL' as const, sureUnit: 'yil' as const, kalanSure: 20, toplamSure: 30 };
    const doc = await buildSimpleUstHakkiPdf('toplam', input, whole, land);
    const text = await extractText(doc);
    const heroIdx = text.indexOf('ÜST HAKKI DEĞERİ');
    const parselIdx = text.indexOf('PARSEL BİLGİLERİ');
    expect(heroIdx).toBeGreaterThan(-1);
    expect(parselIdx).toBeGreaterThan(-1);
    expect(heroIdx).toBeLessThan(parselIdx);
  });

  it('"Arsa Değeri Esaslı" — "NİHAİ ÜST HAKKI DEĞERİ" ifadesi de en başta', async () => {
    const cost = baseCost();
    const whole = computeWholeValueMethod(cost, 20, 30);
    const land = computeLandOnlyMethod(cost, 20, 30);
    const input = { hotelName: 'Test', mahalle: '', ada: '1', parsel: '1', parcelArea: 1000, fromKml: false,
      currency: 'TL' as const, sureUnit: 'yil' as const, kalanSure: 20, toplamSure: 30 };
    const doc = await buildSimpleUstHakkiPdf('arsa', input, whole, land);
    const text = await extractText(doc);
    const heroIdx = text.indexOf('NİHAİ ÜST HAKKI DEĞERİ');
    const parselIdx = text.indexOf('PARSEL BİLGİLERİ');
    expect(heroIdx).toBeGreaterThan(-1);
    expect(heroIdx).toBeLessThan(parselIdx);
  });
});

describe('Kalem 4 — Hesap adımları artık açık (2/3 ve süre oranı gösteriliyor)', () => {
  it('"Toplam Değer Esaslı" — "2/3" ve süre oranı PDF metninde gerçekten geçiyor', async () => {
    const cost = baseCost();
    const whole = computeWholeValueMethod(cost, 20, 30);
    const land = computeLandOnlyMethod(cost, 20, 30);
    const input = { hotelName: 'Test', mahalle: '', ada: '1', parsel: '1', parcelArea: 1000, fromKml: false,
      currency: 'TL' as const, sureUnit: 'yil' as const, kalanSure: 20, toplamSure: 30 };
    const doc = await buildSimpleUstHakkiPdf('toplam', input, whole, land);
    const text = await extractText(doc);
    expect(text).toContain('HESAP ADIMLARI');
    expect(text).toMatch(/2\/3/);
    expect(text).toMatch(/20\/30/);
    // Ara değer (Daimi Müstakil Hak Değeri) gerçekten hesaplanan sayıyla eşleşiyor
    const beklenen = Math.round(whole.permanentValue).toLocaleString('tr-TR');
    expect(text).toContain(beklenen);
  });

  it('"Arsa Değeri Esaslı" — Arsa Daimi Müstakil Hak Değeri ara adımı görünüyor (motorun döndürmediği ama PDF\'in yeniden hesapladığı bir değer)', async () => {
    const cost = baseCost();
    const whole = computeWholeValueMethod(cost, 20, 30);
    const land = computeLandOnlyMethod(cost, 20, 30);
    const input = { hotelName: 'Test', mahalle: '', ada: '1', parsel: '1', parcelArea: 1000, fromKml: false,
      currency: 'TL' as const, sureUnit: 'yil' as const, kalanSure: 20, toplamSure: 30 };
    const doc = await buildSimpleUstHakkiPdf('arsa', input, whole, land);
    const text = await extractText(doc);
    const landPermanent = Math.round(land.cost.landValue * (2 / 3));
    expect(text).toContain(landPermanent.toLocaleString('tr-TR'));
    expect(text).toContain('Bina Değeri (tam, oranlanmadan eklenir)');
  });
});
