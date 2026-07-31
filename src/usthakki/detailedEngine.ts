/**
 * AYRINTILI ÜST HAKKI DEĞER ANALİZİ — motor (saf).
 *
 * Salih'in 27 maddelik talimatı (2026-07-30, madde 24-40) ve Denizbank örnek
 * tablosuna göre kurulmuştur. Standart (basit) Üst Hakkı hesabından (engine.ts)
 * TAMAMEN AYRI bir modeldir — otel tarzı gelir/gider zinciri kullanır.
 *
 * Gelir mantığı: Oda Geliri oda satırlarından (Adet×Fiyat×Doluluk×Gün) türetilir;
 * diğer dört kalem (Yiyecek/Diğer/Toplantı/Dükkan) TOPLAM GELİRİN yüzdesi olarak
 * girilir; Oda payı = 100 − diğerlerinin toplamı. Böylece toplam gelir Oda
 * Geliri'nden geriye türetilir: toplamGelir = odaGelir / (odaPct/100).
 * Tüm kalemler böylece aynı büyüme oranıyla (Oda Fiyat Artış Oranı) büyür.
 *
 * Giderler: Oda/Yiyecek/Diğer kendi gelirlerinin yüzdesi; Genel Yönetim ve
 * Basit Tamirat toplam gelirin yüzdesi; Enerji (Oda+Toplantı) toplamının yüzdesi.
 * Sabit giderlerden İşletmeci Primi brüt kârın, Emlak Vergisi ve Bina Sigortası
 * Toplam Maliyet referansının yüzdesidir; Ecrimisil/Üst Hakkı Ödemesi/Bayilik/
 * Yenileme Fonu elle (başlangıç + yıllık artış) girilir.
 *
 * İndirgeme: 1. DÖNEM İNDİRGENMEZ; 2. dönemden itibaren iskonto oranıyla
 * bugüne çekilir (üstel: dönem t için çarpan = (1+i)^-(t-1)).
 * Sonuç, girilen "Dönem Sonu Değer İndirgeme (%)" oranıyla bir kez azaltılır,
 * sonra en yakın 5.000'in katına yuvarlanır.
 */

export interface DetailedRoomRow {
  id: string;
  name: string;
  count: number;
  price: number;          // günlük ortalama fiyat
  occupancyPct: number;   // doluluk %
  days: number;            // faaliyet gün sayısı
}

export interface DetailedUstHakkiInput {
  hotelName: string;
  ada: string;
  parsel: string;
  parcelArea: number;
  fromKml: boolean;

  sureUnit: 'yil' | 'ay';
  kalanSureYil: number;    // her zaman yıl cinsinden saklanır (UI ay↔yıl çevirir)
  toplamSureYil: number;

  currency: 'TL' | 'USD' | 'EUR';
  fxRate: number;           // currency !== 'TL' iken kullanılır

  rooms: DetailedRoomRow[];
  roomGrowthPct: number;    // "Oda Fiyat Artış Oranı" — tüm gelir kalemleri bu oranda büyür

  foodPct: number;          // Yiyecek/İçecek — toplam gelirin %'si
  otherPct: number;         // Diğer Gelirler — toplam gelirin %'si
  meetingPct: number;       // Toplantı/Salon — toplam gelirin %'si
  shopPct: number;          // Dükkan Kira — toplam gelirin %'si

  roomExpensePct: number;   // Oda Gideri — oda geliri üzerinden
  foodExpensePct: number;   // Yiyecek Gideri — yiyecek geliri üzerinden
  otherExpensePct: number;  // Diğer Gider — diğer gelir üzerinden
  generalMgmtPct: number;   // Genel Yönetim — toplam gelir üzerinden
  energyPct: number;        // Enerji — (oda+toplantı) üzerinden
  repairPct: number;        // Basit Tamirat — toplam gelir üzerinden

