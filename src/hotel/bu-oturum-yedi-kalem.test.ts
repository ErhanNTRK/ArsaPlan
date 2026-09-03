/**
 * Otel — bu oturumda kodlanan yedi kalemin doğrulaması:
 * 1) Direkt Kap NOI'sine yenileme fonu düşümü (İNA ile tutarlı)
 * 2) İkincil İNA satırına iskonto oranı
 * 3) "Yeniden inşa maliyeti" uyarısı
 * 4) PDF'te İNA'nın tam indirgeme detay tablosu
 * 5) Terminal büyüme oranı otomatik alındığında (sonuç ekranında) uyarı
 * 6) Sonuç ekranında kapsam notu
 * 7) Otel Maliyet Yaklaşımı'na Yapı Sınıfı otomatik önerisi
 */
import { describe, it, expect } from 'vitest';
import { analyzeHotel, createDefaultHotelInput } from './engine';
import { suggestedHotelUnitCost } from './HotelApp';

function baseInput() {
  const input = createDefaultHotelInput();
  input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 35, adr: 5000, occupancy: 0.60, operatingDays: 365 }];
  input.projection = { ...input.projection, capRate: 0.10, years: 10, incomeGrowthRate: 0.15, expenseGrowthRate: 0.12, renewalFundRate: 0.01, discountRate: 0.25 };
  return input;
}

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

describe('Kalem 1 — Direkt Kap NOI artık Yenileme Fonu\'nu düşüyor (İNA ile tutarlı)', () => {
  it('Hero NOI, Yıllık Projeksiyon Tablosu\'nun 1. yıl NOI\'siyle BİREBİR aynı', () => {
    const input = baseInput();
    const r = analyzeHotel(input);
    expect(r.noi).toBe(r.projectionTable[0].noi);
  });

  it('Yenileme fonu oranı %0 iken davranış değişmiyor (geriye dönük uyumluluk)', () => {
    const input = baseInput();
    input.projection.renewalFundRate = 0;
    const r = analyzeHotel(input);
    expect(r.noi).toBe(r.totalGrossRevenue - r.totalExpense);
  });
});

describe('Kalem 2 — İkincil İNA satırına iskonto oranı eklendi', () => {
  it('finalMethod="direkt" iken (varsayılan), ikincil İNA satırında iskonto oranı gerçekten yazıyor', async () => {
    const input = baseInput();
    const r = analyzeHotel(input);
    const text = await extractPdfText(input, r);
    expect(text).toMatch(/İNA \(NBD\), %25[.,]0 iskonto/);
  });
});

describe('Kalem 3 — "Yeniden inşa maliyeti" uyarısı', () => {
  it('İNA/Direkt Kap, Yapı Değerleri\'nin altına düşerse uyarı veriyor', () => {
    const input = baseInput();
    // Aşırı yüksek bir Yapı Değeri girerek İNA/Direkt Kap'ı bilerek altında bırakıyoruz.
    input.costParcelArea = 500; input.costLandUnitValue = 10000;
    input.costBuildings = [{ id: 'b1', type: 'Otel Binası', area: 5000, unitCost: 200000, depreciationPct: 100 }];
    const r = analyzeHotel(input);
    expect(r.cost!.buildingsValue).toBeGreaterThan(r.capitalizedValue);
    const varMi = r.warnings.some((w) => w.message.includes('yeniden inşa maliyetinin'));
    expect(varMi).toBe(true);
  });

  it('Yapı Değeri, İNA/Direkt Kap\'ın altındaysa uyarı VERİLMİYOR (normal durum)', () => {
    const input = baseInput();
    input.costParcelArea = 500; input.costLandUnitValue = 5000;
    input.costBuildings = [{ id: 'b1', type: 'Otel Binası', area: 800, unitCost: 20000, depreciationPct: 100 }];
    const r = analyzeHotel(input);
    const varMi = r.warnings.some((w) => w.message.includes('yeniden inşa maliyetinin'));
    expect(varMi).toBe(false);
  });
});

describe('Kalem 4 — PDF\'te İNA\'nın tam indirgeme detay tablosu', () => {
  it('"İNA — İndirgeme Detayı" başlığı ve İskonto Katsayısı sütunu gerçekten görünüyor', async () => {
    const input = baseInput();
    const r = analyzeHotel(input);
    const text = await extractPdfText(input, r);
    expect(text).toContain('İNA — İndirgeme Detayı');
    expect(text).toContain('İskonto Katsayısı');
    expect(text).toContain('Terminal Değer Formülü');
    // DÜZELTME (× / ÷ font hatası): önceden bu satırdaki "÷" karakteri
    // formülün geri kalanını (Terminal Kapitalizasyon Oranı %'si, sonuç
    // rakamları) sessizce görünmez yapıyordu — yalnızca başlık kısmı
    // görünüyordu. Artık formülün TAMAMI (cap rate yüzdesi dahil) görünüyor.
    expect(text).toMatch(/Terminal Kapitalizasyon Oranı, %\d/);
    expect(text).toContain('Terminal Değerin Bugünkü Değeri');
  });

  it('İskonto oranı girilmemişse (İNA hesaplanamıyorsa) detay tablosu hiç görünmüyor, hata da vermiyor', async () => {
    const input = baseInput();
    input.projection.discountRate = null;
    const r = analyzeHotel(input);
    const text = await extractPdfText(input, r);
    expect(text).not.toContain('İNA — İndirgeme Detayı');
  });
});

describe('Kalem 5 — Terminal büyüme oranı uyarısı yalnızca otomatik alındığında (buildWarnings kapsamında değil, ayrı UI koşulu — burada engine seviyesinde dolaylı doğrulama)', () => {
  it('longTermGrowthRate girilmemişse İNA hâlâ hesaplanıyor (uyarı yalnız UI\'da, hesaba etkisi yok)', () => {
    const input = baseInput();
    input.projection.longTermGrowthRate = null;
    const r = analyzeHotel(input);
    expect(r.ina).not.toBeNull();
  });
});

describe('Kalem 7 — Otel Maliyet Yaklaşımı\'na Yapı Sınıfı otomatik önerisi', () => {
  it('"Otel Binası" seçilince tebliğ birim maliyeti öneriliyor', () => {
    const oneri = suggestedHotelUnitCost('Otel Binası');
    expect(oneri).not.toBeNull();
    expect(oneri).toBeGreaterThan(0);
  });

  it('Eşleşmeyen bir tür için null döner (zorlama eşleşme yok)', () => {
    expect(suggestedHotelUnitCost('Böyle Bir Tür Yok')).toBeNull();
  });
});
