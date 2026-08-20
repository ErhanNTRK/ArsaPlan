/**
 * Kalem 2 — Bağımsız Maliyet Yaklaşımı: Mevcut Durum'un düzeltme/şerefiye
 * tutarı, Yasal Durum'un tür seçicisine (adjustmentType) bağımlı olmamalı.
 */
import { describe, it, expect } from 'vitest';
import { analyzeCostApproach, createDefaultCostInput } from './engine';

describe('Kalem 2 — Mevcut Durum düzeltme tutarı Yasal\'dan bağımsız', () => {
  it('Yasal Durum\'da adjustmentType "none" (hiç şerefiye seçilmemiş) olsa bile, Mevcut Durum\'a girilen tutar uygulanır', () => {
    const input = createDefaultCostInput();
    input.netParcelArea = 500; input.landUnitValue = 10000;
    input.adjustmentType = 'none'; // Yasal Durum'da tür seçilmedi
    input.adjustmentAmount = 0;
    input.computeMevcutDurum = true;
    input.mevcutBuildings = [{ id: 'b1', type: 'Depo', buildingClassCode: null, area: 100, unitCostOverride: 5000, depreciationPct: 100 }];
    input.mevcutAdjustmentAmount = 250000; // Mevcut Durum'a özel tutar girildi

    const r = analyzeCostApproach(input);
    expect(r.adjustmentValue).toBe(0); // Yasal Durum hâlâ 0 — doğru, tür seçilmedi
    expect(r.current.adjustmentValue).toBe(250000); // Mevcut Durum artık uygulanıyor — DÜZELTME
  });

  it('Mevcut Durum tutarı boş bırakılırsa (null), Yasal Durum\'un tür+tutarına geri döner (eski davranış korunuyor)', () => {
    const input = createDefaultCostInput();
    input.netParcelArea = 500; input.landUnitValue = 10000;
    input.adjustmentType = 'serefiye';
    input.adjustmentAmount = 100000;
    input.computeMevcutDurum = true;
    input.mevcutBuildings = [{ id: 'b1', type: 'Depo', buildingClassCode: null, area: 100, unitCostOverride: 5000, depreciationPct: 100 }];
    // mevcutAdjustmentAmount hiç girilmedi (null)

    const r = analyzeCostApproach(input);
    expect(r.current.adjustmentValue).toBe(100000); // Yasal Durum'un tutarına düşüyor
  });

  it('Mevcut Durum tutarı 0 olarak AÇIKÇA girilirse (null değil), 0 olarak uygulanır — Yasal\'a geri dönmez', () => {
    const input = createDefaultCostInput();
    input.netParcelArea = 500; input.landUnitValue = 10000;
    input.adjustmentType = 'serefiye';
    input.adjustmentAmount = 100000;
    input.computeMevcutDurum = true;
    input.mevcutBuildings = [{ id: 'b1', type: 'Depo', buildingClassCode: null, area: 100, unitCostOverride: 5000, depreciationPct: 100 }];
    input.mevcutAdjustmentAmount = 0; // açıkça sıfır girildi

    const r = analyzeCostApproach(input);
    expect(r.current.adjustmentValue).toBe(0);
  });
});
