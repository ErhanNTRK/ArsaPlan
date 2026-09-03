/**
 * Ayrıntılı Üst Hakkı PDF — Kalem 1 & 2 doğrulaması:
 * 1) "TAŞINMAZ DEĞERİ" artık raporun başında (kimlik satırından hemen sonra).
 * 2) Motorun hesapladığı 5 gelir + 13 gider kalemi artık PDF'te görünüyor
 *    (önceden yalnızca "Toplam Gelir/Gider" gösteriliyordu).
 */
import { describe, it, expect } from 'vitest';
import { computeDetailedUstHakki } from './detailedEngine';
import { buildDetailedUstHakkiPdf } from './detailedPdf';

function baseInput() {
  return {
    hotelName: 'Test Otel', ada: '100', parsel: '5', parcelArea: 2000, fromKml: false,
    sureUnit: 'yil' as const, kalanSureYil: 15, toplamSureYil: 25, currency: 'TL' as const, fxRate: 1,
    rooms: [{ id: 'r1', name: 'Standart', count: 40, price: 4000, occupancyPct: 60, days: 365 }],
    roomGrowthPct: 18,
    foodIncomeBase: 8000000, otherIncomeBase: 1500000, meetingIncomeBase: 1000000, shopIncomeBase: 500000,
    roomExpensePct: 25, foodExpensePct: 55, otherExpensePct: 20, generalMgmtPct: 8, energyPct: 6, repairPct: 1,
    landUnitValue: 12000,
    buildings: [{ id: 'b1', type: 'Otel Binası', area: 3000, unitCost: 22000 }],
    buildingDepreciationPct: 25, showCostApproachInPdf: true,
    operatorPremiumPct: 10, propertyTaxPct: 0.2, insurancePct: 0.5, renewalFundPct: 1,
    ecrimisilBase: 1000000, ecrimisilGrowthPct: 12,
    ustHakkiOdemeBase: 3000000, ustHakkiOdemeGrowthPct: 12,
    bayilikBase: 500000, bayilikGrowthPct: 12,
    discountRatePct: 35, donemSonuIndirgemePct: 0,
  };
}

async function extractPdfTextWithPositions(doc: Awaited<ReturnType<typeof buildDetailedUstHakkiPdf>>) {
  const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const pdfDoc = await pdfjs.getDocument({ data: doc.output('arraybuffer') }).promise;
  const page1 = await pdfDoc.getPage(1);
  const content = await page1.getTextContent();
  return content.items.map((it: any) => it.str).join(' ');
}

describe('Kalem 1 — TAŞINMAZ DEĞERİ artık raporun başında', () => {
  it('1. sayfada "TAŞINMAZ DEĞERİ" ifadesi, "DÖNEMSEL ÖZET TABLOSU" ifadesinden ÖNCE geçiyor', async () => {
    const input = baseInput();
    const r = computeDetailedUstHakki(input);
    const doc = await buildDetailedUstHakkiPdf(input, r);
    const text = await extractPdfTextWithPositions(doc);
    const heroIdx = text.indexOf('TAŞINMAZ DEĞERİ');
    const tableIdx = text.indexOf('DÖNEMSEL ÖZET TABLOSU');
    expect(heroIdx).toBeGreaterThan(-1);
    expect(tableIdx).toBeGreaterThan(-1);
    expect(heroIdx).toBeLessThan(tableIdx);
  });
});

describe('Kalem 1 (düzeltme) — dört per-yıl detay tablosu kaldırıldı, kompakt "Girdi Varsayımları" ile değiştirildi', () => {
  it('"GELİR KALEMLERİ DETAYI" gibi eski per-yıl tablolar artık YOK', async () => {
    const input = baseInput();
    const r = computeDetailedUstHakki(input);
    const doc = await buildDetailedUstHakkiPdf(input, r);
    const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const pdfDoc = await pdfjs.getDocument({ data: doc.output('arraybuffer') }).promise;
    let full = '';
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const content = await (await pdfDoc.getPage(i)).getTextContent();
      full += content.items.map((it: any) => it.str).join(' ') + '\n';
    }
    expect(full).not.toContain('GELİR KALEMLERİ DETAYI');
    expect(full).not.toContain('İŞLETME GİDERLERİ DETAYI');
    expect(full).not.toContain('SABİT GİDERLER DETAYI');
    expect(full).not.toContain('ÜST HAKKI SAHİBİNE ÖZGÜ ÖDEMELER');
  });

  it('"GİRDİ VARSAYIMLARI" bölümü var, 1. yıl taban değerleri ve oranlar gerçekten görünüyor', async () => {
    const input = baseInput();
    const r = computeDetailedUstHakki(input);
    const doc = await buildDetailedUstHakkiPdf(input, r);
    const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const pdfDoc = await pdfjs.getDocument({ data: doc.output('arraybuffer') }).promise;
    let full = '';
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const content = await (await pdfDoc.getPage(i)).getTextContent();
      full += content.items.map((it: any) => it.str).join(' ') + '\n';
    }
    expect(full).toContain('GİRDİ VARSAYIMLARI');
    expect(full).toMatch(/Ecrimisil.*1\.000\.000/);
    expect(full).toMatch(/Üst Hakkı Ödemesi.*3\.000\.000/);
    expect(full).toMatch(/İşletmeci Prim Oranı.*%10/);
  });
});
