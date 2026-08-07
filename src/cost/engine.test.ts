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
});
