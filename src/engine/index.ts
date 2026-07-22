/** Motor giriş noktası — tüm analizi tek çağrıda üretir. */
import type { ProjectInput, AnalysisResult, CapacityResult } from './types';
import { computeCapacity } from './capacity';
import { computeApartment } from './apartment';
import { computeFinancial, computeShare } from './financial';
import { buildAdvice } from './advisor';
import { buildApartmentAdvice } from './apartmentAdvisor';

export * from './types';
export { computeCapacity } from './capacity';
export { computeApartment, floorsFromHmax } from './apartment';
export { computeFinancial, computeShare } from './financial';
export { buildAdvice } from './advisor';
export { buildApartmentAdvice } from './apartmentAdvisor';

export function analyze(input: ProjectInput): AnalysisResult {
  if (input.housingType === 'apartman-3-8') return analyzeApartment(input);

  const capacity = computeCapacity(input.parcel, input.zoning, input.emsal, input.villa);
  const financial = computeFinancial(input.parcel, capacity, input.cost, input.site, input.sales, input.residual);
  const share = computeShare(capacity, financial, input.share);
  const advice = buildAdvice(
    input.parcel, input.emsal, input.cost, input.site, input.residual,
    capacity, financial, share, input.share.enabled,
  );
  return { capacity, financial, share, advice };
}

/** 3-8 katlı bina hattı: kat tablosu kapasitesi + kat tipi bazlı gelir. */
function analyzeApartment(input: ProjectInput): AnalysisResult {
  const apartment = computeApartment(input.parcel, input.zoning, input.apartment);

  /* Finansal motorun beklediği kapasite görünümü — villa alanları nötr */
  const capacity: CapacityResult = {
    footprintArea: apartment.footprintArea,
    emsalArea: apartment.emsalArea,
    extraArea: apartment.extraSaleableArea,
    atticArea: apartment.areaByKind.piyes,
    basementArea: apartment.areaByKind.bodrum,
    emsalConsumedByExtras: 0,
    aboveGroundArea: apartment.areaByKind.zemin + apartment.areaByKind.normal,
    totalArea: apartment.totalArea,
    saleableArea: apartment.saleableTotal,
    gardenArea: apartment.gardenArea,
    extraFloorsShare: apartment.totalArea > 0
      ? (apartment.areaByKind.bodrum + apartment.areaByKind.piyes) / apartment.totalArea : 0,
    unitCount: 0, areaPerUnit: 0,
    floorsAboveGround: 1 + apartment.normalFloorCount,
    areaPerFloor: 0, floorFits: true, minFloorsNeeded: 0,
    warnings: apartment.warnings,
  };

  const p = input.sales.apt;
  const buildingRevenue =
    apartment.saleableByKind.bodrum * p.bodrum +
    apartment.saleableByKind.zemin * p.zemin +
    apartment.saleableByKind.normal * p.normal +
    apartment.saleableByKind.piyes * p.piyes;

  const financial = computeFinancial(
    input.parcel, capacity, input.cost, input.site, input.sales, input.residual, buildingRevenue,
  );
  const share = computeShare(capacity, financial, input.share);
  const advice = buildApartmentAdvice(
    input.apartment, apartment, input.cost, input.sales, input.residual,
    financial, share, input.share.enabled,
  );
  return { capacity, financial, share, advice, apartment };
}
