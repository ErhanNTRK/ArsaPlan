/**
 * OTEL GELİRİ — HESAPLAMA MOTORU
 *
 * Saf TypeScript'tir: React bilmez, DOM'a dokunmaz, yan etkisi yoktur
 * (ArsaPlan'ın mevcut engine/ klasörüyle aynı ilke).
 *
 * Hiçbir hesaplama UI bileşenleri içinde tekrar edilmez; tüm matematik burada,
 * tek merkezden yönetilir. Her fonksiyon tek sorumluluğa sahiptir.
 *
 * Kural: sistem kullanıcıyı uyarır ama hesaplamayı engellemez — nihai karar
 * her zaman değerleme uzmanına aittir (kullanıcının kendi belirlediği ilke).
 */
import type {
  HotelIncomeInput, HotelIncomeResult, RoomRevenueRow, RoomRevenueCalc,
  CommercialLeaseRow, CommercialLeaseCalc, HotelProjectionYear, HotelWarning,
  HotelPerformanceIndicators,
} from './types';

const R = Math.round;
const safeDiv = (a: number, b: number) => (b === 0 ? 0 : a / b);

/* ─────────────────── 1) Oda Gelirleri ─────────────────── */
export function computeRoomRevenue(rows: RoomRevenueRow[]): { rows: RoomRevenueCalc[]; total: number } {
  const calc = rows.map((r) => {
    const count = Math.max(0, r.roomCount);
    const adr = Math.max(0, r.adr);
    const occ = Math.min(1, Math.max(0, r.occupancy));
    const days = Math.min(365, Math.max(0, r.operatingDays));
    const annualRevenue = R(count * adr * occ * days);
    return { ...r, annualRevenue };
  });
  const total = calc.reduce((a, r) => a + r.annualRevenue, 0);
  return { rows: calc, total };
}

/* ─────────────────── 2) Yardımcı İşletme Gelirleri ───────────────────
   'tutar' satırlar ₺ olarak; 'oran' satırlar oda gelirinin yüzdesi olarak
   hesaba girer (örn. oda geliri 10M, oran %2 → 200.000 ₺). */
export function computeAncillaryRevenue(
  rows: HotelIncomeInput['ancillary'], roomRevenueTotal: number,
): { rows: import('./types').AncillaryIncomeCalc[]; total: number } {
  const calc = rows.map((r) => {
    const effectiveIncome = (r.mode ?? 'tutar') === 'oran'
      ? R(Math.max(0, roomRevenueTotal) * Math.max(0, r.rate ?? 0))
      : Math.max(0, R(r.annualIncome));
    return { ...r, effectiveIncome };
  });
  return { rows: calc, total: calc.reduce((a, r) => a + r.effectiveIncome, 0) };
}

/* ─────────────────── 3) Ticari Alan Kira Gelirleri ─────────────────── */
export function computeLeaseRevenue(rows: CommercialLeaseRow[]): { rows: CommercialLeaseCalc[]; total: number } {
  const calc = rows.map((r) => {
    const amount = Math.max(0, r.amount);
    const monthlyAmount = r.inputMode === 'aylik' ? amount : amount / 12;
    const annualAmount = r.inputMode === 'yillik' ? amount : amount * 12;
    return { ...r, monthlyAmount: R(monthlyAmount), annualAmount: R(annualAmount) };
  });
  const total = calc.reduce((a, r) => a + r.annualAmount, 0);
  return { rows: calc, total };
}

/* ─────────────────── Performans Göstergeleri (otomatik) ─────────────────── */
export function computePerformanceIndicators(rows: RoomRevenueCalc[]): HotelPerformanceIndicators {
  const totalRoomCount = rows.reduce((a, r) => a + Math.max(0, r.roomCount), 0);
  if (totalRoomCount === 0) {
    return { totalRoomCount: 0, blendedAdr: 0, blendedOccupancy: 0, revPar: 0 };
  }
  const blendedAdr = safeDiv(
    rows.reduce((a, r) => a + r.adr * r.roomCount, 0), totalRoomCount,
  );
  const blendedOccupancy = safeDiv(
    rows.reduce((a, r) => a + r.occupancy * r.roomCount, 0), totalRoomCount,
  );
  return { totalRoomCount, blendedAdr, blendedOccupancy, revPar: blendedAdr * blendedOccupancy };
}

