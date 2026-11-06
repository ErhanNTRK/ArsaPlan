import { describe, it, expect } from 'vitest';

/** Duyarlılık tablosu yalnızca kullanıcı işaretlerse PDF'e girer; varsayılan: girmez. */
describe('PDF — Duyarlılık tablosu opsiyonel', () => {
  async function pdfPages(flag: boolean) {
    const { analyze } = await import('../engine');
    const make = (await import('../tests/fixtures/minimalProjectInput')).default;
    const { buildPdf } = await import('./pdf');
    const input = { ...make(), showSensitivityInPdf: flag, showScenariosInPdf: flag };
    const { doc } = await buildPdf(input, analyze(input), 'test');
    return doc.getNumberOfPages();
  }
  it('işaretsizken PDF üretilir; işaretliyken de hatasız üretilir', async () => {
    const off = await pdfPages(false);
    const on = await pdfPages(true);
    expect(off).toBeGreaterThan(0);
    expect(on).toBeGreaterThanOrEqual(off);
  }, 60000);
});
