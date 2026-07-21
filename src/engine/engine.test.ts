/**
 * GOLDEN TEST — motorun sözleşmesi. Sayılar elle doğrulanmıştır.
 */
import { describe, it, expect } from 'vitest';
import { analyze, computeEnvelope, computeVillaCapacity } from './index';
import type { ProjectInput } from './types';

const base: ProjectInput = {
  assetType: 'konut',
  housingType: 'villa',
  parcel: { il: 'İstanbul', ilce: 'Beykoz', mahalle: 'Merkez', ada: '101', parsel: '5',
            area: 2500, netArea: 2350, width: 50, depth: 50 },
  zoning: { mode: 'taks-kaks', lejant: 'Konut Alanı', useSetbacks: true,
            taks: 0.30, kaks: 0.60, hmax: 9.5, floors: 2,
            directTotalArea: 0, directFootprint: 0,
            setbackFront: 5, setbackRear: 3, setbackSideLeft: 3, setbackSideRight: 3, planNotes: '' },
  emsal: { hasBasement: true, basementInEmsal: false, basementPerUnit: 0, basementSaleable: false,
           hasAttic: true, atticInEmsal: false, atticPerUnit: 0, atticSaleable: true,
           extraSaleablePerUnit: 0 },
  villa: { mode: 'alan', unitCountManual: 0, villaType: 'mustakil',
           grossPerVilla: 240, floorsPerVilla: 3, layoutEfficiency: 0.70 },
  cost: { buildingClass: 'III-C', unitCost: 23400, inflationRate: 0, extrasRate: 0 },
  site: { landscapeArea: 0, landscapeUnitCost: 0, gardenPricePerM2: 0 },
  sales: { unitPrice: 90000 },
  residual: { profitRate: 0.25, financeRateOfCost: 0 },
  share: { enabled: true, ownerShare: 0.45 },
};

describe('yapılaşma zarfı', () => {
  it('çekme mesafelerinden zarfı üretir', () => {
    const e = computeEnvelope(base.parcel, base.zoning);
    expect(e.buildableWidth).toBe(44);
    expect(e.buildableDepth).toBe(42);
    expect(e.envelopeArea).toBe(1848);
  });
  it('geometri yoksa uyarır', () => {
    const e = computeEnvelope({ ...base.parcel, width: 0, depth: 0 }, base.zoning);
    expect(e.hasGeometry).toBe(false);
    expect(e.warnings.join(' ')).toContain('en/boy');
  });
  it('çekmeler parseli yutarsa yapılaşma yok der', () => {
    const e = computeEnvelope(base.parcel, { ...base.zoning, setbackSideLeft: 25, setbackSideRight: 25 });
    expect(e.envelopeArea).toBe(0);
    expect(e.warnings.join(' ')).toContain('yapılaşma mümkün görünmüyor');
  });
});

