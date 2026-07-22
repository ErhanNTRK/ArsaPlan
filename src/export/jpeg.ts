/**
 * ÖZET KART — JPEG çıktısı
 * Rapor PDF'iyle aynı görsel dil; tek sayfalık, banka ekranına eklenebilir veya
 * Word'e yapıştırılabilir bir görsel üretir. Tarayıcı canvas'ı ile çizilir;
 * ek kütüphane yüklemez. Uzman değerlendirmesi içermez.
 */
import type { ProjectInput, AnalysisResult } from '../engine';
import { BRAND } from '../brand/brand';
import { DORA_LOGO_PNG, DORA_LOGO_W, DORA_LOGO_H } from '../brand/logo';
import { triggerDownload } from './excel';

/* A4 dikey · 150 dpi */
const CW = 1240, CH = 1754;
const K = CW / 210;                       // mm → px
const M = 15 * K, W = CW - 2 * M;

const NAVY = '#0F2A47';
const NAVY2 = '#1F3F66';
const INK = '#17202C';
const GRAY = '#5A6774';
const FAINT = '#F6F8FB';
const LINE = '#DCE3EB';
const GOLD = '#B28D42';
const GREEN = '#1E6B41';
const RED = '#B42318';
const LIGHT = '#A8BDD4';

const tl = (v: number) => Math.round(v).toLocaleString('tr-TR') + ' ₺';
const tlm2 = (v: number) => Math.round(v).toLocaleString('tr-TR') + ' ₺/m²';
const m2 = (v: number) => Math.round(v).toLocaleString('tr-TR') + ' m²';
const pct = (v: number, d = 1) => '%' + (v * 100).toFixed(d).replace('.', ',');

let fontsReady = false;
async function ensureFonts() {
  if (fontsReady) return;
  const { FONT_REGULAR, FONT_BOLD } = await import('./font');
  const toBuf = (b64: string) => Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0)).buffer;
  const reg = new FontFace('NTRK', toBuf(FONT_REGULAR), { weight: '400' });
  const bold = new FontFace('NTRK', toBuf(FONT_BOLD), { weight: '700' });
  await Promise.all([reg.load(), bold.load()]);
  document.fonts.add(reg);
  document.fonts.add(bold);
  fontsReady = true;
}

function loadLogo(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('logo yüklenemedi'));
    img.src = `data:image/png;base64,${DORA_LOGO_PNG}`;
  });
}

