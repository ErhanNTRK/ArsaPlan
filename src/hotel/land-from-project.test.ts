/**
 * Projeden Arsa Değeri (artık değer): Arsa = Tamamlanmış değer − maliyetler − girişimci kârı;
 * süre + oran girilirse arsa modülündeki indirgeme formülü uygulanır.
 */
import { describe, it, expect } from 'vitest';
import { analyzeHotel, createDefaultHotelInput } from './engine';
import { defaultLandProject } from './landFromProject';
import { buildHotelPdf } from './pdf';
import { buildHotelExcelWorkbook } from './excel';

function makeInput() {
  const input = createDefaultHotelInput();
  input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 27, adr: 6000, occupancy: 0.7, operatingDays: 365 }];
  input.opex.expenseRate = 0.55;
  input.projection.capRate = 0.10;
  input.projection.discountRate = 0.20;
  input.costParcelArea = 500;
  const lp = defaultLandProject();
  lp.buildings = [{ id: 'b1', type: 'Otel', area: 1000, unitCost: 20_000, ratePct: 100 }]; // 20.000.000
  lp.costs[0].amount = 5_000_000;
  lp.profitRate = 0.15;
  input.landProject = lp;
  return input;
}

describe('Projeden arsa değeri (artık değer)', () => {
  it('kapalıysa hesaplanmaz', () => {
    const i = makeInput();
    i.landProject!.enabled = false;
    expect(analyzeHotel(i).landFromProject).toBeNull();
    expect(analyzeHotel(createDefaultHotelInput()).landFromProject).toBeNull();
  });

  it('indirgemesiz: tamamlanmış değer − maliyet − kâr', () => {
    const i = makeInput();
    i.landProject!.basis = 'direkt';
    const r = analyzeHotel(i);
    const l = r.landFromProject!;
    expect(l.completedValue).toBe(r.capitalizedValue);
    expect(l.buildingCost).toBe(20_000_000);
    expect(l.investment).toBe(25_000_000);
    expect(l.profit).toBeCloseTo(3_750_000, 2);
    expect(l.landBeforeDiscount).toBeCloseTo(r.capitalizedValue - 25_000_000 - 3_750_000, 2);
    expect(l.discountOn).toBe(false);
    expect(l.landValue).toBeCloseTo(l.landBeforeDiscount, 6);
    expect(l.landValueRounded % 5000).toBe(0);
    expect(l.unitValue).toBeCloseTo(l.landValueRounded / 500, 6);
  });

  it('şerefiye düşülür; yapı maliyeti alan × birim maliyet × oran', () => {
    const i = makeInput();
    i.landProject!.basis = 'direkt';
    i.landProject!.buildings[0].ratePct = 50; // güçlendirme: yapım maliyetinin %50'si
    i.landProject!.goodwill = 2_000_000;
    const l = analyzeHotel(i).landFromProject!;
    expect(l.buildingCost).toBe(10_000_000);
    expect(l.investment).toBe(15_000_000);
    expect(l.profit).toBeCloseTo(2_250_000, 2); // kâr yapı + diğer üzerinden, şerefiye hariç
    expect(l.landBeforeDiscount).toBeCloseTo(l.completedValue - 15_000_000 - 2_000_000 - 2_250_000, 2);
  });

  it('indirgemede şerefiye ve kâr proje sonu değerinden düşülür', () => {
    const i = makeInput();
    i.landProject!.basis = 'direkt';
    i.landProject!.goodwill = 2_000_000;
    i.landProject!.months = 12;
    i.landProject!.discountRate = 0.1;
    const l = analyzeHotel(i).landFromProject!;
    expect(l.landValue).toBeCloseTo((l.completedValue - l.profit - 2_000_000) / 1.1 - l.investment / Math.sqrt(1.1), 4);
  });

  it('esas yöntem İNA seçilince İNA NBD kullanılır', () => {
    const i = makeInput();
    i.landProject!.basis = 'ina';
    const r = analyzeHotel(i);
    expect(r.ina).not.toBeNull();
    expect(r.landFromProject!.completedValue).toBe(r.ina!.npv);
  });

  it('süre ve oran girilince arsa modülü formülüyle indirgenir (indirgemesizden düşük)', () => {
    const i = makeInput();
    i.landProject!.basis = 'direkt';
    i.landProject!.months = 24;
    i.landProject!.discountRate = 0.10;
    const l = analyzeHotel(i).landFromProject!;
    const dEnd = Math.pow(1.1, -2), dMid = Math.pow(1.1, -1);
    expect(l.discountOn).toBe(true);
    expect(l.landValue).toBeCloseTo((l.completedValue - l.profit) * dEnd - l.investment * dMid, 4);
    expect(l.landValue).toBeLessThan(l.landBeforeDiscount);
  });

  it('maliyet ve kâr tamamlanmış değeri aşarsa uyarı verir', () => {
    const i = makeInput();
    i.landProject!.buildings[0].unitCost = 900_000_000;
    const r = analyzeHotel(i);
    expect(r.landFromProject!.negative).toBe(true);
    expect(r.warnings.some((w) => w.message.includes('Projeden arsa değeri'))).toBe(true);
  });

  it('takdir edilen arsa değeriyle karşılaştırma için Maliyet Yaklaşımı arsa değeri taşınır', () => {
    const i = makeInput();
    i.costLandUnitValue = 100_000;
    expect(analyzeHotel(i).landFromProject!.appraisedLandValue).toBe(50_000_000);
  });

  it('nihai yöntem "arsa" iken PDF ve Excel üretilir', async () => {
    const i = makeInput();
    i.finalMethod = 'arsa';
    i.landProject!.months = 18;
    i.landProject!.discountRate = 0.1;
    const r = analyzeHotel(i);
    const { doc } = await buildHotelPdf(i, r);
    expect(doc.getNumberOfPages()).toBeGreaterThan(0);
    const wb = await buildHotelExcelWorkbook(i, r);
    const ws = wb.getWorksheet('Otel Geliri')!;
    const texts: string[] = [];
    ws.eachRow((row) => row.eachCell((c) => texts.push(String(c.value ?? ''))));
    expect(texts.some((t) => t.includes('PROJEDEN ARSA DEĞERİ'))).toBe(true);
  }, 30000);
});
