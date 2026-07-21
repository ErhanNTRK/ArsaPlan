/**
 * ARSAPLAN — MOTOR TİPLERİ (v4 model)
 *
 * Model, alan üretimini tek yönde ve sade kurar:
 *   1) İmar hakkı: taban oturumu ve emsale dahil alan
 *   2) Emsal dışı satılabilir alan (emsalin yüzdesi veya elle)
 *   3) Çatı katı (taban oturumunun yüzdesi veya elle) — emsale dahil ya da dışı
 *   4) Bodrum kat (taban oturumu kadar) — emsale dahil ya da dışı
 *   5) Toplam inşaat alanı = emsal + emsal dışı kalemler
 *   6) Villa adedi opsiyoneldir; girilirse villa alanı = toplam ÷ adet
 *
 * engine klasörü saf TypeScript'tir: React bilmez, DOM'a dokunmaz, yan etkisi yoktur.
 */

export type AssetType = 'konut' | 'ticari' | 'karma';
export type HousingType = 'villa' | 'apartman-3-6' | 'blok-7-18' | 'site';

export interface Parcel {
  il: string; ilce: string; mahalle: string; ada: string; parsel: string;
  /** Tapu alanı (m²) */
  area: number;
  /** Terk/DOP sonrası net parsel alanı (m²) */
  netArea: number;
}

/** 'taks-kaks' → katsayılardan hesaplanır · 'dogrudan' → alanlar elle girilir */
export type ZoningMode = 'taks-kaks' | 'dogrudan';

export interface Zoning {
  mode: ZoningMode;
  lejant: string;
  taks: number | null;
  kaks: number | null;
  hmax: number | null;
  /** 'dogrudan' modda taban oturumu (m²) */
  directFootprint: number;
  /** 'dogrudan' modda emsale dahil toplam inşaat alanı (m²) */
  directEmsalArea: number;
  planNotes: string;
}

/** Oran ile mi elle mi hesaplansın */
export type CalcMode = 'oran' | 'manuel';

export interface EmsalOptions {
  /* ── Emsal dışı satılabilir alan — emsale dahil alanın yüzdesi ── */
  hasExtra: boolean;
  extraMode: CalcMode;
  /** Emsale dahil alanın oranı (0.10 = %10) */
  extraRate: number;
  /** Elle girilen emsal dışı satılabilir alan (m²) */
  extraArea: number;

  /* ── Çatı katı — taban oturumunun yüzdesi ── */
  hasAttic: boolean;
  atticMode: CalcMode;
  /** Taban oturumunun oranı (0.50 = %50) */
  atticRate: number;
  /** Elle girilen çatı katı alanı (m²) */
  atticArea: number;
  /** Emsale dahil mi? (dahilse emsalin içinden yer alır, toplamı artırmaz) */
  atticInEmsal: boolean;

  /* ── Bodrum kat — taban oturumu kadar ── */
  hasBasement: boolean;
  basementInEmsal: boolean;
}

export interface VillaConfig {
  villaType: 'mustakil' | 'ikiz' | 'sirali';
  /** Villa adedi — OPSİYONEL. 0 ise villa dağılımı hesaplanmaz. */
  unitCount: number;
  /** Zemin üstü kat adedi (bodrum ve çatı katı hariç) — yerleşim kontrolü için */
  floorsAboveGround: number;
}

export interface CostInput {
  buildingClass: string;
  unitCost: number;
  inflationRate: number;
  /** Proje, ruhsat, harç, müşavirlik — inşaat maliyeti üzerinden oran */
  extrasRate: number;
}

export interface SiteWorks {
  /** Peyzaj/bahçe alanı (m²). 0 → net parsel − taban oturumu otomatik. */
  landscapeArea: number;
  landscapeUnitCost: number;
  /** Bahçe m² satış değeri (₺/m²). 0 → bahçe ayrıca fiyatlanmaz. */
  gardenPricePerM2: number;
}

export interface SalesInput {
  /** Toplam inşaat alanı m² başına satış fiyatı (₺/m²) */
  unitPrice: number;
}

export interface ResidualInput {
  profitRate: number;
  /** Finansman gideri — toplam maliyetin yüzdesi. 0 → hesaba katılmaz. */
  financeRateOfCost: number;
}

export interface ShareInput {
  enabled: boolean;
  ownerShare: number;
}

export interface ProjectInput {
  assetType: AssetType;
  housingType: HousingType;
  parcel: Parcel;
  zoning: Zoning;
  emsal: EmsalOptions;
  villa: VillaConfig;
  cost: CostInput;
  site: SiteWorks;
  sales: SalesInput;
  residual: ResidualInput;
  share: ShareInput;
}

export interface CapacityResult {
  /** Taban oturumu (m²) */
  footprintArea: number;
  /** Emsale dahil alan (m²) */
  emsalArea: number;
  /** Emsal dışı satılabilir alan (m²) */
  extraArea: number;
  /** Çatı katı alanı (m²) */
  atticArea: number;
  /** Bodrum kat alanı (m²) */
  basementArea: number;
  /** Emsalin içinden çatı ve bodruma giden kısım (m²) */
  emsalConsumedByExtras: number;
  /** Emsalin zemin üstü normal katlara kalan kısmı (m²) */
  aboveGroundArea: number;
  /** TOPLAM İNŞAAT ALANI (m²) */
  totalArea: number;
  /** Satılabilir alan — satış bu alan üzerinden yapılır */
  saleableArea: number;
  /** Bahçe / açık alan (m²) */
  gardenArea: number;

  /* Villa dağılımı — adet girilmişse */
  unitCount: number;
  areaPerUnit: number;
  floorsAboveGround: number;
  /** Zemin üstü alanın kat başına düşen kısmı */
  areaPerFloor: number;
  /** Kat başına alan taban oturumuna sığıyor mu? */
  floorFits: boolean;
  /** Yerleşim için gereken en az kat adedi */
  minFloorsNeeded: number;

  warnings: string[];
}

export interface FinancialResult {
  effectiveUnitCost: number;
  constructionCost: number;
  landscapeCost: number;
  extrasCost: number;
  financeCost: number;
  totalCost: number;
  buildingRevenue: number;
  gardenRevenue: number;
  revenue: number;
  developerProfit: number;
  residualLandValue: number;
  landUnitValue: number;
  landToRevenue: number;
  roi: number;
  breakEvenFactor: number;
  safetyMargin: number;
  costPerSaleableM2: number;
}

export interface ShareResult {
  ownerShare: number;
  contractorShare: number;
  ownerUnits: number;
  contractorUnits: number;
  ownerArea: number;
  contractorArea: number;
  ownerValue: number;
  contractorValue: number;
  contractorNet: number;
  balancedShare: number;
  difference: number;
  verdict: 'arsa-sahibi-lehine' | 'muteahhit-lehine' | 'dengeli';
}

export type AdviceLevel = 'olumlu' | 'bilgi' | 'dikkat' | 'uyari';
export interface Advice { level: AdviceLevel; title: string; body: string; }

export interface AnalysisResult {
  capacity: CapacityResult;
  financial: FinancialResult;
  share: ShareResult;
  advice: Advice[];
}
