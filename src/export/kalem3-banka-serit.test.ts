/**
 * Kalem 3 — Banka İsmi / Şube İsmi / Tarih şeridi. Ortak `drawBankInfoStrip`
 * fonksiyonunu doğrudan test ediyor, ayrıca birkaç modülün (temsili örnek —
 * hepsini tam kapsamda test etmek çok uzun sürer) gerçek PDF çıktısında
 * doğru göründüğünü doğruluyor.
 */
import { describe, it, expect } from 'vitest';
import { jsPDF } from 'jspdf';
import { drawBankInfoStrip } from './pdf';

describe('drawBankInfoStrip — ortak fonksiyon', () => {
  it('Hiçbir alan doluysa, y hiç değişmiyor (şerit çizilmiyor)', () => {
    const doc = new jsPDF();
    const y = drawBankInfoStrip(doc, 50, {});
    expect(y).toBe(50);
  });

  it('Yalnızca Banka İsmi doluysa, y ilerliyor (şerit çiziliyor)', () => {
    const doc = new jsPDF();
    const y = drawBankInfoStrip(doc, 50, { bankName: 'Ziraat Bankası' });
    expect(y).toBeGreaterThan(50);
  });

  it('Üçü de doluysa da aynı şekilde ilerliyor, hata vermiyor', () => {
    const doc = new jsPDF();
    const y = drawBankInfoStrip(doc, 50, { bankName: 'Ziraat Bankası', branchName: 'Ege Ticari Merkez', reportDate: '2026-09-03' });
    expect(y).toBeGreaterThan(50);
  });

  it('Yalnızca boşluk içeren bir Banka İsmi (trim sonrası boş), şerit çizmiyor', () => {
    const doc = new jsPDF();
    const y = drawBankInfoStrip(doc, 50, { bankName: '   ' });
    expect(y).toBe(50);
  });
});

describe('Kalem 3 — temsili modüllerde gerçek PDF entegrasyonu', () => {
  it('Arsa Gelir Projeksiyonu: Banka İsmi doluysa PDF metninde gerçekten görünüyor', async () => {
    const { analyze } = await import('../engine');
    const makeMinimalProjectInput = (await import('../tests/fixtures/minimalProjectInput')).default;
    const { buildPdf } = await import('./pdf');
    const input = makeMinimalProjectInput();
    input.bankName = 'Test Bankası A.Ş.';
    input.branchName = 'Merkez Şube';
    const r = analyze(input);
    const { doc } = await buildPdf(input, r, 'test');
    const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const pdfDoc = await pdfjs.getDocument({ data: doc.output('arraybuffer') }).promise;
    const content = await (await pdfDoc.getPage(1)).getTextContent();
    const text = content.items.map((it: any) => it.str).join(' ');
    expect(text).toContain('Test Bankası A.Ş.');
    expect(text).toContain('Merkez Şube');
  });

  it('Arsa Gelir Projeksiyonu: hiçbiri doldurulmazsa şerit hiç görünmüyor', async () => {
    const { analyze } = await import('../engine');
    const makeMinimalProjectInput = (await import('../tests/fixtures/minimalProjectInput')).default;
    const { buildPdf } = await import('./pdf');
    const input = makeMinimalProjectInput();
    const r = analyze(input);
    const { doc } = await buildPdf(input, r, 'test');
    const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const pdfDoc = await pdfjs.getDocument({ data: doc.output('arraybuffer') }).promise;
    const content = await (await pdfDoc.getPage(1)).getTextContent();
    const text = content.items.map((it: any) => it.str).join(' ');
    expect(text).not.toContain('Banka:');
  });

  it('Otel Gelir Analizi: Banka İsmi doluysa PDF metninde gerçekten görünüyor', async () => {
    const { analyzeHotel, createDefaultHotelInput } = await import('../hotel/engine');
    const { buildHotelPdf } = await import('../hotel/pdf');
    const input = createDefaultHotelInput();
    input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 20, adr: 4000, occupancy: 0.6, operatingDays: 365 }];
    input.bankName = 'Denizbank';
    input.showReportDate = true;
    input.reportDate = '2026-09-03';
    const r = analyzeHotel(input);
    const { doc } = await buildHotelPdf(input, r);
    const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const pdfDoc = await pdfjs.getDocument({ data: doc.output('arraybuffer') }).promise;
    const content = await (await pdfDoc.getPage(1)).getTextContent();
    const text = content.items.map((it: any) => it.str).join(' ');
    expect(text).toContain('Denizbank');
    expect(text).toMatch(/03\.09\.2026/);
  });

  it('Ayrıntılı Üst Hakkı: Şube İsmi doluysa PDF metninde gerçekten görünüyor', async () => {
    const { computeDetailedUstHakki } = await import('../usthakki/detailedEngine');
    const { buildDetailedUstHakkiPdf } = await import('../usthakki/detailedPdf');
    const input = {
      hotelName: 'Test', ada: '1', parsel: '1', parcelArea: 1000, fromKml: false,
      sureUnit: 'yil' as const, kalanSureYil: 5, toplamSureYil: 10, currency: 'TL' as const, fxRate: 1,
      rooms: [{ id: 'r1', name: 'Standart', count: 10, price: 3000, occupancyPct: 60, days: 365 }],
      roomGrowthPct: 15,
      foodIncomeBase: 0, otherIncomeBase: 0, meetingIncomeBase: 0, shopIncomeBase: 0,
      roomExpensePct: 25, foodExpensePct: 0, otherExpensePct: 0, generalMgmtPct: 8, energyPct: 6, repairPct: 1,
      landUnitValue: 5000, buildings: [], buildingDepreciationPct: 25, showCostApproachInPdf: false,
      operatorPremiumPct: 10, propertyTaxPct: 0.2, insurancePct: 0.5, renewalFundPct: 1,
      ecrimisilBase: 0, ecrimisilGrowthPct: 0, ustHakkiOdemeBase: 0, ustHakkiOdemeGrowthPct: 0,
      bayilikBase: 0, bayilikGrowthPct: 0, discountRatePct: 30, donemSonuIndirgemePct: 0,
      branchName: 'Kadıköy Şubesi',
    };
    const r = computeDetailedUstHakki(input);
    const doc = await buildDetailedUstHakkiPdf(input, r);
    const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const pdfDoc = await pdfjs.getDocument({ data: doc.output('arraybuffer') }).promise;
    const content = await (await pdfDoc.getPage(1)).getTextContent();
    const text = content.items.map((it: any) => it.str).join(' ');
    expect(text).toContain('Kadıköy Şubesi');
  });
});
