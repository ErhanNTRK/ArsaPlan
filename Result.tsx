/** Arayüz duman testi: her adım ve sonuç ekranı hatasız render olmalı. */
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { ProjectInput } from '../engine';
import { analyze } from '../engine';
import { Step1, Step2, Step3, Step4, Step5 } from './Steps';
import { Result } from './Result';

const input: ProjectInput = {
  assetType: 'konut',
  housingType: 'villa',
  parcel: { il: 'İstanbul', ilce: 'Beykoz', mahalle: 'Merkez', ada: '101', parsel: '5',
            area: 2500, netArea: 2350, width: 50, depth: 50 },
  zoning: { mode: 'taks-kaks', lejant: 'Konut Alanı', useSetbacks: true, taks: 0.30, kaks: 0.60, hmax: 9.5, floors: 2,
            directTotalArea: 0, directFootprint: 0,
            setbackFront: 5, setbackRear: 3, setbackSideLeft: 3, setbackSideRight: 3,
            planNotes: 'Bodrum katlar tamamen toprak altında kaldığı sürece emsale dahil değildir.' },
  emsal: { hasBasement: true, basementInEmsal: false, basementPerUnit: 0,
           hasAttic: true, atticInEmsal: false, atticPerUnit: 0 },
  villa: { mode: 'alan', unitCountManual: 0, villaType: 'mustakil', grossPerVilla: 240, netPerVilla: null, floorsPerVilla: 2, layoutEfficiency: 0.70 },
  cost: { buildingClass: 'III-C', unitCost: 23400, inflationRate: 0.15, extrasRate: 0.12 },
  site: { landscapeArea: 0, landscapeUnitCost: 1200, gardenPricePerM2: 4000 },
  sales: { unitPrice: 90000 },
  residual: { profitRate: 0.25, financeRateOfCost: 0.15 },
  share: { enabled: true, ownerShare: 0.45 },
};
const noop = () => {};
const P = { input, upd: noop, setTop: noop };

describe('adım ekranları', () => {
  const steps = [Step1, Step2, Step3, Step4, Step5];
  steps.forEach((S, i) => {
    it(`Adım ${i + 1} render olur`, () => {
      expect(renderToString(<S {...P} />).length).toBeGreaterThan(50);
    });
  });

  it('doğrudan alan girişi modunda da render olur', () => {
    const d = { ...input, zoning: { ...input.zoning, mode: 'dogrudan' as const, directFootprint: 700, directTotalArea: 1400 } };
    expect(() => renderToString(<Step2 input={d} upd={noop} setTop={noop} />)).not.toThrow();
    expect(() => renderToString(<Step3 input={d} upd={noop} setTop={noop} />)).not.toThrow();
  });

  it('villa adet modunda önizleme render olur', () => {
    const a = { ...input, villa: { ...input.villa, mode: 'adet' as const, unitCountManual: 3 } };
    const html = renderToString(<Step3 input={a} upd={noop} setTop={noop} />);
    expect(html).toContain('Villa adedi');
  });

  it('çekme mesafeleri kapalıyken alanlar gizlenir', () => {
    const k = { ...input, zoning: { ...input.zoning, useSetbacks: false } };
    const html = renderToString(<Step2 input={k} upd={noop} setTop={noop} />);
    expect(html).not.toContain('Ön Bahçe');
  });

  it('boş girdiyle çökmez', () => {
    const bos: ProjectInput = {
      ...input,
      parcel: { ...input.parcel, area: 0, netArea: 0, width: 0, depth: 0 },
      zoning: { ...input.zoning, taks: null, kaks: null, hmax: null, floors: null },
      emsal: { ...input.emsal, hasBasement: false, hasAttic: false },
      villa: { ...input.villa, grossPerVilla: 0, netPerVilla: null },
      site: { landscapeArea: 0, landscapeUnitCost: 0, gardenPricePerM2: 0 },
      sales: { unitPrice: 0 },
    };
    [Step1, Step2, Step3, Step4, Step5].forEach((S) => {
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
    expect(html).toContain('Bağlayıcı Kısıt');
    expect(html).toContain('Çatı Arası');
    expect(html).toContain('Bahçe');
    expect(html).toContain('PDF İndir');
    expect(html).toContain('Excel İndir');
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
    const sifir = { ...input, villa: { ...input.villa, grossPerVilla: 9000 } };
    expect(() => renderToString(<Result input={sifir} result={analyze(sifir)} version="t" />)).not.toThrow();
  });
});
