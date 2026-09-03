/**
 * Yedi modülün hepsinde — hiçbir Banka/Şube/Tarih bilgisi girilmemişse
 * (varsayılan durum), şerit gerçekten hiç görünmüyor mu, tek tek doğrular.
 */
import { describe, it, expect } from 'vitest';

async function extractPage1Text(doc: any) {
  const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const pdfDoc = await pdfjs.getDocument({ data: doc.output('arraybuffer') }).promise;
  const content = await (await pdfDoc.getPage(1)).getTextContent();
  return content.items.map((it: any) => it.str).join(' ');
}

describe('Banka/Şube/Tarih şeridi — bilgi girilmemişse hiçbir modülde görünmüyor', () => {
  it('Arsa Gelir Projeksiyonu', async () => {
    const { analyze } = await import('../engine');
    const makeMinimalProjectInput = (await import('../tests/fixtures/minimalProjectInput')).default;
    const { buildPdf } = await import('./pdf');
    const input = makeMinimalProjectInput();
    const r = analyze(input);
    const { doc } = await buildPdf(input, r, 'test');
    const text = await extractPage1Text(doc);
    expect(text).not.toContain('Banka:');
    expect(text).not.toContain('Şube:');
  });

  it('Otel Gelir Analizi', async () => {
    const { analyzeHotel, createDefaultHotelInput } = await import('../hotel/engine');
    const { buildHotelPdf } = await import('../hotel/pdf');
    const input = createDefaultHotelInput();
    input.rooms = [{ id: 'r1', roomType: 'Standart', roomCount: 10, adr: 3000, occupancy: 0.6, operatingDays: 365 }];
    const r = analyzeHotel(input);
    const { doc } = await buildHotelPdf(input, r);
    const text = await extractPage1Text(doc);
    expect(text).not.toContain('Banka:');
  });

  it('Akaryakıt Gelir Hesabı', async () => {
    const { computeFuel } = await import('../fuel/engine');
    const { buildFuelPdf } = await import('../fuel/pdf');
    const input = {
      products: [{ id: 'p1', name: 'Kurşunsuz 95', mode: 'gunluk' as const, dailyLiters: 2000, monthlyLiters: 0,
        multiYearLiters: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], multiYearLabels: null, unitPrice: 47, profitPct: 3 }],
      extras: [], otherIncomePctOfFuel: 0, dealerRent: { include: false, yearlyAmount: 0 },
      capRate: 12, rounding: 50000,
      cost: { enabled: false, parcelArea: 0, landUnitValue: 0, buildings: [] },
    } as any;
    const r = computeFuel(input);
    const doc = await buildFuelPdf(input, r);
    const text = await extractPage1Text(doc);
    expect(text).not.toContain('Banka:');
  });

  it('Bağımsız Maliyet Yaklaşımı', async () => {
    const { analyzeCostApproach } = await import('../cost/engine');
    const { buildCostApproachPdf } = await import('../cost/pdf');
    const input = {
      category: 'Otel', general: { name: '', il: '', ilce: '', mahalle: '', ada: '', parsel: '' },
      parcelArea: 1000, netParcelArea: 1000, landUnitValue: 5000, fromKml: false,
      buildings: [{ id: 'b1', type: 'Otel Binası', buildingClassCode: null, area: 500, unitCostOverride: 15000, depreciationPct: 90 }],
      adjustmentType: 'none', adjustmentAmount: 0, computeMevcutDurum: false, mevcutBuildings: [], mevcutAdjustmentAmount: null,
    } as any;
    const r = analyzeCostApproach(input);
    const { doc } = await buildCostApproachPdf(input, r);
    const text = await extractPage1Text(doc);
    expect(text).not.toContain('Banka:');
  });

  it('Tarımsal Ürün Gelir Hesabı', async () => {
    const { computeAgri } = await import('../agri/engine');
    const { buildAgriPdf } = await import('../agri/pdf');
    const input = {
      parcelArea: 10000, arablePct: 100,
      rows: [{ id: 'r1', kind: 'ekili' as const, name: 'Buğday', areaM2: 10000, byproduct: null,
               yieldPerUnit: 400, price: 12, expensePct: 35, treeCount: 0, economicLifeYears: 0 }],
      amortYears: 25,
    } as any;
    const r = computeAgri(input);
    const doc = await buildAgriPdf(input, r);
    const text = await extractPage1Text(doc);
    expect(text).not.toContain('Banka:');
  });

  it('Üst Hakkı — Basit Mod', async () => {
    const { computeWholeValueMethod, computeLandOnlyMethod } = await import('../usthakki/simpleCostEngine');
    const { buildSimpleUstHakkiPdf } = await import('../usthakki/simplePdf');
    const cost = { parcelArea: 1000, landUnitValue: 8000, buildings: [] };
    const whole = computeWholeValueMethod(cost, 20, 30);
    const land = computeLandOnlyMethod(cost, 20, 30);
    const input = { hotelName: '', mahalle: '', ada: '', parsel: '', parcelArea: 1000, fromKml: false,
      currency: 'TL' as const, sureUnit: 'yil' as const, kalanSure: 20, toplamSure: 30 };
    const doc = await buildSimpleUstHakkiPdf('toplam', input, whole, land);
    const text = await extractPage1Text(doc);
    expect(text).not.toContain('Banka:');
  });

  it('Üst Hakkı — Ayrıntılı Mod', async () => {
    const { computeDetailedUstHakki } = await import('../usthakki/detailedEngine');
    const { buildDetailedUstHakkiPdf } = await import('../usthakki/detailedPdf');
    const input = {
      hotelName: '', ada: '', parsel: '', parcelArea: 1000, fromKml: false,
      sureUnit: 'yil' as const, kalanSureYil: 10, toplamSureYil: 20, currency: 'TL' as const, fxRate: 1,
      rooms: [{ id: 'r1', name: 'Standart', count: 10, price: 3000, occupancyPct: 60, days: 365 }],
      roomGrowthPct: 15,
      foodIncomeBase: 0, otherIncomeBase: 0, meetingIncomeBase: 0, shopIncomeBase: 0,
      roomExpensePct: 25, foodExpensePct: 0, otherExpensePct: 0, generalMgmtPct: 8, energyPct: 6, repairPct: 1,
      landUnitValue: 5000, buildings: [], buildingDepreciationPct: 25, showCostApproachInPdf: false,
      operatorPremiumPct: 10, propertyTaxPct: 0.2, insurancePct: 0.5, renewalFundPct: 1,
      ecrimisilBase: 0, ecrimisilGrowthPct: 0, ustHakkiOdemeBase: 0, ustHakkiOdemeGrowthPct: 0,
      bayilikBase: 0, bayilikGrowthPct: 0, discountRatePct: 30, donemSonuIndirgemePct: 0,
    };
    const r = computeDetailedUstHakki(input);
    const doc = await buildDetailedUstHakkiPdf(input, r);
    const text = await extractPage1Text(doc);
    expect(text).not.toContain('Banka:');
  });
});
