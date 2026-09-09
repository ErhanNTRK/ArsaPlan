import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { StepNavigation } from './CorporateLayout';

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
