import { describe, it, expect } from 'vitest';
import { analyzeCostApproach, createDefaultCostInput } from './engine';

describe('Maliyet Yaklaşımı motoru', () => {
  it('kullanıcının verdiği örnek senaryo: Lojman 1.000 m² × 25.000 TL/m² × %50 amortisman', () => {
    const input = createDefaultCostInput();
    input.category = 'Otel';
    input.netParcelArea = 5000;
    input.landUnitValue = 20000;
    input.buildings = [
      { id: 'b1', type: 'Lojman', buildingClassCode: '3B', area: 1000, unitCostOverride: 25000, depreciationPct: 50 },
    ];
    const r = analyzeCostApproach(input);
    expect(r.landValue).toBe(5000 * 20000);
    expect(r.buildingRows[0].effectiveUnitCost).toBe(25000);
    expect(r.buildingRows[0].buildingValue).toBe(1000 * 25000 * 0.5);
    expect(r.buildingsValue).toBe(12_500_000);
  });

  it('Yapı Sınıfı seçilince Tebliğ birim maliyeti otomatik gelir (override yoksa)', () => {
    const input = createDefaultCostInput();
    input.netParcelArea = 100;
    input.landUnitValue = 1000;
    input.buildings = [
      { id: 'b1', type: 'Test', buildingClassCode: 'III-A', area: 100, unitCostOverride: null, depreciationPct: 100 },
    ];
    const r = analyzeCostApproach(input);
    expect(r.buildingRows[0].overridden).toBe(false);
    expect(r.buildingRows[0].effectiveUnitCost).toBeGreaterThan(0);
  });

  it('toplam her zaman 5.000\'in katına yuvarlanır', () => {
    const input = createDefaultCostInput();
    input.netParcelArea = 333;
    input.landUnitValue = 777;
    const r = analyzeCostApproach(input);
    expect(r.totalValueRounded % 5000).toBe(0);
  });

  it('düzeltme tipi "none" ise adjustmentValue sıfırdır, tutar girilse bile', () => {
    const input = createDefaultCostInput();
    input.netParcelArea = 100; input.landUnitValue = 1000;
    input.adjustmentType = 'none'; input.adjustmentAmount = 999999;
    const r = analyzeCostApproach(input);
    expect(r.adjustmentValue).toBe(0);
  });

  it('düzeltme tipi seçilince tutar hesaba eklenir', () => {
    const input = createDefaultCostInput();
    input.netParcelArea = 100; input.landUnitValue = 1000;
    input.adjustmentType = 'serefiye'; input.adjustmentAmount = 500000;
    const r = analyzeCostApproach(input);
    expect(r.adjustmentValue).toBe(500000);
    expect(r.totalValue).toBe(100 * 1000 + 500000);
  });

  it('Mevcut Durum kapalıysa "current", Yasal Durum ile birebir aynıdır', () => {
    const input = createDefaultCostInput();
    input.netParcelArea = 100; input.landUnitValue = 1000;
    input.buildings = [{ id: 'b1', type: 'Depo', buildingClassCode: null, area: 100, unitCostOverride: 10000, depreciationPct: 90 }];
    const r = analyzeCostApproach(input);
    expect(r.current.totalValueRounded).toBe(r.totalValueRounded);
    expect(r.current.buildingsValue).toBe(r.buildingsValue);
    expect(r.current.buildingRows).toEqual(r.buildingRows);
  });

  it('Mevcut Durum açık ama satır girilmemişse yine Yasal Durum ile aynıdır', () => {
    const input = createDefaultCostInput();
    input.netParcelArea = 100; input.landUnitValue = 1000;
    input.buildings = [{ id: 'b1', type: 'Depo', buildingClassCode: null, area: 100, unitCostOverride: 10000, depreciationPct: 90 }];
    input.computeMevcutDurum = true; // ama mevcutBuildings boş
    const r = analyzeCostApproach(input);
    expect(r.current.totalValueRounded).toBe(r.totalValueRounded);
  });

  it('kullanıcının örneği: alan 100 m² birim maliyet 10.000, amortisman 90 → 900.000 TL (hem Yasal hem Mevcut)', () => {
    const input = createDefaultCostInput();
    input.netParcelArea = 0; input.landUnitValue = 0; // yalnız yapı değerine bakıyoruz
    input.buildings = [{ id: 'b1', type: 'Ambar', buildingClassCode: null, area: 100, unitCostOverride: 10000, depreciationPct: 90 }];
    input.computeMevcutDurum = true;
    input.mevcutBuildings = [{ id: 'b1', type: 'Ambar', buildingClassCode: null, area: 100, unitCostOverride: 10000, depreciationPct: 90 }];
    const r = analyzeCostApproach(input);
    expect(r.buildingsValue).toBe(900000);
    expect(r.current.buildingsValue).toBe(900000);
  });

  it('Mevcut Durum satırları Yasal Durum\'dan bağımsız değiştirilebilir (kaçak/ilave yapı senaryosu)', () => {
    const input = createDefaultCostInput();
    input.netParcelArea = 100; input.landUnitValue = 1000; // arsa değeri her iki durumda da aynı
    input.buildings = [{ id: 'b1', type: 'Ana Bina', buildingClassCode: null, area: 200, unitCostOverride: 5000, depreciationPct: 100 }];
    input.computeMevcutDurum = true;
    input.mevcutBuildings = [
      { id: 'b1', type: 'Ana Bina', buildingClassCode: null, area: 200, unitCostOverride: 5000, depreciationPct: 100 },
      { id: 'b2', type: 'Kaçak Ek Yapı', buildingClassCode: null, area: 50, unitCostOverride: 4000, depreciationPct: 100 },
    ];
    const r = analyzeCostApproach(input);
    expect(r.landValue).toBe(r.current.buildingRows.length && 100 * 1000); // arsa ortak
    expect(r.buildingsValue).toBe(200 * 5000); // Yasal: yalnız ana bina
    expect(r.current.buildingsValue).toBe(200 * 5000 + 50 * 4000); // Mevcut: ana bina + kaçak ek yapı
    expect(r.current.buildingRows.map((b) => b.type)).toEqual(['Ana Bina', 'Kaçak Ek Yapı']);
  });

  it('Mevcut Durum için ayrı düzeltme tutarı girilirse o kullanılır, girilmezse Yasal Durum\'unki kullanılır', () => {
    const input = createDefaultCostInput();
    input.netParcelArea = 100; input.landUnitValue = 1000;
    input.adjustmentType = 'serefiye'; input.adjustmentAmount = 100000;
    input.computeMevcutDurum = true;
    input.mevcutBuildings = [{ id: 'b1', type: 'Depo', buildingClassCode: null, area: 10, unitCostOverride: 1000, depreciationPct: 100 }];
    // Mevcut için ayrı tutar girilmemiş:
    let r = analyzeCostApproach(input);
    expect(r.current.adjustmentValue).toBe(100000);
    // Şimdi ayrı tutar girilsin:
    input.mevcutAdjustmentAmount = 250000;
    r = analyzeCostApproach(input);
    expect(r.current.adjustmentValue).toBe(250000);
    expect(r.adjustmentValue).toBe(100000); // Yasal Durum etkilenmez
  });
});
