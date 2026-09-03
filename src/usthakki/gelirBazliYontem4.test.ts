/**
 * Üst Hakkı Yöntem 4 — Basit Gelir Bazlı Hesap. Salih'in onayladığı,
 * Ayrıntılı modelin (Toplam Gelir Üzerinden) sadeleştirilmiş kardeşi.
 */
import { describe, it, expect } from 'vitest';
import { computeGelirBazliUstHakki, createDefaultGelirBazliInput, type GelirBazliUstHakkiInput } from './gelirBazliEngine';

function baseInput(): GelirBazliUstHakkiInput {
  return {
    ...createDefaultGelirBazliInput(),
    hotelName: 'Test Otel', ada: '1', parsel: '1', parcelArea: 1000,
    kalanSureYil: 20, toplamSureYil: 30,
    toplamGelirBase: 90000000, gelirArtisOraniPct: 18,
    isletmeGideriOraniPct: 45, sabitGiderOraniPct: 12,
    ecrimisilBase: 1000000, ecrimisilGrowthPct: 12,
    ustHakkiOdemeBase: 3000000, ustHakkiOdemeGrowthPct: 12,
    bayilikBase: 500000, bayilikGrowthPct: 12,
    discountRatePct: 35,
  };
}

describe('computeGelirBazliUstHakki — motor', () => {
  it('Projeksiyon süresi TAM OLARAK Kalan Süre kadar — kullanıcının en önemli beklentisi', () => {
    const input = baseInput();
    const r = computeGelirBazliUstHakki(input);
    expect(r.years.length).toBe(input.kalanSureYil);
  });

  it('Terminal değer YOK — son yılın büyümesi, önceki yıllarla aynı oranda, ekstra sıçrama içermiyor', () => {
    const input = baseInput();
    const r = computeGelirBazliUstHakki(input);
    const lastYear = r.years[r.years.length - 1];
    const secondLastYear = r.years[r.years.length - 2];
    const observedGrowth = lastYear.totalRevenue / secondLastYear.totalRevenue;
    expect(observedGrowth).toBeCloseTo(1 + input.gelirArtisOraniPct / 100, 5);
  });

  it('1. dönem indirgenmiyor (bugünkü değer = nakit akışın kendisi)', () => {
    const input = baseInput();
    const r = computeGelirBazliUstHakki(input);
    expect(r.years[0].presentValue).toBe(r.years[0].ustHakkiSahibineKalan);
  });

  it('Ecrimisil/Üst Hakkı Ödemesi/Bayilik, NOI\'den düşülüyor', () => {
    const input = baseInput();
    const r = computeGelirBazliUstHakki(input);
    const y1 = r.years[0];
    expect(y1.ustHakkiSahibineKalan).toBe(y1.noi - y1.ecrimisil - y1.ustHakkiOdeme - y1.bayilik);
    expect(y1.ustHakkiSahibineKalan).toBeLessThan(y1.noi);
  });

  it('Toplam Gelir girilmemişse uyarı veriyor, hata fırlatmıyor', () => {
    const input = baseInput();
    input.toplamGelirBase = 0;
    const r = computeGelirBazliUstHakki(input);
    expect(r.warnings.some((w) => w.includes('Toplam Gelir'))).toBe(true);
  });

  it('Sonuç, gerçekçi bir aralıkta', () => {
    const input = baseInput();
    const r = computeGelirBazliUstHakki(input);
    expect(r.ustHakkiDegeriRounded).toBeGreaterThan(0);
    expect(r.ustHakkiDegeriRounded).toBeLessThan(input.toplamGelirBase * 10);
  });
});

