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

/* ─────────────────── 2) Yardımcı İşletme Gelirleri ─────────────────── */
export function computeAncillaryRevenue(rows: HotelIncomeInput['ancillary']): number {
  return rows.reduce((a, r) => a + Math.max(0, R(r.annualIncome)), 0);
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
  let revenue = baseRevenue;
  let expenseRate = Math.min(1, Math.max(0, baseExpenseRate));
  for (let i = 1; i <= input.years; i++) {
    if (i > 1) {
      revenue = revenue * (1 + input.incomeGrowthRate);
      expenseRate = Math.min(1, expenseRate * (1 + input.expenseGrowthRate));
    }
    const { totalExpense, noi } = computeNoi(revenue, expenseRate);
    const capitalizedValue = computeCapitalizedValue(noi, input.capRate);
    table.push({
      year: input.startYear + i - 1,
      yearIndex: i,
      totalRevenue: R(revenue),
      totalExpense,
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
}): string {
  if (r.totalGrossRevenue <= 0) {
    return 'Gelir verileri henüz tamamlanmadığı için değerlendirme metni oluşturulamamıştır.';
  }
  return (
    `Yapılan gelir yöntemi analizinde taşınmazın yıllık toplam işletme geliri ` +
    `${fmtTLShort(r.totalGrossRevenue)} olarak hesaplanmış; işletme giderleri ` +
    `(${fmtTLShort(r.totalExpense)}) düşüldükten sonra net işletme geliri ` +
    `${fmtTLShort(r.noi)} olarak belirlenmiştir. %${(r.capRate * 100).toFixed(1).replace('.', ',')} ` +
    `kapitalizasyon oranı uygulanarak, taşınmazın gelir yaklaşımına göre piyasa değeri ` +
    `${fmtTLShort(r.capitalizedValue)} olarak tespit edilmiştir.`
  );
}
function fmtTLShort(v: number): string {
  return Math.round(v).toLocaleString('tr-TR') + ' ₺';
}

/* ─────────────────── Orkestratör — tek çağrıda tüm analizi üretir ─────────────────── */
export function analyzeHotel(input: HotelIncomeInput): HotelIncomeResult {
  const roomCalc = computeRoomRevenue(input.rooms);
  const totalAncillaryRevenue = computeAncillaryRevenue(input.ancillary);
  const leaseCalc = computeLeaseRevenue(input.leases);

  const totalGrossRevenue = roomCalc.total + totalAncillaryRevenue + leaseCalc.total;
  const { totalExpense, noi } = computeNoi(totalGrossRevenue, input.opex.expenseRate);
  const capitalizedValue = computeCapitalizedValue(noi, input.projection.capRate);

  const performance = computePerformanceIndicators(roomCalc.rows);

  const projectionTable = computeProjection(totalGrossRevenue, input.opex.expenseRate, input.projection);

  const warnings = buildWarnings(input, { totalRoomRevenue: roomCalc.total, totalGrossRevenue, noi });
  const summaryText = buildSummaryText({
    totalGrossRevenue, totalExpense, noi, capitalizedValue, capRate: input.projection.capRate,
  });

  return {
    roomRows: roomCalc.rows,
    totalRoomRevenue: roomCalc.total,
    totalAncillaryRevenue,
    leaseRows: leaseCalc.rows,
    totalLeaseRevenue: leaseCalc.total,
    totalGrossRevenue,
    totalExpense,
    noi,
    capitalizedValue,
    performance,
    projectionTable,
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
    opex: { expenseRate: 0.35 },
    projection: {
      startYear: now, years: 10, incomeGrowthRate: 0.15, expenseGrowthRate: 0.15,
      capRate: 0.10, terminalCapRate: null, discountRate: null,
    },
  };
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}