describe('kapasite — TAKS/KAKS yöntemi', () => {
  const c = computeVillaCapacity(base.parcel, base.zoning, base.villa, base.emsal);

  it('limitleri net parselden hesaplar', () => {
    expect(c.taksLimit).toBeCloseTo(705, 6);
    expect(c.kaksLimit).toBeCloseTo(1410, 6);
  });
  it('villa adedini en kısıtlayıcı koşuldan bulur', () => {
    expect(c.footprintPerUnit).toBe(120);
    expect(c.countByFootprint).toBe(5);
    expect(c.unitCount).toBe(5);
    expect(c.binding).toBe('TAKS');
  });
  it('bodrum ve çatı arası emsal dışıyken alanları ayırır', () => {
    expect(c.emsalPerUnit).toBe(240);
    expect(c.basementArea).toBe(600);          // 5 × 120
    expect(c.atticArea).toBe(240);             // 5 × 48 (tabanın %40'ı)
    expect(c.grossArea).toBe(2040);            // 5 × 408
    expect(c.saleableArea).toBe(1440);         // 5 × (240 kapalı + 48 çatı arası)
    expect(c.emsalArea).toBe(1200);
  });
  it('kat adedi bodrumu içerir; zemin üstü kat ondan türetilir', () => {
    expect(c.aboveGroundFloors).toBe(2);      // 3 kat − 1 bodrum
    expect(c.footprintPerUnit).toBe(120);     // 240 / 2 zemin üstü kat
  });
  it('bahçe alanını toplam zemin oturumundan (TAKS) türetir', () => {
    expect(c.footprintTotal).toBe(600);
    expect(c.groundCoverage).toBe(705);       // TAKS taban alanı hakkı
    expect(c.gardenArea).toBe(2350 - 705);    // 1.645
  });
  it('bodrum yokken kat adedi doğrudan zemin üstü kattır', () => {
    const c2 = computeVillaCapacity(base.parcel, base.zoning,
      { ...base.villa, floorsPerVilla: 2 },
      { ...base.emsal, hasBasement: false });
    expect(c2.aboveGroundFloors).toBe(2);     // zemin + 1 normal kat
    expect(c2.footprintPerUnit).toBe(120);
    expect(c2.basementArea).toBe(0);
  });
  it('bodrum varken 4 kat = bodrum + zemin + 2 normal kat', () => {
    const c3 = computeVillaCapacity(base.parcel, base.zoning,
      { ...base.villa, floorsPerVilla: 4 }, base.emsal);
    expect(c3.aboveGroundFloors).toBe(3);
    expect(c3.footprintPerUnit).toBe(80);     // 240 / 3
  });
  it('çatı arası kat sayısına girmez, alana girer', () => {
    const c4 = computeVillaCapacity(base.parcel, base.zoning, base.villa,
      { ...base.emsal, hasAttic: true, atticPerUnit: 60 });
    expect(c4.aboveGroundFloors).toBe(2);     // değişmedi
    expect(c4.atticArea).toBe(c4.unitCount * 60);
  });
  it('bodrum emsale dahil olunca kapasite düşer', () => {
    const c2 = computeVillaCapacity(base.parcel, base.zoning, base.villa,
      { ...base.emsal, basementInEmsal: true });
    expect(c2.emsalPerUnit).toBe(360);
    expect(c2.unitCount).toBe(3);
    expect(c2.binding).toBe('KAKS');
  });
  it('çatı arası emsale dahil olunca kapasite düşer', () => {
    const c3 = computeVillaCapacity(base.parcel, base.zoning, base.villa,
      { ...base.emsal, atticInEmsal: true });
    expect(c3.emsalPerUnit).toBe(288);
    expect(c3.unitCount).toBe(4);
    expect(c3.binding).toBe('KAKS');
  });

});

describe('kapasite — doğrudan alan girişi', () => {
  const dogrudan: ProjectInput = {
    ...base,
    zoning: { ...base.zoning, mode: 'dogrudan', taks: null, kaks: null,
              directFootprint: 700, directTotalArea: 1400 },
  };
  it('taban ve inşaat alanını doğrudan girdiden alır', () => {
    const c = computeVillaCapacity(dogrudan.parcel, dogrudan.zoning, dogrudan.villa, dogrudan.emsal);
    expect(c.taksLimit).toBe(700);
    expect(c.kaksLimit).toBe(1400);
    expect(c.unitCount).toBe(5);
    expect(['DOĞRUDAN TABAN', 'DOĞRUDAN İNŞAAT ALANI']).toContain(c.binding);
  });
  it('doğrudan inşaat alanı düşükse o bağlayıcı olur', () => {
    const c = computeVillaCapacity(dogrudan.parcel,
      { ...dogrudan.zoning, directTotalArea: 720 }, dogrudan.villa, dogrudan.emsal);
    expect(c.unitCount).toBe(3);
    expect(c.binding).toBe('DOĞRUDAN İNŞAAT ALANI');
  });
});

describe('villa adedinden büyüklüğe (adet modu)', () => {
  const adet = computeVillaCapacity(base.parcel, base.zoning,
    { ...base.villa, mode: 'adet', unitCountManual: 3 }, base.emsal);

  it('girilen adedi korur ve villa büyüklüğünü kapasiteden türetir', () => {
    expect(adet.unitCount).toBe(3);
    expect(adet.grossPerVilla).toBe(470);      // min(705/3×2 kat, 1410/3)
    expect(adet.footprintPerUnit).toBe(235);
  });
  it('bodrum ve çatı arasını türetilen tabana göre hesaplar', () => {
    expect(adet.basementArea).toBe(3 * 235);
    expect(adet.atticArea).toBeCloseTo(3 * 94, 6);
    expect(adet.saleableArea).toBeCloseTo(3 * (470 + 94), 6);
  });
  it('kapasitenin üstünde adet girilirse villa küçülür', () => {
    const cok = computeVillaCapacity(base.parcel, base.zoning,
      { ...base.villa, mode: 'adet', unitCountManual: 10 }, base.emsal);
    expect(cok.unitCount).toBe(10);
    expect(cok.grossPerVilla).toBeLessThan(470);
  });
});

