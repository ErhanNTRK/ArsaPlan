import type { ProjectInput } from '../../engine/types';

/** Testlerde tekrar kullanılabilir, minimal ama geçerli bir ProjectInput üretir. */
export default function makeMinimalProjectInput(): ProjectInput {
  return {
    assetType: 'konut',
    housingType: 'villa',
    ticariMode: 'apartman',
    isletme: { buildings: [], inflationRate: 0, wallUnitCost: 0, landscapeUnitCost: 0, infraUnitCost: 0, otherCosts: [], salesTotal: 0 },
    parcel: { il: 'İstanbul', ilce: 'Pendik', mahalle: 'Kurtköy', ada: '101', parsel: '5', area: 1850, netArea: 1850 },
    zoning: { mode: 'taks-kaks', lejant: 'Konut Alanı', taks: 0.30, kaks: 1.65, hmax: 18.5,
              directFootprint: 0, directEmsalArea: 0, cekmeFront: 5, cekmeSide: 3, cekmeRear: 3, cekmeFrontEdge: null, planNotes: '' },
    emsal: { hasExtra: true, extraMode: 'oran', extraRate: 0.08, extraArea: 0,
             hasAttic: false, atticMode: 'oran', atticRate: 0.50, atticArea: 0, atticInEmsal: false,
             hasBasement: false, basementMode: 'oran', basementRate: 1.0, basementArea: 0, basementInEmsal: false },
    villa: { villaType: 'mustakil', unitCount: 0, floorsAboveGround: 2 },
    apartment: {
      basementCount: 0,
      basements: [
        { use: 'konut', area: null, lossRate: 0.10, saleable: null },
        { use: 'ortak', area: null, lossRate: 0.10, saleable: null },
        { use: 'ortak', area: null, lossRate: 0.10, saleable: null },
        { use: 'ortak', area: null, lossRate: 0.10, saleable: null },
      ],
      zeminArea: null, zeminLossRate: 0.15, zeminSaleable: null,
      normalCount: null,
      normalAreas: [null, null, null, null, null, null, null, null],
      normalSaleables: [null, null, null, null, null, null, null, null],
      normalCommonRate: 0.10,
      hasPiyes: false, piyesInEmsal: true, piyesRate: 0.30,
      piyesArea: null, piyesSaleable: null,
      asmaCount: 0, asmaInEmsal: true, asmaRate: 0.40,
      asmaAreas: [null, null, null, null],
      asmaSaleables: [null, null, null, null],
      hasExtraSaleable: false, extraMode: 'oran', extraRate: 0.10, extraArea: 0,
    },
    cost: { buildingClass: 'III-C', unitCost: 19500, inflationRate: 0, extrasRate: 0.06 },
    site: { landscapeArea: 0, landscapeUnitCost: 0, gardenPricePerM2: 0 },
    sales: { unitPrice: 62000, apt: { bodrum: 0, bodrumTicari: 0, zemin: 0, asma: 0, normal: 0, piyes: 0 } },
    residual: { profitRate: 0.20, financeRateOfCost: 0.08 },
    share: { enabled: true, ownerShare: 0.35 },
  };
}
