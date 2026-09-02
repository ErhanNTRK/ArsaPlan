/**
 * Akaryakıt — Nihai Değer seçici (Gelir Yaklaşımı / Maliyet Yaklaşımı /
 * Manuel), Otel modülüyle aynı desen.
 */
import { describe, it, expect } from 'vitest';
import { computeFuel } from './engine';

const baseProduct = { id: 'p1', name: 'Kurşunsuz 95', mode: 'gunluk' as const, dailyLiters: 3000, monthlyLiters: 0,
  multiYearLiters: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], multiYearLabels: null, unitPrice: 47.5, profitPct: 3 };

function makeInput(finalMethod?: 'gelir' | 'maliyet' | 'manuel', finalManualValue?: number | null) {
  return {
    products: [baseProduct], extras: [], otherIncomePctOfFuel: 0, dealerRent: { include: false, yearlyAmount: 0 },
    capRate: 12, rounding: 50000,
    cost: { enabled: true, parcelArea: 1000, landUnitValue: 10000,
      buildings: [{ id: 'b1', type: 'Kanopi', buildingClassCode: null, area: 100, unitCostOverride: 10000, depreciationPct: 100 }] },
    finalMethod, finalManualValue,
  } as any;
}

async function extractPdfText(buf: ArrayBuffer): Promise<string> {
  const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let full = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    full += content.items.map((it: any) => it.str).join(' ') + '\n';
  }
  return full;
}

describe('Akaryakıt — Nihai Değer seçici', () => {
  it('finalMethod belirtilmemişse (varsayılan), hero kutusu Gelir Yaklaşımı gösteriyor', async () => {
    const input = makeInput();
    const r = computeFuel(input);
    const { buildFuelPdf } = await import('./pdf');
    const doc = await buildFuelPdf(input, r);
    const text = await extractPdfText(doc.output('arraybuffer') as ArrayBuffer);
    expect(text).toMatch(/GELİR YAKLAŞIMI/);
  });

  it('finalMethod="maliyet" iken hero kutusu Maliyet Yaklaşımı\'nı gösteriyor, Gelir Yaklaşımı ikincil satırda kalıyor', async () => {
    const input = makeInput('maliyet');
    const r = computeFuel(input);
    const { buildFuelPdf } = await import('./pdf');
    const doc = await buildFuelPdf(input, r);
    const text = await extractPdfText(doc.output('arraybuffer') as ArrayBuffer);
    expect(text).toMatch(/MALİYET YAKLAŞIMI/);
    expect(text).toMatch(/Gelir Yaklaşımı/); // ikincil satır olarak hâlâ görünüyor
  });

  it('finalMethod="manuel" iken hero kutusu elle girilen değeri gösteriyor', async () => {
    const input = makeInput('manuel', 99000000);
    const r = computeFuel(input);
    const { buildFuelPdf } = await import('./pdf');
    const doc = await buildFuelPdf(input, r);
    const text = await extractPdfText(doc.output('arraybuffer') as ArrayBuffer);
    expect(text).toMatch(/NİHAİ DEĞER/);
    expect(text).toMatch(/99\.000\.000/);
  });
});
