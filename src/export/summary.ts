/**
 * ÖZET TABLO — rapora tek sayfa (en fazla iki sayfa) olarak eklenebilecek kısa özet.
 * Ekrandaki "Özet" sekmesi ve "Özet PDF" aynı veriyi kullanır, böylece ikisi her zaman tutarlıdır.
 * Bu dosya PDF kütüphanesini içe aktarmaz (ekran paketini şişirmemek için).
 */
import type { ProjectInput, AnalysisResult } from '../engine';
import { YAPI_SINIFLARI } from '../data/yapiSiniflari';
import { mahalleUzun } from '../geo/mahalle';
import { LOC } from '../i18n';
import { resolveFinal } from '../engine/finalValue';

const tl = (v: number) => Math.round(v).toLocaleString(LOC()) + ' ₺';
const tlm2 = (v: number) => Math.round(v).toLocaleString(LOC()) + ' ₺/m²';
const m2 = (v: number) => Math.round(v).toLocaleString(LOC()) + ' m²';
const m2p = (v: number) => v.toLocaleString(LOC(), { maximumFractionDigits: 2 }) + ' m²';
const pct = (v: number, d = 0) => '%' + (v * 100).toFixed(d).replace('.', ',');
const n2 = (v: number) => v.toLocaleString(LOC(), { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export interface SummaryRow { label: string; value: string; strong?: boolean; tone?: 'pos' | 'neg'; band?: boolean }
export interface SummarySection { title: string; rows: SummaryRow[] }
export interface Summary {
  place: string;
  ident: string;
  type: string;
  headline: { label: string; value: string; unit: string };
  sections: SummarySection[];
}

export function buildSummary(input: ProjectInput, r: AnalysisResult): Summary {
  const { capacity: c, financial: f, share: s, apartment: apt, isletme } = r;
  const p = input.parcel;
  const z = input.zoning;
  const discountOn = (input.residual.projectMonths ?? 0) > 0 && (input.residual.timeDiscountRate ?? 0) > 0;

  const place = `${p.il} / ${p.ilce}${p.mahalle ? ' · ' + mahalleUzun(p.mahalle) : ''}`;
  const ident = `Ada ${p.ada || '—'} · Parsel ${p.parsel || '—'} · Tapu Alanı ${m2p(p.area)}`;

  const parcelRows: SummaryRow[] = [
    { label: 'Parsel Alanı (tapu)', value: m2p(p.area) },
    { label: 'Net Parsel Alanı', value: m2p(p.netArea) },
    { label: 'Plan Lejantı', value: z.lejant.trim() || '—' },
  ];

  /* ── Ticari işletme: sade ── */
  if (isletme) {
    return {
      place, ident, type: 'Ticari İşletme',
      headline: { label: 'ARSA DEĞERİ (GELİR PROJEKSİYONU)', value: tl(isletme.landValue), unit: tlm2(isletme.landUnitValue) + ' (tapu alanı üzerinden)' },
      sections: [
        { title: 'TAŞINMAZ', rows: [...parcelRows, { label: 'Toplam Yapı Alanı', value: m2(isletme.totalBuildingArea) }] },
        {
          title: 'DEĞERLEME', rows: [
            { label: 'Öngörülen Satış Değeri', value: tl(isletme.salesTotal), strong: true, tone: 'pos' },
            { label: 'Yapı Maliyetleri', value: '- ' + tl(isletme.buildingsCost), tone: 'neg' },
            ...(isletme.extrasTotal > 0 ? [{ label: 'İlave Maliyetler', value: '- ' + tl(isletme.extrasTotal), tone: 'neg' as const }] : []),
            ...(isletme.profit > 0 ? [{ label: `Müteahhit Kazancı (${pct(isletme.profitRate)})`, value: '- ' + tl(isletme.profit), tone: 'neg' as const }] : []),
            { label: 'ARSA DEĞERİ', value: tl(isletme.landValue), band: true },
            { label: 'Arsa m² Birim Değeri', value: tlm2(isletme.landUnitValue) },
          ],
        },
      ],
    };
  }

  /* ── Ana değer: PDF'teki ana kutuyla aynı mantık ── */
  const fin = resolveFinal(input, r);
  const heroValue = fin.value;
  const heroLabel = fin.label;

  const type = apt
    ? `${input.assetType === 'karma' ? 'Karma Kullanım' : input.assetType === 'ticari' ? 'Ticari Apartman' : 'Çok Katlı Bina'}`
    : 'Villa Projesi';

  const zoningRows: SummaryRow[] = [...parcelRows];
  if (z.mode === 'taks-kaks') {
    zoningRows.push({ label: 'TAKS / KAKS', value: `${z.taks != null ? n2(z.taks) : '—'} / ${z.kaks != null ? n2(z.kaks) : '—'}` });
  } else if (z.mode === 'cekme') {
    zoningRows.push({ label: 'Bahçe Mesafeleri (ön/yan/arka)', value: `${z.cekmeFront} / ${z.cekmeSide} / ${z.cekmeRear} m` });
  } else {
    zoningRows.push({ label: 'Hesap Yöntemi', value: 'Alan Bilgisi Girilerek' });
  }
  if (z.hmax) zoningRows.push({ label: 'Hmax', value: `${z.hmax.toLocaleString(LOC())} m` });

  const areaRows: SummaryRow[] = [
    { label: 'Taban Oturumu', value: m2(apt ? apt.footprintArea : c.footprintArea) },
    ...(apt ? [] : [{ label: 'Emsale Dahil Alan', value: m2(c.emsalArea) }]),
    { label: 'Toplam İnşaat Alanı', value: m2(c.totalArea), strong: true },
    ...(apt ? [{ label: 'Satılabilir Alan', value: m2(apt.saleableTotal), strong: true }] : []),
    ...(!apt && c.unitCount > 0 ? [{ label: 'Villa Adedi', value: `${c.unitCount} adet` }] : []),
    { label: 'Bahçe / Açık Alan', value: m2(apt ? apt.gardenArea : c.gardenArea) },
  ];

  const sinif = YAPI_SINIFLARI.find((x) => x.code === input.cost.buildingClass);
  const feas: SummaryRow[] = [
    { label: 'Yapı Sınıfı', value: `${input.cost.buildingClass}${sinif ? ' — ' + sinif.label : ''}` },
    { label: 'Güncel Birim Maliyet', value: tlm2(f.effectiveUnitCost) },
    { label: 'Toplam Satış Geliri', value: tl(f.revenue), strong: true, tone: 'pos' },
    { label: 'Toplam Proje Maliyeti', value: '- ' + tl(f.totalCost), tone: 'neg' },
    { label: `Müteahhit Kazancı (${pct(input.residual.profitRate)})`, value: '- ' + tl(f.developerProfit), tone: 'neg' },
    ...(f.salesCost > 0 ? [{ label: `Satış Giderleri (${pct(input.residual.salesCostRate ?? 0)})`, value: '- ' + tl(f.salesCost), tone: 'neg' as const }] : []),
    { label: discountOn ? 'ARSA DEĞERİ (İNDİRGEMESİZ)' : 'ARSA DEĞERİ', value: tl(f.residualLandValueRounded), band: true },
    ...(discountOn ? [
      { label: `İndirgeme Etkisi (${input.residual.projectMonths} ay · ${pct(input.residual.timeDiscountRate ?? 0)})`,
        value: '- ' + tl(Math.max(0, f.residualLandValueRounded - f.discountedLandValueRounded)), tone: 'neg' as const },
      { label: 'ARSA DEĞERİ (İNDİRGEMELİ)', value: tl(f.discountedLandValueRounded), band: true },
    ] : []),
  ];

  const sections: SummarySection[] = [
    { title: 'PARSEL VE İMAR', rows: zoningRows },
    { title: 'ALAN BİLGİSİ', rows: areaRows },
    { title: 'FİZİBİLİTE', rows: feas },
  ];

  if (input.share.enabled) {
    sections.push({
      title: 'YÖNTEM KARŞILAŞTIRMASI',
      rows: discountOn ? [
        { label: 'İndirgemeli Kat Karşılığı Değeri', value: tl(s.discountedShareLandValueRounded), strong: true },
        { label: 'İndirgemeli Gelir Projeksiyonu Değeri', value: tl(f.discountedLandValueRounded), strong: true },
        { label: 'Arsa Sahibi Payı', value: pct(s.ownerShare) },
      ] : [
        { label: 'Kat Karşılığı Yöntemine Göre', value: tl(s.shareLandValueRounded), strong: true },
        { label: 'Gelir Projeksiyonuna Göre', value: tl(f.residualLandValueRounded), strong: true },
        { label: 'Arsa Sahibi Payı', value: pct(s.ownerShare) },
        { label: 'Gelir Projeksiyonuna Denk Gelen Pay', value: pct(s.balancedShare, 1) },
      ],
    });
  }

  return {
    place, ident, type: `${type} · ${z.mode === 'cekme' ? 'Çekme Mesafesi' : z.mode === 'taks-kaks' ? 'TAKS/KAKS' : 'Alan Bilgisi'} Yöntemi`,
    headline: { label: heroLabel, value: tl(heroValue), unit: tlm2(p.area > 0 ? heroValue / p.area : 0) },
    sections,
  };
}
