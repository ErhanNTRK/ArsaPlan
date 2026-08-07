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
}

export interface CostBuildingRowResult extends CostBuildingRow {
  effectiveUnitCost: number;
  buildingValue: number; // area × effectiveUnitCost × (depreciationPct/100)
  overridden: boolean;
}

export interface CostApproachResult {
  landValue: number;
  buildingRows: CostBuildingRowResult[];
  buildingsValue: number;
  adjustmentValue: number;
  totalValue: number;
  totalValueRounded: number; // 5.000'e yuvarlanmış
  warnings: string[];
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
  };
}

export function analyzeCostApproach(input: CostApproachInput): CostApproachResult {
  const warnings: string[] = [];
  const netArea = Math.max(0, input.netParcelArea ?? 0);
  const landValue = Math.round(netArea * Math.max(0, input.landUnitValue));

  const buildingRows: CostBuildingRowResult[] = input.buildings.map((b) => {
    const cls = YAPI_SINIFLARI.find((c) => c.code === b.buildingClassCode);
    const baseUnitCost = cls?.unitCost ?? 0;
    const overridden = b.unitCostOverride != null;
    const effectiveUnitCost = overridden ? b.unitCostOverride! : baseUnitCost;
    const dep = Math.min(100, Math.max(0, b.depreciationPct));
    const buildingValue = Math.round(Math.max(0, b.area) * Math.max(0, effectiveUnitCost) * (dep > 0 ? dep / 100 : 1));
    return { ...b, effectiveUnitCost, buildingValue, overridden };
  });
  const buildingsValue = buildingRows.reduce((s, b) => s + b.buildingValue, 0);

  const adjustmentValue = input.adjustmentType === 'none' ? 0 : Math.max(0, input.adjustmentAmount);

  const totalValue = landValue + buildingsValue + adjustmentValue;
  const totalValueRounded = Math.round(totalValue / 5000) * 5000;

  if (netArea <= 0) warnings.push('Net Arsa Alanı giriniz.');
  if (input.landUnitValue <= 0) warnings.push('Arsa m² Birim Değeri giriniz.');
  if (buildingRows.length === 0) warnings.push('En az bir yapı eklemeniz önerilir (yalnız arsa değeri hesaplanıyor).');

  return { landValue, buildingRows, buildingsValue, adjustmentValue, totalValue, totalValueRounded, warnings };
}
