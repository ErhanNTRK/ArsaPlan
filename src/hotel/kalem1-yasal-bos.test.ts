/**
 * Kalem 1 — Otel Maliyet Yaklaşımı: Yasal Durum'a hiç veri girilmese bile
 * yalnız Mevcut Durum'a girilen veri sonucu görünür kılmalı.
 */
import { describe, it, expect } from 'vitest';
import { analyzeHotel, createDefaultHotelInput } from './engine';

describe('Kalem 1 — Otel: Yasal boşken de Mevcut Durum sonucu görünüyor', () => {
  it('Yasal Durum tamamen boş (arsa/yapı yok), yalnız Mevcut Durum\'a yapı girilmiş — cost artık null DEĞİL', () => {
    const input = createDefaultHotelInput();
    input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 10, adr: 5000, occupancy: 0.6, operatingDays: 365 }];
    // costParcelArea / costLandUnitValue / costBuildings hiç girilmedi (hepsi varsayılan/boş).
    input.computeMevcutDurum = true;
    input.mevcutCostBuildings = [{ id: 'b1', type: 'Otel', area: 500, unitCost: 20000, depreciationPct: 100 }];
    const r = analyzeHotel(input);
    expect(r.cost).not.toBeNull();
    expect(r.cost!.landValue).toBe(0); // Yasal gerçekten boş, 0 olması doğru
    expect(r.cost!.buildingsValue).toBe(0);
    expect(r.cost!.current.buildingsValue).toBe(500 * 20000); // Mevcut Durum doğru hesaplanmış
  });

  it('Hem Yasal hem Mevcut boşsa cost hâlâ null (eski davranış korunuyor)', () => {
    const input = createDefaultHotelInput();
    input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 10, adr: 5000, occupancy: 0.6, operatingDays: 365 }];
    const r = analyzeHotel(input);
    expect(r.cost).toBeNull();
  });
});
