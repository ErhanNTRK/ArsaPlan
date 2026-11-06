import { describe, it, expect } from 'vitest';
import { analyze } from './index';
import { buildSensitivity } from './sensitivity';
import makeMinimalProjectInput from '../tests/fixtures/minimalProjectInput';

describe('Duyarlılık analizi', () => {
  it('orta hücre mevcut sonuçla aynıdır ve girdi değişmez', () => {
    const input = makeMinimalProjectInput();
    const before = JSON.stringify(input);
    const g = buildSensitivity(input);
    expect(g.baseValue).toBe(analyze(input).financial.residualLandValueRounded);
    expect(JSON.stringify(input)).toBe(before);
  });
  it('fiyat arttıkça ve kâr azaldıkça arsa değeri artar', () => {
    const g = buildSensitivity(makeMinimalProjectInput());
    expect(g.values[4][2]).toBeGreaterThan(g.values[2][2]);
    expect(g.values[2][0]).toBeGreaterThan(g.values[2][4]);
  });
});

describe('Satış giderleri (opsiyonel)', () => {
  it('oran 0 iken sonuç değişmez; oran girilince arsa değeri hasılat × oran kadar düşer', () => {
    const a = makeMinimalProjectInput();
    const r0 = analyze(a).financial;
    const b = { ...a, residual: { ...a.residual, salesCostRate: 0.03 } };
    const r1 = analyze(b).financial;
    expect(r0.salesCost).toBe(0);
    expect(r1.salesCost).toBeCloseTo(r1.revenue * 0.03, 6);
    expect(r0.residualLandValue - r1.residualLandValue).toBeCloseTo(r1.revenue * 0.03, 4);
  });
});

describe('Duyarlılık / senaryo — indirgeme tutarlılığı', () => {
  it('indirgeme açıkken orta hücre İNDİRGEMELİ arsa değerine eşittir', () => {
    const input = makeMinimalProjectInput();
    input.residual = { ...input.residual, projectMonths: 24, timeDiscountRate: 0.10 };
    const f = analyze(input).financial;
    const g = buildSensitivity(input);
    expect(g.discounted).toBe(true);
    expect(g.baseValue).toBe(f.discountedLandValueRounded);
    expect(g.baseValue).not.toBe(f.residualLandValueRounded);
  });
  it('indirgeme kapalıyken klasik değerle aynıdır', () => {
    const input = makeMinimalProjectInput();
    const g = buildSensitivity(input);
    expect(g.discounted).toBe(false);
    expect(g.baseValue).toBe(analyze(input).financial.residualLandValueRounded);
  });
});