/* ─────────────────── 5-8) Gider, NOI, Kapitalizasyon ─────────────────── */
export function computeNoi(totalGrossRevenue: number, expenseRate: number) {
  const rate = Math.min(1, Math.max(0, expenseRate));
  const totalExpense = R(totalGrossRevenue * rate);
  const noi = totalGrossRevenue - totalExpense;
  return { totalExpense, noi };
}

export function computeCapitalizedValue(noi: number, capRate: number): number {
  if (capRate <= 0) return 0;
  return R(noi / capRate);
}

/* ─────────────────── Yıllık Projeksiyon Tablosu ─────────────────── */
/**
 * baseExpenseRate: 1. yıl için Toplam Gelir üzerinden uygulanan sabit gider oranı.
 * expenseGrowthRate ile birlikte, gider oranının kendisi de yıllar içinde
 * (gelir artışından bağımsız olarak) bileşik büyür. Girdi 0 ise oran sabit kalır.
 */
export function computeProjection(
  baseRevenue: number, baseExpenseRate: number, input: HotelIncomeInput['projection'],
): HotelProjectionYear[] {
  const table: HotelProjectionYear[] = [];
  const years = Math.max(3, Math.min(25, Math.round(input.years)));
  const z = (v: number) => (Object.is(v, -0) ? 0 : v);
  /* Gider, 1. yıl TUTARI üzerinden bileşik büyür (oran değil). Böylece gelir ve
     gider aynı oranda artarsa gider/gelir oranı sabit kalır ve NOI aynı oranda
     büyür; gider artışı gelirden yüksekse marj gerçekçi biçimde daralır. */
  const baseExpense = baseRevenue * Math.min(1, Math.max(0, baseExpenseRate));
  const renewalRate = Math.max(0, input.renewalFundRate ?? 0);
  for (let i = 1; i <= years; i++) {
    const revenue = baseRevenue * Math.pow(1 + input.incomeGrowthRate, i - 1);
    const opExpense = baseExpense * Math.pow(1 + input.expenseGrowthRate, i - 1);
    const renewalFund = R(revenue * renewalRate);
    const expense = opExpense + renewalFund;
    const noi = z(R(revenue) - R(expense));
    const capitalizedValue = z(computeCapitalizedValue(noi, input.capRate));
    table.push({
      year: input.startYear + i - 1,
      yearIndex: i,
      totalRevenue: z(R(revenue)),
      renewalFund: z(renewalFund),
      totalExpense: z(R(expense)),
      noi,
      capitalizedValue,
    });
  }
  return table;
}

