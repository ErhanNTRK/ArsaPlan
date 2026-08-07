import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import { attachDataSheet, readDataSheet } from '../export/excelImport';
import { analyzeCostApproach, createDefaultCostInput, type CostApproachInput } from './engine';

/** File benzeri bir nesne üretir (readDataSheet File.arrayBuffer() bekliyor). */
function toFile(buf: ArrayBuffer): File {
  return new File([buf], 'test.xlsx');
}

describe('Maliyet Yaklaşımı — Excel round-trip (içe/dışa aktarma)', () => {
  it('Mevcut Durum alanları dahil, tam veri kaybı olmadan geri yüklenir', async () => {
    const input = createDefaultCostInput();
    input.category = 'Depo';
    input.netParcelArea = 400; input.landUnitValue = 3000;
    input.buildings = [{ id: 'b1', type: 'Ana Depo', buildingClassCode: null, area: 200, unitCostOverride: 9000, depreciationPct: 90 }];
    input.computeMevcutDurum = true;
    input.mevcutBuildings = [
      { id: 'b1', type: 'Ana Depo', buildingClassCode: null, area: 200, unitCostOverride: 9000, depreciationPct: 90 },
      { id: 'b2', type: 'Ek Bölüm', buildingClassCode: null, area: 40, unitCostOverride: 5000, depreciationPct: 100 },
    ];
    input.mevcutAdjustmentAmount = 77000;

    const wb = new ExcelJS.Workbook();
    attachDataSheet(wb, input);
    const buf = await wb.xlsx.writeBuffer();

    const restored = await readDataSheet<CostApproachInput>(toFile(buf as ArrayBuffer));
    expect(restored).not.toBeNull();
    const merged = { ...createDefaultCostInput(), ...restored };
    expect(merged.computeMevcutDurum).toBe(true);
    expect(merged.mevcutBuildings).toHaveLength(2);
    expect(merged.mevcutBuildings[1].type).toBe('Ek Bölüm');
    expect(merged.mevcutAdjustmentAmount).toBe(77000);

    // Geri yüklenen veriyle motor hatasız çalışmalı ve aynı sonucu üretmeli.
    const r = analyzeCostApproach(merged);
    expect(r.current.buildingsValue).toBe(200 * 9000 * 0.9 + 40 * 5000);
  });

  it('Bu özellikten ÖNCE dışa aktarılmış eski bir Excel (Mevcut Durum alanları yok) çökmeden yüklenir', async () => {
    // Eski format simülasyonu: computeMevcutDurum/mevcutBuildings/mevcutAdjustmentAmount hiç yok.
    const eskiFormat = {
      category: 'Ev/Konut',
      general: { name: '', il: 'Ankara', ilce: 'Çankaya', mahalle: '', ada: '12', parsel: '5' },
      parcelArea: 300, netParcelArea: 300, landUnitValue: 5000, fromKml: false,
      buildings: [{ id: 'x1', type: 'Ev', buildingClassCode: null, area: 150, unitCostOverride: 12000, depreciationPct: 100 }],
      adjustmentType: 'none', adjustmentAmount: 0,
      // computeMevcutDurum / mevcutBuildings / mevcutAdjustmentAmount YOK — eski sürüm çıktısı.
    };
    const wb = new ExcelJS.Workbook();
    attachDataSheet(wb, eskiFormat);
    const buf = await wb.xlsx.writeBuffer();

    const restored = await readDataSheet<any>(toFile(buf as ArrayBuffer));
    expect(restored).not.toBeNull();
    expect(restored.computeMevcutDurum).toBeUndefined(); // gerçekten eski format, alan yok

    // UI'daki içe aktarma düzeltmesiyle birebir aynı birleştirme:
    const merged = { ...createDefaultCostInput(), ...restored };
    expect(merged.computeMevcutDurum).toBe(false);
    expect(merged.mevcutBuildings).toEqual([]);

    // Birleştirme olmadan bu satır TypeError ile çökerdi (mevcutBuildings undefined).
    expect(() => analyzeCostApproach(merged)).not.toThrow();
    const r = analyzeCostApproach(merged);
    expect(r.current.totalValueRounded).toBe(r.totalValueRounded);
  });
});
