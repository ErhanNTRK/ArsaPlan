import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CorporateShell, StepNavigation } from './CorporateLayout';

const steps = [{ title: 'Taşınmaz' }, { title: 'İmar' }, { title: 'Maliyet' }, { title: 'Değerleme' }];
function buttons(current: number, canAdvance: boolean) {
  return renderToStaticMarkup(<StepNavigation steps={steps} current={current} canAdvance={canAdvance} onChange={() => {}} />).match(/<button\b[^>]*>/g)!;
}
describe('kurumsal adım gezintisi: mevcut alan doğrulamalarını korur', () => {
  it('eksik zorunlu alan varsa ilerideki adımlar ve sonuç kapalı kalır', () => {
    const markup = buttons(1, false);
    expect(markup.slice(1).every(b => b.includes('disabled'))).toBe(true);
  });
  it('geçerli adım yalnız bir sonraki adıma geçebilir, sonraki doğrulamaları atlayamaz', () => {
    const markup = buttons(2, true);
    expect(markup[0]).not.toContain('disabled');
    expect(markup[2]).not.toContain('disabled');
    expect(markup[3]).toContain('disabled');
    expect(markup[4]).toContain('disabled');
  });
  it('sonuç yalnız son adımın doğrulaması sağlandığında açılır', () => {
    expect(buttons(4, false)[4]).toContain('disabled');
    expect(buttons(4, true)[4]).not.toContain('disabled');
  });
});

describe('kurumsal kabuk: çalışma alanını tüm ekrana açar', () => {
  it('sabit sol yöntem paneli olmadan içeriği ve yardımcı kontrolleri gösterir', () => {
    const markup = renderToStaticMarkup(
      <CorporateShell controls={<button type="button">Dil</button>}><main>İçerik</main></CorporateShell>,
    );
    expect(markup).not.toContain('corp-sidebar');
    expect(markup).toContain('corporate-main');
    expect(markup).toContain('corp-utilities');
  });
});
