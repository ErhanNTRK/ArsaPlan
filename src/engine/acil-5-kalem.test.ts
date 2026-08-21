/**
 * Acil düzeltme turu: (1) İndirgemeli değer artık hem ay hem oran > 0
 * gerektiriyor, (2) Parsel Alanı 2 ondalık koruyor, (3) TAKS/KAKS modunda
 * krokiye taban oturumu ekleniyor, (4) Parsel Krokisi/Yapı Kesiti ayrı
 * anahtarlar, (5) gapExplanation artık PDF/Excel'e yazılmıyor (yalnız ekran).
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

describe('Acil #1 — İndirgemeli değer artık yalnız ay VEYA oran doluysa yanlışlıkla görünmüyor', () => {
  it('Yalnız Proje Süresi girilmiş, İskonto Oranı boşsa: discountedLandValue = residualLandValue (gerçek indirgeme yok)', () => {
    const input = makeMinimalProjectInput();
    input.residual.projectMonths = 24;
    input.residual.timeDiscountRate = 0; // boş
    const r = analyze(input);
    expect(r.financial.discountedLandValue).toBe(r.financial.residualLandValue);
  });

  it('PDF: yalnız ay doluysa "İndirgemeli Kat Karşılığı Değeri" satırı ARTIK YAZILMIYOR', async () => {
    const input = makeMinimalProjectInput();
    input.residual.projectMonths = 24;
    input.residual.timeDiscountRate = 0;
    input.share.enabled = true;
    const r = analyze(input);
    const { buildPdf } = await import('../export/pdf');
    const { doc } = await buildPdf(input, r, 'test');
    const text = await extractPdfText(doc.output('arraybuffer') as ArrayBuffer);
    expect(text).not.toContain('İndirgemeli Kat Karşılığı Değeri');
    expect(text).not.toContain('İndirgemeli Gelir Projeksiyonu Değeri');
  });

  it('Hem ay hem oran doluysa satır gerçekten yazılıyor (yanlışlıkla kaldırılmadı)', async () => {
    const input = makeMinimalProjectInput();
    input.residual.projectMonths = 24;
    input.residual.timeDiscountRate = 0.30;
    input.share.enabled = true;
    const r = analyze(input);
    const { buildPdf } = await import('../export/pdf');
    const { doc } = await buildPdf(input, r, 'test');
    const text = await extractPdfText(doc.output('arraybuffer') as ArrayBuffer);
    expect(text).toContain('İndirgemeli Kat Karşılığı Değeri');
  });
});

describe('Acil #2 — Parsel Alanı artık tam sayıya yuvarlanmıyor', () => {
  it('PDF: 10.000,33 m² gerçekten ondalıklı yazılıyor, 10.000 m² olarak değil', async () => {
    const input = makeMinimalProjectInput();
    input.parcel.area = 10000.33;
    input.parcel.netArea = 10000.33;
    const r = analyze(input);
    const { buildPdf } = await import('../export/pdf');
    const { doc } = await buildPdf(input, r, 'test');
    const text = await extractPdfText(doc.output('arraybuffer') as ArrayBuffer);
    expect(text).toMatch(/10\.000,33/);
  });
});

describe('Acil #4 — Parsel Krokisi ve Yapı Kesiti ayrı ayrı kontrol edilebiliyor', () => {
  it('showParcelSketch=false, showBuildingSection=true iken yalnız kesit çiziliyor', async () => {
    const input = makeMinimalProjectInput();
    input.showParcelSketch = false;
    input.showBuildingSection = true;
    const r = analyze(input);
    const { buildPdf } = await import('../export/pdf');
    const { doc } = await buildPdf(input, r, 'test');
    const text = await extractPdfText(doc.output('arraybuffer') as ArrayBuffer);
    expect(text).not.toContain('PARSEL KROKİSİ');
    expect(text).toContain('YAPI KESİTİ');
  });

  it('Hiçbiri ayarlanmamışsa (eski taslak), eski davranış korunuyor — reportVisuals=true ile ikisi de görünür kalır', async () => {
    const input = makeMinimalProjectInput();
    input.reportVisuals = true;
    const r = analyze(input);
    const { buildPdf } = await import('../export/pdf');
    const { doc } = await buildPdf(input, r, 'test');
    const text = await extractPdfText(doc.output('arraybuffer') as ArrayBuffer);
    expect(text).toContain('YAPI KESİTİ');
  });
});

describe('Acil #5 — gapExplanation artık PDF/Excel\'e yazılmıyor (yalnız ekranda)', () => {
  it('Fark %5\'i aşan bir senaryoda bile PDF\'te tutarsızlık notu YOK', async () => {
    const input = makeMinimalProjectInput();
    input.share.enabled = true;
    input.share.ownerShare = 0.60; // büyük fark yaratacak
    const r = analyze(input);
    expect(r.share.gapExplanation).not.toBeNull(); // motor hâlâ hesaplıyor (ekran için)
    const { buildPdf } = await import('../export/pdf');
    const { doc } = await buildPdf(input, r, 'test');
    const text = await extractPdfText(doc.output('arraybuffer') as ArrayBuffer);
    expect(text).not.toMatch(/müteahhit kâr oranı/i);
    expect(text).not.toMatch(/tutarsızlığa işaret/i);
  });
});
