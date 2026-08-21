/**
 * KAPASİTE MOTORU (v4)
 *
 * Akış tek yönlüdür, döngüsel bağımlılık yoktur:
 *   taban oturumu → emsale dahil alan → emsal dışı satılabilir
 *   → çatı katı → bodrum kat → TOPLAM İNŞAAT ALANI → villa dağılımı
 */
import type { Parcel, Zoning, EmsalOptions, VillaConfig, CapacityResult } from './types';

const safeDiv = (a: number, b: number) => (b === 0 ? 0 : a / b);
const m2 = (v: number) => `${Math.round(v).toLocaleString('tr-TR')} m²`;

export function computeCapacity(
  parcel: Parcel, zoning: Zoning, emsal: EmsalOptions, villa: VillaConfig,
): CapacityResult {
  const warnings: string[] = [];
  const direct = zoning.mode === 'dogrudan';

  /* ── 1) İmar hakkı ── */
  const emsalArea = direct
    ? Math.max(0, zoning.directEmsalArea)
    : (zoning.kaks != null ? parcel.netArea * zoning.kaks : 0);

  /* TAKS girilmemişse (ör. imar durumunda yalnız Emsal + Yençok varsa, TAKS
     hiç belirtilmemişse), kullanıcının girdiği "Kat Sayısı" (villa.floorsAboveGround)
     ve Emsal Alanı'ndan taban oturumu otomatik türetilir:
       Taban Oturumu = (Emsal Alanı − çatı katının sabit m² payı varsa)
                        ÷ (Kat Sayısı + çatı katı oranı [emsale dahil ve oran modundaysa])
     Kullanıcı önerilen bu değeri (zoning.footprintOverride ile) ELLE değiştirirse,
     bu sefer TERSİNE çözülür: kat sayısı, girilen yeni taban oturumuyla emsali
     tam tüketecek şekilde otomatik yeniden hesaplanır (effectiveFloorsAboveGround). */
  let footprintArea: number;
  let effectiveFloorsAboveGround: number | null = null;
  let footprintSuggested = false;
  if (direct) {
    footprintArea = Math.max(0, zoning.directFootprint);
  } else if (zoning.taks != null) {
    footprintArea = parcel.netArea * zoning.taks;
  } else if (emsalArea > 0 && villa.floorsAboveGround > 0) {
    const desiredFloors = Math.max(1, Math.round(villa.floorsAboveGround));
    const atticFactorOran = (emsal.hasAttic && emsal.atticInEmsal && emsal.atticMode === 'oran') ? Math.max(0, emsal.atticRate) : 0;
    const atticFixed = (emsal.hasAttic && emsal.atticInEmsal && emsal.atticMode === 'manuel') ? Math.max(0, emsal.atticArea) : 0;
    const emsalNetOfFixedAttic = Math.max(0, emsalArea - atticFixed);
    if (zoning.footprintOverride != null && zoning.footprintOverride > 0) {
      footprintArea = zoning.footprintOverride;
      effectiveFloorsAboveGround = atticFactorOran > 0
        ? safeDiv(emsalNetOfFixedAttic, footprintArea) - atticFactorOran
        : safeDiv(emsalNetOfFixedAttic, footprintArea);
    } else {
      footprintArea = safeDiv(emsalNetOfFixedAttic, desiredFloors + atticFactorOran);
      footprintSuggested = true;
    }
  } else {
    footprintArea = 0;
  }

  if (emsalArea <= 0) {
    warnings.push(direct
      ? 'Emsale dahil toplam inşaat alanı girilmedi.'
      : 'KAKS girilmediği için emsale dahil alan hesaplanamıyor.');
  }
  if (footprintArea <= 0) {
    warnings.push(direct
      ? 'Taban oturumu girilmedi; çatı katı oranı ve bahçe alanı hesaplanamıyor.'
      : (zoning.taks != null
          ? 'TAKS girilmediği için taban oturumu hesaplanamıyor.'
          : 'TAKS girilmedi ve Kat Sayısı (0) belirtilmedi; taban oturumu otomatik türetilemiyor — Kat Sayısı alanını doldurun.'));
  }
  if (footprintSuggested) {
    warnings.push(
      `Taban oturumu, TAKS girilmediği için Emsal Alanı ve girdiğiniz Kat Sayısından (${Math.max(1, Math.round(villa.floorsAboveGround))}) ` +
      `otomatik türetildi: ${m2(footprintArea)}. Gerçek imar durumunuzdaki TAKS ile teyit edin; isterseniz ` +
      `"Taban Oturumu (elle)" alanına kendi değerinizi girerek bu öneriyi değiştirebilirsiniz.`,
    );
  }
  if (effectiveFloorsAboveGround != null) {
    warnings.push(
      `Taban oturumunu elle ${m2(footprintArea)} olarak değiştirdiniz — emsali tam tüketmek için gereken kat ` +
      `sayısı buna göre otomatik ${effectiveFloorsAboveGround.toFixed(1)} kata güncellendi (girdiğiniz ` +
      `${Math.max(1, Math.round(villa.floorsAboveGround))} kat yerine).`,
    );
  }

  /* ── 2) Emsal dışı satılabilir alan (emsale dahil alanın yüzdesi) ── */
  const extraArea = !emsal.hasExtra ? 0
    : emsal.extraMode === 'oran'
      ? emsalArea * Math.max(0, emsal.extraRate)
      : Math.max(0, emsal.extraArea);

  /* ── 3) Çatı katı (taban oturumunun yüzdesi) ── */
  const atticArea = !emsal.hasAttic ? 0
    : emsal.atticMode === 'oran'
      ? footprintArea * Math.max(0, emsal.atticRate)
      : Math.max(0, emsal.atticArea);

  /* ── 4) Bodrum kat — tabanın yüzdesi (varsayılan %100) veya elle ── */
  const basementArea = !emsal.hasBasement ? 0
    : emsal.basementMode === 'oran'
      ? footprintArea * Math.max(0, emsal.basementRate)
      : Math.max(0, emsal.basementArea);

  /* ── 5) Toplam inşaat alanı ──
     Emsale dahil kalemler emsalin İÇİNDEN yer alır, toplamı artırmaz.
     Emsal dışı kalemler toplama eklenir. */
  const emsalConsumedByExtras =
    (emsal.hasAttic && emsal.atticInEmsal ? atticArea : 0) +
    (emsal.hasBasement && emsal.basementInEmsal ? basementArea : 0);

  const aboveGroundArea = emsalArea - emsalConsumedByExtras;
  if (aboveGroundArea < 0) {
    warnings.push(
      `Emsale dahil edilen çatı ve bodrum alanları (${m2(emsalConsumedByExtras)}), ` +
      `emsale dahil alanı (${m2(emsalArea)}) aşıyor. Zemin üstü katlara alan kalmıyor.`,
    );
  }

  const outsideEmsal = extraArea +
    (emsal.hasAttic && !emsal.atticInEmsal ? atticArea : 0) +
    (emsal.hasBasement && !emsal.basementInEmsal ? basementArea : 0);

  const totalArea = emsalArea + outsideEmsal;
  const saleableArea = totalArea;          // satış toplam inşaat alanı üzerinden
  const gardenArea = Math.max(0, parcel.netArea - footprintArea);
  const extraFloorsShare = totalArea > 0 ? (atticArea + basementArea) / totalArea : 0;

  /* ── 6) Villa dağılımı (opsiyonel) ── */
  const unitCount = Math.max(0, Math.floor(villa.unitCount));
  const areaPerUnit = unitCount > 0 ? safeDiv(totalArea, unitCount) : 0;

  const floorsAboveGround = effectiveFloorsAboveGround != null
    ? Math.max(1, Math.round(effectiveFloorsAboveGround))
    : Math.max(1, Math.round(villa.floorsAboveGround));
  const usableAboveGround = Math.max(0, aboveGroundArea);
  const areaPerFloor = safeDiv(usableAboveGround, floorsAboveGround);
  const floorFits = footprintArea <= 0 || areaPerFloor <= footprintArea + 0.5;
  const minFloorsNeeded = footprintArea > 0 ? Math.ceil(usableAboveGround / footprintArea) : 0;

  if (!floorFits && footprintArea > 0) {
    warnings.push(
      `Zemin üstü ${m2(usableAboveGround)} alan, ${floorsAboveGround} katta ${m2(areaPerFloor)} kat alanı gerektiriyor; ` +
      `taban oturumu ise ${m2(footprintArea)}. Bu yerleşim için en az ${minFloorsNeeded} kat gerekir.`,
    );
  }
  if (unitCount > 0 && areaPerUnit < 40) {
    warnings.push(`Villa başına ${m2(areaPerUnit)} düşüyor; villa adedini azaltmayı değerlendiriniz.`);
  }

  return {
    footprintArea, footprintSuggested, effectiveFloorsAboveGround, emsalArea, extraArea, atticArea, basementArea,
    emsalConsumedByExtras, aboveGroundArea: usableAboveGround,
    totalArea, saleableArea, gardenArea, extraFloorsShare,
    unitCount, areaPerUnit, floorsAboveGround, areaPerFloor, floorFits, minFloorsNeeded,
    warnings,
  };
}