  totalCost: number;            // "Toplam Maliyet" referansı (emlak vergisi/sigorta tabanı)
  operatorPremiumPct: number;   // İşletmeci Prim — brüt kâr üzerinden
  propertyTaxPct: number;       // Emlak Vergisi — toplam maliyet üzerinden
  insurancePct: number;         // Bina Sigortası — toplam maliyet üzerinden

  renewalFundBase: number; renewalFundGrowthPct: number;      // Yenileme Fonu — elle
  ecrimisilBase: number; ecrimisilGrowthPct: number;          // Ecrimisil — elle
  ustHakkiOdemeBase: number; ustHakkiOdemeGrowthPct: number;  // Üst Hakkı Ödemesi — elle
  bayilikBase: number; bayilikGrowthPct: number;              // Bayilik Ödemeleri — elle

  riskFreeRatePct: number;
  riskPremiumPct: number;
  donemSonuIndirgemePct: number;   // "Dönem Sonu Değer İndirgeme (%)" — nihai sonuca bir kez uygulanan haircut
}

export interface DetailedPeriodRow {
  year: number;
  roomIncome: number;
  foodIncome: number;
  otherIncome: number;
  meetingIncome: number;
  shopIncome: number;
  totalRevenue: number;

  roomExpense: number;
  foodExpense: number;
  otherExpense: number;
  generalMgmtExpense: number;
  energyExpense: number;
  repairExpense: number;
  totalOperatingExpense: number;

  grossOperatingProfit: number;
  grossOperatingProfitPct: number;

  operatorPremium: number;
  propertyTax: number;
  insurance: number;
  renewalFund: number;
  ecrimisil: number;
  ustHakkiOdeme: number;
  bayilik: number;
  totalFixedExpense: number;

  totalExpense: number;
  netOperatingProfit: number;
  netOperatingProfitPct: number;

  presentValue: number;    // "Nakit Akış Net Bugünkü Değer"
}

export interface DetailedUstHakkiResult {
  discountRate: number;
  baseRoomIncome: number;
  years: DetailedPeriodRow[];
  sumPresentValue: number;
  propertyValueLocal: number;     // dönem sonu indirgeme sonrası, seçilen para biriminde
  propertyValueRounded: number;   // en yakın 5.000'in katına (seçilen para biriminde)
  propertyValueTl: number;        // TL karşılığı (currency==='TL' iken aynı)
  warnings: string[];
}

const R = (v: number) => Math.round(v * 100) / 100;
const R5000 = (v: number) => Math.round(v / 5000) * 5000;

export function computeRoomIncome(rooms: DetailedRoomRow[]): number {
  return R(rooms.reduce((s, r) =>
    s + Math.max(0, r.count) * Math.max(0, r.price) * Math.min(100, Math.max(0, r.occupancyPct)) / 100 * Math.max(0, r.days), 0));
}

