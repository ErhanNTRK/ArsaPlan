import { describe, it, expect } from 'vitest';
import { analyze } from './index';
import { buildScenarios, DEFAULT_SCENARIOS } from './scenarios';
import makeMinimalProjectInput from '../tests/fixtures/minimalProjectInput';

describe('Senaryo analizi', () => {
  it('baz senaryo mevcut sonuçla aynıdır ve girdi değişmez', () => {
    const input = makeMinimalProjectInput();
    const before = JSON.stringify(input);
    const rows = buildScenarios(input);
    expect(rows).toHaveLength(3);
    expect(rows[1].landValue).toBe(analyze(input).financial.residualLandValueRounded);
    expect(JSON.stringify(input)).toBe(before);
  });
  it('kötümser < baz < iyimser', () => {
    const rows = buildScenarios(makeMinimalProjectInput());
    expect(rows[0].landValue).toBeLessThan(rows[1].landValue);
    expect(rows[2].landValue).toBeGreaterThan(rows[1].landValue);
  });
  it('kullanıcı varsayımları kullanılır', () => {
    const input = makeMinimalProjectInput();
    const custom = DEFAULT_SCENARIOS.map((s) => ({ ...s, priceDelta: s.priceDelta * 2 }));
    const a = buildScenarios(input)[2].landValue;
    const b = buildScenarios(input, custom)[2].landValue;
    expect(b).toBeGreaterThan(a);
  });
});

describe('Senaryo — indirgeme tutarlılığı', () => {
  it('indirgeme açıkken baz senaryo indirgemeli değeri verir', () => {
    const input = makeMinimalProjectInput();
    input.residual = { ...input.residual, projectMonths: 24, timeDiscountRate: 0.10 };
    const rows = buildScenarios(input);
    expect(rows[1].discounted).toBe(true);
    expect(rows[1].landValue).toBe(analyze(input).financial.discountedLandValueRounded);
  });
});
