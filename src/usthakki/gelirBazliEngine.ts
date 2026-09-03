/**
 * ÜST HAKKI — YÖNTEM 4: BASİT GELİR BAZLI HESAP.
 *
 * "Toplam Gelir Üzerinden Üst Hakkı Hesabı" (Ayrıntılı — detailedEngine.ts)
 * modelinin sadeleştirilmiş kardeşi. Salih'in testinde (2026-09-03), tam
 * bu mimariyle Ayrıntılı modele göre yalnızca %3,7 fark bulundu — 39 alan
 * yerine ~13 alanla neredeyse aynı sonuca ulaşılıyor.
 *
 * Temel farklar (Ayrıntılı'ya göre):
 * - 5 ayrı gelir kalemi yerine TEK "Toplam Gelir" tabanı
 * - 6 ayrı işletme gideri oranı yerine TEK "İşletme Gideri Oranı"
 * - 4 ayrı sabit gider oranı (İşletmeci Primi/Emlak Vergisi/Sigorta/
 *   Yenileme) yerine TEK "Sabit Gider Oranı"
 * - Ecrimisil / Üst Hakkı Ödemesi / Bayilik AYNEN korunuyor (zaten sade)
 * - Kalan Süre = Projeksiyon Süresi, TERMİNAL DEĞER YOK (Ayrıntılı modelle
 *   aynı, doğru ilke — üst hakkı süreli bir hak, sonsuz ömür varsayılmaz)
 * - Maliyet Yaklaşımı YOK (bu yöntemde arsa/yapı değeri hiç girilmiyor,
 *   yalnızca gelir akışı üzerinden hesaplanıyor — adından da bu anlaşılır)
 */

export interface GelirBazliUstHakkiInput {
  hotelName: string;
  ada: string;
  parsel: string;
  parcelArea: number;
  fromKml: boolean;

  currency: 'TL' | 'USD' | 'EUR';
  fxRate: number;

  kalanSureYil: number;      // = projeksiyon süresi (yıl sayısı)
  toplamSureYil: number;     // yalnız bilgi amaçlı gösterim, hesaba girmez

  toplamGelirBase: number;       // 1. yıl Toplam Gelir tabanı
  gelirArtisOraniPct: number;    // yıllık büyüme oranı

  isletmeGideriOraniPct: number; // Toplam Gelir üzerinden — tek oran
  sabitGiderOraniPct: number;    // Toplam Gelir üzerinden — tek oran (Emlak Vergisi+Sigorta+Yenileme+İşletmeci Primi birleşik)

  ecrimisilBase: number; ecrimisilGrowthPct: number;
  ustHakkiOdemeBase: number; ustHakkiOdemeGrowthPct: number;
  bayilikBase: number; bayilikGrowthPct: number;

  discountRatePct: number;
  donemSonuIndirgemePct: number;   // opsiyonel, nihai sonuca bir kez uygulanan haircut

  showReportDate?: boolean;
  reportDate?: string | null;
  bankName?: string | null;
  branchName?: string | null;
}

export interface GelirBazliPeriodRow {
  year: number;
  totalRevenue: number;
  isletmeGideri: number;
  sabitGider: number;
  noi: number;
  ecrimisil: number;
  ustHakkiOdeme: number;
  bayilik: number;
  ustHakkiSahibineKalan: number;
  presentValue: number;
}

export interface GelirBazliUstHakkiResult {
  discountRate: number;
  years: GelirBazliPeriodRow[];
  sumPresentValue: number;
  ustHakkiDegeriLocal: number;     // dönem sonu indirgeme sonrası, seçilen para biriminde
  ustHakkiDegeriRounded: number;   // en yakın 5.000'in katına
  ustHakkiDegeriTl: number;        // TL karşılığı (currency==='TL' iken aynı)
  warnings: string[];
}

const R = (v: number) => Math.round(v * 100) / 100;
const R5000 = (v: number) => Math.round(v / 5000) * 5000;

