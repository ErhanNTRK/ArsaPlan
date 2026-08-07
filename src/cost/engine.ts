import { YAPI_SINIFLARI } from '../data/yapiSiniflari';

export interface CostBuildingRow {
  id: string;
  type: string;             // yapı türü (kategori önerisi veya elle yazılmış)
  buildingClassCode: string | null; // YAPI_SINIFLARI kodu; null ise elle birim maliyet
  area: number;
  unitCostOverride: number | null; // elle girilmişse Tebliğ değerinin yerine geçer
  depreciationPct: number;  // 0-100, aşınma/amortisman
}

export type AdjustmentType = 'none' | 'serefiye' | 'duzeltme' | 'peyzaj';

export interface CostApproachInput {
  category: string;         // PROPERTY_CATEGORIES'ten biri, ya da serbest metin
  general: { name: string; il: string; ilce: string; mahalle: string; ada: string; parsel: string };
  parcelArea: number | null;    // KML/elle — tapu alanı
  netParcelArea: number | null; // hesaba giren asıl alan
  landUnitValue: number;
  fromKml: boolean;
  buildings: CostBuildingRow[];
  adjustmentType: AdjustmentType;
  adjustmentAmount: number;
  /** "Mevcut Durum Değeri Hesapla" opsiyonu açıldığında true olur. */
  computeMevcutDurum: boolean;
  /** Açıldığında, Yasal Durum yapı satırlarının bir kopyası ile başlar; kullanıcı değiştirip ekleyip silebilir. */
  mevcutBuildings: CostBuildingRow[];
  /** Mevcut Durum için ayrı şerefiye/düzeltme tutarı (girilmezse Yasal Durum'unki kullanılır). */
  mevcutAdjustmentAmount: number | null;
}

export interface CostBuildingRowResult extends CostBuildingRow {
  effectiveUnitCost: number;
  buildingValue: number; // area × effectiveUnitCost × (depreciationPct/100, veya 0 ise ×1)
  overridden: boolean;
}

/** Tek bir durumun (Yasal ya da Mevcut) hesap çıktısı. */
export interface CostStatusResult {
  buildingRows: CostBuildingRowResult[];
  buildingsValue: number;
  adjustmentValue: number;
  totalValue: number;
  totalValueRounded: number; // 5.000'e yuvarlanmış
}

export interface CostApproachResult extends CostStatusResult {
  landValue: number;
  warnings: string[];
  /**
   * Mevcut Durum sonucu. "Mevcut Durum Değeri Hesapla" kapalıysa ya da
   * ayrı yapı satırı girilmemişse, Yasal Durum'un birebir aynısıdır.
   */
  current: CostStatusResult;
}

export function createDefaultCostInput(): CostApproachInput {
  return {
    category: '',
    general: { name: '', il: '', ilce: '', mahalle: '', ada: '', parsel: '' },
    parcelArea: null,
    netParcelArea: null,
    landUnitValue: 0,
    fromKml: false,
    buildings: [],
    adjustmentType: 'none',
    adjustmentAmount: 0,
    computeMevcutDurum: false,
    mevcutBuildings: [],
    mevcutAdjustmentAmount: null,
  };
}

function computeBuildingRows(rows: CostBuildingRow[]): { buildingRows: CostBuildingRowResult[]; buildingsValue: number } {
  const buildingRows: CostBuildingRowResult[] = rows.map((b) => {
    const cls = YAPI_SINIFLARI.find((c) => c.code === b.buildingClassCode);
    const baseUnitCost = cls?.unitCost ?? 0;
    const overridden = b.unitCostOverride != null;
    const effectiveUnitCost = overridden ? b.unitCostOverride! : baseUnitCost;
    const dep = Math.min(100, Math.max(0, b.depreciationPct));
    const buildingValue = Math.round(Math.max(0, b.area) * Math.max(0, effectiveUnitCost) * (dep > 0 ? dep / 100 : 1));
    return { ...b, effectiveUnitCost, buildingValue, overridden };
  });
  const buildingsValue = buildingRows.reduce((s, b) => s + b.buildingValue, 0);
  return { buildingRows, buildingsValue };
}

function computeStatus(landValue: number, buildingRows: CostBuildingRow[], adjustmentType: AdjustmentType, adjustmentAmount: number): CostStatusResult {
  const { buildingRows: rows, buildingsValue } = computeBuildingRows(buildingRows);
  const adjustmentValue = adjustmentType === 'none' ? 0 : Math.max(0, adjustmentAmount);
  const totalValue = landValue + buildingsValue + adjustmentValue;
  const totalValueRounded = Math.round(totalValue / 5000) * 5000;
  return { buildingRows: rows, buildingsValue, adjustmentValue, totalValue, totalValueRounded };
}

export function analyzeCostApproach(input: CostApproachInput): CostApproachResult {
  const warnings: string[] = [];
  const netArea = Math.max(0, input.netParcelArea ?? 0);
  const landValue = Math.round(netArea * Math.max(0, input.landUnitValue));

  const legal = computeStatus(landValue, input.buildings, input.adjustmentType, input.adjustmentAmount);

  // Mevcut Durum: opsiyon kapalıysa ya da satır girilmemişse Yasal Durum'un aynısı.
  const hasMevcutOverride = input.computeMevcutDurum && input.mevcutBuildings.length > 0;
  const current = hasMevcutOverride
    ? computeStatus(
        landValue,
        input.mevcutBuildings,
        input.adjustmentType,
        input.mevcutAdjustmentAmount ?? input.adjustmentAmount,
      )
    : legal;

  if (netArea <= 0) warnings.push('Net Arsa Alanı giriniz.');
  if (input.landUnitValue <= 0) warnings.push('Arsa m² Birim Değeri giriniz.');
  if (legal.buildingRows.length === 0) warnings.push('En az bir yapı eklemeniz önerilir (yalnız arsa değeri hesaplanıyor).');

  return { landValue, ...legal, warnings, current };
}
