/**
 * Kalem 4 — Şerefiye/Düzeltme/Çevre Düzenlemesi tür seçicisi (Maliyet
 * Yaklaşımı modülüyle aynı desen) ve KML'den otomatik il/ilçe/ada/parsel
 * doldurma sözleşmesi.
 */
import { describe, it, expect } from 'vitest';
import { analyzeHotel, createDefaultHotelInput } from './engine';
import { parseKml } from '../geo/kml';

describe('Kalem 4 — Şerefiye tür seçici', () => {
  it('GERİYE DÖNÜK UYUMLULUK: costAdjustmentType hiç girilmemiş (eski taslak), costGoodwill > 0 ise yine uygulanır', () => {
    const input = createDefaultHotelInput();
    input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 10, adr: 5000, occupancy: 0.6, operatingDays: 365 }];
    input.costParcelArea = 500; input.costLandUnitValue = 20000;
    input.costGoodwill = 300000;
    // costAdjustmentType kasıtlı olarak hiç set edilmedi (undefined) — eski taslak senaryosu.
    const r = analyzeHotel(input);
    expect(r.cost!.goodwill).toBe(300000);
  });

  it('costAdjustmentType="none" AÇIKÇA seçilirse, costGoodwill > 0 olsa bile uygulanmaz', () => {
    const input = createDefaultHotelInput();
    input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 10, adr: 5000, occupancy: 0.6, operatingDays: 365 }];
    input.costParcelArea = 500; input.costLandUnitValue = 20000;
    input.costGoodwill = 300000;
    input.costAdjustmentType = 'none';
    const r = analyzeHotel(input);
    expect(r.cost!.goodwill).toBe(0);
  });

  it('costAdjustmentType="serefiye"/"duzeltme"/"peyzaj" seçilirse tutar uygulanır', () => {
    for (const t of ['serefiye', 'duzeltme', 'peyzaj'] as const) {
      const input = createDefaultHotelInput();
      input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 10, adr: 5000, occupancy: 0.6, operatingDays: 365 }];
      input.costParcelArea = 500; input.costLandUnitValue = 20000;
      input.costGoodwill = 150000;
      input.costAdjustmentType = t;
      const r = analyzeHotel(input);
      expect(r.cost!.goodwill).toBe(150000);
    }
  });
});

describe('Kalem 4 — KML sözleşmesi (HotelApp\'in dayandığı gerçek davranış)', () => {
  it('TKGM tarzı ExtendedData içeren bir KML\'den il/ilçe/mahalle/ada/parsel/alan gerçekten çıkarılıyor', () => {
    const kml = `<?xml version="1.0"?>
<kml><Document><Placemark>
  <name>123 ADA 45 PARSEL</name>
  <ExtendedData>
    <Data name="İl"><value>İstanbul</value></Data>
    <Data name="İlçe"><value>Pendik</value></Data>
    <Data name="Mahalle"><value>Kurtköy</value></Data>
    <Data name="Ada"><value>123</value></Data>
    <Data name="ParselNo"><value>45</value></Data>
    <Data name="Alan"><value>1.850,00</value></Data>
  </ExtendedData>
  <Polygon><outerBoundaryIs><LinearRing><coordinates>
    29.30,40.90,0 29.31,40.90,0 29.31,40.91,0 29.30,40.91,0 29.30,40.90,0
  </coordinates></LinearRing></outerBoundaryIs></Polygon>
</Placemark></Document></kml>`;
    const parsed = parseKml(kml);
    expect(parsed).not.toBeNull();
    expect(parsed!.il).toBe('İstanbul');
    expect(parsed!.ilce).toBe('Pendik');
    expect(parsed!.mahalle).toBe('Kurtköy');
    expect(parsed!.ada).toBe('123');
    expect(parsed!.parsel).toBe('45');
    expect(parsed!.deedArea).toBeCloseTo(1850, 1);
  });
});
