/**
 * Kalem 5 — Akaryakıt Maliyet Yaklaşımı: Yasal/Mevcut Durum ayrımı, yapı
 * türü kataloğu (BUILDING_TYPES), amortisman, birim maliyet kataloğu
 * (YAPI_SINIFLARI) eklendi.
 */
import { describe, it, expect } from 'vitest';
import { computeFuel } from './engine';

const baseProduct = { id: 'p1', name: 'Kurşunsuz 95', mode: 'gunluk' as const, dailyLiters: 3000, monthlyLiters: 0,
  multiYearLiters: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], multiYearLabels: null, unitPrice: 47.5, profitPct: 3 };

function makeInput(costOverrides: any) {
  return {
    products: [baseProduct], extras: [], otherIncomePctOfFuel: 0, dealerRent: { include: false, yearlyAmount: 0 },
    capRate: 12, rounding: 50000,
    cost: { enabled: true, parcelArea: 1000, landUnitValue: 10000, buildings: [], ...costOverrides },
  } as any;
}

describe('Kalem 5 — Akaryakıt yapı sınıfı kataloğundan birim maliyet çekiyor', () => {
  it('buildingClassCode verilirse YAPI_SINIFLARI\'ndan birim maliyet otomatik geliyor', async () => {
    const { YAPI_SINIFLARI } = await import('../data/yapiSiniflari');
    const anyClass = YAPI_SINIFLARI[0];
    const input = makeInput({
      buildings: [{ id: 'b1', type: 'Kanopi', buildingClassCode: anyClass.code, area: 100, unitCostOverride: null, depreciationPct: 100 }],
    });
    const r = computeFuel(input);
    expect(r.costBuildings).toBe(100 * anyClass.unitCost);
  });

  it('unitCostOverride girilirse kataloğu ezer', async () => {
    const { YAPI_SINIFLARI } = await import('../data/yapiSiniflari');
    const anyClass = YAPI_SINIFLARI[0];
    const input = makeInput({
      buildings: [{ id: 'b1', type: 'Kanopi', buildingClassCode: anyClass.code, area: 100, unitCostOverride: 99999, depreciationPct: 100 }],
    });
    const r = computeFuel(input);
    expect(r.costBuildings).toBe(100 * 99999);
  });

  it('amortisman gerçekten uygulanıyor (%50 amortisman → yarı değer)', () => {
    const input = makeInput({
      buildings: [{ id: 'b1', type: 'Kanopi', buildingClassCode: null, area: 100, unitCostOverride: 10000, depreciationPct: 50 }],
    });
    const r = computeFuel(input);
    expect(r.costBuildings).toBe(100 * 10000 * 0.5);
  });

  it('amortisman 0 girilirse (belirtilmemiş sayılır) tam değer kullanılır — cost/hotel modülleriyle aynı davranış', () => {
    const input = makeInput({
      buildings: [{ id: 'b1', type: 'Kanopi', buildingClassCode: null, area: 100, unitCostOverride: 10000, depreciationPct: 0 }],
    });
    const r = computeFuel(input);
    expect(r.costBuildings).toBe(100 * 10000); // 0 → ×1 (belirtilmemiş kabul edilir), ×0 değil
  });
});

describe('Kalem 5 — Akaryakıt Yasal/Mevcut Durum ayrımı', () => {
  it('computeMevcutDurum kapalıysa costCurrent, Yasal Durum ile birebir aynı', () => {
    const input = makeInput({
      buildings: [{ id: 'b1', type: 'Kanopi', buildingClassCode: null, area: 100, unitCostOverride: 10000, depreciationPct: 100 }],
    });
    const r = computeFuel(input);
    expect(r.costCurrent.value).toBe(r.costValue);
    expect(r.costCurrent.buildings).toBe(r.costBuildings);
  });

  it('Mevcut Durum bağımsız yapı satırlarıyla girilirse Yasal\'dan farklı, doğru hesaplanır', () => {
    const input = makeInput({
      buildings: [{ id: 'b1', type: 'Kanopi', buildingClassCode: null, area: 100, unitCostOverride: 10000, depreciationPct: 100 }],
      computeMevcutDurum: true,
      mevcutBuildings: [
        { id: 'b1', type: 'Kanopi', buildingClassCode: null, area: 100, unitCostOverride: 10000, depreciationPct: 100 },
        { id: 'b2', type: 'Ek Depo', buildingClassCode: null, area: 50, unitCostOverride: 8000, depreciationPct: 100 },
      ],
    });
    const r = computeFuel(input);
    expect(r.costBuildings).toBe(100 * 10000); // Yasal: yalnız kanopi
    expect(r.costCurrent.buildings).toBe(100 * 10000 + 50 * 8000); // Mevcut: + ek depo
    expect(r.costCurrent.value).not.toBe(r.costValue);
  });

  it('costCurrent.value da 5.000 ve katlarına yuvarlanmış', () => {
    const input = makeInput({
      buildings: [],
      computeMevcutDurum: true,
      mevcutBuildings: [{ id: 'b1', type: 'Kanopi', buildingClassCode: null, area: 137, unitCostOverride: 12345, depreciationPct: 100 }],
    });
    const r = computeFuel(input);
    expect(r.costCurrent.value! % 5000).toBe(0);
  });
});

describe('Kalem 5 — PDF/Excel gerçek çıktı doğrulaması', () => {
  it('PDF ve Excel çıktısında Yasal Durum ve Mevcut Durum maliyet bölümleri gerçekten görünüyor', async () => {
    const input = makeInput({
      buildings: [{ id: 'b1', type: 'Kanopi', buildingClassCode: null, area: 100, unitCostOverride: 10000, depreciationPct: 100 }],
      computeMevcutDurum: true,
      mevcutBuildings: [
        { id: 'b1', type: 'Kanopi', buildingClassCode: null, area: 100, unitCostOverride: 10000, depreciationPct: 100 },
        { id: 'b2', type: 'Ek Depo', buildingClassCode: null, area: 50, unitCostOverride: 8000, depreciationPct: 100 },
      ],
    });
    const r = computeFuel(input);

    const { buildFuelPdf } = await import('./pdf');
    const doc = await buildFuelPdf(input, r);
    const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const buf = doc.output('arraybuffer') as ArrayBuffer;
    const pdfDoc = await pdfjs.getDocument({ data: buf }).promise;
    let text = '';
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const content = await (await pdfDoc.getPage(i)).getTextContent();
      text += content.items.map((it: any) => it.str).join(' ');
    }
    expect(text).toContain('Mevcut Durum');

    const { buildFuelExcelWorkbook } = await import('./excel');
    const wb = await buildFuelExcelWorkbook(input, r);
    const ws = wb.worksheets[0];
    let foundYasal = false, foundMevcut = false;
    ws.eachRow((row) => row.eachCell((cell) => {
      const v = String(cell.value ?? '');
      if (v.includes('YASAL DURUM')) foundYasal = true;
      if (v.includes('MEVCUT DURUM')) foundMevcut = true;
    }));
    expect(foundYasal).toBe(true);
    expect(foundMevcut).toBe(true);
  });
});
