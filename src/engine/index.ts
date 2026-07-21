/** Motor giriş noktası — tüm analizi tek çağrıda üretir. */
import type { ProjectInput, AnalysisResult } from './types';
import { computeCapacity } from './capacity';
import { computeFinancial, computeShare } from './financial';
import { buildAdvice } from './advisor';

export * from './types';
export { computeCapacity } from './capacity';
export { computeFinancial, computeShare } from './financial';
export { buildAdvice } from './advisor';

export function analyze(input: ProjectInput): AnalysisResult {
  const capacity = computeCapacity(input.parcel, input.zoning, input.emsal, input.villa);
  const financial = computeFinancial(input.parcel, capacity, input.cost, input.site, input.sales, input.residual);
  const share = computeShare(capacity, financial, input.share);
  const advice = buildAdvice(
    input.parcel, input.emsal, input.cost, input.site, input.residual,
    capacity, financial, share, input.share.enabled,
  );
  return { capacity, financial, share, advice };
}
