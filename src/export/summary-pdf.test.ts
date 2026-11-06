import { describe, it, expect } from 'vitest';

/** Özet PDF: rapora eklenmek üzere tek sayfa olmalı; ana değer indirgeme durumuna göre seçilir. */
describe('Özet PDF', () => {
  it('villa için tek sayfa', async () => {
    const { analyze } = await import('../engine');
    const make = (await import('../tests/fixtures/minimalProjectInput')).default;
    const { buildSummaryPdf } = await import('./summaryPdf');
    const input = make();
    const { doc } = await buildSummaryPdf(input, analyze(input), 'test');
    expect(doc.getNumberOfPages()).toBe(1);
  }, 60000);

  it('indirgeme + kat karşılığı + satış gideri açıkken de tek sayfa', async () => {
    const { analyze } = await import('../engine');
    const make = (await import('../tests/fixtures/minimalProjectInput')).default;
    const { buildSummaryPdf } = await import('./summaryPdf');
    const input = make();
    input.residual = { ...input.residual, salesCostRate: 0.03, projectMonths: 24, timeDiscountRate: 0.10 };
    input.share = { enabled: true, ownerShare: 0.4 };
    const { doc } = await buildSummaryPdf(input, analyze(input), 'test');
    expect(doc.getNumberOfPages()).toBe(1);
  }, 60000);

  it('indirgeme açıkken özetin ana değeri indirgemeli değerdir', async () => {
    const { analyze } = await import('../engine');
    const make = (await import('../tests/fixtures/minimalProjectInput')).default;
    const { buildSummary } = await import('./summary');
    const input = make();
    input.residual = { ...input.residual, projectMonths: 24, timeDiscountRate: 0.10 };
    const r = analyze(input);
    const S = buildSummary(input, r);
    expect(S.headline.label).toContain('İNDİRGEMELİ');
    expect(S.headline.value.replace(/\D/g, '')).toBe(String(Math.round(r.financial.discountedLandValueRounded)));
  });
});
