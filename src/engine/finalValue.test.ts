import { describe, it, expect } from 'vitest';
import { analyze } from './index';
import { resolveFinal, finalOptions, computedMethodCount } from './finalValue';
import makeMinimalProjectInput from '../tests/fixtures/minimalProjectInput';

describe('Nihai arsa değeri — yöntem seçimi', () => {
  it('indirgeme yokken varsayılan klasik gelir projeksiyonudur', () => {
    const input = makeMinimalProjectInput();
    const r = analyze(input);
    const f = resolveFinal(input, r);
    expect(f.method).toBe('gelir');
    expect(f.value).toBe(r.financial.residualLandValueRounded);
  });

  it('indirgeme varsa varsayılan indirgemeli değerdir', () => {
    const input = makeMinimalProjectInput();
    input.residual = { ...input.residual, projectMonths: 24, timeDiscountRate: 0.1 };
    const r = analyze(input);
    const f = resolveFinal(input, r);
    expect(f.method).toBe('gelir-indirgemeli');
    expect(f.value).toBe(r.financial.discountedLandValueRounded);
  });

  it('kullanıcı seçimi (kat karşılığı) uygulanır', () => {
    const input = makeMinimalProjectInput();
    input.share = { enabled: true, ownerShare: 0.4 };
    input.finalMethod = 'kat-karsiligi';
    const r = analyze(input);
    expect(resolveFinal(input, r).value).toBe(r.share.shareLandValueRounded);
  });

  it('elle değer girilince o değer esas alınır; girilmediyse varsayılana düşülür', () => {
    const input = makeMinimalProjectInput();
    input.finalMethod = 'manuel';
    const r = analyze(input);
    expect(resolveFinal(input, r).manualMissing).toBe(true);
    input.finalManualValue = 123_000_000;
    const f = resolveFinal(input, r);
    expect(f.method).toBe('manuel');
    expect(f.value).toBe(123_000_000);
  });

  it('birden fazla yöntem varsa seçim sorulur (>=2), tek yöntemde sorulmaz', () => {
    const input = makeMinimalProjectInput();
    input.share = { enabled: false, ownerShare: 0.4 };
    expect(computedMethodCount(input, analyze(input))).toBe(1);
    input.share = { enabled: true, ownerShare: 0.4 };
    expect(computedMethodCount(input, analyze(input))).toBe(2);
    input.residual = { ...input.residual, projectMonths: 12, timeDiscountRate: 0.1 };
    expect(finalOptions(input, analyze(input)).filter((o) => o.value !== 'manuel')).toHaveLength(4);
  });

  it('özet ve PDF ana değeri aynı kararı kullanır', async () => {
    const input = makeMinimalProjectInput();
    input.share = { enabled: true, ownerShare: 0.4 };
    input.finalMethod = 'kat-karsiligi';
    const r = analyze(input);
    const { buildSummary } = await import('../export/summary');
    const S = buildSummary(input, r);
    expect(S.headline.label).toContain('KAT KARŞILIĞI');
    expect(S.headline.value.replace(/\D/g, '')).toBe(String(r.share.shareLandValueRounded));
  });
});
