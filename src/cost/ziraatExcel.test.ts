import { describe, it, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
import { analyzeCostApproach, createDefaultCostInput } from './engine';
import { buildZiraatWorkbook } from './ziraatExcel';

describe('Ziraat Tablosu İndir — şablon export', () => {
  it('diğer 3 sayfaya dokunmaz, yalnız NİTELİKLİ GAYRİMENKUL dolar', async () => {
    const input = createDefaultCostInput();
    input.netParcelArea = 725.32; input.landUnitValue = 1300;
    input.buildings = [{ id: 'b1', type: 'YAPI 1', buildingClassCode: null, area: 315, unitCostOverride: 19800, depreciationPct: 85 }];
    input.adjustmentType = 'duzeltme'; input.adjustmentAmount = 5634;
    const r = analyzeCostApproach(input);
    const wb = await buildZiraatWorkbook(input, r);
    expect(wb.worksheets.map((w) => w.name)).toEqual(['TARLA', 'ARSA', 'KONUT-İŞYERLERİ', 'NİTELİKLİ GAYRİMENKUL']);
    const tarla = wb.getWorksheet('TARLA')!;
    expect(tarla.getCell('G3').value).toBe(3250000); // orijinal örnek veri hiç değişmemiş
  });

  it('bankanın kendi örnek senaryosunu (725,32 m² arsa + 1 yapı) birebir reprodükler', async () => {
    const input = createDefaultCostInput();
    input.netParcelArea = 725.32; input.landUnitValue = 1300;
    input.buildings = [{ id: 'b1', type: 'YAPI 1', buildingClassCode: null, area: 315, unitCostOverride: 19800, depreciationPct: 85 }];
    input.adjustmentType = 'duzeltme'; input.adjustmentAmount = 5634;
    const r = analyzeCostApproach(input);
    const wb = await buildZiraatWorkbook(input, r);
    const ws = wb.getWorksheet('NİTELİKLİ GAYRİMENKUL')!;
    expect(ws.getCell('E3').value).toBe(725.32);
    expect(ws.getCell('F3').value).toBe(1300);
    expect(ws.getCell('C4').value).toBe('YAPI 1');
    expect(ws.getCell('E4').value).toBe(315);
    expect(ws.getCell('F4').value).toBe(19800);
    expect(ws.getCell('G4').value).toBe(0.85);
    expect(ws.getCell('I3').value).toBe('SATILABİLİR');
    expect(ws.getCell('B4').value).toBeNull();
    expect(ws.getCell('B3').value).toBeNull(); // şablonun örnek "102/6" metni kalmamalı
    expect(ws.getCell('D4').value).toBeNull(); // şablonun örnek ruhsat metni kalmamalı
    writeFileSync('/tmp/ziraat-tek-yapi.xlsx', Buffer.from(await wb.xlsx.writeBuffer()));
  });

  it('birden çok yapı satırı eklenince şablon satır ekler, formüller ve Mevcut Durum bloğu bozulmadan kayar', async () => {
    const input = createDefaultCostInput();
    input.netParcelArea = 500; input.landUnitValue = 2000;
    input.buildings = [
      { id: 'b1', type: 'Ana Bina', buildingClassCode: null, area: 200, unitCostOverride: 10000, depreciationPct: 90 },
      { id: 'b2', type: 'Müştemilat', buildingClassCode: null, area: 50, unitCostOverride: 4000, depreciationPct: 100 },
      { id: 'b3', type: 'Depo', buildingClassCode: null, area: 80, unitCostOverride: 3000, depreciationPct: 80 },
    ];
    input.adjustmentType = 'serefiye'; input.adjustmentAmount = 12345;
    const r = analyzeCostApproach(input);
    const wb = await buildZiraatWorkbook(input, r);
    const ws = wb.getWorksheet('NİTELİKLİ GAYRİMENKUL')!;
    // 3 yapı satırı: 4,5,6 — düzeltme satırı 7, toplam satırı 8
    expect(ws.getCell('C4').value).toBe('Ana Bina');
    expect(ws.getCell('D4').value).toBeNull(); // şablonun örnek ruhsat metni kalmamalı
    expect(ws.getCell('C5').value).toBe('Müştemilat');
    expect(ws.getCell('C6').value).toBe('Depo');
    expect((ws.getCell('H8').value as any).formula).toBe('SUM(H3:H7)');
    expect((ws.getCell('E8').value as any).formula).toBe('SUM(E4:E6)');
    // Mevcut Durum bloğu 2 satır aşağı kaymış olmalı: başlık orijinal 8→10, ARSA orijinal 10→12, ilk yapı 11→13.
    expect(ws.getCell('A10').value).toBe('NİTELİKLİ GAYRİMENKUL MEVCUT DURUM DEĞERİ/KANAAT TABLOSU');
    expect(ws.getCell('A12').value).toBe(1); // ARSA satırı, şablonun kendi sabit Sıra No'su
    expect(ws.getCell('C13').value).toBe('Ana Bina');
    writeFileSync('/tmp/ziraat-cok-yapi.xlsx', Buffer.from(await wb.xlsx.writeBuffer()));
  });

  it('Mevcut Durum açık ve farklı satırlarla girildiğinde iki blok bağımsız değer taşır', async () => {
    const input = createDefaultCostInput();
    input.netParcelArea = 300; input.landUnitValue = 1500;
    input.buildings = [{ id: 'b1', type: 'Eski Bina', buildingClassCode: null, area: 100, unitCostOverride: 8000, depreciationPct: 70 }];
    input.computeMevcutDurum = true;
    input.mevcutBuildings = [
      { id: 'b1', type: 'Eski Bina', buildingClassCode: null, area: 100, unitCostOverride: 8000, depreciationPct: 70 },
      { id: 'b2', type: 'Kaçak Ek Yapı', buildingClassCode: null, area: 30, unitCostOverride: 5000, depreciationPct: 100 },
    ];
    const r = analyzeCostApproach(input);
    const wb = await buildZiraatWorkbook(input, r);
    const ws = wb.getWorksheet('NİTELİKLİ GAYRİMENKUL')!;
    // Yasal: tek yapı satırı (4), toplam satırı 6 — orijinal şablon boyutunda kalır.
    expect(ws.getCell('C4').value).toBe('Eski Bina');
    // Mevcut Durum: orijinal başlangıç satırı 8, ARSA 10; burada Yasal hiç büyümediği için kaymamış olmalı.
    expect(ws.getCell('A8').value).toBe('NİTELİKLİ GAYRİMENKUL MEVCUT DURUM DEĞERİ/KANAAT TABLOSU');
    expect(ws.getCell('C11').value).toBe('Eski Bina');
    expect(ws.getCell('C12').value).toBe('Kaçak Ek Yapı');
    writeFileSync('/tmp/ziraat-mevcut-farkli.xlsx', Buffer.from(await wb.xlsx.writeBuffer()));
  });
});
