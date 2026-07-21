/** Arayüz duman testi: her adım ve sonuç ekranı hatasız render olmalı. */
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { ProjectInput } from '../engine';
import { analyze } from '../engine';
import { Step1, Step2, Step3, Step4, Step5, Step6, Step7, Step8, Step9 } from './Steps';
import { Result } from './Result';

const input: ProjectInput = {
  assetType: 'konut',
  housingType: 'villa',
  parcel: { il: 'İstanbul', ilce: 'Beykoz', mahalle: 'Merkez', ada: '101', parsel: '5',
            area: 2500, netArea: 2350, width: 50, depth: 50 },
  zoning: { mode: 'taks-kaks', lejant: 'Konut', taks: 0.30, kaks: 0.60, hmax: 9.5, floors: 2,
            directTotalArea: 0, directFootprint: 0,
            setbackFront: 5, setbackRear: 3, setbackSideLeft: 3, setbackSideRight: 3,
            planNotes: 'Bodrum katlar tamamen toprak altında kaldığı sürece emsale dahil değildir.' },
  emsal: { hasBasement: true, basementInEmsal: false, basementPerUnit: 0,
           hasAttic: true, atticInEmsal: false, atticPerUnit: 0 },
  villa: { villaType: 'mustakil', grossPerVilla: 240, netPerVilla: null, floorsPerVilla: 2, layoutEfficiency: 0.70 },
  cost: { buildingClass: 'III-C', unitCost: 23400, inflationRate: 0.15,
          basementCostFactor: 0.6, atticCostFactor: 0.5, extrasRate: 0.12 },
  site: { landscapeArea: 0, landscapeUnitCost: 1200, infrastructureCost: 1500000, gardenPricePerM2: 4000 },
  sales: { unitPrice: 90000 },
  residual: { profitRate: 0.25, useFinance: true, financeRate: 0.35, months: 24, utilization: 0.4 },
  share: { ownerShare: 0.45 },
};
const noop = () => {};
const P = { input, upd: noop, setTop: noop };

describe('adım ekranları', () => {
  const steps = [Step1, Step2, Step3, Step4, Step5, Step6, Step7, Step8, Step9];
  steps.forEach((S, i) => {
    it(`Adım ${i + 1} render olur`, () => {
      expect(renderToString(<S {...P} />).length).toBeGreaterThan(50);
    });
  });

  it('doğrudan alan girişi modunda da render olur', () => {
    const d = { ...input, zoning: { ...input.zoning, mode: 'dogrudan' as const, directFootprint: 700, directTotalArea: 1400 } };
    expect(() => renderToString(<Step3 input={d} upd={noop} setTop={noop} />)).not.toThrow();
  });

  it('boş girdiyle çökmez', () => {
    const bos: ProjectInput = {
      ...input,
      parcel: { ...input.parcel, area: 0, netArea: 0, width: 0, depth: 0 },
      zoning: { ...input.zoning, taks: null, kaks: null, hmax: null, floors: null },
      emsal: { ...input.emsal, hasBasement: false, hasAttic: false },
      villa: { ...input.villa, grossPerVilla: 0, netPerVilla: null },
      site: { landscapeArea: 0, landscapeUnitCost: 0, infrastructureCost: 0, gardenPricePerM2: 0 },
      sales: { unitPrice: 0 },
    };
    [Step1, Step2, Step3, Step4, Step5, Step6, Step7, Step8, Step9].forEach((S) => {
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
  it('negatif artık değerde çökmez', () => {
    const kotu = { ...input, sales: { unitPrice: 15000 } };
    expect(() => renderToString(<Result input={kotu} result={analyze(kotu)} version="t" />)).not.toThrow();
  });
  it('sıfır kapasitede çökmez', () => {
    const sifir = { ...input, villa: { ...input.villa, grossPerVilla: 9000 } };
    expect(() => renderToString(<Result input={sifir} result={analyze(sifir)} version="t" />)).not.toThrow();
  });
});
