/** Arayüz duman testi: her adım ve sonuç ekranı hatasız render olmalı. */
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { ProjectInput } from '../engine';
import { analyze } from '../engine';
import { Step1, Step2, Step3, Step4 } from './Steps';
import { Result } from './Result';

const input: ProjectInput = {
  assetType: 'konut', housingType: 'villa',
  parcel: { il: 'İstanbul', ilce: 'Beykoz', mahalle: 'Çavuşbaşı', ada: '1245', parsel: '17', area: 1000, netArea: 1000 },
  zoning: { mode: 'taks-kaks', lejant: 'Az Yoğunluklu Konut Alanı', taks: 0.40, kaks: 0.80, hmax: 9.5,
            directFootprint: 0, directEmsalArea: 0,
            planNotes: 'Çatı katı piyesleri son kat ile irtibatlı olmak kaydıyla emsale dahil değildir.' },
  emsal: { hasExtra: true, extraMode: 'oran', extraRate: 0.10, extraArea: 0,
           hasAttic: true, atticMode: 'oran', atticRate: 0.50, atticArea: 0, atticInEmsal: false,
           hasBasement: true, basementInEmsal: false },
  villa: { villaType: 'mustakil', unitCount: 6, floorsAboveGround: 2 },
  cost: { buildingClass: 'III-C', unitCost: 23400, inflationRate: 0.20, extrasRate: 0.12 },
  site: { landscapeArea: 0, landscapeUnitCost: 1500, gardenPricePerM2: 3000 },
  sales: { unitPrice: 105000 },
  residual: { profitRate: 0.25, financeRateOfCost: 0.10 },
  share: { enabled: true, ownerShare: 0.40 },
};
const noop = () => {};
const P = { input, upd: noop, setTop: noop };

describe('adım ekranları', () => {
  const steps = [Step1, Step2, Step3, Step4];
  steps.forEach((S, i) => {
    it(`Adım ${i + 1} render olur`, () => {
      expect(renderToString(<S {...P} />).length).toBeGreaterThan(50);
    });
  });

  it('doğrudan alan girişi modunda da render olur', () => {
    const d = { ...input, zoning: { ...input.zoning, mode: 'dogrudan' as const, directFootprint: 300, directEmsalArea: 900 } };
    expect(() => renderToString(<Step2 input={d} upd={noop} setTop={noop} />)).not.toThrow();
  });

  it('toplam inşaat alanı dökümü ekranda görünür', () => {
    const html = renderToString(<Step2 input={input} upd={noop} setTop={noop} />);
    expect(html).toContain('Toplam İnşaat Alanı');
    expect(html).toContain('Emsal Dışı Satılabilir Alan');
    expect(html).toContain('Bodrum Kat');
    expect(html).toContain('Çatı Katı');
  });
  it('villa adedi girilmediğinde de çökmez', () => {
    const x = { ...input, villa: { ...input.villa, unitCount: 0 } };
    expect(() => renderToString(<Step2 input={x} upd={noop} setTop={noop} />)).not.toThrow();
  });

  it('boş girdiyle çökmez', () => {
    const bos: ProjectInput = {
      ...input,
      parcel: { ...input.parcel, area: 0, netArea: 0 },
      zoning: { ...input.zoning, taks: null, kaks: null, hmax: null },
      emsal: { ...input.emsal, hasBasement: false, hasAttic: false, hasExtra: false },
      villa: { ...input.villa, unitCount: 0 },
      site: { landscapeArea: 0, landscapeUnitCost: 0, gardenPricePerM2: 0 },
      sales: { unitPrice: 0 },
    };
    [Step1, Step2, Step3, Step4].forEach((S) => {
      expect(() => renderToString(<S input={bos} upd={noop} setTop={noop} />)).not.toThrow();
    });
  });
});

describe('sonuç ekranı', () => {
  it('tüm bölümleri ve uzman yorumlarını basar', () => {
    const html = renderToString(<Result input={input} result={analyze(input)} version="test" />);
    expect(html).toContain('Artık Arsa Değeri');
    expect(html).toContain('Kat Karşılığı');
    expect(html).toContain('Uzman Değerlendirmesi');
    expect(html).toContain('TOPLAM İNŞAAT ALANI');
    expect(html).toContain('Çatı Katı');
    expect(html).toContain('Bahçe');
    expect(html).toContain('PDF İndir');
    expect(html).toContain('Excel İndir');
    expect(html).toContain('Dora Gayrimenkul Değerleme');
    expect(html).toContain('Hasan Erhan Öntürk');
    expect(html).toContain('erhan.onturk@doradegerleme.com.tr');
  });
  it('kat karşılığı kapalıyken o bölüm basılmaz', () => {
    const k = { ...input, share: { enabled: false, ownerShare: 0.45 } };
    const html = renderToString(<Result input={k} result={analyze(k)} version="t" />);
    expect(html).not.toContain('Kat Karşılığı Karşılaştırması');
  });
  it('negatif artık değerde çökmez', () => {
    const kotu = { ...input, sales: { unitPrice: 15000 } };
    expect(() => renderToString(<Result input={kotu} result={analyze(kotu)} version="t" />)).not.toThrow();
  });
  it('sıfır kapasitede çökmez', () => {
    const sifir = { ...input, zoning: { ...input.zoning, taks: null, kaks: null } };
    expect(() => renderToString(<Result input={sifir} result={analyze(sifir)} version="t" />)).not.toThrow();
  });
});