describe('çekme mesafeleri opsiyonel', () => {
  it('kapalıyken zarf hesaba katılmaz', () => {
    const kapali = computeVillaCapacity(base.parcel,
      { ...base.zoning, useSetbacks: false, setbackFront: 20, setbackRear: 20, setbackSideLeft: 20, setbackSideRight: 20 },
      base.villa, base.emsal);
    expect(kapali.envelope.hasGeometry).toBe(false);
    expect(kapali.unitCount).toBe(5);          // yalnızca TAKS/KAKS belirler
    expect(kapali.binding).toBe('TAKS');
  });
  it('açıkken dar zarf kapasiteyi düşürür', () => {
    const acik = computeVillaCapacity(base.parcel,
      { ...base.zoning, useSetbacks: true, setbackFront: 15, setbackRear: 15, setbackSideLeft: 10, setbackSideRight: 10 },
      base.villa, base.emsal);
    expect(acik.unitCount).toBe(3);
    expect(acik.binding).toBe('ÇEKME MESAFESİ');
  });
});

describe('kapasite tam kullanımı (sabit nokta çözümü)', () => {
  const P = { ...base.parcel, area: 1000, netArea: 1000, width: 0, depth: 0 };
  const Z = { ...base.zoning, useSetbacks: false, taks: 0.40, kaks: 0.80 };
  const E = { ...base.emsal, basementInEmsal: true, atticInEmsal: true };

  it('adet modunda emsal hakkı eksiksiz kullanılır', () => {
    const c = computeVillaCapacity(P, Z, { ...base.villa, mode: 'adet', unitCountManual: 5, floorsPerVilla: 4 }, E);
    expect(c.unitCount).toBe(5);
    expect(c.emsalArea).toBeCloseTo(800, 3);      // eskiden 352 çıkıyordu
    expect(c.emsalLeftover).toBeCloseTo(0, 3);
    expect(c.grossPerVilla).toBeCloseTo(800 / 5 / (1 + 1.4 / 3), 3);
  });

  it('ekler emsal dışıysa emsalin tamamı villaya gider', () => {
    const c = computeVillaCapacity(P, Z, { ...base.villa, mode: 'adet', unitCountManual: 5, floorsPerVilla: 4 },
      { ...E, basementInEmsal: false, atticInEmsal: false });
    expect(c.grossPerVilla).toBeCloseTo(160, 3);
    expect(c.emsalArea).toBeCloseTo(800, 3);
  });

  it('alan modunda artan hakkı ve villa alanı önerisini bildirir', () => {
    const c = computeVillaCapacity(P, Z, { ...base.villa, mode: 'alan', grossPerVilla: 180, floorsPerVilla: 4 },
      { ...E, basementInEmsal: false, atticInEmsal: false });
    expect(c.unitCount).toBe(4);
    expect(c.emsalLeftover).toBeCloseTo(80, 3);
    expect(c.suggestedGrossPerVilla).toBeCloseTo(200, 3);
  });

  it('doğrudan modda taban boş bırakılırsa inşaat hakkı tam kullanılır', () => {
    const c = computeVillaCapacity(P,
      { ...Z, mode: 'dogrudan', taks: null, kaks: null, directTotalArea: 900, directFootprint: 0 },
      { ...base.villa, mode: 'adet', unitCountManual: 4, floorsPerVilla: 2 },
      { ...base.emsal, hasAttic: false, basementInEmsal: false });
    expect(c.grossPerVilla).toBeCloseTo(225, 3);
    expect(c.emsalArea).toBeCloseTo(900, 3);
    expect(c.binding).toBe('DOĞRUDAN İNŞAAT ALANI');
  });

  it('doğrudan modda taban girilirse kısıt olur ve artan hak bildirilir', () => {
    const c = computeVillaCapacity(P,
      { ...Z, mode: 'dogrudan', taks: null, kaks: null, directTotalArea: 900, directFootprint: 400 },
      { ...base.villa, mode: 'adet', unitCountManual: 4, floorsPerVilla: 2 },
      { ...base.emsal, hasAttic: false, basementInEmsal: false });
    expect(c.grossPerVilla).toBeCloseTo(100, 3);   // 400/4 taban × 1 zemin üstü kat
    expect(c.binding).toBe('DOĞRUDAN TABAN');
    expect(c.emsalLeftover).toBeCloseTo(500, 3);
  });
});

