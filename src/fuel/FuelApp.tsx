/**
 * AKARYAKIT İSTASYONU GELİR HESABI — tek ekran, çift yöntem.
 * 3 ürün (KDV hariç fiyat) · 4 giriş modu · ilave gelirler (ciro/net) ·
 * dağıtıcı kirası opsiyonu · kap oranı konum önerili · sonuç yuvarlama ·
 * opsiyonel MALİYET yaklaşımı (arsa + yapılar) → "Gelir 60M · Maliyet 57M" yan yana.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { computeFuel, daysBetween, type FuelInput, type FuelProductInput, type ExtraIncomeRow } from './engine';
import { BRAND } from '../brand/brand';
import { parseKml } from '../geo/kml';
import { readDataSheet } from '../export/excelImport';
import { downloadFuelPdf } from './pdf';
import { downloadFuelExcel } from './excel';
import { Num, Sel, Txt } from '../ui/fields';
import { YAPI_SINIFLARI } from '../data/yapiSiniflari';
import { BUILDING_TYPES } from '../usthakki/detailedEngine';
import { suggestBuildingClass } from '../data/yapiTuruEslesme';

const DRAFT = 'arsaplan-fuel-draft-v1';
const uid = () => Math.random().toString(36).slice(2, 9);
const TL = (v: number) => Math.round(v).toLocaleString('tr-TR') + ' ₺';

const PRODUCT_DEFS: { name: string; profit: number; hint: string }[] = [
  { name: 'Kurşunsuz Benzin (95)', profit: 3, hint: 'Öneri %3 · 5-10bin Lt/gün satan istasyonda %3,5 · 10bin+ %4' },
  { name: 'Motorin', profit: 3, hint: 'Öneri %3 · 5-10bin Lt/gün %3,5 · 10bin+ %4' },
  { name: 'LPG (Otogaz)', profit: 5, hint: 'Öneri %5 · dağıtıcı sözleşmesine göre %6-7 olabilir' },
];
const EXTRA_SUGGESTIONS = [
  'Market Geliri', 'Restoran / Kafe Geliri', 'Oto Yıkama', 'Araç Temizlik Merkezi', 'LPG Geliri',
  'Elektrikli Araç Şarj Geliri', 'ATM / Banka Kira Geliri', 'Reklam Geliri',
  'Araç Bakım / Lastik Servisi', 'Lastik Satış ve Değişimi', 'Tekel', 'Kira Geliri',
];
const EXTRA_PCT: Record<string, number> = { 'Restoran / Lokanta': 20, Market: 20, Tekel: 4 };

function defProduct(i: number): FuelProductInput & { periodStart: string; periodEnd: string } {
  const d = PRODUCT_DEFS[i];
  const y = new Date().getFullYear();
  return { id: uid(), name: d.name, mode: 'gunluk', dailyLiters: 0, yearlyLiters: 0,
    multiYearLiters: [0, 0, 0], multiYearLabels: [String(y - 2), String(y - 1), String(y)],
    periodLiters: 0, periodDays: 0, unitPrice: 0, profitPct: d.profit,
    periodStart: '', periodEnd: '' };
}

const DEFAULT = {
  products: [defProduct(0), defProduct(1), defProduct(2)],
  extras: [] as ExtraIncomeRow[],
  otherIncomePctOfFuel: 0,
  dealerRent: { include: false, yearlyAmount: 0 },
  capRate: 10, rounding: 50000,
  cost: { enabled: false, parcelArea: 0, landUnitValue: 0,
    buildings: [] as { id: string; type: string; buildingClassCode: string | null; area: number; unitCostOverride: number | null; depreciationPct: number }[],
    computeMevcutDurum: false,
    mevcutBuildings: [] as { id: string; type: string; buildingClassCode: string | null; area: number; unitCostOverride: number | null; depreciationPct: number }[] },
  finalMethod: 'gelir' as 'gelir' | 'maliyet' | 'manuel',
  finalManualValue: null as number | null,
};
type S = typeof DEFAULT;

export function FuelApp({ onBack }: { onBack: () => void }) {
  const [state, setState] = useState<S>(() => {
    try { const s = localStorage.getItem(DRAFT); if (s) return JSON.parse(s); } catch { /* yok */ }
    return DEFAULT;
  });
  useEffect(() => { try { localStorage.setItem(DRAFT, JSON.stringify(state)); } catch { /* dolu */ } }, [state]);
  const fileRef = useRef<HTMLInputElement>(null);

  const engineInput: FuelInput = useMemo(() => ({
    ...state,
    capRate: state.capRate / 100,
    products: state.products.map((p) => ({
      ...p,
      periodDays: p.periodStart && p.periodEnd ? daysBetween(p.periodStart, p.periodEnd) : p.periodDays,
    })),
  }), [state]);
  const r = useMemo(() => computeFuel(engineInput), [engineInput]);

  const patch = (p: Partial<S>) => setState((s) => ({ ...s, ...p }));
  const patchProd = (id: string, p: Partial<S['products'][0]>) =>
    patch({ products: state.products.map((x) => (x.id === id ? { ...x, ...p } : x)) });
  const patchExtra = (id: string, p: Partial<ExtraIncomeRow>) =>
    patch({ extras: state.extras.map((x) => (x.id === id ? { ...x, ...p } : x)) });

  async function onKml(f: File) {
    try {
      const parsed = parseKml(await f.text());
      const area = parsed ? (parsed.deedArea || parsed.polygonArea || 0) : 0;
      if (area > 0) patch({ cost: { ...state.cost, enabled: true, parcelArea: Math.round(area) } });
      else alert('KML içinde alan bilgisi bulunamadı.');
    } catch { alert('KML okunamadı.'); }
  }

  return (
    <div className="app fuel-app">
      <div className="topbar no-print"><div className="topbar-inner">
        <img src={`${import.meta.env.BASE_URL}dora-logo.png`} alt={BRAND.company} className="topbar-logo" />
        <button type="button" className="btn-ghost" onClick={onBack}>← Ana Sayfaya Dön</button>
        <button type="button" className="btn-ghost" title="Tüm alanları temizler"
                onClick={() => { if (window.confirm('Sayfa sıfırlansın mı? Tüm girdiler silinecek.')) { localStorage.removeItem(DRAFT); setState(DEFAULT); } }}>
          ↺ Sayfayı Sıfırla
        </button>
        <label className="btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
          📂 Excel Yükle
          <input type="file" accept=".xlsx" hidden onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            const data = await readDataSheet<S>(f);
            if (data) setState(data); else alert('Bu Excel dosyasında ArsaPlan verisi bulunamadı.');
            e.currentTarget.value = '';
          }} />
        </label>
      </div></div>
      <div className="hint" style={{ margin: "6px 0 0" }}>Excel'e görünmeyen bir veri sayfası eklenir; aynı dosyayı "Excel Yükle" ile geri yükleyince tüm girdiler birebir doldurulur.</div>

      {state.products.length > 0 && (
        <div className="hotel-summary-sticky no-print">
          <div className="hotel-summary-inner">
            <div><span>Toplam Net Kâr</span><b>{TL(r.totalNet)}</b></div>
            <div><span>Gelir (Direkt Kap.)</span><b>{TL(r.incomeValueRounded)}</b></div>
            {r.costValue != null && <div><span>Maliyet Yaklaşımı</span><b>{TL(r.costValue)}</b></div>}
          </div>
        </div>
      )}

      <div className="step" style={{ paddingBottom: 76 }}>
        <div className="step-head">
          <div className="step-eyebrow">Akaryakıt Gelir Hesabı</div>
          <div className="step-title">İstasyon Satışları ve Değerleme</div>
          <div className="step-desc">Fiyatları <b>KDV hariç</b> giriniz. Kâr oranları ve kapitalizasyon önerileri yönlendiricidir; tüm kutular serbesttir.</div>
        </div>

        <div className="card">
          <div className="card-title">Akaryakıt Satışları</div>
          {r.products.map((pr) => {
            const s = state.products.find((x) => x.id === pr.id)!;
            const def = PRODUCT_DEFS.find((d) => d.name === pr.name);
            return (
              <div className="prop-card" key={pr.id}>
                <div className="prop-card__top">
                  <div className="pfield pfield--ro"><span>Ürün</span><b>{pr.name}</b></div>
                  <label className="pfield"><span>Veri Girişi</span>
                    <select value={s.mode} onChange={(e) => patchProd(pr.id, { mode: e.target.value as never })}>
                      <option value="gunluk">Günlük litre (×365)</option>
                      <option value="yillik">Yıllık litre</option>
                      <option value="cokyil">Çok yıllı ortalama</option>
                      <option value="kismi">Kısmi dönem (tarih aralığı)</option>
                    </select></label>
                  {s.mode === 'gunluk' && (
                    <label className="pfield"><span>Günlük Litre</span>
                      <input type="number" value={s.dailyLiters || ''} onChange={(e) => patchProd(pr.id, { dailyLiters: Number(e.target.value) || 0 })} /></label>
                  )}
                  {s.mode === 'yillik' && (
                    <label className="pfield"><span>Yıllık Litre</span>
                      <input type="number" value={s.yearlyLiters || ''} onChange={(e) => patchProd(pr.id, { yearlyLiters: Number(e.target.value) || 0 })} /></label>
                  )}
                  {s.mode === 'cokyil' && s.multiYearLiters.map((v, i) => (
                    <label className="pfield pfield--s" key={i}>
                      <span>
                        <input className="year-label-input" value={s.multiYearLabels?.[i] ?? String(i + 1)}
                               onChange={(e) => {
                                 const arr = [...(s.multiYearLabels ?? s.multiYearLiters.map((_, j) => String(j + 1)))];
                                 arr[i] = e.target.value;
                                 patchProd(pr.id, { multiYearLabels: arr });
                               }} /> Yılı Lt
                      </span>
                      <input type="number" value={v || ''} onChange={(e) => {
                        const arr = [...s.multiYearLiters]; arr[i] = Number(e.target.value) || 0;
                        patchProd(pr.id, { multiYearLiters: arr });
                      }} /></label>
                  ))}
                  {s.mode === 'kismi' && (<>
                    <label className="pfield"><span>Başlangıç</span>
                      <input type="date" value={s.periodStart} onChange={(e) => patchProd(pr.id, { periodStart: e.target.value })} /></label>
                    <label className="pfield"><span>Bitiş</span>
                      <input type="date" value={s.periodEnd} onChange={(e) => patchProd(pr.id, { periodEnd: e.target.value })} /></label>
                    <label className="pfield"><span>Dönem Litresi</span>
                      <input type="number" value={s.periodLiters || ''} onChange={(e) => patchProd(pr.id, { periodLiters: Number(e.target.value) || 0 })} /></label>
                  </>)}
                  <label className="pfield pfield--s"><span>Fiyat ₺/Lt (KDV hariç)</span>
                    <input type="number" step="0.01" value={s.unitPrice || ''} onChange={(e) => patchProd(pr.id, { unitPrice: Number(e.target.value) || 0 })} /></label>
                  <label className="pfield pfield--s"><span>Net Kâr % {def && <em title={def.hint}>ⓘ</em>}</span>
                    <input type="number" step="0.1" value={s.profitPct || ''} onChange={(e) => patchProd(pr.id, { profitPct: Number(e.target.value) || 0 })} /></label>
                </div>
                <div className="prop-card__bottom">
                  <div className="pfield pfield--ro"><span>Yıllık Litre (365 gün)</span><b>{pr.yearlyLitersUsed.toLocaleString('tr-TR')}</b></div>
                  <div className="pfield pfield--ro"><span>Yıllık Ciro</span><b>{TL(pr.turnover)}</b></div>
                  <div className="pfield pfield--ro"><span>Yıllık Net Kâr</span><b>{TL(pr.net)}</b></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="card-title">İlave Gelir Getiriciler</div>
          <div className="hint">İstasyon içinde oto yıkama, restoran, market gibi bölümler varsa ekleyin — değere etkisi ancak siz eklerseniz girer.</div>
          {state.extras.map((e) => (
            <div className="prop-card" key={e.id}>
              <div className="prop-card__top">
                <label className="pfield"><span>Gelir Kalemi</span>
                  <select value={EXTRA_SUGGESTIONS.includes(e.name) ? e.name : '__ozel__'} onChange={(ev) => {
                    const name = ev.target.value === '__ozel__' ? '' : ev.target.value;
                    patchExtra(e.id, { name, ...(EXTRA_PCT[name] !== undefined ? { profitPct: EXTRA_PCT[name] } : {}) });
                  }}>
                    {EXTRA_SUGGESTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                    <option value="__ozel__">Diğer (elle yaz)</option>
                  </select>
                  {!EXTRA_SUGGESTIONS.includes(e.name) && (
                    <input style={{ marginTop: 6 }} placeholder="Gelir kalemi adı" value={e.name}
                           onChange={(ev) => patchExtra(e.id, { name: ev.target.value })} />
                  )}</label>
                <label className="pfield"><span>Hesap Şekli</span>
                  <select value={e.mode} onChange={(ev) => patchExtra(e.id, { mode: ev.target.value as never })}>
                    <option value="ciro">Ciro × kâr oranı</option>
                    <option value="net">Doğrudan net tutar</option>
                  </select></label>
                {e.mode === 'ciro' ? (<>
                  <label className="pfield"><span>Yıllık Ciro ₺</span>
                    <Num value={e.turnover} onChange={(n) => patchExtra(e.id, { turnover: n })} /></label>
                  <label className="pfield pfield--s"><span>Kâr %</span>
                    <Num value={e.profitPct} onChange={(n) => patchExtra(e.id, { profitPct: n })} /></label>
                </>) : (
                  <label className="pfield"><span>Yıllık Net ₺</span>
                    <Num value={e.netAmount} onChange={(n) => patchExtra(e.id, { netAmount: n })} /></label>
                )}
                <div className="pfield pfield--ro"><span>Net Katkı</span>
                  <b>{TL(e.mode === 'net' ? e.netAmount : e.turnover * e.profitPct / 100)}</b></div>
                <button type="button" className="b-del" onClick={() => patch({ extras: state.extras.filter((x) => x.id !== e.id) })}>✕</button>
              </div>
            </div>
          ))}
          <button type="button" className="btn-ghost"
                  onClick={() => patch({ extras: [...state.extras, { id: uid(), name: 'Oto Yıkama', mode: 'ciro', turnover: 0, profitPct: 20, netAmount: 0 }] })}>
            ➕ Gelir Kalemi Ekle
          </button>
          <div className="hrow-labeled" style={{ marginTop: 12 }}>
            <label className="pfield"><span>Diğer Gelirler <em title="Bazı dosyalarda ayrıntı yoktur, yalnız tek bir 'Diğer Gelirler' toplamı bulunur. Ayrıntılı kalemlerle birlikte de kullanılabilir.">(yakıt cirosunun %'si)</em></span>
              <input type="number" step="0.5" placeholder="0" value={state.otherIncomePctOfFuel || ''}
                     onChange={(e) => patch({ otherIncomePctOfFuel: Number(e.target.value) || 0 })} /></label>
            {state.otherIncomePctOfFuel > 0 && (
              <div className="pfield pfield--ro"><span>Katkı</span><b>{TL(r.otherIncomeFromPct)}</b></div>
            )}
          </div>
          <div className="hrow-labeled" style={{ marginTop: 12 }}>
            <label className="pfield"><span>Dağıtıcıya Kira Ödeniyor mu?</span>
              <select value={state.dealerRent.include ? '1' : '0'}
                      onChange={(e) => patch({ dealerRent: { ...state.dealerRent, include: e.target.value === '1' } })}>
                <option value="0">Hesap dışı bırak</option>
                <option value="1">Net kârdan düş</option>
              </select></label>
            {state.dealerRent.include && (
              <label className="pfield"><span>Yıllık Kira ₺</span>
                <input type="number" value={state.dealerRent.yearlyAmount || ''}
                       onChange={(e) => patch({ dealerRent: { ...state.dealerRent, yearlyAmount: Number(e.target.value) || 0 } })} /></label>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Maliyet Yaklaşımı (opsiyonel — ikinci değer)</div>
          <div className="hrow-labeled">
            <label className="pfield"><span>Maliyet Hesabı</span>
              <select value={state.cost.enabled ? '1' : '0'}
                      onChange={(e) => patch({ cost: { ...state.cost, enabled: e.target.value === '1' } })}>
                <option value="0">Kapalı (yalnız gelir değeri)</option>
                <option value="1">Açık (gelirle yan yana)</option>
              </select></label>
            {state.cost.enabled && (<>
              <label className="pfield"><span>Parsel Alanı m²</span>
                <input type="number" value={state.cost.parcelArea || ''}
                       onChange={(e) => patch({ cost: { ...state.cost, parcelArea: Number(e.target.value) || 0 } })} /></label>
              <label className="pfield"><span>Arsa Birim ₺/m²</span>
                <input type="number" value={state.cost.landUnitValue || ''}
                       onChange={(e) => patch({ cost: { ...state.cost, landUnitValue: Number(e.target.value) || 0 } })} /></label>
              <label className="pfield"><span>KML (TKGM)</span>
                <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()}>Dosya Yükle</button>
                <input ref={fileRef} type="file" accept=".kml" hidden
                       onChange={(e) => { const f = e.target.files?.[0]; if (f) onKml(f); e.currentTarget.value = ''; }} />
              </label>
            </>)}
          </div>
          {state.cost.enabled && (<>
            <div className="card-title" style={{ marginTop: 10, fontSize: 13 }}>Yapılar — Yasal Durum</div>
            {state.cost.buildings.map((b) => {
              const cls = YAPI_SINIFLARI.find((c) => c.code === b.buildingClassCode);
              const effectiveUnitCost = b.unitCostOverride ?? cls?.unitCost ?? 0;
              return (
              <div className="prop-card" key={b.id}><div className="prop-card__top">
                <label className="pfield"><span>Yapı Türü</span>
                  <Sel value={BUILDING_TYPES.includes(b.type) ? b.type : 'Diğer'}
                       onChange={(v) => {
                         const newType = v === 'Diğer' ? '' : v;
                         const suggested = suggestBuildingClass(newType);
                         patch({ cost: { ...state.cost, buildings: state.cost.buildings.map((x) => x.id === b.id
                           ? (suggested ? { ...x, type: newType, buildingClassCode: suggested, unitCostOverride: null } : { ...x, type: newType })
                           : x) } });
                       }}
                       options={[...BUILDING_TYPES.map((t) => ({ value: t, label: t })), { value: 'Diğer', label: 'Diğer (elle yaz)' }]} />
                  {!BUILDING_TYPES.includes(b.type) && (
                    <Txt value={b.type} placeholder="Yapı adını yazın"
                         onChange={(v) => patch({ cost: { ...state.cost, buildings: state.cost.buildings.map((x) => x.id === b.id ? { ...x, type: v } : x) } })} />
                  )}
                </label>
                <label className="pfield pfield--s"><span>Yapı Sınıfı</span>
                  <Sel value={b.buildingClassCode ?? ''}
                       onChange={(v) => patch({ cost: { ...state.cost, buildings: state.cost.buildings.map((x) => x.id === b.id ? { ...x, buildingClassCode: v || null, unitCostOverride: null } : x) } })}
                       options={[{ value: '', label: '— elle gireceğim —' }, ...YAPI_SINIFLARI.map((c) => ({ value: c.code, label: c.code }))]} />
                </label>
                <label className="pfield pfield--s"><span>Alan m²</span>
                  <Num value={b.area || 0} onChange={(n) => patch({ cost: { ...state.cost, buildings: state.cost.buildings.map((x) => x.id === b.id ? { ...x, area: n } : x) } })} /></label>
                <label className="pfield pfield--s"><span>Birim ₺/m²</span>
                  <span className="floor-cell">
                    <Num value={effectiveUnitCost} onChange={(n) => patch({ cost: { ...state.cost, buildings: state.cost.buildings.map((x) => x.id === b.id ? { ...x, unitCostOverride: n } : x) } })} />
                    {b.unitCostOverride != null && (
                      <button type="button" className="cell-reset" title="Tebliğ değerine dön"
                              onClick={() => patch({ cost: { ...state.cost, buildings: state.cost.buildings.map((x) => x.id === b.id ? { ...x, unitCostOverride: null } : x) } })}>↺</button>
                    )}
                  </span>
                </label>
                <label className="pfield pfield--s"><span>Amortisman %</span>
                  <Num value={b.depreciationPct || 0} onChange={(n) => patch({ cost: { ...state.cost, buildings: state.cost.buildings.map((x) => x.id === b.id ? { ...x, depreciationPct: n } : x) } })} /></label>
                <div className="pfield pfield--ro"><span>Maliyet</span><b>{TL(Math.max(0, b.area) * Math.max(0, effectiveUnitCost) * (b.depreciationPct > 0 ? Math.min(100, b.depreciationPct) / 100 : 1))}</b></div>
                <button type="button" className="b-del" onClick={() => patch({ cost: { ...state.cost, buildings: state.cost.buildings.filter((x) => x.id !== b.id) } })}>✕</button>
              </div></div>
              );
            })}
            <button type="button" className="btn-ghost"
                    onClick={() => patch({ cost: { ...state.cost, buildings: [...state.cost.buildings, (() => {
                      const t0 = BUILDING_TYPES[0]; const suggested = suggestBuildingClass(t0);
                      return { id: uid(), type: t0, buildingClassCode: suggested, unitCostOverride: suggested ? null : 0, area: 0, depreciationPct: 100 };
                    })()] } })}>
              ➕ Yapı Ekle
            </button>

            <label className="chk-row" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <input type="checkbox" checked={!!state.cost.computeMevcutDurum}
                     onChange={() => patch({
                       cost: state.cost.computeMevcutDurum
                         ? { ...state.cost, computeMevcutDurum: false }
                         : { ...state.cost, computeMevcutDurum: true,
                             mevcutBuildings: state.cost.buildings.length > 0
                               ? state.cost.buildings.map((b) => ({ ...b, id: uid() }))
                               : (state.cost.mevcutBuildings ?? []) },
                     })} />
              <span><b>Mevcut Durum Değeri Hesapla</b> (opsiyonel)</span>
            </label>
            <div className="hint" style={{ marginTop: 4 }}>
              Açarsanız yukarıdaki yapı satırları aşağıya kopyalanır; burada bağımsız olarak değiştirebilir,
              silebilir veya yeni satır ekleyebilirsiniz. Kapalı kalırsa Mevcut Durum, Yasal Durum ile aynı görünür.
            </div>

            {state.cost.computeMevcutDurum && (
              <>
                <div className="card-title" style={{ marginTop: 10, fontSize: 13 }}>Yapılar — Mevcut Durum</div>
                {(state.cost.mevcutBuildings ?? []).map((b) => {
                  const cls = YAPI_SINIFLARI.find((c) => c.code === b.buildingClassCode);
                  const effectiveUnitCost = b.unitCostOverride ?? cls?.unitCost ?? 0;
                  return (
                  <div className="prop-card" key={b.id}><div className="prop-card__top">
                    <label className="pfield"><span>Yapı Türü</span>
                      <Sel value={BUILDING_TYPES.includes(b.type) ? b.type : 'Diğer'}
                           onChange={(v) => {
                             const newType = v === 'Diğer' ? '' : v;
                             const suggested = suggestBuildingClass(newType);
                             patch({ cost: { ...state.cost, mevcutBuildings: (state.cost.mevcutBuildings ?? []).map((x) => x.id === b.id
                               ? (suggested ? { ...x, type: newType, buildingClassCode: suggested, unitCostOverride: null } : { ...x, type: newType })
                               : x) } });
                           }}
                           options={[...BUILDING_TYPES.map((t) => ({ value: t, label: t })), { value: 'Diğer', label: 'Diğer (elle yaz)' }]} />
                      {!BUILDING_TYPES.includes(b.type) && (
                        <Txt value={b.type} placeholder="Yapı adını yazın"
                             onChange={(v) => patch({ cost: { ...state.cost, mevcutBuildings: (state.cost.mevcutBuildings ?? []).map((x) => x.id === b.id ? { ...x, type: v } : x) } })} />
                      )}
                    </label>
                    <label className="pfield pfield--s"><span>Yapı Sınıfı</span>
                      <Sel value={b.buildingClassCode ?? ''}
                           onChange={(v) => patch({ cost: { ...state.cost, mevcutBuildings: (state.cost.mevcutBuildings ?? []).map((x) => x.id === b.id ? { ...x, buildingClassCode: v || null, unitCostOverride: null } : x) } })}
                           options={[{ value: '', label: '— elle gireceğim —' }, ...YAPI_SINIFLARI.map((c) => ({ value: c.code, label: c.code }))]} />
                    </label>
                    <label className="pfield pfield--s"><span>Alan m²</span>
                      <Num value={b.area || 0} onChange={(n) => patch({ cost: { ...state.cost, mevcutBuildings: (state.cost.mevcutBuildings ?? []).map((x) => x.id === b.id ? { ...x, area: n } : x) } })} /></label>
                    <label className="pfield pfield--s"><span>Birim ₺/m²</span>
                      <span className="floor-cell">
                        <Num value={effectiveUnitCost} onChange={(n) => patch({ cost: { ...state.cost, mevcutBuildings: (state.cost.mevcutBuildings ?? []).map((x) => x.id === b.id ? { ...x, unitCostOverride: n } : x) } })} />
                        {b.unitCostOverride != null && (
                          <button type="button" className="cell-reset" title="Tebliğ değerine dön"
                                  onClick={() => patch({ cost: { ...state.cost, mevcutBuildings: (state.cost.mevcutBuildings ?? []).map((x) => x.id === b.id ? { ...x, unitCostOverride: null } : x) } })}>↺</button>
                        )}
                      </span>
                    </label>
                    <label className="pfield pfield--s"><span>Amortisman %</span>
                      <Num value={b.depreciationPct || 0} onChange={(n) => patch({ cost: { ...state.cost, mevcutBuildings: (state.cost.mevcutBuildings ?? []).map((x) => x.id === b.id ? { ...x, depreciationPct: n } : x) } })} /></label>
                    <div className="pfield pfield--ro"><span>Maliyet</span><b>{TL(Math.max(0, b.area) * Math.max(0, effectiveUnitCost) * (b.depreciationPct > 0 ? Math.min(100, b.depreciationPct) / 100 : 1))}</b></div>
                    <button type="button" className="b-del" onClick={() => patch({ cost: { ...state.cost, mevcutBuildings: (state.cost.mevcutBuildings ?? []).filter((x) => x.id !== b.id) } })}>✕</button>
                  </div></div>
                  );
                })}
                <button type="button" className="btn-ghost"
                        onClick={() => patch({ cost: { ...state.cost, mevcutBuildings: [...(state.cost.mevcutBuildings ?? []), (() => {
                          const t0 = BUILDING_TYPES[0]; const suggested = suggestBuildingClass(t0);
                          return { id: uid(), type: t0, buildingClassCode: suggested, unitCostOverride: suggested ? null : 0, area: 0, depreciationPct: 100 };
                        })()] } })}>
                  ➕ Mevcut Duruma Yapı Ekle
                </button>
              </>
            )}
          </>)}
        </div>

        <div className="card result-card">
          <div className="card-title">Sonuç — Değerleme</div>
          <div className="hrow-labeled">
            <div className="pfield pfield--ro"><span>Yakıt Net Kârı/yıl</span><b>{TL(r.fuelNet)}</b></div>
            <div className="pfield pfield--ro"><span>İlave Gelirler/yıl</span><b>{TL(r.extrasNet + r.otherIncomeFromPct)}</b></div>
            {r.dealerRentApplied > 0 && <div className="pfield pfield--ro"><span>Dağıtıcı Kirası</span><b>−{TL(r.dealerRentApplied)}</b></div>}
            <div className="pfield pfield--ro"><span>Toplam Net Kâr/yıl</span><b>{TL(r.totalNet)}</b></div>
            <label className="pfield pfield--s"><span>Konum</span>
              <select value="" onChange={(e) => { const v = Number(e.target.value); if (v) patch({ capRate: v }); }}>
                <option value="">Öneri seçin…</option>
                <option value="10">Şehir içi (10bin+ Lt/gün) → %10</option>
                <option value="11">Şehre yakın, orta ölçek (5-10bin Lt/gün) → %10-12</option>
                <option value="12">Şehirlerarası / düşük ciro → %12</option>
              </select></label>
            <label className="pfield pfield--s"><span>Kap. Oranı %</span>
              <input type="number" step="0.5" value={state.capRate || ''}
                     title="Düşük ciro → yüksek risk → yüksek kap. oranı → düşük değer. Yüksek ciro → düşük risk → düşük kap. oranı → yüksek değer."
                     onChange={(e) => patch({ capRate: Number(e.target.value) || 0 })} /></label>
            <label className="pfield pfield--s"><span>Yuvarlama ₺</span>
              <input type="number" value={state.rounding || ''} onChange={(e) => patch({ rounding: Number(e.target.value) || 0 })} /></label>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginTop: 8 }}>
            <label className="pfield pfield--s"><span>Nihai Değer</span>
              <select value={state.finalMethod ?? 'gelir'}
                      onChange={(e) => patch({ finalMethod: e.target.value as typeof state.finalMethod })}>
                <option value="gelir">Gelir Yaklaşımı</option>
                {r.costValue != null && <option value="maliyet">Maliyet Yaklaşımı</option>}
                <option value="manuel">Manuel</option>
              </select>
            </label>
            {(state.finalMethod ?? 'gelir') === 'manuel' && (
              <label className="pfield pfield--s"><span>Manuel Değer ₺</span>
                <input type="number" value={state.finalManualValue ?? ''}
                       onChange={(e) => patch({ finalManualValue: Number(e.target.value) || 0 })} /></label>
            )}
          </div>
          <div className="dual-values">
            <div className={`dual-box${(state.finalMethod ?? 'gelir') === 'gelir' ? ' dual-box--chosen' : ''}`}>
              <span>GELİR YAKLAŞIMI</span>
              <b>{TL(r.incomeValueRounded)}</b>
              <em>Net kâr ÷ %{state.capRate}</em>
            </div>
            {r.costValue != null && (
              <div className={`dual-box${state.finalMethod === 'maliyet' ? ' dual-box--chosen' : ''}`}>
                <span>MALİYET YAKLAŞIMI</span>
                <b>{TL(r.costValue)}</b>
                <em>Arsa {TL(r.costLand)} + Yapılar {TL(r.costBuildings)}</em>
              </div>
            )}
          </div>
          {r.warnings.map((w, i) => <div className="warn-line" key={i}>{w}</div>)}
          <div className="export-row no-print">
            <button type="button" className="btn-ghost" onClick={() => downloadFuelPdf(engineInput, r)}>📄 PDF İndir</button>
            <button type="button" className="btn-ghost" onClick={() => downloadFuelExcel(engineInput, r)}>📊 Excel İndir</button>
          </div>
        </div>

        <div className="stamp">{BRAND.preparedBy}<br />{BRAND.developerLine} · Akaryakıt Gelir Modülü</div>
      </div>

      <div className="navbar no-print">
        <div className="navbar-inner">
          <button type="button" className="btn btn-ghost" onClick={onBack}>← Ana Sayfaya Dön</button>
        </div>
      </div>
    </div>
  );
}
