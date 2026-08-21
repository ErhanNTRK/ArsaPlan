/**
 * Kalem 1 (bugünkü tur) — Otel Maliyet Yaklaşımı'nda Mevcut Durum'un
 * Şerefiye alanı da Yasal Durum'daki gibi tür seçici yapısına geçirildi,
 * ve Yasal Durum'un türünden BAĞIMSIZ çalışıyor (bağımsız Maliyet
 * Yaklaşımı modülündeki Kalem 2 düzeltmesiyle aynı mantık).
 */
import { describe, it, expect } from 'vitest';
import { analyzeHotel, createDefaultHotelInput } from './engine';

function baseInput() {
  const input = createDefaultHotelInput();
  input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 10, adr: 5000, occupancy: 0.6, operatingDays: 365 }];
  input.costParcelArea = 500; input.costLandUnitValue = 20000;
  input.costBuildings = [{ id: 'b1', type: 'Otel', area: 800, unitCost: 25000, depreciationPct: 100 }];
  input.computeMevcutDurum = true;
  input.mevcutCostBuildings = [{ id: 'b1', type: 'Otel', area: 800, unitCost: 25000, depreciationPct: 100 }];
  return input;
}

describe('Bugünkü Kalem 1 — Otel Mevcut Durum Şerefiye tür seçici', () => {
  it('GERİYE DÖNÜK UYUMLULUK: mevcutCostAdjustmentType hiç girilmemiş, mevcutCostGoodwill > 0 ise yine uygulanır (Yasal\'ın türünden bağımsız)', () => {
    const input = baseInput();
    input.costAdjustmentType = 'none'; // Yasal Durum'da tür Yok
    input.mevcutCostGoodwill = 400000; // Mevcut Durum'a özel tutar
    // mevcutCostAdjustmentType kasıtlı olarak hiç set edilmedi
    const r = analyzeHotel(input);
    expect(r.cost!.goodwill).toBe(0); // Yasal Durum: tür Yok, uygulanmıyor
    expect(r.cost!.current.goodwill).toBe(400000); // Mevcut Durum: kendi tutarı uygulanıyor
  });

  it('mevcutCostAdjustmentType="none" AÇIKÇA seçilirse, mevcutCostGoodwill > 0 olsa bile uygulanmaz', () => {
    const input = baseInput();
    input.costAdjustmentType = 'serefiye';
    input.costGoodwill = 300000;
    input.mevcutCostGoodwill = 400000;
    input.mevcutCostAdjustmentType = 'none';
    const r = analyzeHotel(input);
    expect(r.cost!.goodwill).toBe(300000); // Yasal Durum etkilenmiyor
    expect(r.cost!.current.goodwill).toBe(0); // Mevcut Durum'da açıkça "Yok" seçilmiş
  });

  it('mevcutCostAdjustmentType bir tür olarak seçilir ama tutar girilmezse, Yasal Durum\'un tutarına düşer', () => {
    const input = baseInput();
    input.costAdjustmentType = 'serefiye';
    input.costGoodwill = 300000;
    input.mevcutCostAdjustmentType = 'peyzaj'; // tür seçilmiş
    input.mevcutCostGoodwill = null; // ama tutar girilmemiş
    const r = analyzeHotel(input);
    expect(r.cost!.current.goodwill).toBe(300000); // Yasal'ın tutarına düştü
  });

  it('Hem tür hem tutar Mevcut Durum\'a özel girilirse ikisi de kullanılır, Yasal\'dan tamamen bağımsız', () => {
    const input = baseInput();
    input.costAdjustmentType = 'none'; // Yasal'da hiç şerefiye yok
    input.mevcutCostAdjustmentType = 'duzeltme';
    input.mevcutCostGoodwill = 550000;
    const r = analyzeHotel(input);
    expect(r.cost!.goodwill).toBe(0);
    expect(r.cost!.current.goodwill).toBe(550000);
  });
});
