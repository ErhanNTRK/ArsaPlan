/**
 * TARIMSAL ÜRÜN GELİR MOTORU (saf).
 * Değer mantığı (Salih, dükkan analojisi): yıllık net gelir × amorti yılı = değer.
 * Karma parselde ürün satırları alan bütçesini paylaşır (Ekili: m², Dikili: ağaç adedi).
 */
export type AgriKind = 'ekili' | 'dikili';

export interface CropRow {
  id: string;
  kind: AgriKind;
  name: string;
  /** ekili: ayrılan alan m² · dikili: kullanılmaz (ağaç adedi esas) */
  areaM2: number;
  /** dikili: ağaç adedi */
  treeCount: number;
  /** kg/dönüm (ekili) veya kg/ağaç (dikili) */
  yieldPerUnit: number;
  price: number;        // TL/kg
  expensePct: number;   // %
}

export interface AgriInput {
  parcelArea: number;        // m² (elle veya KML'den)
  arablePct: number;         // ekilebilir alan oranı %
  rows: CropRow[];
  amortYears: number;        // bölge amorti yılı (dükkan mantığı)
}

export interface CropRowResult extends CropRow {
  units: number;             // dönüm veya ağaç
  gross: number;
  expense: number;
  net: number;
}

export interface AgriResult {
  arableArea: number;
  allocatedArea: number;     // ekili satırların ayırdığı m²
  areaOk: boolean;
  rows: CropRowResult[];
  totalGross: number;
  totalNet: number;
  value: number;             // totalNet × amortYears
  warnings: string[];
}

const R = (v: number) => Math.round(v * 100) / 100;

/** Ağaç aralığından adet önerisi. edgeFull=true → kenardan TAM aralık payı (kare parsel varsayımı). */
export function suggestTreeCount(areaM2: number, spacingA: number, spacingB: number, edgeFull = false): number {
  if (areaM2 <= 0 || spacingA <= 0 || spacingB <= 0) return 0;
  if (!edgeFull) return Math.floor(areaM2 / (spacingA * spacingB));
  const side = Math.sqrt(areaM2);
  const rows = Math.floor((side - 2 * spacingA) / spacingA) + 1;
  const cols = Math.floor((side - 2 * spacingB) / spacingB) + 1;
  return Math.max(0, rows) * Math.max(0, cols);
}

export function computeAgri(input: AgriInput): AgriResult {
  const warnings: string[] = [];
  const arableArea = R(input.parcelArea * Math.min(100, Math.max(0, input.arablePct)) / 100);
  let allocatedArea = 0;

  const rows: CropRowResult[] = input.rows.map((r) => {
    const units = r.kind === 'ekili' ? Math.max(0, r.areaM2) / 1000 : Math.max(0, r.treeCount);
    if (r.kind === 'ekili') allocatedArea += Math.max(0, r.areaM2);
    const gross = R(units * r.yieldPerUnit * r.price);
    const expense = R(gross * Math.min(100, Math.max(0, r.expensePct)) / 100);
    return { ...r, units: R(units), gross, expense, net: R(gross - expense) };
  });

  allocatedArea = R(allocatedArea);
  const areaOk = allocatedArea <= arableArea + 0.01;
  if (!areaOk) warnings.push(`Ürünlere ayrılan alan (${allocatedArea.toLocaleString('tr-TR')} m²) ekilebilir alanı (${arableArea.toLocaleString('tr-TR')} m²) aşıyor.`);

  const totalGross = R(rows.reduce((s, x) => s + x.gross, 0));
  const totalNet = R(rows.reduce((s, x) => s + x.net, 0));
  return {
    arableArea, allocatedArea, areaOk, rows, totalGross, totalNet,
    value: R(totalNet * Math.max(0, input.amortYears)),
    warnings,
  };
}
