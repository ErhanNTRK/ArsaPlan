/**
 * ÜST HAKKI — YÖNTEM 4: BASİT GELİR BAZLI HESAP. Ayrıntılı modelin
 * (DetailedUstHakkiApp) sadeleştirilmiş kardeşi — 39 alan yerine ~13 alan,
 * Salih'in testinde %3,7 farkla neredeyse aynı sonuca ulaşıyor.
 */
import { useEffect, useMemo, useState, useRef } from 'react';
import { computeGelirBazliUstHakki, createDefaultGelirBazliInput, type GelirBazliUstHakkiInput } from './gelirBazliEngine';
import { BRAND } from '../brand/brand';
import { parseKml } from '../geo/kml';
import { readDataSheet } from '../export/excelImport';
import { Num } from '../ui/fields';
import { downloadGelirBazliUstHakkiPdf } from './gelirBazliPdf';
import { downloadGelirBazliUstHakkiExcel } from './gelirBazliExcel';

const CUR_SYM: Record<GelirBazliUstHakkiInput['currency'], string> = { TL: '₺', USD: '$', EUR: '€' };
const DRAFT = 'arsaplan-usthakki-gelirbazli-v1';

export function GelirBazliUstHakkiApp({ onBack }: { onBack: () => void }) {
  const [state, setState] = useState<GelirBazliUstHakkiInput>(() => {
    try { const s = localStorage.getItem(DRAFT); if (s) return JSON.parse(s); } catch { /* yok */ }
    return createDefaultGelirBazliInput();
  });
  useEffect(() => { try { localStorage.setItem(DRAFT, JSON.stringify(state)); } catch { /* dolu */ } }, [state]);

  const fileRef = useRef<HTMLInputElement>(null);
  const patch = (p: Partial<GelirBazliUstHakkiInput>) => setState((s) => ({ ...s, ...p }));

  const cur = CUR_SYM[state.currency];
  const TL = (v: number) => Math.round(v).toLocaleString('tr-TR') + ' ' + cur;

  const r = useMemo(() => computeGelirBazliUstHakki(state), [state]);

  async function onKml(f: File) {
    try {
      const parsed = parseKml(await f.text());
      if (!parsed) { alert('KML okunamadı.'); return; }
      const area = parsed.deedArea || parsed.polygonArea || 0;
      patch({
        parcelArea: area > 0 ? Math.round(area) : state.parcelArea,
        ada: parsed.ada || state.ada, parsel: parsed.parsel || state.parsel,
        fromKml: true,
      });
    } catch { alert('KML okunamadı.'); }
  }

  const busyRef = useRef(false);
  async function onPdf() { if (busyRef.current) return; busyRef.current = true; try { await downloadGelirBazliUstHakkiPdf(state, r); } finally { busyRef.current = false; } }
  async function onExcel() { if (busyRef.current) return; busyRef.current = true; try { await downloadGelirBazliUstHakkiExcel(state, r); } finally { busyRef.current = false; } }

  return (
    <div className="app usthakki-app">
      <div className="topbar no-print"><div className="topbar-inner">
        <img src={`${import.meta.env.BASE_URL}dora-logo.png`} alt={BRAND.company} className="topbar-logo" />
        <button type="button" className="btn-ghost" onClick={onBack}>← Ana Sayfaya Dön</button>
        <button type="button" className="btn-ghost" title="Tüm alanları temizler"
                onClick={() => { if (window.confirm('Sayfa sıfırlansın mı? Tüm girdiler silinecek.')) { localStorage.removeItem(DRAFT); setState(createDefaultGelirBazliInput()); } }}>
          ↺ Sayfayı Sıfırla
        </button>
        <label className="btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
          📂 Excel Yükle
          <input type="file" accept=".xlsx" hidden onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            const data = await readDataSheet<GelirBazliUstHakkiInput>(f);
            if (data) setState(data); else alert('Bu Excel dosyasında ArsaPlan verisi bulunamadı.');
            e.currentTarget.value = '';
          }} />
        </label>
      </div></div>
      <div className="hint" style={{ margin: "6px 0 0" }}>Excel'e görünmeyen bir veri sayfası eklenir; aynı dosyayı "Excel Yükle" ile geri yükleyince tüm girdiler birebir doldurulur.</div>

      {state.toplamGelirBase > 0 && (
        <div className="hotel-summary-sticky no-print">
          <div className="hotel-summary-inner">
            <div><span>Projeksiyon Süresi</span><b>{state.kalanSureYil} yıl</b></div>
            <div><span>Üst Hakkı Değeri</span><b>{TL(r.ustHakkiDegeriRounded)}</b></div>
          </div>
        </div>
      )}

      <div className="step" style={{ paddingBottom: 76 }}>
        <div className="step-head">
          <div className="step-eyebrow">Üst Hakkı Değerleme</div>
          <div className="step-title">Basit Gelir Bazlı Üst Hakkı Hesabı</div>
          <div className="step-desc">"Toplam Gelir Üzerinden Üst Hakkı Hesabı"nın sadeleştirilmiş sürümü — tek gelir tabanı, tek işletme gideri oranı, tek sabit gider oranı. Kalan Süre = Projeksiyon Süresi, terminal değer yok.</div>
        </div>

        <div className="card">
          <div className="card-title">Kimlik</div>
          <div className="hrow-labeled">
            <label className="pfield"><span>Otel/Tesis Adı <em>(opsiyonel)</em></span>
              <input value={state.hotelName} placeholder="—" onChange={(e) => patch({ hotelName: e.target.value })} /></label>
            <label className="pfield pfield--s"><span>Ada <em>(opsiyonel)</em></span>
              <input value={state.ada} placeholder="—" onChange={(e) => patch({ ada: e.target.value })} /></label>
            <label className="pfield pfield--s"><span>Parsel <em>(opsiyonel)</em></span>
              <input value={state.parsel} placeholder="—" onChange={(e) => patch({ parsel: e.target.value })} /></label>
            <label className="pfield"><span>Parsel Alanı m² <em>(opsiyonel)</em> {state.fromKml && <em>(KML)</em>}</span>
              <Num value={state.parcelArea} onChange={(n) => patch({ parcelArea: n, fromKml: false })} /></label>
            <label className="pfield"><span>KML (TKGM)</span>
              <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()}>Dosya Yükle</button>
              <input ref={fileRef} type="file" accept=".kml" hidden
                     onChange={(e) => { const f = e.target.files?.[0]; if (f) onKml(f); e.currentTarget.value = ''; }} />
            </label>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Para Birimi ve Süre</div>
          <div className="hrow-labeled">
            <label className="pfield pfield--s"><span>Para Birimi</span>
              <select value={state.currency} onChange={(e) => patch({ currency: e.target.value as GelirBazliUstHakkiInput['currency'] })}>
                <option value="TL">TL (₺)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option>
              </select></label>
            {state.currency !== 'TL' && (
              <label className="pfield pfield--s"><span>Kur (1 {state.currency} = ? ₺)</span>
                <Num value={state.fxRate} onChange={(n) => patch({ fxRate: n })} /></label>
            )}
            <label className="pfield pfield--s"><span>Toplam Süre (yıl)</span>
              <Num value={state.toplamSureYil} onChange={(n) => patch({ toplamSureYil: n })} /></label>
            <label className="pfield pfield--s"><span>Kalan Süre (yıl) <b style={{ color: '#c0392b' }}>*zorunlu</b></span>
              <Num value={state.kalanSureYil} onChange={(n) => patch({ kalanSureYil: n })} /></label>
          </div>
          <div className="hint" style={{ marginTop: 6 }}>Kalan Süre, doğrudan projeksiyon yıl sayısıdır — terminal değer eklenmez.</div>
        </div>

        <div className="card">
          <div className="card-title">Gelir ve Gider Varsayımları</div>
          <div className="hrow-labeled">
            <label className="pfield"><span>Toplam Gelir (1. yıl, {cur}) <b style={{ color: '#c0392b' }}>*zorunlu</b></span>
              <Num value={state.toplamGelirBase} onChange={(n) => patch({ toplamGelirBase: n })} /></label>
            <label className="pfield pfield--s"><span>Gelir Artış Oranı %</span>
              <Num value={state.gelirArtisOraniPct} onChange={(n) => patch({ gelirArtisOraniPct: n })} /></label>
            <label className="pfield pfield--s"><span>İşletme Gideri Oranı %</span>
              <Num value={state.isletmeGideriOraniPct} onChange={(n) => patch({ isletmeGideriOraniPct: n })} /></label>
            <label className="pfield pfield--s"><span>Sabit Gider Oranı %</span>
              <Num value={state.sabitGiderOraniPct} onChange={(n) => patch({ sabitGiderOraniPct: n })} /></label>
          </div>
          <div className="hint" style={{ marginTop: 6 }}>İşletme Gideri: personel/enerji/tamirat gibi doğrudan işletme giderleri. Sabit Gider: emlak vergisi + sigorta + yenileme fonu + işletmeci primi birleşik — ikisi de Toplam Gelir üzerinden.</div>
        </div>

        <div className="card">
          <div className="card-title">Üst Hakkı Sahibine Özgü Ödemeler</div>
          <div className="hrow-labeled">
            <label className="pfield"><span>Ecrimisil (1. yıl, {cur})</span>
              <Num value={state.ecrimisilBase} onChange={(n) => patch({ ecrimisilBase: n })} /></label>
            <label className="pfield pfield--s"><span>Artış %</span>
              <Num value={state.ecrimisilGrowthPct} onChange={(n) => patch({ ecrimisilGrowthPct: n })} /></label>
            <label className="pfield"><span>Üst Hakkı Ödemesi (1. yıl, {cur})</span>
              <Num value={state.ustHakkiOdemeBase} onChange={(n) => patch({ ustHakkiOdemeBase: n })} /></label>
            <label className="pfield pfield--s"><span>Artış %</span>
              <Num value={state.ustHakkiOdemeGrowthPct} onChange={(n) => patch({ ustHakkiOdemeGrowthPct: n })} /></label>
            <label className="pfield"><span>Bayilik (1. yıl, {cur})</span>
              <Num value={state.bayilikBase} onChange={(n) => patch({ bayilikBase: n })} /></label>
            <label className="pfield pfield--s"><span>Artış %</span>
              <Num value={state.bayilikGrowthPct} onChange={(n) => patch({ bayilikGrowthPct: n })} /></label>
          </div>
        </div>

        <div className="card">
          <div className="card-title">İskonto ve İndirgeme</div>
          <div className="hrow-labeled">
            <label className="pfield pfield--s"><span>İskonto Oranı %</span>
              <Num value={state.discountRatePct} onChange={(n) => patch({ discountRatePct: n })} /></label>
            <label className="pfield pfield--s"><span>Dönem Sonu Değer İndirgeme % <em>(opsiyonel)</em></span>
              <Num value={state.donemSonuIndirgemePct} onChange={(n) => patch({ donemSonuIndirgemePct: n })} /></label>
          </div>
          <div className="hint" style={{ marginTop: 6 }}>İskonto oranı için TCMB politika faizine yakın risksiz getiri + risk primi önerilir (TL için tipik %35-45).</div>
          {r.warnings.map((w, i) => <div className="warn-line" key={i}>{w}</div>)}
        </div>

        <div className="card result-card">
          <div className="card-title">Sonuç</div>
          <div className="hrow-labeled">
            <div className="pfield pfield--ro"><span>Nakit Akış BBD Toplamı</span><b>{TL(r.sumPresentValue)}</b></div>
            <div className="pfield pfield--ro pfield--big"><span>ÜST HAKKI DEĞERİ</span><b>{TL(r.ustHakkiDegeriRounded)}</b></div>
            {state.currency !== 'TL' && (
              <div className="pfield pfield--ro"><span>TL Karşılığı</span><b>{Math.round(r.ustHakkiDegeriTl).toLocaleString('tr-TR')} ₺</b></div>
            )}
          </div>
          <label className="chk-row" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <input type="checkbox" checked={!!state.showReportDate}
                   onChange={(e) => patch({ showReportDate: e.target.checked })} />
            <span>Rapor Tarihini Göster (opsiyonel)</span>
          </label>
          {state.showReportDate && (
            <label className="pfield" style={{ marginTop: 6, maxWidth: 220 }}>
              <span>Rapor Tarihi (boş bırakılırsa bugün)</span>
              <input type="date" value={state.reportDate ?? ''}
                     onChange={(e) => patch({ reportDate: e.target.value || null })} />
            </label>
          )}
          <div className="grid-2" style={{ marginTop: 10 }}>
            <label className="pfield"><span>Banka İsmi (opsiyonel)</span>
              <input value={state.bankName ?? ''} onChange={(e) => patch({ bankName: e.target.value || null })} /></label>
            <label className="pfield"><span>Şube İsmi (opsiyonel)</span>
              <input value={state.branchName ?? ''} onChange={(e) => patch({ branchName: e.target.value || null })} /></label>
          </div>
          <div className="export-row no-print">
            <button type="button" className="btn-ghost" onClick={onPdf}>📄 PDF İndir</button>
            <button type="button" className="btn-ghost" onClick={onExcel}>📊 Excel İndir</button>
          </div>
        </div>

        <div className="stamp">{BRAND.preparedBy}<br />{BRAND.developerLine} · Basit Gelir Bazlı Üst Hakkı Hesabı</div>
      </div>

      <div className="navbar no-print">
        <div className="navbar-inner">
          <button type="button" className="btn btn-ghost" onClick={onBack}>← Ana Sayfaya Dön</button>
        </div>
      </div>
    </div>
  );
}
