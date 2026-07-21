/**
 * ARSA DEĞER ANALİZİ — MOTOR TİPLERİ
 *
 * engine klasöründeki her şey SAF TypeScript'tir: React bilmez, DOM'a
 * dokunmaz, yan etkisi yoktur. Böylece test edilebilir ve arayüzden bağımsızdır.
 */

/** ADIM 1 — Ne değerleniyor? */
export type AssetType = 'konut' | 'ticari' | 'karma';

/** ADIM 2 — Konut alt tipi */
export type HousingType = 'villa' | 'apartman-3-6' | 'blok-7-18' | 'site';

export interface Parcel {
  il: string; ilce: string; mahalle: string; ada: string; parsel: string;
  /** Tapu alanı (m²) */
  area: number;
  /** Terk/DOP sonrası net parsel alanı (m²) */
  netArea: number;
  /** Yol cephesi genişliği (m) — çekme mesafesi hesabı için */
  width: number;
  /** Parsel derinliği (m) */
  depth: number;
}

/**
 * İmar hakkının nasıl tanımlandığı:
 *  'taks-kaks' → TAKS / KAKS / Hmax üzerinden (öncelikli yöntem)
 *  'dogrudan'  → Toplam inşaat alanı ve/veya taban oturumu doğrudan girilir
 *                (plan notu emsal vermiyorsa, avan proje veya kütle etüdü varsa)
 */
export type ZoningMode = 'taks-kaks' | 'dogrudan';

export interface Zoning {
  mode: ZoningMode;
  lejant: string;
  taks: number | null;
  kaks: number | null;
  hmax: number | null;
  floors: number | null;
  /** 'dogrudan' modda toplam (emsale konu) inşaat alanı m² */
  directTotalArea: number;
  /** 'dogrudan' modda toplam taban oturumu m² */
  directFootprint: number;
  setbackFront: number;
  setbackRear: number;
  setbackSideLeft: number;
  setbackSideRight: number;
  planNotes: string;
}

/** Emsal istisnaları — plan notuna göre değişen alanlar */
export interface EmsalOptions {
  hasBasement: boolean;
  basementInEmsal: boolean;
  /** Villa başına bodrum alanı (m²). 0 → villa taban alanı kadar varsayılır. */
  basementPerUnit: number;
  hasAttic: boolean;
  atticInEmsal: boolean;
  /** Villa başına çatı arası piyesi (m²). 0 → taban alanının %40'ı varsayılır. */
  atticPerUnit: number;
}

export interface VillaConfig {
  villaType: 'mustakil' | 'ikiz' | 'sirali';
  /** Villa başına zemin üstü brüt alan (m²) */
  grossPerVilla: number;
  /** Villa başına net (satılabilir) alan — 0 ise brüt kullanılır */
  netPerVilla: number | null;
  /** Villa kat adedi (zemin dahil; bodrum ve çatı arası hariç) */
  floorsPerVilla: number;
  /** Yapılaşma zarfının bina tabanına dönüşen oranı */
  layoutEfficiency: number;
}

export interface CostInput {
  buildingClass: string;
  unitCost: number;
  inflationRate: number;
  /** Bodrum ve çatı arası kaba yapı ağırlıklıdır; birim maliyet katsayısı */
  basementCostFactor: number;
  atticCostFactor: number;
  /** Proje, ruhsat, harç, müşavirlik vb. — inşaat maliyeti üzerinden oran */
  extrasRate: number;
}

/** Çevre düzenlemesi, peyzaj ve bahçe */
export interface SiteWorks {
  /** Peyzaj alanı (m²). 0 → net parsel − taban oturumu otomatik hesaplanır. */
  landscapeArea: number;
  landscapeUnitCost: number;
  /** İç yol, otopark, altyapı, çevre duvarı — sabit tutar */
  infrastructureCost: number;
  /** Bahçe m² satış değeri (₺/m²). 0 → bahçe villa fiyatına dahildir. */
  gardenPricePerM2: number;
}

export interface SalesInput { unitPrice: number; }

export interface ResidualInput {
  profitRate: number;
  useFinance: boolean;
  financeRate: number;
  months: number;
  utilization: number;
}

export interface ShareInput { ownerShare: number; }

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

export interface EnvelopeResult {
  buildableWidth: number;
  buildableDepth: number;
  envelopeArea: number;
  envelopeRatio: number;
  hasGeometry: boolean;
  geometryDeviation: number;
  warnings: string[];
}

export type BindingConstraint =
  | 'TAKS' | 'KAKS' | 'ÇEKME MESAFESİ' | 'DOĞRUDAN TABAN' | 'DOĞRUDAN İNŞAAT ALANI' | 'YOK';

export interface CapacityResult {
  envelope: EnvelopeResult;
  taksLimit: number | null;
  kaksLimit: number | null;
  layoutFootprint: number;
  effectiveFootprint: number;
  footprintPerUnit: number;
  countByFootprint: number;
  countByEmsal: number | null;
  unitCount: number;
  unitCountRange: [number, number];
  binding: BindingConstraint;
  emsalPerUnit: number;
  grossPerUnit: number;
  saleablePerUnit: number;
  emsalArea: number;
  grossArea: number;
  saleableArea: number;
  basementArea: number;
  atticArea: number;
  footprintTotal: number;
  gardenArea: number;
  parcelEfficiency: number;
  emsalUsage: number | null;
  warnings: string[];
}

export interface FinancialResult {
  effectiveUnitCost: number;
  aboveGroundCost: number;
  basementCost: number;
  atticCost: number;
  constructionCost: number;
  landscapeCost: number;
  infrastructureCost: number;
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
