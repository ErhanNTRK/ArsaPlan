/** Motor giriş noktası — tüm analizi tek çağrıda üretir. */
import type { ProjectInput, AnalysisResult } from './types';
import { computeVillaCapacity } from './capacity';
import { computeFinancial, computeShare } from './financial';
import { buildAdvice } from './advisor';

export * from './types';
export { computeEnvelope, computeVillaCapacity } from './capacity';
export { computeFinancial, computeShare } from './financial';
export { buildAdvice } from './advisor';

export function analyze(input: ProjectInput): AnalysisResult {
  const capacity = computeVillaCapacity(input.parcel, input.zoning, input.villa, input.emsal);
  const financial = computeFinancial(input.parcel, capacity, input.cost, input.site, input.sales, input.residual);
  const share = computeShare(capacity, financial, input.share);
  const advice = buildAdvice(
    input.parcel, input.zoning, input.villa, input.emsal, input.cost, input.site, input.residual,
    capacity, financial, share,
  );
  return { capacity, financial, share, advice };
}
