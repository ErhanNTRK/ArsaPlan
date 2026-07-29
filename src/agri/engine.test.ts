import { describe, it, expect } from 'vitest';
import { computeAgri, suggestTreeCount } from './engine';

describe('ağaç aralığı önerisi (Salih goldeni: 10.000 m²)', () => {
  it('yarım-aralık kuralı: 4×4→625 · 4×5→500 · 5×5→400', () => {
    expect(suggestTreeCount(10000, 4, 4)).toBe(625);
    expect(suggestTreeCount(10000, 4, 5)).toBe(500);
    expect(suggestTreeCount(10000, 5, 5)).toBe(400);
  });
  it('tam-mesafe (muhafazakâr): 4×4→576 · 4×5→456 · 5×5→361', () => {
    expect(suggestTreeCount(10000, 4, 4, true)).toBe(576);
    expect(suggestTreeCount(10000, 4, 5, true)).toBe(456);
    expect(suggestTreeCount(10000, 5, 5, true)).toBe(361);
  });
  it('12.500 m² zeytinlik örneği: 4×5→625 · 4×4→781', () => {
    expect(suggestTreeCount(12500, 4, 5)).toBe(625);
    expect(suggestTreeCount(12500, 4, 4)).toBe(781);
  });
});

describe('computeAgri — karma parsel ve amorti', () => {
  it('Excel goldeni: 10.000 m² · %85 · buğday 350kg×11TL · gider %35 · 3 yıl', () => {
    const r = computeAgri({
      parcelArea: 10000, arablePct: 85, amortYears: 3,
      rows: [{ id: 'a', kind: 'ekili', name: 'Buğday', areaM2: 8500, treeCount: 0, yieldPerUnit: 350, price: 11, expensePct: 35 }],
    });
    expect(r.arableArea).toBe(8500);
    expect(r.totalGross).toBeCloseTo(32725, 2);
    expect(r.totalNet).toBeCloseTo(21271.25, 2);
    expect(r.value).toBeCloseTo(63813.75, 2);
    expect(r.areaOk).toBe(true);
  });
  it('karma: 9.000 ekilebilirin 5.000 buğday + 400 zeytin ağacı; alan bütçesi izlenir', () => {
    const r = computeAgri({
      parcelArea: 10000, arablePct: 90, amortYears: 6,
      rows: [
        { id: 'b', kind: 'ekili', name: 'Buğday', areaM2: 5000, treeCount: 0, yieldPerUnit: 350, price: 13.5, expensePct: 35 },
        { id: 'z', kind: 'dikili', name: 'Zeytin', areaM2: 0, treeCount: 400, yieldPerUnit: 18, price: 45, expensePct: 40 },
      ],
    });
    expect(r.allocatedArea).toBe(5000);
    expect(r.areaOk).toBe(true);
    const bugday = 5 * 350 * 13.5;           // 5 dönüm
    const zeytin = 400 * 18 * 45;
    expect(r.totalGross).toBeCloseTo(bugday + zeytin, 2);
    expect(r.rows[1].net).toBeCloseTo(zeytin * 0.6, 2);
    expect(r.value).toBeCloseTo(r.totalNet * 6, 2);
  });
  it('alan aşımı uyarı verir ama engellemez', () => {
    const r = computeAgri({
      parcelArea: 10000, arablePct: 80, amortYears: 3,
      rows: [{ id: 'x', kind: 'ekili', name: 'Mısır', areaM2: 9000, treeCount: 0, yieldPerUnit: 800, price: 10, expensePct: 40 }],
    });
    expect(r.areaOk).toBe(false);
    expect(r.warnings.length).toBe(1);
    expect(r.totalNet).toBeGreaterThan(0);
  });
});
