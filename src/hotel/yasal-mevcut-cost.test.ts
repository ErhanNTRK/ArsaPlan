/**
 * Otel Gelir Hesabı — Maliyet Yaklaşımı çapraz kontrolüne Yasal/Mevcut Durum
 * ayrımı eklendi (Maliyet Yaklaşımı modülüyle aynı desen, nötr isimlendirme).
 */
import { describe, it, expect } from 'vitest';
import { analyzeHotel, createDefaultHotelInput } from './engine';

describe('Otel — Maliyet Yaklaşımı Yasal/Mevcut Durum', () => {
  it('computeMevcutDurum kapalıysa current, Yasal Durum ile birebir aynıdır', () => {
    const input = createDefaultHotelInput();
    input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 10, adr: 5000, occupancy: 0.6, operatingDays: 365 }];
    input.costParcelArea = 500;
    input.costLandUnitValue = 20000;
    input.costBuildings = [{ id: 'b1', type: 'Otel', area: 800, unitCost: 25000, depreciationPct: 90 }];
    const r = analyzeHotel(input);
    expect(r.cost).not.toBeNull();
    expect(r.cost!.current.totalValueRounded).toBe(r.cost!.totalValueRounded);
    expect(r.cost!.current.buildingsValue).toBe(r.cost!.buildingsValue);
  });

  it('computeMevcutDurum açık ama mevcutCostBuildings boşsa yine Yasal Durum ile aynıdır', () => {
    const input = createDefaultHotelInput();
    input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 10, adr: 5000, occupancy: 0.6, operatingDays: 365 }];
    input.costParcelArea = 500;
    input.costLandUnitValue = 20000;
    input.costBuildings = [{ id: 'b1', type: 'Otel', area: 800, unitCost: 25000, depreciationPct: 90 }];
    input.computeMevcutDurum = true; // ama mevcutCostBuildings hiç girilmemiş
    const r = analyzeHotel(input);
    expect(r.cost!.current.totalValueRounded).toBe(r.cost!.totalValueRounded);
  });

  it('Mevcut Durum bağımsız yapı satırlarıyla girilirse Yasal Durum\'dan farklı, doğru hesaplanır', () => {
    const input = createDefaultHotelInput();
    input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 10, adr: 5000, occupancy: 0.6, operatingDays: 365 }];
    input.costParcelArea = 500;
    input.costLandUnitValue = 20000; // arsa değeri = 10.000.000, her iki durumda ortak
    input.costBuildings = [{ id: 'b1', type: 'Otel', area: 800, unitCost: 25000, depreciationPct: 100 }]; // 20.000.000
    input.computeMevcutDurum = true;
    input.mevcutCostBuildings = [
      { id: 'b1', type: 'Otel', area: 800, unitCost: 25000, depreciationPct: 100 },
      { id: 'b2', type: 'Ek Bölüm', area: 150, unitCost: 18000, depreciationPct: 100 }, // +2.700.000
    ];
    const r = analyzeHotel(input);
    expect(r.cost!.landValue).toBe(10_000_000); // arsa ortak
    expect(r.cost!.buildingsValue).toBe(20_000_000); // Yasal: yalnız ana bina
    expect(r.cost!.current.buildingsValue).toBe(22_700_000); // Mevcut: ana bina + ek bölüm
    expect(r.cost!.totalValueRounded).not.toBe(r.cost!.current.totalValueRounded);
  });

  it('Mevcut Durum için ayrı şerefiye girilirse kullanılır, girilmezse Yasal Durum\'unki kullanılır', () => {
    const input = createDefaultHotelInput();
    input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 10, adr: 5000, occupancy: 0.6, operatingDays: 365 }];
    input.costParcelArea = 500;
    input.costLandUnitValue = 20000;
    input.costBuildings = [{ id: 'b1', type: 'Otel', area: 800, unitCost: 25000, depreciationPct: 100 }];
    input.costGoodwill = 500_000;
    input.computeMevcutDurum = true;
    input.mevcutCostBuildings = [{ id: 'b1', type: 'Otel', area: 800, unitCost: 25000, depreciationPct: 100 }];

    let r = analyzeHotel(input);
    expect(r.cost!.current.goodwill).toBe(500_000); // ayrı girilmemiş, Yasal'ınki kullanılıyor

    input.mevcutCostGoodwill = 750_000;
    r = analyzeHotel(input);
    expect(r.cost!.current.goodwill).toBe(750_000);
    expect(r.cost!.goodwill).toBe(500_000); // Yasal Durum etkilenmiyor
  });
});

describe('Otel — Maliyet Yaklaşımı Yasal/Mevcut Durum (PDF/Excel gerçek çıktı doğrulaması)', () => {
  it('PDF ve Excel çıktısında Yasal Durum ve Mevcut Durum ayrı bölümler olarak görünüyor', async () => {
    const input = createDefaultHotelInput();
    input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 10, adr: 5000, occupancy: 0.6, operatingDays: 365 }];
    input.costParcelArea = 500;
    input.costLandUnitValue = 20000;
    input.costBuildings = [{ id: 'b1', type: 'Otel', area: 800, unitCost: 25000, depreciationPct: 100 }];
    input.computeMevcutDurum = true;
    input.mevcutCostBuildings = [
      { id: 'b1', type: 'Otel', area: 800, unitCost: 25000, depreciationPct: 100 },
      { id: 'b2', type: 'Ek Bölüm', area: 150, unitCost: 18000, depreciationPct: 100 },
    ];
    const r = analyzeHotel(input);

    const { buildHotelPdf } = await import('./pdf');
    const { doc } = await buildHotelPdf(input, r);
    const pdfText = doc.output('datauristring');
    expect(pdfText.length).toBeGreaterThan(1000);

    const { buildHotelExcelWorkbook } = await import('./excel');
    const wb = await buildHotelExcelWorkbook(input, r);
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