/* ─────────────────── Doğrulama / Uyarılar (engellemez, yalnızca bilgilendirir) ─────────────────── */
export function buildWarnings(input: HotelIncomeInput, result: {
  totalRoomRevenue: number; totalGrossRevenue: number; noi: number;
}): HotelWarning[] {
  const w: HotelWarning[] = [];
  if (input.rooms.length === 0) {
    w.push({ level: 'uyari', message: 'Hiç oda tipi eklenmedi; oda geliri hesaplanamıyor.' });
  }
  input.rooms.forEach((r, i) => {
    if (r.occupancy > 1) w.push({ level: 'uyari', message: `${i + 1}. oda satırında doluluk %100'ü geçemez.` });
    if (r.occupancy < 0) w.push({ level: 'uyari', message: `${i + 1}. oda satırında doluluk negatif olamaz.` });
    if (r.adr < 0) w.push({ level: 'uyari', message: `${i + 1}. oda satırında negatif fiyat girilemez.` });
    if (r.roomCount < 0) w.push({ level: 'uyari', message: `${i + 1}. oda satırında negatif oda sayısı girilemez.` });
    if (r.operatingDays > 365) w.push({ level: 'uyari', message: `${i + 1}. oda satırında faaliyet günü 365'i geçemez.` });
    if (r.operatingDays < 1) w.push({ level: 'dikkat', message: `${i + 1}. oda satırında faaliyet günü giriniz.` });
    if (r.occupancy < 0.2 && r.occupancy > 0) {
      w.push({ level: 'dikkat', message: `${i + 1}. oda satırında doluluk oranı çok düşük görünüyor.` });
    }
  });
  if (input.projection.capRate <= 0) {
    w.push({ level: 'uyari', message: 'Kapitalizasyon oranı sıfır olamaz; nihai değer hesaplanamıyor.' });
  }
  if (input.projection.capRate > 0 && input.projection.capRate < 0.03) {
    w.push({ level: 'dikkat', message: 'Kapitalizasyon oranı olağan dışı düşük görünüyor.' });
  }
  if (input.projection.capRate > 0.25) {
    w.push({ level: 'dikkat', message: 'Kapitalizasyon oranı olağan dışı yüksek görünüyor.' });
  }
  if (result.totalGrossRevenue <= 0) {
    w.push({ level: 'uyari', message: 'Gelir girilmeden değer hesaplanamaz.' });
  }
  if (result.noi < 0) {
    w.push({ level: 'dikkat', message: 'İşletme gideri toplam geliri aşıyor; net işletme geliri negatif.' });
  }
  return w;
}

/* ─────────────────── Otomatik Rapor Özeti ─────────────────── */
export function buildSummaryText(r: {
  totalGrossRevenue: number; totalExpense: number; noi: number;
  capitalizedValue: number; capRate: number;
}, sym = '₺'): string {
  if (r.totalGrossRevenue <= 0) {
    return 'Gelir verileri henüz tamamlanmadığı için değerlendirme metni oluşturulamamıştır.';
  }
  return (
    `Yapılan gelir yöntemi analizinde taşınmazın yıllık toplam işletme geliri ` +
    `${fmtTLShort(r.totalGrossRevenue, sym)} olarak hesaplanmış; işletme giderleri ` +
    `(${fmtTLShort(r.totalExpense, sym)}) düşüldükten sonra net işletme geliri ` +
    `${fmtTLShort(r.noi, sym)} olarak belirlenmiştir. %${(r.capRate * 100).toFixed(1).replace('.', ',')} ` +
    `kapitalizasyon oranı uygulanarak, taşınmazın gelir yaklaşımına göre piyasa değeri ` +
    `${fmtTLShort(r.capitalizedValue, sym)} olarak tespit edilmiştir.`
  );
}
function fmtTLShort(v: number, sym = '₺'): string {
  return Math.round(v).toLocaleString('tr-TR') + ' ' + sym;
}

/**
 * Seçili para birimi TL değilse ve bir kur girilmişse, TL karşılığını
 * "1.234.567 $ (≈ 45.678.900 ₺)" biçiminde ekler. TL ise ya da kur
 * girilmemişse (fxRate null/0) yalnız ana tutarı döner — icat edilmiş bir
 * kur göstermeyiz, sessizce atlarız.
 */
export function fmtWithTlEquivalent(
  value: number, currency: 'TRY' | 'USD' | 'EUR' | undefined, fxRate: number | null | undefined,
): string {
  const CUR_SYM: Record<string, string> = { TRY: '₺', USD: '$', EUR: '€' };
  const sym = CUR_SYM[currency ?? 'TRY'] ?? '₺';
  const main = fmtTLShort(value, sym);
  if ((currency ?? 'TRY') === 'TRY' || !fxRate || fxRate <= 0) return main;
  const tl = fmtTLShort(value * fxRate, '₺');
  return `${main} (≈ ${tl})`;
}