export async function downloadJpeg(input: ProjectInput, r: AnalysisResult, version: string) {
  await ensureFonts();
  const logo = await loadLogo();

  const canvas = document.createElement('canvas');
  canvas.width = CW; canvas.height = CH;
  const g = canvas.getContext('2d')!;
  g.textBaseline = 'alphabetic';

  const font = (size: number, bold = false) => { g.font = `${bold ? 700 : 400} ${size * K}px NTRK, Arial`; };
  const text = (t: string, x: number, y: number, color: string, size: number, bold = false, align: CanvasTextAlign = 'left') => {
    font(size, bold); g.fillStyle = color; g.textAlign = align; g.fillText(t, x, y);
  };
  const fill = (x: number, y: number, w: number, h: number, color: string, radius = 0) => {
    g.fillStyle = color;
    if (radius <= 0) { g.fillRect(x, y, w, h); return; }
    g.beginPath();
    g.roundRect(x, y, w, h, radius);
    g.fill();
  };
  const strokeBox = (x: number, y: number, w: number, h: number, color: string, radius = 0) => {
    g.strokeStyle = color; g.lineWidth = 1.5;
    g.beginPath();
    g.roundRect(x, y, w, h, radius);
    g.stroke();
  };

  const { capacity: c, financial: f, apartment: apt } = r;
  const p = input.parcel;
  const tarih = new Date().toLocaleDateString('tr-TR');

  /* ── Zemin ── */
  fill(0, 0, CW, CH, '#FFFFFF');

  /* ── Başlık bandı ── */
  fill(0, 0, CW, 34 * K, NAVY);
  fill(0, 34 * K, CW, 0.9 * K, NAVY2);
  fill(0, 34.9 * K, CW, 1.1 * K, GOLD);
  text('ARSA DEĞER ANALİZİ — ÖZET', M, 15 * K, '#FFFFFF', 15.5, true);
  text('Gelir Projeksiyonu Yöntemi', M, 22 * K, '#C4D4E5', 9);
  text(BRAND.company, M, 28.5 * K, '#A0B5CD', 8);
  const lh = 13 * K, lw = (DORA_LOGO_W / DORA_LOGO_H) * lh;
  const lx = CW - M - lw, ly = (34 * K - lh) / 2;
  fill(lx - 3.4 * K, ly - 2.6 * K, lw + 6.8 * K, lh + 5.2 * K, '#FFFFFF', 2 * K);
  g.drawImage(logo, lx, ly, lw, lh);

  /* ── Künye ── */
  let y = 41 * K;
  fill(M, y, W, 13.5 * K, FAINT, 1.6 * K);
  strokeBox(M, y, W, 13.5 * K, LINE, 1.6 * K);
  text(`${p.il} / ${p.ilce}${p.mahalle ? ' · ' + p.mahalle + ' Mahallesi' : ''}`, M + 4 * K, y + 5.8 * K, INK, 10.5, true);
  text(`Ada ${p.ada || '—'} · Parsel ${p.parsel || '—'} · Tapu Alanı ${m2(p.area)} · ${input.zoning.lejant.trim() || 'Lejant girilmedi'}`, M + 4 * K, y + 10.8 * K, GRAY, 8.4);
  text(`Rapor Tarihi: ${tarih}`, CW - M - 4 * K, y + 5.8 * K, GRAY, 8.2, false, 'right');
  text(apt ? `Çok Katlı Bina · ${apt.mode === 'taks-kaks' ? 'TAKS/KAKS' : 'Doğrudan Alan'}` : 'Villa Projesi',
       CW - M - 4 * K, y + 10.8 * K, GRAY, 8.2, false, 'right');
  y += 19 * K;

  /* ── Sonuç şeridi ── */
  const HH = 27 * K;
  fill(M, y, W, HH, NAVY, 2.2 * K);
  fill(M, y + HH - 1.2 * K, W, 1.2 * K, GOLD);
  text('ARSA DEĞERİ (GELİR PROJEKSİYONU)', M + 5 * K, y + 7 * K, LIGHT, 8);
  text(tl(f.residualLandValue), M + 5 * K, y + 18 * K, '#FFFFFF', 20, true);
  if (f.revenue > 0) text(`Arsa payı, hasılatın ${pct(f.landToRevenue)} kadarıdır`, M + 5 * K, y + 23.4 * K, LIGHT, 7.4);
  const cx = M + W * 0.56;
  g.strokeStyle = '#3A587C'; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(cx - 4 * K, y + 4.5 * K); g.lineTo(cx - 4 * K, y + HH - 4.5 * K); g.stroke();
  const stat = (label: string, val: string, sy: number) => {
    text(label, cx, sy, LIGHT, 7.4);
    text(val, CW - M - 5 * K, sy, '#FFFFFF', 10.6, true, 'right');
  };
  stat('Arsa m² Birim Değeri', tlm2(f.landUnitValue), y + 8.6 * K);
  stat('Toplam İnşaat Alanı', m2(c.totalArea), y + 15.4 * K);
  if (apt) stat('Satılabilir Alan', m2(apt.saleableTotal), y + 22.2 * K);
  else stat(c.unitCount > 0 ? 'Villa Adedi' : 'Bahçe / Açık Alan',
            c.unitCount > 0 ? `${c.unitCount} adet` : m2(c.gardenArea), y + 22.2 * K);
  y += HH + 8 * K;

  /* ── Bölüm başlığı ── */
  const section = (title: string) => {
    fill(M, y - 3.4 * K, 1.8 * K, 5.4 * K, GOLD);
    text(title, M + 4.6 * K, y + 0.8 * K, NAVY, 9.6, true);
    g.strokeStyle = LINE; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(M, y + 3.4 * K); g.lineTo(CW - M, y + 3.4 * K); g.stroke();
    y += 9 * K;
  };

  /* ── İçerik: kat tablosu (apartman) veya alan özeti (villa) ── */
  const rowsAvail = apt ? apt.floors.length + 2 : 8;
  const rh = Math.min(6.4, Math.max(4.6, 120 / rowsAvail)) * K;   // sığdırma
  const C2 = M + W * 0.64, C3 = CW - M - 3 * K;

  if (apt) {
    section('KAT TABLOSU');
    fill(M, y - 4.2 * K, W, rh, NAVY);
    text('KAT BİLGİSİ', M + 3 * K, y, '#FFFFFF', 7.6, true);
    text('KAT ALANI', C2, y, '#FFFFFF', 7.6, true, 'right');
    text('SATILABİLİR ALAN', C3, y, '#FFFFFF', 7.6, true, 'right');
    y += rh + 0.6 * K;
    let z = true;
    const fsize = rh / K > 5.6 ? 9 : 8.2;
    for (const fl of apt.floors) {
      if (z) fill(M, y - 4.2 * K, W, rh, FAINT);
      z = !z;
      const ortak = fl.kind === 'bodrum' && input.apartment.basements[fl.index - 1]?.use === 'ortak';
      text(fl.label, M + 3 * K, y, INK, fsize);
      text(m2(fl.area), C2, y, INK, fsize, true, 'right');
      if (ortak) text('ortak mahal', C3, y, GRAY, fsize, false, 'right');
      else text(m2(fl.saleable), C3, y, INK, fsize, true, 'right');
      y += rh;
    }
    fill(M, y - 4.2 * K, W, rh, NAVY);
    text('TOPLAM', M + 3 * K, y, '#FFFFFF', fsize, true);
    text(m2(apt.totalArea), C2, y, '#FFFFFF', fsize, true, 'right');
    text(m2(apt.saleableTotal), C3, y, '#FFFFFF', fsize, true, 'right');
    y += rh + 6 * K;
  } else {
    section('ALAN ÜRETİMİ');
    let z = false;
    const vrow = (label: string, val: string, band = false) => {
      if (band) {
        fill(M, y - 4.4 * K, W, 6.4 * K, NAVY);
        text(label, M + 3 * K, y, '#FFFFFF', 9.2, true);
        text(val, CW - M - 3 * K, y, '#FFFFFF', 9.2, true, 'right');
        z = false;
      } else {
        if (z) fill(M, y - 4.4 * K, W, 6.4 * K, FAINT);
        z = !z;
        text(label, M + 3 * K, y, GRAY, 9.1);
        text(val, CW - M - 3 * K, y, INK, 9.1, true, 'right');
      }
      y += 6.6 * K;
    };
    vrow('Taban Oturumu', m2(c.footprintArea));
    vrow('Emsale Dahil Alan', m2(c.emsalArea));
    if (c.extraArea > 0) vrow('Emsal Dışı Satılabilir Alan', m2(c.extraArea));
    if (c.atticArea > 0) vrow('Çatı Katı', m2(c.atticArea));
    if (c.basementArea > 0) vrow('Bodrum Kat', m2(c.basementArea));
    vrow('TOPLAM İNŞAAT ALANI', m2(c.totalArea), true);
    if (c.unitCount > 0) vrow('Villa Adedi · Villa Başına Alan', `${c.unitCount} adet · ${m2(c.areaPerUnit)}`);
    vrow('Bahçe / Açık Alan', m2(c.gardenArea));
    y += 5 * K;
  }

  /* ── Fizibilite kutuları ── */
  section('FİZİBİLİTE');
  const half = W / 2 - 3 * K;
  const box = (x: number, label: string, val: string, tone: string) => {
    fill(x, y, half, 14 * K, FAINT, 1.6 * K);
    strokeBox(x, y, half, 14 * K, LINE, 1.6 * K);
    text(label, x + 4 * K, y + 5.2 * K, GRAY, 7.4);
    text(val, x + 4 * K, y + 11.2 * K, tone, 11.5, true);
  };
  box(M, 'TOPLAM MALİYET', tl(f.totalCost), RED);
  box(M + half + 6 * K, 'TOPLAM SATIŞ HASILATI', tl(f.revenue), GREEN);
  y += 17.5 * K;
  box(M, `MÜTEAHHİT KÂRI (${pct(input.residual.profitRate, 0)})`, tl(f.developerProfit), INK);
  box(M + half + 6 * K, 'ARSA m² BİRİM DEĞERİ', tlm2(f.landUnitValue), NAVY);
  y += 20 * K;

  /* ── Altbilgi ── */
  g.strokeStyle = LINE; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(M, CH - 9 * K); g.lineTo(CW - M, CH - 9 * K); g.stroke();
  text(`${BRAND.preparedBy} · ${BRAND.developerLine}`, M, CH - 4.8 * K, '#8C98A5', 7.2);
  text(`Yöntem: Gelir Projeksiyonu · Tutarlar KDV hariçtir · ${BRAND.appName} ${version}`, CW - M, CH - 4.8 * K, '#8C98A5', 7.2, false, 'right');

  /* ── İndirme ── */
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('JPEG üretilemedi'))), 'image/jpeg', 0.92));
  const name = `Arsa-Ozet-${(p.ilce || p.il || 'analiz').replace(/\s+/g, '-')}-${p.ada || ''}-${p.parsel || ''}.jpg`
    .replace(/-+\./, '.');
  triggerDownload(blob, name);
}
