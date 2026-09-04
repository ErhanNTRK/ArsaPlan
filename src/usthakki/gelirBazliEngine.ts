/**
 * ÜST HAKKI — YÖNTEM 4: BASİT GELİR BAZLI HESAP.
 *
 * "Toplam Gelir Üzerinden Üst Hakkı Hesabı" (Ayrıntılı — detailedEngine.ts)
 * modelinin sadeleştirilmiş kardeşi.
 *
 * DÜZELTME (2026-09-03, Salih'in geri bildirimi — v1'de elle "Toplam Gelir"
 * ve elle Ecrimisil/Üst Hakkı Ödemesi/Bayilik tutarları isteniyordu; Salih
 * bunun "meşakkatli" olduğunu, otomatik hesaplanmasını beklediğini belirtti):
 * - Toplam Gelir artık KENDİ küçük oda tablosundan (Oda Sayısı/Fiyat/
 *   Doluluk/Gün) OTOMATİK hesaplanıyor — Otel modülünden bağımsız, ayrı
 *   bir veri girişi (Otel modülüne hiç dokunmuyor).
 * - Ecrimisil / Üst Hakkı Ödemesi / Bayilik artık Toplam Gelir'in bir
 *   ORANI olarak (sürekli, her yıl gelirle birlikte büyüyerek) hesaplanıyor
 *   — kullanıcı isterse oranı değiştirebilir, ama artık elle taban tutarı
 *   girmesi gerekmiyor.
 *
 * Temel farklar (Ayrıntılı'ya göre):
 * - 5 ayrı gelir kalemi yerine TEK oda tablosundan otomatik Toplam Gelir
 * - 6 ayrı işletme gideri oranı yerine TEK "İşletme Gideri Oranı"
 * - 4 ayrı sabit gider oranı yerine TEK "Sabit Gider Oranı"
 * - Ecrimisil/Üst Hakkı Ödemesi/Bayilik artık Toplam Gelir'in oranı
 * - Kalan Süre = Projeksiyon Süresi, TERMİNAL DEĞER YOK (Ayrıntılı modelle
 *   aynı, doğru ilke — üst hakkı süreli bir hak, sonsuz ömür varsayılmaz)
 * - Maliyet Yaklaşımı YOK (yalnızca gelir akışı üzerinden hesaplanıyor)
 */

export interface GelirBazliRoomRow {
  id: string;
  name: string;
  count: number;
  price: number;       // günlük fiyat
  occupancyPct: number; // doluluk %
  days: number;         // yıllık faal gün sayısı
}

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

  rooms: GelirBazliRoomRow[];    // Toplam Gelir (1. yıl) buradan otomatik hesaplanır
  gelirArtisOraniPct: number;    // yıllık büyüme oranı

  isletmeGideriOraniPct: number; // Toplam Gelir üzerinden — tek oran
  sabitGiderOraniPct: number;    // Toplam Gelir üzerinden — tek oran (Emlak Vergisi+Sigorta+Yenileme+İşletmeci Primi birleşik)

  // DÜZELTME: artık taban tutar + kendi büyüme oranı değil — doğrudan
  // Toplam Gelir'in bir oranı (her yıl gelirle birlikte otomatik büyür).
  ecrimisilPctOfRevenue: number;
  ustHakkiOdemePctOfRevenue: number;
  bayilikPctOfRevenue: number;

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
  toplamGelirBase: number;  // 1. yıl, oda tablosundan otomatik hesaplanan
  years: GelirBazliPeriodRow[];
  sumPresentValue: number;
  ustHakkiDegeriLocal: number;     // dönem sonu indirgeme sonrası, seçilen para biriminde
  ustHakkiDegeriRounded: number;   // en yakın 5.000'in katına
  ustHakkiDegeriTl: number;        // TL karşılığı (currency==='TL' iken aynı)
  warnings: string[];
}

const R = (v: number) => Math.round(v * 100) / 100;
const R5000 = (v: number) => Math.round(v / 5000) * 5000;

export function computeRoomRevenue(rooms: GelirBazliRoomRow[]): number {
  return R(rooms.reduce((s, r) =>
    s + Math.max(0, r.count) * Math.max(0, r.price) * (Math.min(100, Math.max(0, r.occupancyPct)) / 100) * Math.max(0, r.days), 0));
}

export function computeGelirBazliUstHakki(input: GelirBazliUstHakkiInput): GelirBazliUstHakkiResult {
  const warnings: string[] = [];
  const i = Math.max(0, input.discountRatePct) / 100;
  const n = Math.max(0, Math.round(input.kalanSureYil));
  if (n <= 0) warnings.push('Kalan süre 0 veya negatif; dönemsel tablo hesaplanamıyor.');

  const toplamGelirBase = computeRoomRevenue(input.rooms);
  if (toplamGelirBase <= 0) warnings.push('Oda tablosu boş veya 0 gelir üretiyor; en az bir oda satırı girin.');

  const g = input.gelirArtisOraniPct / 100;
  const years: GelirBazliPeriodRow[] = [];
  let sumPv = 0;

  for (let t = 1; t <= n; t++) {
    const growth = Math.pow(1 + g, t - 1);
    const totalRevenue = R(toplamGelirBase * growth);
    const isletmeGideri = R(totalRevenue * Math.max(0, input.isletmeGideriOraniPct) / 100);
    const sabitGider = R(totalRevenue * Math.max(0, input.sabitGiderOraniPct) / 100);
    const noi = R(totalRevenue - isletmeGideri - sabitGider);

    // DÜZELTME: artık Toplam Gelir'in oranı olarak, gelirle BİRLİKTE
    // otomatik büyüyor — ayrı bir taban/büyüme oranı girilmesi gerekmiyor.
    const ecrimisil = R(totalRevenue * Math.max(0, input.ecrimisilPctOfRevenue) / 100);
    const ustHakkiOdeme = R(totalRevenue * Math.max(0, input.ustHakkiOdemePctOfRevenue) / 100);
    const bayilik = R(totalRevenue * Math.max(0, input.bayilikPctOfRevenue) / 100);

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

  return { discountRate: i, toplamGelirBase, years, sumPresentValue: sumPv, ustHakkiDegeriLocal, ustHakkiDegeriRounded, ustHakkiDegeriTl, warnings };
}

export function createDefaultGelirBazliInput(): GelirBazliUstHakkiInput {
  return {
    hotelName: '', ada: '', parsel: '', parcelArea: 0, fromKml: false,
    currency: 'TL', fxRate: 1,
    kalanSureYil: 0, toplamSureYil: 0,
    rooms: [{ id: Math.random().toString(36).slice(2, 9), name: 'Standart', count: 0, price: 0, occupancyPct: 60, days: 365 }],
    gelirArtisOraniPct: 15,
    isletmeGideriOraniPct: 45, sabitGiderOraniPct: 12,
    // Öneri niteliğinde varsayılan oranlar — sözleşmenizdeki gerçek
    // koşullara göre değiştirilmelidir, sabit bir kural değildir.
    ecrimisilPctOfRevenue: 2, ustHakkiOdemePctOfRevenue: 5, bayilikPctOfRevenue: 1,
    discountRatePct: 35, donemSonuIndirgemePct: 0,
    showReportDate: false, reportDate: null, bankName: null, branchName: null,
  };
}