/* ─────────────────── Orkestratör — tek çağrıda tüm analizi üretir ─────────────────── */
export function analyzeHotel(input: HotelIncomeInput): HotelIncomeResult {
  const roomCalc = computeRoomRevenue(input.rooms);
  const ancCalc = computeAncillaryRevenue(input.ancillary, roomCalc.total);
  const totalAncillaryRevenue = ancCalc.total;
  const leaseCalc = computeLeaseRevenue(input.leases);

  const totalGrossRevenue = roomCalc.total + totalAncillaryRevenue + leaseCalc.total;
  const { totalExpense, noi } = computeNoi(totalGrossRevenue, input.opex.expenseRate);
  const capitalizedValue = computeCapitalizedValue(noi, input.projection.capRate);

  const performance = computePerformanceIndicators(roomCalc.rows);

  const projectionTable = computeProjection(totalGrossRevenue, input.opex.expenseRate, input.projection);
  const ina = computeIna(projectionTable, input.projection, capitalizedValue);

  const warnings = buildWarnings(input, { totalRoomRevenue: roomCalc.total, totalGrossRevenue, noi });
  const CUR_SYM: Record<string, string> = { TRY: '₺', USD: '$', EUR: '€' };
  const summaryText = buildSummaryText({
    totalGrossRevenue, totalExpense, noi, capitalizedValue, capRate: input.projection.capRate,
  }, CUR_SYM[input.currency ?? 'TRY'] ?? '₺');

  const costLandValue = R((input.costParcelArea ?? 0) * (input.costLandUnitValue ?? 0));
  const computeCostBuildings = (rows: typeof input.costBuildings) => R((rows ?? []).reduce((s, b) =>
    s + Math.max(0, b.area) * Math.max(0, b.unitCost) * (b.depreciationPct > 0 ? Math.min(100, b.depreciationPct) / 100 : 1), 0));
  const costBuildingsValue = computeCostBuildings(input.costBuildings);
  const costGoodwill = Math.max(0, input.costGoodwill ?? 0);
  const costTotal = R(costLandValue + costBuildingsValue + costGoodwill);

  const hasMevcutOverride = !!input.computeMevcutDurum && (input.mevcutCostBuildings?.length ?? 0) > 0;
  const mevcutBuildingsValue = hasMevcutOverride ? computeCostBuildings(input.mevcutCostBuildings) : costBuildingsValue;
  const mevcutGoodwill = hasMevcutOverride ? Math.max(0, input.mevcutCostGoodwill ?? costGoodwill) : costGoodwill;
  const mevcutTotal = R(costLandValue + mevcutBuildingsValue + mevcutGoodwill);

  const cost = (costLandValue > 0 || costBuildingsValue > 0)
    ? {
        landValue: costLandValue, buildingsValue: costBuildingsValue, goodwill: costGoodwill, totalValue: costTotal, totalValueRounded: Math.round(costTotal / 5000) * 5000,
        current: { buildingsValue: mevcutBuildingsValue, goodwill: mevcutGoodwill, totalValue: mevcutTotal, totalValueRounded: Math.round(mevcutTotal / 5000) * 5000 },
      }
    : null;

  return {
    roomRows: roomCalc.rows,
    totalRoomRevenue: roomCalc.total,
    ancillaryRows: ancCalc.rows,
    totalAncillaryRevenue,
    leaseRows: leaseCalc.rows,
    totalLeaseRevenue: leaseCalc.total,
    totalGrossRevenue,
    totalExpense,
    noi,
    capitalizedValue: Math.round(capitalizedValue / 5000) * 5000,
    performance,
    projectionTable,
    ina,
    cost,
    warnings,
    summaryText,
  };
}

