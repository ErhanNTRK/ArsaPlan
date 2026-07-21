/**
 * KAPASİTE MOTORU
 *
 * İki yöntem destekler:
 *  1) TAKS / KAKS / Hmax  (öncelikli)
 *  2) Doğrudan toplam inşaat alanı ve/veya taban oturumu girişi
 * Her iki yöntemde de çekme mesafelerinden üretilen yapılaşma zarfı,
 * fiziksel üst sınır olarak devreye girer.
 *
 * Kritik ilke: villa adedi bir TAHMİNDİR — tek sayı değil aralık verilir ve
 * hangi kısıtın bağlayıcı olduğu daima açıkça bildirilir.
 */
import type {
  Parcel, Zoning, VillaConfig, EmsalOptions, EnvelopeResult, CapacityResult, BindingConstraint,
} from './types';

const safeDiv = (a: number, b: number) => (b === 0 ? 0 : a / b);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Çekme mesafeleri sonrası yapılaşabilir zarf */
export function computeEnvelope(parcel: Parcel, zoning: Zoning): EnvelopeResult {
  const warnings: string[] = [];
  const hasGeometry = zoning.useSetbacks && parcel.width > 0 && parcel.depth > 0;

  if (!zoning.useSetbacks) {
    return { buildableWidth: 0, buildableDepth: 0, envelopeArea: 0, envelopeRatio: 0, hasGeometry: false, geometryDeviation: 0, warnings };
  }
  if (!hasGeometry) {
    warnings.push('Parsel en/boy girilmedi. Çekme mesafeleri hesaba katılamıyor; kapasite yalnızca imar hakları üzerinden bulunacak.');
    return { buildableWidth: 0, buildableDepth: 0, envelopeArea: 0, envelopeRatio: 0, hasGeometry: false, geometryDeviation: 0, warnings };
  }

  const rectArea = parcel.width * parcel.depth;
  const geometryDeviation = parcel.area > 0 ? (rectArea - parcel.area) / parcel.area : 0;
  if (Math.abs(geometryDeviation) > 0.1) {
    warnings.push(
      `Girilen en × boy (${Math.round(rectArea)} m²) tapu alanından %${Math.abs(geometryDeviation * 100).toFixed(0)} sapıyor. ` +
      'Parsel dikdörtgen değilse bu normaldir; zarf hesabı yaklaşık kabul edilmelidir.',
    );
  }

  const buildableWidth = Math.max(0, parcel.width - zoning.setbackSideLeft - zoning.setbackSideRight);
  const buildableDepth = Math.max(0, parcel.depth - zoning.setbackFront - zoning.setbackRear);
  const envelopeArea = buildableWidth * buildableDepth;

  if (envelopeArea <= 0) {
    warnings.push('Çekme mesafeleri parselin tamamını kapsıyor — bu koşullarda yapılaşma mümkün görünmüyor.');
  } else if (buildableWidth < 6 || buildableDepth < 6) {
    warnings.push(`Yapılaşma zarfı çok dar (${buildableWidth.toFixed(1)} m × ${buildableDepth.toFixed(1)} m); uygulanabilir yerleşim kurmak güçtür.`);
  }

  return { buildableWidth, buildableDepth, envelopeArea, envelopeRatio: safeDiv(envelopeArea, parcel.area), hasGeometry: true, geometryDeviation, warnings };
}

