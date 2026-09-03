/**
 * Akaryakıt — Salih'in bildirdiği hata: kullanıcının kendi girdiği isimli
 * "İlave Gelir Kalemleri" (Market Geliri, Restoran vb.) PDF/Excel'de
 * hiç isimleriyle görünmüyordu, hepsi tek bir "İlave Gelir Kalemleri/yıl"
 * toplam satırına sıkıştırılıyordu. Artık her kalem kendi ismiyle ayrı.
 */
import { describe, it, expect } from 'vitest';
import { computeFuel } from './engine';

function baseInput() {
  return {
    products: [{ id: 'p1', name: 'Kurşunsuz 95', mode: 'gunluk' as const, dailyLiters: 3000, monthlyLiters: 0,
      multiYearLiters: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], multiYearLabels: null, unitPrice: 47.5, profitPct: 3 }],
    extras: [
      { id: 'e1', name: 'Market Geliri', mode: 'net' as const, turnover: 0, profitPct: 0, netAmount: 850000 },
      { id: 'e2', name: 'Oto Yıkama', mode: 'net' as const, turnover: 0, profitPct: 0, netAmount: 120000 },
    ],
    otherIncomePctOfFuel: 0, dealerRent: { include: false, yearlyAmount: 0 },
    capRate: 12, rounding: 50000,
    cost: { enabled: false, parcelArea: 0, landUnitValue: 0, buildings: [] },
  } as any;
}

async function extractPdfText(input: ReturnType<typeof baseInput>, r: ReturnType<typeof computeFuel>) {
  const { buildFuelPdf } = await import('./pdf');
  const doc = await buildFuelPdf(input, r);
  const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const pdfDoc = await pdfjs.getDocument({ data: doc.output('arraybuffer') }).promise;
  const content = await (await pdfDoc.getPage(1)).getTextContent();
  return content.items.map((it: any) => it.str).join(' ');
}

describe('Akaryakıt PDF — İlave Gelir Kalemleri artık kendi ismiyle görünüyor', () => {
  it('"Market Geliri" ve "Oto Yıkama" PDF metninde ayrı ayrı, kendi isimleriyle geçiyor', async () => {
    const input = baseInput();
    const r = computeFuel(input);
    const text = await extractPdfText(input, r);
    expect(text).toContain('Market Geliri');
    expect(text).toContain('Oto Yıkama');
    expect(text).toMatch(/850\.000/);
    expect(text).toMatch(/120\.000/);
  });

  it('Eski genel "İlave Gelir Kalemleri/yıl" toplam satırı artık YOK (isimsiz toplama dönmüyor)', async () => {
    const input = baseInput();
    const r = computeFuel(input);
    const text = await extractPdfText(input, r);
    expect(text).not.toContain('İlave Gelir Kalemleri/yıl');
  });

  it('Toplam net kazanç, tek tek kalemlerin toplamıyla hâlâ tutarlı (yalnız gösterim değişti, hesap değişmedi)', async () => {
    const input = baseInput();
    const r = computeFuel(input);
    expect(r.extrasNet).toBe(850000 + 120000);
  });
});

describe('Akaryakıt PDF — Gelir/Kesinti bölümleri artık AYRI, net başlıklarla', () => {
  it('"DİĞER GELİR KALEMLERİ" ve "KESİNTİLER" ayrı başlıklar olarak geçiyor — eski karışık başlık YOK', async () => {
    const input = baseInput();
    input.dealerRent = { include: true, yearlyAmount: 200000 };
    const r = computeFuel(input);
    const text = await extractPdfText(input, r);
    expect(text).toContain('DİĞER GELİR KALEMLERİ');
    expect(text).toContain('KESİNTİLER');
    expect(text).not.toContain('DİĞER GELİRLER VE KESİNTİLER');
  });

  it('Dağıtıcı Kirası "KESİNTİLER" başlığının ALTINDA, Market Geliri "DİĞER GELİR KALEMLERİ"nin altında — karışmıyor', async () => {
    const input = baseInput();
    input.dealerRent = { include: true, yearlyAmount: 200000 };
    const r = computeFuel(input);
    const text = await extractPdfText(input, r);
    const gelirIdx = text.indexOf('DİĞER GELİR KALEMLERİ');
    const marketIdx = text.indexOf('Market Geliri');
    const kesintilerIdx = text.indexOf('KESİNTİLER');
    const kiraIdx = text.indexOf('Dağıtıcı Kirası');
    expect(marketIdx).toBeGreaterThan(gelirIdx);
    expect(marketIdx).toBeLessThan(kesintilerIdx);
    expect(kiraIdx).toBeGreaterThan(kesintilerIdx);
  });

  it('"ciro" modunda girilen bir kalemin hesap detayı (ciro × kâr oranı) artık gösteriliyor', async () => {
    const input = baseInput();
    input.extras = [{ id: 'e3', name: 'Restoran Geliri', mode: 'ciro' as const, turnover: 5000000, profitPct: 15, netAmount: 0 }];
    const r = computeFuel(input);
    const text = await extractPdfText(input, r);
    expect(text).toContain('Restoran Geliri');
    expect(text).toMatch(/%15 kar oranı/);
    expect(text).toMatch(/5\.000\.000/);
  });
});

describe('Akaryakıt Excel — aynı düzeltme', () => {
  it('"Market Geliri" Excel çıktısında da kendi ismiyle bir hücrede geçiyor', async () => {
    const input = baseInput();
    const r = computeFuel(input);
    const { buildFuelExcelWorkbook } = await import('./excel');
    const wb = await buildFuelExcelWorkbook(input, r);
    const ws = wb.worksheets[0];
    let found = false;
    ws.eachRow((row) => row.eachCell((cell) => {
      if (String(cell.value ?? '').includes('Market Geliri')) found = true;
    }));
    expect(found).toBe(true);
  });
});
