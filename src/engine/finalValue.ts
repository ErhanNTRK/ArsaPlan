/**
 * NİHAİ ARSA DEĞERİ — hangi yöntemin sonucunun "esas değer" olarak raporlanacağı.
 * Ekran ana kutusu, Özet, PDF ve Excel aynı kararı bu dosyadan alır; böylece hiçbiri ayrışmaz.
 *
 * Varsayılan (kullanıcı seçmediyse): indirgeme girilmişse İNDİRGEMELİ Gelir Projeksiyonu,
 * girilmemişse klasik Gelir Projeksiyonu. Birden fazla yöntem varsa kullanıcı seçer;
 * ya da değeri elle girer.
 */
import type { ProjectInput, AnalysisResult } from './types';

export type FinalMethod = NonNullable<ProjectInput['finalMethod']>;

export interface FinalOption {
  value: FinalMethod;
  /** Kısa ad: "İndirgemeli Gelir Projeksiyonu" */
  name: string;
  /** Büyük harfli ana kutu etiketi */
  label: string;
  /** Hesaplanan tutar; elle girişte henüz değer yoksa null */
  amount: number | null;
}

export const isDiscountOn = (input: ProjectInput) =>
  (input.residual.projectMonths ?? 0) > 0 && (input.residual.timeDiscountRate ?? 0) > 0;

export function finalOptions(input: ProjectInput, r: AnalysisResult): FinalOption[] {
  const f = r.financial, s = r.share;
  const disc = isDiscountOn(input);
  const manual = input.finalManualValue != null && input.finalManualValue > 0 ? input.finalManualValue : null;
  const list: FinalOption[] = [];
  list.push({ value: 'gelir', name: 'Gelir Projeksiyonu', label: 'ARSA DEĞERİ (GELİR PROJEKSİYONU)', amount: f.residualLandValueRounded });
  if (disc) list.push({ value: 'gelir-indirgemeli', name: 'İndirgemeli Gelir Projeksiyonu', label: 'ARSA DEĞERİ (İNDİRGEMELİ GELİR PROJEKSİYONU)', amount: f.discountedLandValueRounded });
  if (input.share.enabled) {
    list.push({ value: 'kat-karsiligi', name: 'Kat Karşılığı', label: 'ARSA DEĞERİ (KAT KARŞILIĞI)', amount: s.shareLandValueRounded });
    if (disc) list.push({ value: 'kat-karsiligi-indirgemeli', name: 'İndirgemeli Kat Karşılığı', label: 'ARSA DEĞERİ (İNDİRGEMELİ KAT KARŞILIĞI)', amount: s.discountedShareLandValueRounded });
  }
  list.push({ value: 'manuel', name: 'Elle Değer Girişi', label: 'ARSA DEĞERİ (KULLANICI BELİRLEDİ)', amount: manual });
  return list;
}

/** Hesaplanan (elle giriş hariç) yöntem sayısı — 2 ve üstüyse kullanıcıya seçim sorulur. */
export const computedMethodCount = (input: ProjectInput, r: AnalysisResult) =>
  finalOptions(input, r).filter((o) => o.value !== 'manuel').length;

export function defaultMethod(input: ProjectInput): FinalMethod {
  return isDiscountOn(input) ? 'gelir-indirgemeli' : 'gelir';
}

export interface FinalResolved {
  method: FinalMethod;
  name: string;
  label: string;
  value: number;
  /** Elle giriş seçili ama geçerli bir tutar girilmemiş (varsayılana düşülmüştür). */
  manualMissing: boolean;
}

export function resolveFinal(input: ProjectInput, r: AnalysisResult): FinalResolved {
  const opts = finalOptions(input, r);
  const want = input.finalMethod ?? defaultMethod(input);
  let opt = opts.find((o) => o.value === want);
  let manualMissing = false;
  if (!opt || opt.amount == null) {
    manualMissing = want === 'manuel';
    opt = opts.find((o) => o.value === defaultMethod(input))!;
  }
  return { method: opt.value, name: opt.name, label: opt.label, value: opt.amount as number, manualMissing };
}