export function computeVillaCapacity(
  parcel: Parcel, zoning: Zoning, villa: VillaConfig, emsal: EmsalOptions,
): CapacityResult {
  const envelope = computeEnvelope(parcel, zoning);
  const warnings = [...envelope.warnings];
  const direct = zoning.mode === 'dogrudan';

  /* ── Taban ve emsal üst sınırları ── */
  const taksLimit = !direct && zoning.taks != null ? parcel.netArea * zoning.taks
    : direct && zoning.directFootprint > 0 ? zoning.directFootprint : null;
  const kaksLimit = !direct && zoning.kaks != null ? parcel.netArea * zoning.kaks
    : direct && zoning.directTotalArea > 0 ? zoning.directTotalArea : null;

  const efficiency = clamp(villa.layoutEfficiency, 0.3, 0.95);
  const layoutFootprint = envelope.hasGeometry ? envelope.envelopeArea * efficiency : 0;

  const footprintCandidates: Array<{ value: number; source: BindingConstraint }> = [];
  if (taksLimit != null) footprintCandidates.push({ value: taksLimit, source: direct ? 'DOĞRUDAN TABAN' : 'TAKS' });
  if (envelope.hasGeometry) footprintCandidates.push({ value: layoutFootprint, source: 'ÇEKME MESAFESİ' });
  if (footprintCandidates.length === 0) {
    warnings.push('Taban alanını belirleyecek veri yok: TAKS, doğrudan taban oturumu veya parsel en/boy bilgilerinden en az biri gereklidir.');
  }

  const footprintWinner = footprintCandidates.length
    ? footprintCandidates.reduce((a, b) => (a.value <= b.value ? a : b))
    : { value: 0, source: 'YOK' as BindingConstraint };
  const effectiveFootprint = footprintWinner.value;

  /* KAT MANTIĞI: girilen kat adedi bodrumu İÇERİR, çatı arasını içermez.
     Zemin üstü kat = girilen kat − (bodrum varsa 1). */
  const enteredFloors = Math.max(1, Math.round(villa.floorsPerVilla));
  const aboveGroundFloors = Math.max(1, enteredFloors - (emsal.hasBasement ? 1 : 0));
  const floorsPerUnit = aboveGroundFloors;
  if (emsal.hasBasement && enteredFloors < 2) {
    warnings.push('Bodrum var denildiği hâlde kat adedi 1 girilmiş. Bodrum + zemin için en az 2 kat gereklidir; zemin üstü 1 kat kabul edildi.');
  }

  /* ══ Villa kurgusu ══
     'alan' modunda villa büyüklüğü verilir, adet hesaplanır.
     'adet' modunda villa sayısı verilir, villa büyüklüğü kapasiteden türetilir. */
  let grossPerVilla = villa.grossPerVilla;
  let unitCount = 0;
  let binding: BindingConstraint = 'YOK';
  let countByFootprint = 0;
  let countByEmsal: number | null = null;
  let basementPerUnit = 0;
  let atticPerUnit = 0;
  let emsalPerUnit = 0;

  const extraSale = Math.max(0, emsal.extraSaleablePerUnit);
  const extras = (fp: number) => {
    const b = emsal.hasBasement ? (emsal.basementPerUnit > 0 ? emsal.basementPerUnit : fp) : 0;
    const a = emsal.hasAttic ? (emsal.atticPerUnit > 0 ? emsal.atticPerUnit : fp * 0.4) : 0;
    return {
      b, a,
      inEmsal: (emsal.hasBasement && emsal.basementInEmsal ? b : 0) + (emsal.hasAttic && emsal.atticInEmsal ? a : 0),
      /** emsal dışı olup satılabilir sayılan alanlar */
      outsideSaleable:
        (emsal.hasBasement && emsal.basementSaleable && !emsal.basementInEmsal ? b : 0) +
        (emsal.hasAttic && emsal.atticSaleable && !emsal.atticInEmsal ? a : 0) +
        extraSale,
    };
  };

  if (villa.mode === 'adet') {
    const n = Math.max(0, Math.floor(villa.unitCountManual));
    unitCount = n;
    if (n > 0) {
      /**
       * Bodrum ve çatı arası otomatik boyutlanırken villa tabanına, taban da villa
       * alanına bağlıdır. Bu döngüsel ilişki tahminle çözülemez; doğrudan çözülür:
       *   emsal/villa = g + katsayı·g + sabit  →  g = (emsal/villa − sabit) / (1 + katsayı)
       * Böylece emsal hakkı eksiksiz kullanılır (eski sürümde fazla rezerve edilip boşa gidiyordu).
       */
      const bAutoCoef = emsal.hasBasement && emsal.basementPerUnit <= 0 ? 1 / floorsPerUnit : 0;
      const aAutoCoef = emsal.hasAttic && emsal.atticPerUnit <= 0 ? 0.4 / floorsPerUnit : 0;
      const bFix = emsal.hasBasement && emsal.basementPerUnit > 0 ? emsal.basementPerUnit : 0;
      const aFix = emsal.hasAttic && emsal.atticPerUnit > 0 ? emsal.atticPerUnit : 0;
      const coefInEmsal = (emsal.basementInEmsal ? bAutoCoef : 0) + (emsal.atticInEmsal ? aAutoCoef : 0);
      const fixInEmsal = (emsal.basementInEmsal ? bFix : 0) + (emsal.atticInEmsal ? aFix : 0);

      const grossFromEmsal = kaksLimit != null
        ? Math.max(0, (kaksLimit / n - fixInEmsal) / (1 + coefInEmsal))
        : Infinity;
      const grossFromFootprint = effectiveFootprint > 0
        ? (effectiveFootprint / n) * floorsPerUnit
        : Infinity;

      grossPerVilla = Math.min(grossFromFootprint, grossFromEmsal);
      if (!isFinite(grossPerVilla)) grossPerVilla = 0;
      binding = grossFromEmsal <= grossFromFootprint
        ? (direct ? 'DOĞRUDAN İNŞAAT ALANI' : 'KAKS')
        : footprintWinner.source;
      if (grossPerVilla <= 0) {
        warnings.push('Girilen villa adedi için kapasite yetersiz; adedi azaltınız veya imar haklarını kontrol ediniz.');
      }
    }
    const fp = safeDiv(grossPerVilla, floorsPerUnit);
    const e = extras(fp);
    basementPerUnit = e.b; atticPerUnit = e.a;
    emsalPerUnit = grossPerVilla + e.inEmsal;
    countByFootprint = fp > 0 ? Math.floor(effectiveFootprint / fp) : 0;
    countByEmsal = kaksLimit != null && emsalPerUnit > 0 ? Math.floor(kaksLimit / emsalPerUnit) : null;
  } else {
    const fp = safeDiv(grossPerVilla, floorsPerUnit);
    const e = extras(fp);
    basementPerUnit = e.b; atticPerUnit = e.a;
    emsalPerUnit = grossPerVilla + e.inEmsal;
    countByFootprint = fp > 0 ? Math.floor(effectiveFootprint / fp) : 0;
    countByEmsal = kaksLimit != null && emsalPerUnit > 0 ? Math.floor(kaksLimit / emsalPerUnit) : null;
    unitCount = footprintCandidates.length ? countByFootprint : (countByEmsal ?? 0);
    binding = footprintCandidates.length ? footprintWinner.source
      : (countByEmsal != null ? (direct ? 'DOĞRUDAN İNŞAAT ALANI' : 'KAKS') : 'YOK');
    if (countByEmsal != null && countByEmsal < unitCount) {
      unitCount = countByEmsal;
      binding = direct ? 'DOĞRUDAN İNŞAAT ALANI' : 'KAKS';
    }
    unitCount = Math.max(0, unitCount);
  }

  const footprintPerUnit = safeDiv(grossPerVilla, floorsPerUnit);
  const grossPerUnit = grossPerVilla + basementPerUnit + atticPerUnit + extraSale;

  /* ── Adet aralığı: yerleşim verimliliği ±8 puan ── */
  let rangeLow = unitCount, rangeHigh = unitCount;
  if (villa.mode === 'alan' && envelope.hasGeometry && footprintPerUnit > 0) {
    const capByOther = (footprintArea: number) => {
      let c = Math.floor(footprintArea / footprintPerUnit);
      if (taksLimit != null) c = Math.min(c, Math.floor(taksLimit / footprintPerUnit));
      if (countByEmsal != null) c = Math.min(c, countByEmsal);
      return Math.max(0, c);
    };
    rangeLow = capByOther(envelope.envelopeArea * clamp(efficiency - 0.08, 0.25, 0.95));
    rangeHigh = capByOther(envelope.envelopeArea * clamp(efficiency + 0.08, 0.3, 0.95));
  }

  /* ── Alan üretimi ── */
  /* Satılabilir alan = emsale konu satılabilir kısım + emsal dışı satılabilir kısım */
  const withinEmsalPerUnit = grossPerVilla
    + (emsal.hasAttic && emsal.atticSaleable && emsal.atticInEmsal ? atticPerUnit : 0)
    + (emsal.hasBasement && emsal.basementSaleable && emsal.basementInEmsal ? basementPerUnit : 0);
  const outsidePerUnit =
    (emsal.hasBasement && emsal.basementSaleable && !emsal.basementInEmsal ? basementPerUnit : 0) +
    (emsal.hasAttic && emsal.atticSaleable && !emsal.atticInEmsal ? atticPerUnit : 0) +
    extraSale;
  const saleablePerUnit = withinEmsalPerUnit + outsidePerUnit;

  const emsalArea = unitCount * emsalPerUnit;
  const basementArea = unitCount * basementPerUnit;
  const atticArea = unitCount * atticPerUnit;
  const extraSaleableArea = unitCount * extraSale;
  const grossArea = unitCount * grossPerUnit;
  const saleableArea = unitCount * saleablePerUnit;
  const saleableWithinEmsal = unitCount * withinEmsalPerUnit;
  const saleableOutsideEmsal = unitCount * outsidePerUnit;
  const footprintTotal = unitCount * footprintPerUnit;
  /* Bahçe/peyzaj alanı, toplam ZEMİN OTURUMU düşülerek bulunur.
     TAKS tanımlıysa yasal taban alanı hakkı esas alınır (fiili oturum bunun altında
     kalsa bile arada kalan alan yapılaşmaya ayrılmış sayılır); yoksa fiili oturum. */
  const groundCoverage = taksLimit != null && taksLimit > 0
    ? Math.max(taksLimit, footprintTotal)
    : footprintTotal;
  const gardenArea = Math.max(0, parcel.netArea - groundCoverage);

  /* Kullanılmayan kapasite ve somut öneri */
  const emsalLeftover = kaksLimit != null ? Math.max(0, kaksLimit - emsalArea) : 0;
  const footprintLeftover = effectiveFootprint > 0 ? Math.max(0, effectiveFootprint - footprintTotal) : 0;
  let suggestedGrossPerVilla: number | null = null;
  if (villa.mode === 'alan' && unitCount > 0 && emsalLeftover > 0.5 && emsalPerUnit > 0) {
    /* Aynı adette emsali tam kullanacak villa alanı (ekler oransal olduğu için bölerek) */
    const oran = emsalPerUnit / grossPerVilla;
    const hedef = (kaksLimit! / unitCount) / oran;
    /* Taban kısıtını aşmasın */
    const tabanSiniri = effectiveFootprint > 0 ? (effectiveFootprint / unitCount) * floorsPerUnit : Infinity;
    const oneri = Math.min(hedef, tabanSiniri);
    if (oneri > grossPerVilla + 0.5) suggestedGrossPerVilla = oneri;
  }

  if (unitCount === 0 && villa.mode === 'alan') {
    warnings.push('Girilen koşullarda hiçbir villa yerleşmiyor. Villa büyüklüğünü, çekme mesafelerini veya imar haklarını kontrol ediniz.');
  }
  if (kaksLimit != null && emsalArea > kaksLimit + 0.5) {
    warnings.push('Hesaplanan emsal alanı üst sınırı aşıyor — girdileri kontrol ediniz.');
  }
  if (zoning.floors != null && zoning.floors > 0 && aboveGroundFloors > zoning.floors) {
    warnings.push(`Villanın zemin üstü kat adedi (${aboveGroundFloors}), plandaki kat adedini (${zoning.floors}) aşıyor.`);
  }
  if (!direct && zoning.hmax != null && zoning.hmax > 0 && aboveGroundFloors * 3.2 > zoning.hmax + 0.5) {
    warnings.push(`Zemin üstü ${aboveGroundFloors} kat için yaklaşık ${(aboveGroundFloors * 3.2).toFixed(1)} m yükseklik gerekir; Hmax ${zoning.hmax} m girilmiş.`);
  }

  return {
    envelope, taksLimit, kaksLimit, layoutFootprint, effectiveFootprint, footprintPerUnit,
    aboveGroundFloors, groundCoverage, emsalLeftover, footprintLeftover, suggestedGrossPerVilla,
    countByFootprint, countByEmsal, unitCount,
    unitCountRange: [Math.min(rangeLow, unitCount), Math.max(rangeHigh, unitCount)],
    binding, emsalPerUnit, grossPerUnit, saleablePerUnit, grossPerVilla,
    emsalArea, grossArea, saleableArea, basementArea, atticArea,
    extraSaleableArea, saleableOutsideEmsal, saleableWithinEmsal, footprintTotal, gardenArea,
    parcelEfficiency: safeDiv(grossArea, parcel.area),
    emsalUsage: kaksLimit != null ? safeDiv(emsalArea, kaksLimit) : null,
    warnings,
  };
}