describe('emsal dışı satılabilir alan', () => {
  it('çatı arası emsal dışı ama satılabilirse toplam satılabilir alanı büyütür', () => {
    const c = computeVillaCapacity(base.parcel, base.zoning, base.villa, base.emsal);
    expect(c.saleableWithinEmsal).toBe(5 * 240);   // 1.200 — emsale konu
    expect(c.saleableOutsideEmsal).toBe(5 * 48);   //   240 — emsal dışı (çatı arası)
    expect(c.saleableArea).toBe(1440);
  });

  it('bodrum satılabilir işaretlenirse satılabilir alana eklenir', () => {
    const c = computeVillaCapacity(base.parcel, base.zoning, base.villa,
      { ...base.emsal, basementSaleable: true });
    expect(c.saleableOutsideEmsal).toBe(5 * (120 + 48));
    expect(c.saleableArea).toBe(5 * (240 + 120 + 48));
    expect(c.emsalArea).toBe(1200);                // emsal değişmez
  });

  it('diğer emsal dışı satılabilir alan hem brüte hem satılabilire girer', () => {
    const c = computeVillaCapacity(base.parcel, base.zoning, base.villa,
      { ...base.emsal, extraSaleablePerUnit: 10 });
    expect(c.extraSaleableArea).toBe(50);
    expect(c.saleableArea).toBe(1440 + 50);
    expect(c.grossArea).toBe(2040 + 50);
    expect(c.emsalArea).toBe(1200);
  });

  it('senaryo: 500 m² emsal + 50 m² emsal dışı = 550 m² satılabilir', () => {
    const c = computeVillaCapacity(
      { ...base.parcel, area: 1000, netArea: 1000, width: 0, depth: 0 },
      { ...base.zoning, useSetbacks: false, taks: 0.50, kaks: 0.50 },
      { ...base.villa, mode: 'adet', unitCountManual: 1, floorsPerVilla: 1 },
      { hasBasement: false, basementInEmsal: false, basementPerUnit: 0, basementSaleable: false,
        hasAttic: false, atticInEmsal: false, atticPerUnit: 0, atticSaleable: false,
        extraSaleablePerUnit: 50 },
    );
    expect(c.emsalArea).toBe(500);
    expect(c.saleableWithinEmsal).toBe(500);
    expect(c.saleableOutsideEmsal).toBe(50);
    expect(c.saleableArea).toBe(550);
  });
});

