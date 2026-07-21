/**
 * FİNANSAL MOTOR — Artık Değer (Residual Land Value)
 *   Hasılat − Toplam Maliyet − Müteahhit Kârı = Arsa Değeri
 * Satış ve maliyet, TOPLAM İNŞAAT ALANI üzerinden yürütülür; kat ayrımı yapılmaz.
 */
import type {
  CapacityResult, CostInput, SiteWorks, SalesInput, ResidualInput, ShareInput,
  FinancialResult, ShareResult, Parcel,
} from './types';

const safeDiv = (a: number, b: number) => (b === 0 ? 0 : a / b);

export function computeFinancial(
  parcel: Parcel, capacity: CapacityResult, cost: CostInput,
  site: SiteWorks, sales: SalesInput, residual: ResidualInput,
): FinancialResult {
  const effectiveUnitCost = cost.unitCost * (1 + cost.inflationRate);
  const constructionCost = capacity.totalArea * effectiveUnitCost;

  const landscapeArea = site.landscapeArea > 0 ? site.landscapeArea : capacity.gardenArea;
  const landscapeCost = landscapeArea * site.landscapeUnitCost;
  const extrasCost = constructionCost * cost.extrasRate;

  const baseCost = constructionCost + landscapeCost + extrasCost;
  const financeCost = baseCost * Math.max(0, residual.financeRateOfCost);
  const totalCost = baseCost + financeCost;

  const buildingRevenue = capacity.saleableArea * sales.unitPrice;
  const gardenRevenue = site.gardenPricePerM2 > 0 ? capacity.gardenArea * site.gardenPricePerM2 : 0;
  const revenue = buildingRevenue + gardenRevenue;

  const developerProfit = revenue * residual.profitRate;
  const residualLandValue = revenue - totalCost - developerProfit;

  const denom = revenue * (1 - residual.profitRate);
  const breakEvenFactor = denom > 0 ? totalCost / denom : 0;

  return {
    effectiveUnitCost, constructionCost, landscapeCost, extrasCost, financeCost, totalCost,
    buildingRevenue, gardenRevenue, revenue, developerProfit, residualLandValue,
    landUnitValue: safeDiv(residualLandValue, parcel.area),
    landToRevenue: safeDiv(residualLandValue, revenue),
    roi: safeDiv(developerProfit, totalCost + residualLandValue),
    breakEvenFactor,
    safetyMargin: breakEvenFactor > 0 ? 1 - breakEvenFactor : 0,
    costPerSaleableM2: safeDiv(totalCost, capacity.saleableArea),
  };
}

export function computeShare(
  capacity: CapacityResult, financial: FinancialResult, share: ShareInput,
): ShareResult {
  const ownerShare = Math.min(1, Math.max(0, share.ownerShare));
  const contractorShare = 1 - ownerShare;
  const balancedShare = safeDiv(financial.residualLandValue, financial.revenue);
  /** Kat karşılığı yöntemine göre arsa değeri = arsa sahibi payının hasılat karşılığı */
  const shareLandValue = financial.revenue * ownerShare;
  const difference = shareLandValue - financial.residualLandValue;
  const differenceRate = safeDiv(difference, financial.residualLandValue);

  /* İki yöntem %5 bandındaysa "yakın" kabul edilir — biri diğerinden üstün değildir. */
  let verdict: ShareResult['verdict'] = 'yakin';
  if (differenceRate > 0.05) verdict = 'kat-karsiligi-yuksek';
  else if (differenceRate < -0.05) verdict = 'gelir-yontemi-yuksek';

  return {
    ownerShare, contractorShare,
    ownerUnits: capacity.unitCount * ownerShare,
    contractorUnits: capacity.unitCount * contractorShare,
    ownerArea: capacity.saleableArea * ownerShare,
    contractorArea: capacity.saleableArea * contractorShare,
    shareLandValue,
    contractorValue: financial.revenue * contractorShare,
    contractorNet: financial.revenue * contractorShare - financial.totalCost,
    balancedShare, difference, differenceRate, verdict,
  };
}