describe('Üst Hakkı Yöntem 4 — PDF çıktısı', () => {
  it('Sonuç ("ÜST HAKKI DEĞERİ") raporun başında, "DÖNEMSEL ÖZET TABLOSU"ndan ÖNCE geçiyor', async () => {
    const { buildGelirBazliUstHakkiPdf } = await import('./gelirBazliPdf');
    const input = baseInput();
    const r = computeGelirBazliUstHakki(input);
    const doc = await buildGelirBazliUstHakkiPdf(input, r);
    const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const pdfDoc = await pdfjs.getDocument({ data: doc.output('arraybuffer') }).promise;
    const content = await (await pdfDoc.getPage(1)).getTextContent();
    const text = content.items.map((it: any) => it.str).join(' ');
    const heroIdx = text.indexOf('ÜST HAKKI DEĞERİ');
    const tableIdx = text.indexOf('DÖNEMSEL ÖZET TABLOSU');
    expect(heroIdx).toBeGreaterThan(-1);
    expect(heroIdx).toBeLessThan(tableIdx);
  });

  it('Girdi Varsayımları bölümü (Toplam Gelir, oranlar) PDF\'te gerçekten görünüyor', async () => {
    const { buildGelirBazliUstHakkiPdf } = await import('./gelirBazliPdf');
    const input = baseInput();
    const r = computeGelirBazliUstHakki(input);
    const doc = await buildGelirBazliUstHakkiPdf(input, r);
    const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const pdfDoc = await pdfjs.getDocument({ data: doc.output('arraybuffer') }).promise;
    const content = await (await pdfDoc.getPage(1)).getTextContent();
    const text = content.items.map((it: any) => it.str).join(' ');
    expect(text).toContain('GİRDİ VARSAYIMLARI');
    expect(text).toMatch(/90\.000\.000/);
    expect(text).toContain('İşletme Gideri Oranı');
  });

  it('Hiç × / ÷ karakteri içermiyor (font hatası korunuyor)', async () => {
    const { buildGelirBazliUstHakkiPdf } = await import('./gelirBazliPdf');
    const input = baseInput();
    const r = computeGelirBazliUstHakki(input);
    const doc = await buildGelirBazliUstHakkiPdf(input, r);
    const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const pdfDoc = await pdfjs.getDocument({ data: doc.output('arraybuffer') }).promise;
    let full = '';
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const content = await (await pdfDoc.getPage(i)).getTextContent();
      full += content.items.map((it: any) => it.str).join(' ');
    }
    expect(full).not.toContain('×');
    expect(full).not.toContain('÷');
  });

  it('Banka İsmi doluysa en başta gösteriliyor (Kalem 3 tutarlılığı)', async () => {
    const { buildGelirBazliUstHakkiPdf } = await import('./gelirBazliPdf');
    const input = baseInput();
    input.bankName = 'Test Bank';
    const r = computeGelirBazliUstHakki(input);
    const doc = await buildGelirBazliUstHakkiPdf(input, r);
    const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const pdfDoc = await pdfjs.getDocument({ data: doc.output('arraybuffer') }).promise;
    const content = await (await pdfDoc.getPage(1)).getTextContent();
    const text = content.items.map((it: any) => it.str).join(' ');
    expect(text).toContain('Test Bank');
  });
});

describe('Üst Hakkı Yöntem 4 — Excel çıktısı', () => {
  it('Geçerli bir workbook üretir, Toplam Gelir Oranı gibi girdi varsayımları gerçekten bir hücrede geçiyor', async () => {
    const { buildGelirBazliUstHakkiWorkbook } = await import('./gelirBazliExcel');
    const input = baseInput();
    const r = computeGelirBazliUstHakki(input);
    const wb = await buildGelirBazliUstHakkiWorkbook(input, r);
    const ws = wb.worksheets[0];
    let found90m = false, foundLabel = false;
    ws.eachRow((row) => row.eachCell((cell) => {
      if (typeof cell.value === 'number' && Math.abs(cell.value - 90000000) < 1) found90m = true;
      if (String(cell.value ?? '').includes('İşletme Gideri Oranı')) foundLabel = true;
    }));
    expect(found90m).toBe(true);
    expect(foundLabel).toBe(true);
  });
});