export function computeDetailedUstHakki(input: DetailedUstHakkiInput): DetailedUstHakkiResult {
  const warnings: string[] = [];
  const i = Math.max(0, input.riskFreeRatePct + input.riskPremiumPct) / 100;
  const n = Math.max(0, Math.round(input.kalanSureYil));
  if (n <= 0) warnings.push('Kalan süre 0 veya negatif; dönemsel tablo hesaplanamıyor.');

  const otherPctSum = Math.max(0, input.foodPct) + Math.max(0, input.otherPct)
    + Math.max(0, input.meetingPct) + Math.max(0, input.shopPct);
  const roomPct = R(100 - otherPctSum);
  if (roomPct <= 0) warnings.push('Diğer gelir oranlarının toplamı %100\'ü aşıyor; Oda Geliri payı sıfır veya negatif çıktı.');

  const baseRoomIncome = computeRoomIncome(input.rooms);
  const g = input.roomGrowthPct / 100;

  const years: DetailedPeriodRow[] = [];
  let sumPv = 0;
  for (let t = 1; t <= n; t++) {
    const growth = Math.pow(1 + g, t - 1);
    const roomIncome = R(baseRoomIncome * growth);
    const totalRevenue = roomPct > 0 ? R(roomIncome / (roomPct / 100)) : 0;
    const foodIncome = R(totalRevenue * input.foodPct / 100);
    const otherIncome = R(totalRevenue * input.otherPct / 100);
    const meetingIncome = R(totalRevenue * input.meetingPct / 100);
    const shopIncome = R(totalRevenue * input.shopPct / 100);

    const roomExpense = R(roomIncome * input.roomExpensePct / 100);
    const foodExpense = R(foodIncome * input.foodExpensePct / 100);
    const otherExpense = R(otherIncome * input.otherExpensePct / 100);
    const generalMgmtExpense = R(totalRevenue * input.generalMgmtPct / 100);
    const energyExpense = R((roomIncome + meetingIncome) * input.energyPct / 100);
    const repairExpense = R(totalRevenue * input.repairPct / 100);
    const totalOperatingExpense = R(roomExpense + foodExpense + otherExpense + generalMgmtExpense + energyExpense + repairExpense);

    const grossOperatingProfit = R(totalRevenue - totalOperatingExpense);
    const grossOperatingProfitPct = totalRevenue > 0 ? R((grossOperatingProfit / totalRevenue) * 100) : 0;

    const operatorPremium = R(grossOperatingProfit * input.operatorPremiumPct / 100);
    const propertyTax = R(input.totalCost * input.propertyTaxPct / 100);
    const insurance = R(input.totalCost * input.insurancePct / 100);
    const renewalFund = R(input.renewalFundBase * Math.pow(1 + input.renewalFundGrowthPct / 100, t - 1));
    const ecrimisil = R(input.ecrimisilBase * Math.pow(1 + input.ecrimisilGrowthPct / 100, t - 1));
    const ustHakkiOdeme = R(input.ustHakkiOdemeBase * Math.pow(1 + input.ustHakkiOdemeGrowthPct / 100, t - 1));
    const bayilik = R(input.bayilikBase * Math.pow(1 + input.bayilikGrowthPct / 100, t - 1));
    const totalFixedExpense = R(operatorPremium + propertyTax + insurance + renewalFund + ecrimisil + ustHakkiOdeme + bayilik);

    const totalExpense = R(totalOperatingExpense + totalFixedExpense);
    const netOperatingProfit = R(totalRevenue - totalExpense);
    const netOperatingProfitPct = totalRevenue > 0 ? R((netOperatingProfit / totalRevenue) * 100) : 0;

    // 1. dönem indirgenmez; 2. dönemden itibaren (1+i)^-(t-1)
    const presentValue = t === 1 ? netOperatingProfit : R(netOperatingProfit / Math.pow(1 + i, t - 1));
    sumPv += presentValue;

    years.push({
      year: t, roomIncome, foodIncome, otherIncome, meetingIncome, shopIncome, totalRevenue,
      roomExpense, foodExpense, otherExpense, generalMgmtExpense, energyExpense, repairExpense, totalOperatingExpense,
      grossOperatingProfit, grossOperatingProfitPct,
      operatorPremium, propertyTax, insurance, renewalFund, ecrimisil, ustHakkiOdeme, bayilik, totalFixedExpense,
      totalExpense, netOperatingProfit, netOperatingProfitPct, presentValue,
    });
  }

  sumPv = R(sumPv);
  const haircut = Math.min(100, Math.max(0, input.donemSonuIndirgemePct)) / 100;
  const propertyValueLocal = R(sumPv * (1 - haircut));
  const propertyValueRounded = R5000(propertyValueLocal);
  const fx = input.currency === 'TL' ? 1 : Math.max(0, input.fxRate);
  const propertyValueTl = input.currency === 'TL' ? propertyValueRounded : R5000(propertyValueRounded * fx);

  return {
    discountRate: i, baseRoomIncome, years, sumPresentValue: sumPv,
    propertyValueLocal, propertyValueRounded, propertyValueTl, warnings,
  };
}