export function computeGelirBazliUstHakki(input: GelirBazliUstHakkiInput): GelirBazliUstHakkiResult {
  const warnings: string[] = [];
  const i = Math.max(0, input.discountRatePct) / 100;
  const n = Math.max(0, Math.round(input.kalanSureYil));
  if (n <= 0) warnings.push('Kalan süre 0 veya negatif; dönemsel tablo hesaplanamıyor.');
  if (input.toplamGelirBase <= 0) warnings.push('Toplam Gelir (1. yıl) girilmedi; hesaplama için zorunludur.');

  const g = input.gelirArtisOraniPct / 100;
  const years: GelirBazliPeriodRow[] = [];
  let sumPv = 0;

  for (let t = 1; t <= n; t++) {
    const growth = Math.pow(1 + g, t - 1);
    const totalRevenue = R(input.toplamGelirBase * growth);
    const isletmeGideri = R(totalRevenue * Math.max(0, input.isletmeGideriOraniPct) / 100);
    const sabitGider = R(totalRevenue * Math.max(0, input.sabitGiderOraniPct) / 100);
    const noi = R(totalRevenue - isletmeGideri - sabitGider);

    const ecrimisil = R(input.ecrimisilBase * Math.pow(1 + input.ecrimisilGrowthPct / 100, t - 1));
    const ustHakkiOdeme = R(input.ustHakkiOdemeBase * Math.pow(1 + input.ustHakkiOdemeGrowthPct / 100, t - 1));
    const bayilik = R(input.bayilikBase * Math.pow(1 + input.bayilikGrowthPct / 100, t - 1));

    const ustHakkiSahibineKalan = R(noi - ecrimisil - ustHakkiOdeme - bayilik);
    // 1. dönem indirgenmez (Ayrıntılı modelin konvansiyonuyla tutarlı);
    // 2. dönemden itibaren (1+i)^-(t-1). Terminal değer YOK.
    const presentValue = t === 1 ? ustHakkiSahibineKalan : R(ustHakkiSahibineKalan / Math.pow(1 + i, t - 1));
    sumPv += presentValue;

    years.push({ year: t, totalRevenue, isletmeGideri, sabitGider, noi, ecrimisil, ustHakkiOdeme, bayilik, ustHakkiSahibineKalan, presentValue });
  }

  sumPv = R(sumPv);
  const haircut = Math.min(100, Math.max(0, input.donemSonuIndirgemePct)) / 100;
  const ustHakkiDegeriLocal = R(sumPv * (1 - haircut));
  const ustHakkiDegeriRounded = R5000(ustHakkiDegeriLocal);
  const fx = input.currency === 'TL' ? 1 : Math.max(0, input.fxRate);
  const ustHakkiDegeriTl = input.currency === 'TL' ? ustHakkiDegeriRounded : R5000(ustHakkiDegeriRounded * fx);

  return { discountRate: i, years, sumPresentValue: sumPv, ustHakkiDegeriLocal, ustHakkiDegeriRounded, ustHakkiDegeriTl, warnings };
}

export function createDefaultGelirBazliInput(): GelirBazliUstHakkiInput {
  return {
    hotelName: '', ada: '', parsel: '', parcelArea: 0, fromKml: false,
    currency: 'TL', fxRate: 1,
    kalanSureYil: 0, toplamSureYil: 0,
    toplamGelirBase: 0, gelirArtisOraniPct: 15,
    isletmeGideriOraniPct: 45, sabitGiderOraniPct: 12,
    ecrimisilBase: 0, ecrimisilGrowthPct: 12,
    ustHakkiOdemeBase: 0, ustHakkiOdemeGrowthPct: 12,
    bayilikBase: 0, bayilikGrowthPct: 12,
    discountRatePct: 35, donemSonuIndirgemePct: 0,
    showReportDate: false, reportDate: null, bankName: null, branchName: null,
  };
}