/* ─────────────────── Varsayılan Girdi ─────────────────── */
export function createDefaultHotelInput(): HotelIncomeInput {
  const now = new Date().getFullYear();
  return {
    general: { facilityName: '', il: '', ilce: '', mahalle: '', ada: '', parsel: '', address: '' },
    rooms: [],
    ancillary: [],
    leases: [],
    opex: { expenseRate: 0.60 },
    projection: {
      startYear: now, years: 10, incomeGrowthRate: 0.15, expenseGrowthRate: 0.15,
      capRate: 0.10, terminalCapRate: null, discountRate: null,
    },
  };
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * İNA (İndirgenmiş Nakit Akımı): projeksiyon NOI'leri iskonto oranıyla bugüne
 * çekilir; belirtilen yılda dönemsel bakım-onarım düşülür; son yıla terminal
 * değer eklenir. discountRate girilmemişse null.
 *
 * DÜZELTME (uluslararası standarda göre — Appraisal Institute / Gordon Büyüme
 * kimliği): terminal değer, projeksiyonun SON yılının kendi NOI'sinden değil,
 * bir SONRAKİ (projeksiyon ötesi ilk) yılın NOI'sinden hesaplanır — çünkü
 * terminal değer "o andan sonraki tüm gelecek nakit akışının bugünkü karşılığı"
 * anlamına gelir, bu da bir sonraki yıldan başlar. Eski kod son yılın kendi
 * NOI'sini kullanıyordu; bu, İNA sonucunu sistematik olarak (gelir büyüme
 * oranı kadar) düşük gösteriyordu ve Direkt Kapitalizasyon ile İNA'nın aynı
 * varsayımlar altında bile tutarsız çıkmasına katkıda bulunuyordu.
 * Golden (banka Excel'i): NOI₁ 385.257,6 · artış %3 · iskonto %11 (7,5+3,5) ·
 * terminal %10 · bakım 5. yıl 130.867,2 → NBD 4.229.084,21.
 */
export function computeIna(
  table: import('./types').HotelProjectionYear[],
  p: import('./types').HotelProjectionInput,
  directCapValue?: number,
): import('./types').HotelInaResult | null {
  const i = p.discountRate ?? null;
  if (i == null || i <= 0 || table.length === 0) return null;
  const termCap = (p.terminalCapRate ?? p.capRate) || 0;
  const lastNoi = table[table.length - 1].noi;
  // Bir sonraki (projeksiyon ötesi ilk) yılın NOI'sini, son iki yılın büyüme
  // oranını kullanarak tahmin ediyoruz; tablo tek yıllıksa gelir artış oranını
  // kullanırız (computeProjection'daki incomeGrowthRate ile tutarlı).
  const secondLastNoi = table.length >= 2 ? table[table.length - 2].noi : null;
  const impliedGrowth = secondLastNoi != null && secondLastNoi > 0
    ? (lastNoi - secondLastNoi) / secondLastNoi
    : (p.incomeGrowthRate ?? 0);
  const nextYearNoi = lastNoi * (1 + impliedGrowth);
  const terminalValue = termCap > 0 ? nextYearNoi / termCap : 0;
  const maintInterval = Math.max(0, Math.round(p.maintenanceYear ?? 0));
  const maintBaseAmt = Math.max(0, p.maintenanceAmount ?? 0);
  const expGrowth = p.expenseGrowthRate ?? 0;
  const cashFlows = table.map((row, idx) => {
    let cf = row.noi;
    const yearNum = idx + 1;
    if (maintInterval > 0 && maintBaseAmt > 0 && yearNum % maintInterval === 0) {
      const occurrence = yearNum / maintInterval;              // 1. tekrar, 2. tekrar, ...
      const yearsSinceFirst = (occurrence - 1) * maintInterval; // ilk tekrardan bu yana geçen yıl
      const amt = R(maintBaseAmt * Math.pow(1 + expGrowth, yearsSinceFirst));
      cf -= amt;
    }
    if (idx === table.length - 1) cf += terminalValue;
    return cf;
  });
  const npv = cashFlows.reduce((sum, cf, idx) => sum + cf / Math.pow(1 + i, idx + 1), 0);
  const gapExplanation = directCapValue != null
    ? explainInaVsDirectGap(directCapValue, npv, p.capRate, p.incomeGrowthRate ?? 0, i)
    : null;
  return { cashFlows, terminalValue, npv, gapExplanation };
}

/**
 * Gordon Büyüme kimliği (Appraisal Institute standardı): iskonto oranı =
 * kapitalizasyon oranı + uzun vadeli büyüme oranı. Bu, Direkt Kapitalizasyon
 * (büyümesiz, tek yıllık NOI ÷ cap rate) ile İNA'nın (çok yıllı, büyümeli
 * projeksiyon) MATEMATİKSEL OLARAK AYNI SONUCU vermesini sağlayan tutarlı
 * iskonto oranıdır. Kullanıcı elle farklı bir iskonto oranı girerse (kendi
 * risk görüşü), iki yöntem kasıtlı olarak ayrışır — bu fonksiyon o farkı
 * nicelendirmek için de kullanılır.
 */
export function gordonConsistentDiscountRate(capRate: number, incomeGrowthRate: number): number {
  return capRate + incomeGrowthRate;
}

/**
 * Direkt Kap ile İNA arasındaki farkı, "hangisi hatalı" belirsizliğini
 * gidermek üzere açıklayan bir mesaj üretir (yalnızca uyarı değil, nicel
 * bir açıklama — %5 kuralı: Appraisal Institute pratiğinde iki yöntem %5'ten
 * fazla ayrışırsa farkın kaynağı belirtilmelidir).
 */
export function explainInaVsDirectGap(
  directCap: number, inaValue: number, capRate: number, incomeGrowthRate: number, actualDiscountRate: number,
): string | null {
  if (directCap <= 0 || inaValue <= 0) return null;
  const gapPct = (inaValue / directCap - 1) * 100;
  if (Math.abs(gapPct) < 5) return null; // %5 kuralı: küçük farklar açıklama gerektirmez
  const consistent = gordonConsistentDiscountRate(capRate, incomeGrowthRate);
  const diff = (actualDiscountRate - consistent) * 100;
  const yon = gapPct > 0 ? 'yüksek' : 'düşük';
  if (Math.abs(diff) < 0.5) {
    return `İNA, Direkt Kapitalizasyon'dan %${Math.abs(gapPct).toFixed(1).replace('.', ',')} ${yon} çıkıyor. ` +
      `İskonto oranınız (%${(actualDiscountRate * 100).toFixed(1).replace('.', ',')}) kapitalizasyon oranı+büyüme ` +
      `(%${(consistent * 100).toFixed(1).replace('.', ',')}) ile tutarlı; kalan fark, projeksiyonun sonlu (${'yıl bazlı'}) ` +
      `yapısından ve bakım/onarım kesintilerinden kaynaklanıyor — normal bir sapmadır.`;
  }
  return `İNA, Direkt Kapitalizasyon'dan %${Math.abs(gapPct).toFixed(1).replace('.', ',')} ${yon} çıkıyor. ` +
    `Sebebi: iskonto oranınız (%${(actualDiscountRate * 100).toFixed(1).replace('.', ',')}) ile kapitalizasyon ` +
    `oranı+büyüme oranının toplamı (%${(consistent * 100).toFixed(1).replace('.', ',')}) arasında ` +
    `${diff > 0 ? '+' : ''}${diff.toFixed(1).replace('.', ',')} puan fark var. Direkt Kapitalizasyon büyüme ` +
    `varsaymadan hesaplanır; iskonto oranınız bu tutarlı değerden belirgin saptığı için iki yöntem farklı ` +
    `sonuç veriyor. Bu kasıtlıysa (ek bir risk görüşünüz varsa) sorun değil, ama rastgele seçilmişse iskonto ` +
    `oranını %${(consistent * 100).toFixed(1).replace('.', ',')} civarına çekmeniz iki yöntemi birbirine yaklaştırır.`;
}