describe('finansal sonuç', () => {
  const r = analyze(base);
  it('tüm inşaat alanını aynı birim maliyetle hesaplar', () => {
    expect(r.financial.aboveGroundCost).toBe(1200 * 23400);
    expect(r.financial.basementCost).toBe(600 * 23400);
    expect(r.financial.atticCost).toBe(240 * 23400);
    expect(r.financial.constructionCost).toBe(2040 * 23400);     // 47.736.000
  });
  it('artık arsa değerini ve m² değerini üretir', () => {
    expect(r.financial.revenue).toBe(1440 * 90000);              // 129.600.000
    expect(r.financial.developerProfit).toBe(32400000);
    expect(r.financial.residualLandValue).toBe(129600000 - 47736000 - 32400000); // 49.464.000
    expect(r.financial.landUnitValue).toBeCloseTo(49464000 / 2500, 6);
  });
  it('başabaş çarpanında artık değer tam sıfırlanır', () => {
    const s = r.financial.breakEvenFactor;
    const rlv = r.financial.revenue * s - r.financial.totalCost - r.financial.revenue * s * 0.25;
    expect(Math.abs(rlv)).toBeLessThan(0.01);
  });
  it('peyzaj alanı otomatik hesaplanır ve maliyete girer', () => {
    const r2 = analyze({ ...base, site: { landscapeArea: 0, landscapeUnitCost: 1200, gardenPricePerM2: 0 } });
    expect(r2.financial.landscapeCost).toBe(1645 * 1200);        // net parsel − zemin oturumu
    expect(r2.financial.totalCost).toBe(47736000 + 1645 * 1200);
  });
  it('peyzaj alanı elle girilirse o kullanılır', () => {
    const r2 = analyze({ ...base, site: { landscapeArea: 1000, landscapeUnitCost: 1200, gardenPricePerM2: 0 } });
    expect(r2.financial.landscapeCost).toBe(1000 * 1200);
  });
  it('bahçe ayrı fiyatlanınca hasılat artar', () => {
    const r3 = analyze({ ...base, site: { ...base.site, gardenPricePerM2: 5000 } });
    expect(r3.financial.gardenRevenue).toBe(1645 * 5000);
    expect(r3.financial.revenue).toBe(129600000 + 1645 * 5000);
  });
  it('enflasyon birim maliyeti günceller', () => {
    const r4 = analyze({ ...base, cost: { ...base.cost, inflationRate: 0.20 } });
    expect(r4.financial.effectiveUnitCost).toBeCloseTo(28080, 6);
    expect(r4.financial.residualLandValue).toBeLessThan(r.financial.residualLandValue);
  });
  it('finansman oranı toplam maliyete eklenir', () => {
    const r5 = analyze({ ...base, residual: { profitRate: 0.25, financeRateOfCost: 0.20 } });
    expect(r5.financial.financeCost).toBeCloseTo(47736000 * 0.20, 4);
    expect(r5.financial.totalCost).toBeCloseTo(47736000 * 1.20, 4);
    expect(r5.financial.residualLandValue).toBeLessThan(r.financial.residualLandValue);
  });
});

describe('kat karşılığı', () => {
  const r = analyze(base);
  it('dengeli payı artık değerden türetir', () => {
    expect(r.share.balancedShare).toBeCloseTo(49464000 / 129600000, 6);
  });
  it('paylaşım toplamları hasılatı korur', () => {
    expect(r.share.ownerValue + r.share.contractorValue).toBeCloseTo(r.financial.revenue, 4);
  });
  it('pay dengenin üstündeyse arsa sahibi lehine der', () => {
    // dengeli pay %38,2 · girilen %45
    expect(r.share.verdict).toBe('arsa-sahibi-lehine');
  });
  it('kat karşılığı kapalıyken yorum üretilmez', () => {
    const kapali = analyze({ ...base, share: { enabled: false, ownerShare: 0.45 } });
    expect(kapali.advice.some((a) => a.title.includes('Kat karşılığı'))).toBe(false);
  });
  it('pay dengenin belirgin altındaysa müteahhit lehine der', () => {
    expect(analyze({ ...base, share: { enabled: true, ownerShare: 0.30 } }).share.verdict).toBe('muteahhit-lehine');
  });
});

describe('uzman yorumları', () => {
  it('yeterli sayıda yorum üretir', () => {
    expect(analyze(base).advice.length).toBeGreaterThan(4);
  });
  it('negatif artık değeri uyarır', () => {
    expect(analyze({ ...base, sales: { unitPrice: 20000 } })
      .advice.some((a) => a.level === 'uyari' && a.title.includes('negatif'))).toBe(true);
  });
  it('çatı arası emsal kararını yorumlar', () => {
    expect(analyze({ ...base, emsal: { ...base.emsal, atticInEmsal: true } })
      .advice.some((a) => a.title.includes('Çatı arası'))).toBe(true);
  });
  it('doğrudan giriş modunu bildirir', () => {
    const r = analyze({ ...base, zoning: { ...base.zoning, mode: 'dogrudan', directFootprint: 700, directTotalArea: 1400 } });
    expect(r.advice.some((a) => a.title.includes('Doğrudan alan girişi'))).toBe(true);
  });
  it('sıfır kapasitede uyarır', () => {
    const r = analyze({ ...base, villa: { ...base.villa, grossPerVilla: 9000 } });
    expect(r.capacity.unitCount).toBe(0);
    expect(r.advice.some((a) => a.level === 'uyari')).toBe(true);
  });
});
