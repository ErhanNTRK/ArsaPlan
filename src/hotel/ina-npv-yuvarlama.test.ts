/**
 * Otel — İNA (npv) artık diğer iki yöntemle (Direkt Kap, Maliyet Yaklaşımı)
 * tutarlı olsun diye 5.000'e yuvarlanıyor. Önceden yalnız bu ikisi
 * yuvarlanıyordu, İNA ham/kesirli bir sayı olarak kalıyordu — kullanıcının
 * bildirdiği "kusuratlı rakam" (4.397.200.00 gibi) sorunu buydu.
 */
import { describe, it, expect } from 'vitest';
import { analyzeHotel, createDefaultHotelInput } from './engine';

describe('İNA npv, Direkt Kap ve Maliyet Yaklaşımı ile tutarlı şekilde 5.000\'e yuvarlanıyor', () => {
  it('r.ina.npv gerçekten 5.000\'in katı çıkıyor', () => {
    const input = createDefaultHotelInput();
    input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 37, adr: 4830, occupancy: 0.63, operatingDays: 365 }];
    input.projection.capRate = 0.09;
    input.projection.years = 10;
    input.projection.incomeGrowthRate = 0.15;
    input.projection.expenseGrowthRate = 0.12;
    input.projection.discountRate = 0.25;
    const r = analyzeHotel(input);
    expect(r.ina).not.toBeNull();
    expect(r.ina!.npv % 5000).toBe(0);
  });

  it('Üçü de (Direkt Kap, İNA, Maliyet Yaklaşımı) aynı anda 5.000\'in katı — tutarlı gösterim', () => {
    const input = createDefaultHotelInput();
    input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 20, adr: 5000, occupancy: 0.65, operatingDays: 365 }];
    input.projection.capRate = 0.09;
    input.projection.years = 10;
    input.projection.incomeGrowthRate = 0.15;
    input.projection.expenseGrowthRate = 0.12;
    input.projection.discountRate = 0.25;
    input.costParcelArea = 500; input.costLandUnitValue = 20000;
    input.costBuildings = [{ id: 'b1', type: 'Otel', area: 800, unitCost: 25000, depreciationPct: 100 }];
    const r = analyzeHotel(input);
    expect(r.capitalizedValue % 5000).toBe(0);
    expect(r.ina!.npv % 5000).toBe(0);
    expect(r.cost!.totalValueRounded % 5000).toBe(0);
  });
});
