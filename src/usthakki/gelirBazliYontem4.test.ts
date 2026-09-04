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
    rooms: [{ id: 'r1', name: 'Standart', count: 40, price: 4000, occupancyPct: 60, days: 365 }], // 40*4000*0.6*365 = 35.040.000
    gelirArtisOraniPct: 18,
    isletmeGideriOraniPct: 45, sabitGiderOraniPct: 12,
    ecrimisilPctOfRevenue: 2, ustHakkiOdemePctOfRevenue: 5, bayilikPctOfRevenue: 1,
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

  it('Oda tablosu boşsa (0 gelir) uyarı veriyor, hata fırlatmıyor', () => {
    const input = baseInput();
    input.rooms = [{ id: 'r1', name: 'Standart', count: 0, price: 0, occupancyPct: 60, days: 365 }];
    const r = computeGelirBazliUstHakki(input);
    expect(r.warnings.some((w) => w.includes('Oda tablosu'))).toBe(true);
  });

  it('Sonuç, gerçekçi bir aralıkta', () => {
    const input = baseInput();
    const r = computeGelirBazliUstHakki(input);
    expect(r.ustHakkiDegeriRounded).toBeGreaterThan(0);
    expect(r.ustHakkiDegeriRounded).toBeLessThan(r.toplamGelirBase * 10);
  });
});

describe('DÜZELTME — Toplam Gelir artık oda tablosundan otomatik hesaplanıyor (elle girilmiyor)', () => {
  it('İki farklı oda türü girilince, Toplam Gelir ikisinin toplamı oluyor', () => {
    const input = baseInput();
    input.rooms = [
      { id: 'r1', name: 'Standart', count: 20, price: 4000, occupancyPct: 60, days: 365 },
      { id: 'r2', name: 'Suit', count: 5, price: 8000, occupancyPct: 50, days: 365 },
    ];
    const r = computeGelirBazliUstHakki(input);
    const beklenen = (20 * 4000 * 0.6 * 365) + (5 * 8000 * 0.5 * 365);
    expect(r.toplamGelirBase).toBeCloseTo(beklenen, 0);
  });

  it('"toplamGelirBase" artık INPUT\'ta değil, yalnızca RESULT\'ta (motorun hesapladığı) var', () => {
    const input = baseInput();
    expect('toplamGelirBase' in input).toBe(false);
    const r = computeGelirBazliUstHakki(input);
    expect(r.toplamGelirBase).toBeGreaterThan(0);
  });
});

describe('DÜZELTME — Ecrimisil/Üst Hakkı Ödemesi/Bayilik artık Toplam Gelir\'in oranı (otomatik, üzerine yazılabilir)', () => {
  it('Ecrimisil, tam olarak Toplam Gelir × oran% kadar çıkıyor (1. yıl)', () => {
    const input = baseInput();
    const r = computeGelirBazliUstHakki(input);
    const beklenen = r.toplamGelirBase * (input.ecrimisilPctOfRevenue / 100);
    expect(r.years[0].ecrimisil).toBeCloseTo(beklenen, 0);
  });

  it('Oran değiştirilince (elle "üzerine yazma"), 1. yıl tutarı da orantılı değişiyor', () => {
    const input = baseInput();
    const r1 = computeGelirBazliUstHakki(input);
    input.ecrimisilPctOfRevenue = 10; // varsayılan %2'den değiştirildi
    const r2 = computeGelirBazliUstHakki(input);
    expect(r2.years[0].ecrimisil).toBeCloseTo(r1.years[0].ecrimisil * 5, 0);
  });

  it('Ödemeler, gelirle BİRLİKTE her yıl otomatik büyüyor — ayrı bir büyüme oranı girilmiyor', () => {
    const input = baseInput();
    const r = computeGelirBazliUstHakki(input);
    const yil1Oran = r.years[0].ecrimisil / r.years[0].totalRevenue;
    const yil10Oran = r.years[9].ecrimisil / r.years[9].totalRevenue;
    expect(yil1Oran).toBeCloseTo(yil10Oran, 5); // oran sabit kalmalı, tutar büyümeli
    expect(r.years[9].ecrimisil).toBeGreaterThan(r.years[0].ecrimisil);
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
    expect(text).toMatch(/35\.040\.000/);
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
      if (typeof cell.value === 'number' && Math.abs(cell.value - 35040000) < 1) found90m = true;
      if (String(cell.value ?? '').includes('İşletme Gideri Oranı')) foundLabel = true;
    }));
    expect(found90m).toBe(true);
    expect(foundLabel).toBe(true);
  });
});
