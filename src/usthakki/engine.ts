/**
 * ÜST HAKKI DEĞERLEME MOTORU (saf).
 *
 * IVS/RICS çerçevesi: sınırlı süreli hakların (leasehold/üst hakkı) değeri,
 * hak sahibine kalan süre boyunca gerçekten akan net nakit akışının bugüne
 * indirgenmesiyle bulunur (bkz. Salih ile 2026-07-30 oturumu). Dönem sayısı
 * SABİT DEĞİLDİR — tamamen kalan üst hakkı süresine göre otomatik oluşur.
 *
 * Az veri ilkesi: yıl yıl elle 31-49 satır doldurmak yerine BAŞLANGIÇ GELİRİ +
 * BÜYÜME ORANI girilir, sistem kalan süre kadar satırı kendisi türetir —
 * Otel modülündeki NOI projeksiyonuyla aynı dil (Denizbank örnek tablosunda
 * da her kalem sabit bir büyüme oranıyla ilerliyordu; bu mimariyi doğruladı).
 *
 * Terminal değer: sözleşmede aksi belirtilmediği sürece YOKTUR (varsayılan 0).
 * Üst hakkı ödemesi ve ecrimisil AYRI, opsiyonel, kendi büyüme oranlı satırlardır
 * (Denizbank örneğinde ikisi de ayrı kalemler; ecrimisil de yıllık/tekrarlanan
 * bir DCF satırı olarak modellenmiş, önceki varsayımım yanlıştı — düzeltildi).
 */

export interface UstHakkiInput {
  /** Referans değer: gelir/maliyet/emsal modülünden veya manuel — DCF'in "K katsayısı" hesabında kullanılır */
  referenceValue: number;
  ilkSureYil: number;          // ilk tesis süresi
  kalanSureYil: number;        // kalan süre — elle değiştirilebilir, tesis tarihinden otomatik önerilir

  /** DCF gelir tarafı: yıl 1 net işletme geliri + yıllık büyüme oranı (%) */
  baseIncome: number;
  incomeGrowthPct: number;

  /** Üst hakkı/irtifak ödemesi — opsiyonel, kendi büyüme oranlı */
  paymentEnabled: boolean;
  basePayment: number;
  paymentGrowthPct: number;

  /** Ecrimisil — opsiyonel, ayrı satır (Denizbank örneğinde de ayrı kalemdi) */
  ecrimisilEnabled: boolean;
  baseEcrimisil: number;
  ecrimisilGrowthPct: number;

  /** İskonto: risksiz + risk primi (üst hakkı, tam mülkiyetten daha riskli) */
  riskFreeRatePct: number;
  riskPremiumPct: number;

  /** Devir sonu bedeli — sözleşmede belirtilmedikçe YOK (varsayılan false) */
  hasTerminalValue: boolean;
  terminalValue: number;

  /** Referans/Maliyet/Emsal — opsiyonel karşılaştırma değerleri (manuel/yapıştırılan) */
  costApproachValue: number | null;
  marketApproachValue: number | null;
  manualValue: number | null;

  /** Nihai değer seçimi */
  finalMethod: 'dcf' | 'reference' | 'cost' | 'market' | 'manual';
}

export interface DcfYear {
  year: number;
  income: number;
  payment: number;
  ecrimisil: number;
  netCashFlow: number;
  presentValue: number;
}

export interface UstHakkiResult {
  discountRate: number;         // risksiz + prim (fraksiyon)
  years: DcfYear[];
  dcfValue: number;             // Σ PV + (varsa) terminal PV
  /** Referans üst hakkı hesabı: referansDeğer × K, K = PVAF(kalan)/PVAF(ilk) */
  referenceFactor: number;
  referenceValue: number;
  finalValue: number;
  warnings: string[];
}

const R = (v: number) => Math.round(v * 100) / 100;

/** Anüite bugünkü değer faktörü (PVAF): n dönem, i iskonto oranı. i=0 iken n'e eşittir. */
export function pvaf(n: number, i: number): number {
  if (n <= 0) return 0;
  if (i <= 0) return n;
  return (1 - Math.pow(1 + i, -n)) / i;
}

/** Tesis tarihinden bugüne geçen süre düşülerek kalan süre önerilir (yıl, ondalıklı). */
export function suggestRemainingYears(startIso: string, ilkSureYil: number, asOfIso?: string): number | null {
  const start = new Date(startIso).getTime();
  if (Number.isNaN(start)) return null;
  const now = asOfIso ? new Date(asOfIso).getTime() : Date.now();
  const elapsedYears = (now - start) / (365.2425 * 86400000);
  const remaining = ilkSureYil - elapsedYears;
  return remaining > 0 ? Math.round(remaining * 10) / 10 : 0;
}

export function computeUstHakki(input: UstHakkiInput): UstHakkiResult {
  const warnings: string[] = [];
  const i = Math.max(0, input.riskFreeRatePct + input.riskPremiumPct) / 100;
  const n = Math.max(0, Math.round(input.kalanSureYil));

  if (n <= 0) warnings.push('Kalan süre 0 veya negatif; DCF hesaplanamıyor.');
  if (i <= 0) warnings.push('İskonto oranı 0; bugünkü değerler nominal akışlarla aynı olacak.');

  const years: DcfYear[] = [];
  let dcfSum = 0;
  for (let t = 1; t <= n; t++) {
    const income = R(input.baseIncome * Math.pow(1 + input.incomeGrowthPct / 100, t - 1));
    const payment = input.paymentEnabled
      ? R(input.basePayment * Math.pow(1 + input.paymentGrowthPct / 100, t - 1)) : 0;
    const ecrimisil = input.ecrimisilEnabled
      ? R(input.baseEcrimisil * Math.pow(1 + input.ecrimisilGrowthPct / 100, t - 1)) : 0;
    const netCashFlow = R(income - payment - ecrimisil);
    const presentValue = R(netCashFlow / Math.pow(1 + i, t));
    years.push({ year: t, income, payment, ecrimisil, netCashFlow, presentValue });
    dcfSum += presentValue;
  }

  let terminalPv = 0;
  if (input.hasTerminalValue && n > 0) {
    terminalPv = R(input.terminalValue / Math.pow(1 + i, n));
  }
  const dcfValue = R(dcfSum + terminalPv);

  /* Referans Üst Hakkı Hesabı — pratik çapraz kontrol, ana yöntem DEĞİL.
   * K = PVAF(kalan süre) / PVAF(ilk süre) — aynı iskonto oranıyla, düz bir
   * yıllık akımın kalan/ilk süre oranındaki "kesrini" temsil eder. */
  const pvafKalan = pvaf(n, i);
  const pvafIlk = pvaf(Math.max(0, input.ilkSureYil), i);
  const referenceFactor = pvafIlk > 0 ? R(pvafKalan / pvafIlk) : 0;
  const referenceValue = R(input.referenceValue * referenceFactor);

  const finalValue = (() => {
    switch (input.finalMethod) {
      case 'dcf': return dcfValue;
      case 'reference': return referenceValue;
      case 'cost': return input.costApproachValue ?? 0;
      case 'market': return input.marketApproachValue ?? 0;
      case 'manual': return input.manualValue ?? 0;
    }
  })();

  return { discountRate: i, years, dcfValue, referenceFactor, referenceValue, finalValue, warnings };
}
