/**
 * Arsa Gelir Projeksiyonu — Nihai Değer seçici düzeltmesi. Önceden yalnızca
 * "elle giriş" vardı; hesaplanan iki indirgemeli değerden birini "ana değer"
 * olarak seçmek mümkün değildi (hero her zaman ham Gelir Projeksiyonu'nu
 * gösteriyordu). Artık finalMethod ile üç hesaplanan seçenekten biri veya
 * manuel bir değer, PDF/Excel'in başındaki büyük kutuda gösterilebiliyor.
 */
import { describe, it, expect } from 'vitest';
import { analyze } from './index';
import makeMinimalProjectInput from '../tests/fixtures/minimalProjectInput';

function withDiscountAndShare(overrides: Partial<ReturnType<typeof makeMinimalProjectInput>> = {}) {
  const input = makeMinimalProjectInput();
  input.residual.projectMonths = 9;
  input.residual.timeDiscountRate = 0.12;
  input.share = { enabled: true, ownerShare: 0.35 };
  return { ...input, ...overrides };
}

async function extractPdfText(input: ReturnType<typeof makeMinimalProjectInput>) {
  const r = analyze(input);
  const { buildPdf } = await import('../export/pdf');
  const { doc } = await buildPdf(input, r, 'test');
  const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const pdfDoc = await pdfjs.getDocument({ data: doc.output('arraybuffer') }).promise;
  let full = '';
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const content = await (await pdfDoc.getPage(i)).getTextContent();
    full += content.items.map((it: any) => it.str).join(' ') + '\n';
  }
  return { full, r };
}

describe('Arsa Gelir Projeksiyonu — Nihai Değer seçici (finalMethod)', () => {
  it('finalMethod belirtilmemişse (varsayılan), hero kutusu HAM Gelir Projeksiyonu\'nu gösteriyor — eski davranış korunuyor', async () => {
    const input = withDiscountAndShare();
    const { full, r } = await extractPdfText(input);
    expect(full).toContain('ARSA DEĞERİ (GELİR PROJEKSİYONU)');
    expect(full).toMatch(new RegExp(Math.round(r.financial.residualLandValueRounded).toLocaleString('tr-TR').replace(/\./g, '\\.')));
  });

  it('finalMethod="gelir-indirgemeli" iken hero kutusu İNDİRGEMELİ Gelir Projeksiyonu değerini gösteriyor', async () => {
    const input = withDiscountAndShare({ finalMethod: 'gelir-indirgemeli' });
    const { full, r } = await extractPdfText(input);
    expect(full).toContain('ARSA DEĞERİ (İNDİRGEMELİ GELİR PROJEKSİYONU)');
    expect(full).toMatch(new RegExp(Math.round(r.financial.discountedLandValueRounded).toLocaleString('tr-TR').replace(/\./g, '\\.')));
  });

  it('finalMethod="kat-karsiligi-indirgemeli" iken hero kutusu İNDİRGEMELİ Kat Karşılığı değerini gösteriyor', async () => {
    const input = withDiscountAndShare({ finalMethod: 'kat-karsiligi-indirgemeli' });
    const { full, r } = await extractPdfText(input);
    expect(full).toContain('ARSA DEĞERİ (İNDİRGEMELİ KAT KARŞILIĞI)');
    expect(full).toMatch(new RegExp(Math.round(r.share.discountedShareLandValueRounded).toLocaleString('tr-TR').replace(/\./g, '\\.')));
  });

  it('finalMethod="manuel" iken hero kutusu elle girilen değeri gösteriyor', async () => {
    const input = withDiscountAndShare({ finalMethod: 'manuel', finalManualValue: 77000000 });
    const { full } = await extractPdfText(input);
    expect(full).toContain('ARSA DEĞERİ (KULLANICI BELİRLEDİ)');
    expect(full).toMatch(/77\.000\.000/);
  });

  it('finalMethod="kat-karsiligi-indirgemeli" seçili ama share.enabled=false ise, güvenli şekilde HAM değere düşüyor (hata vermiyor)', async () => {
    const input = withDiscountAndShare({ finalMethod: 'kat-karsiligi-indirgemeli', share: { enabled: false, ownerShare: 0.35 } });
    const { full, r } = await extractPdfText(input);
    expect(full).toContain('ARSA DEĞERİ (GELİR PROJEKSİYONU)');
    expect(full).not.toContain('KAT KARŞILIĞI');
    expect(full).toMatch(new RegExp(Math.round(r.financial.residualLandValueRounded).toLocaleString('tr-TR').replace(/\./g, '\\.')));
  });
});
