/**
 * TARIMSAL ÜRÜN GELİR HESABI — tek ekran modül (adım çubuğu yok).
 * Ekili / Dikili / Karma; katalog yalnız ÖNERİ doldurur, her kutu serbest.
 * Değer = yıllık net gelir × amorti yılı (dükkan mantığı). KML ile alan alınabilir.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { computeAgri, suggestTreeCount, type AgriInput, type CropRow } from './engine';
import { FIELD_CROPS, TREE_CROPS } from './catalog';
import { BRAND } from '../brand/brand';
import { parseKml } from '../geo/kml';

const DRAFT = 'arsaplan-agri-draft-v1';
const uid = () => Math.random().toString(36).slice(2, 9);
const TL = (v: number) => Math.round(v).toLocaleString('tr-TR') + ' ₺';

function defaultRow(kind: CropRow['kind']): CropRow {
  const c = kind === 'ekili' ? FIELD_CROPS[0] : TREE_CROPS[TREE_CROPS.length - 1];
  return { id: uid(), kind, name: c.name, areaM2: 0, treeCount: 0, yieldPerUnit: c.yieldPerUnit, price: c.price, expensePct: c.expensePct };
}

const DEFAULT: AgriInput & { mode: 'ekili' | 'dikili' | 'karma' } = {
  mode: 'ekili', parcelArea: 10000, arablePct: 85, amortYears: 3,
  rows: [defaultRow('ekili')],
};

export function AgriApp({ onBack }: { onBack: () => void }) {
  const [state, setState] = useState(() => {
    try { const s = localStorage.getItem(DRAFT); if (s) return JSON.parse(s); } catch { /* yok */ }
    return DEFAULT;
  });
  useEffect(() => { try { localStorage.setItem(DRAFT, JSON.stringify(state)); } catch { /* dolu */ } }, [state]);

  const [spacing, setSpacing] = useState({ a: 4, b: 5, edgeFull: false, target: '' });
  const fileRef = useRef<HTMLInputElement>(null);
  const result = useMemo(() => computeAgri(state), [state]);

  const patch = (p: Partial<typeof state>) => setState((s: typeof state) => ({ ...s, ...p }));
  const patchRow = (id: string, p: Partial<CropRow>) =>
    patch({ rows: state.rows.map((r: CropRow) => (r.id === id ? { ...r, ...p } : r)) });
  const applyCatalog = (id: string, kind: CropRow['kind'], name: string) => {
    const c = (kind === 'ekili' ? FIELD_CROPS : TREE_CROPS).find((x) => x.name === name);
    if (c) patchRow(id, { name, yieldPerUnit: c.yieldPerUnit, price: c.price, expensePct: c.expensePct });
    else patchRow(id, { name });
  };
  const refOf = (r: CropRow) => (r.kind === 'ekili' ? FIELD_CROPS : TREE_CROPS).find((x) => x.name === r.name);

  const setMode = (mode: 'ekili' | 'dikili' | 'karma') => {
    let rows = state.rows as CropRow[];
    if (mode === 'ekili') rows = rows.filter((r) => r.kind === 'ekili');
    if (mode === 'dikili') rows = rows.filter((r) => r.kind === 'dikili');
    if (!rows.length) rows = [defaultRow(mode === 'dikili' ? 'dikili' : 'ekili')];
    patch({ mode, rows });
  };

  async function onKml(f: File) {
    try {
      const parsed = parseKml(await f.text());
      const area = parsed ? (parsed.deedArea || parsed.polygonArea || 0) : 0;
      if (area > 0) patch({ parcelArea: Math.round(area) });
      else alert('KML içinde alan bilgisi bulunamadı.');
    } catch { alert('KML okunamadı.'); }
  }

  const treeSuggestion = suggestTreeCount(
    state.parcelArea * state.arablePct / 100, spacing.a, spacing.b, spacing.edgeFull);

  return (
    <div className="app agri-app">
      <div className="topbar no-print"><div className="topbar-inner">
        <img src={`${import.meta.env.BASE_URL}dora-logo.png`} alt={BRAND.company} className="topbar-logo" />
        <button type="button" className="btn-ghost" onClick={onBack}>← Yöntem Seçimi</button>
      </div></div>

      <div className="step">
        <div className="step-head">
          <div className="step-eyebrow">Tarımsal Ürün Gelir Hesabı</div>
          <div className="step-title">Ürün Deseni ve Gelir</div>
          <div className="step-desc">Değer = yıllık net gelir × bölge amorti yılı. Tüm öneriler yönlendiricidir; her kutu serbestçe değiştirilebilir.</div>
        </div>

        <div className="card">
          <div className="card-title">Parsel</div>
          <div className="hrow-labeled">
            <label className="pfield"><span>Parsel Türü</span>
              <select value={state.mode} onChange={(e) => setMode(e.target.value as never)}>
                <option value="ekili">Ekili Ürün (tarla)</option>
                <option value="dikili">Dikili Ürün (ağaç)</option>
                <option value="karma">Karma (tarla + ağaç)</option>
              </select></label>
            <label className="pfield"><span>Parsel Alanı m²</span>
              <input type="number" value={state.parcelArea || ''} onChange={(e) => patch({ parcelArea: Number(e.target.value) || 0 })} /></label>
            <label className="pfield"><span>Ekilebilir Alan %</span>
              <input type="number" value={state.arablePct || ''} title="Türkiye ortalaması %80-95"
                     onChange={(e) => patch({ arablePct: Number(e.target.value) || 0 })} /></label>
            <div className="pfield pfield--ro"><span>Ekilebilir Alan</span><b>{result.arableArea.toLocaleString('tr-TR')} m²</b></div>
            <label className="pfield"><span>KML (TKGM)</span>
              <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()}>Dosya Yükle</button>
              <input ref={fileRef} type="file" accept=".kml" hidden
                     onChange={(e) => { const f = e.target.files?.[0]; if (f) onKml(f); e.currentTarget.value = ''; }} />
            </label>
          </div>
        </div>

        {state.mode !== 'ekili' && (
          <div className="card">
            <div className="card-title">Ağaç Aralığından Adet Önerisi</div>
            <div className="hrow-labeled">
              <label className="pfield"><span>Sıra Arası (m)</span>
                <input type="number" value={spacing.a} onChange={(e) => setSpacing({ ...spacing, a: Number(e.target.value) || 0 })} /></label>
              <label className="pfield"><span>Ağaç Arası (m)</span>
                <input type="number" value={spacing.b} onChange={(e) => setSpacing({ ...spacing, b: Number(e.target.value) || 0 })} /></label>
              <label className="pfield"><span>Kenar Payı</span>
                <select value={spacing.edgeFull ? '1' : '0'} onChange={(e) => setSpacing({ ...spacing, edgeFull: e.target.value === '1' })}>
                  <option value="0">Yarım aralık (standart)</option>
                  <option value="1">Tam mesafe (muhafazakâr)</option>
                </select></label>
              <div className="pfield pfield--ro"><span>Öneri (ekilebilir alanda)</span><b>{treeSuggestion.toLocaleString('tr-TR')} ağaç</b></div>
              <label className="pfield"><span>Uygula</span>
                <select value="" onChange={(e) => { if (e.target.value) patchRow(e.target.value, { treeCount: treeSuggestion }); }}>
                  <option value="">Satır seç…</option>
                  {state.rows.filter((r: CropRow) => r.kind === 'dikili').map((r: CropRow) => (
                    <option key={r.id} value={r.id}>{r.name}</option>))}
                </select></label>
            </div>
            <div className="hint">Komşu sınırına yarım aralık payı standarttır (komşu da aynı düzende dikerse tam mesafe korunur). Sayı öneridir; satırda elle değiştirin.</div>
          </div>
        )}

        <div className="card">
          <div className="card-title">Ürün Satırları</div>
          {result.rows.map((r) => {
            const ref = refOf(r);
            return (
              <div className="prop-card" key={r.id}>
                <div className="prop-card__top">
                  {state.mode === 'karma' && (
                    <label className="pfield pfield--s"><span>Tip</span>
                      <select value={r.kind} onChange={(e) => {
                        const kind = e.target.value as CropRow['kind'];
                        const c = (kind === 'ekili' ? FIELD_CROPS : TREE_CROPS)[0];
                        patchRow(r.id, { kind, name: c.name, yieldPerUnit: c.yieldPerUnit, price: c.price, expensePct: c.expensePct });
                      }}>
                        <option value="ekili">Ekili</option><option value="dikili">Dikili</option>
                      </select></label>
                  )}
                  <label className="pfield"><span>Ürün {ref && <em title={ref.note ?? ''}>({ref.source})</em>}</span>
                    <select value={r.name} onChange={(e) => applyCatalog(r.id, r.kind, e.target.value)}>
                      {(r.kind === 'ekili' ? FIELD_CROPS : TREE_CROPS).map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>))}
                    </select></label>
                  {r.kind === 'ekili' ? (
                    <label className="pfield"><span>Ayrılan Alan m²</span>
                      <input type="number" value={r.areaM2 || ''} onChange={(e) => patchRow(r.id, { areaM2: Number(e.target.value) || 0 })} /></label>
                  ) : (
                    <label className="pfield"><span>Ağaç Adedi</span>
                      <input type="number" value={r.treeCount || ''} onChange={(e) => patchRow(r.id, { treeCount: Number(e.target.value) || 0 })} /></label>
                  )}
                  <label className="pfield"><span>{r.kind === 'ekili' ? 'Verim kg/dönüm' : 'Verim kg/ağaç'}</span>
                    <input type="number" value={r.yieldPerUnit || ''} onChange={(e) => patchRow(r.id, { yieldPerUnit: Number(e.target.value) || 0 })} /></label>
                  <label className="pfield"><span>Fiyat TL/kg</span>
                    <input type="number" value={r.price || ''} onChange={(e) => patchRow(r.id, { price: Number(e.target.value) || 0 })} /></label>
                  <label className="pfield pfield--s"><span>Gider %</span>
                    <input type="number" value={r.expensePct || ''} onChange={(e) => patchRow(r.id, { expensePct: Number(e.target.value) || 0 })} /></label>
                </div>
                <div className="prop-card__bottom">
                  <div className="pfield pfield--ro"><span>{r.kind === 'ekili' ? 'Dönüm' : 'Ağaç'}</span><b>{r.units.toLocaleString('tr-TR')}</b></div>
                  <div className="pfield pfield--ro"><span>Brüt Gelir</span><b>{TL(r.gross)}</b></div>
                  <div className="pfield pfield--ro"><span>Gider</span><b>{TL(r.expense)}</b></div>
                  <div className="pfield pfield--ro"><span>Net Gelir</span><b>{TL(r.net)}</b></div>
                  <button type="button" className="b-del" title="Satırı sil"
                          onClick={() => patch({ rows: state.rows.filter((x: CropRow) => x.id !== r.id) })}>✕</button>
                </div>
              </div>
            );
          })}
          <button type="button" className="btn-ghost"
                  onClick={() => patch({ rows: [...state.rows, defaultRow(state.mode === 'dikili' ? 'dikili' : state.mode === 'karma' ? 'dikili' : 'ekili')] })}>
            ➕ Ürün Satırı Ekle
          </button>
          {state.mode !== 'dikili' && (
            <div className={result.areaOk ? 'hint' : 'warn-line'}>
              Alan bütçesi: {result.allocatedArea.toLocaleString('tr-TR')} / {result.arableArea.toLocaleString('tr-TR')} m² dağıtıldı.
            </div>
          )}
          {result.warnings.map((w, i) => <div className="warn-line" key={i}>{w}</div>)}
        </div>

        <div className="card result-card">
          <div className="card-title">Sonuç</div>
          <div className="hrow-labeled">
            <div className="pfield pfield--ro"><span>Toplam Brüt Gelir/yıl</span><b>{TL(result.totalGross)}</b></div>
            <div className="pfield pfield--ro"><span>Toplam Net Gelir/yıl</span><b>{TL(result.totalNet)}</b></div>
            <label className="pfield pfield--s"><span>Amorti Yılı</span>
              <input type="number" title="Bu bölgede bu tür arazi kaç yılda kendini amorti eder?"
                     value={state.amortYears || ''} onChange={(e) => patch({ amortYears: Number(e.target.value) || 0 })} /></label>
            <div className="pfield pfield--ro pfield--big"><span>Yaklaşık Değer</span><b>{TL(result.value)}</b></div>
          </div>
          <div className="hint">Değer = yıllık net gelir × amorti yılı (kiralanabilir dükkan mantığı). Nihai takdir uzmana aittir.</div>
        </div>

        <div className="stamp">{BRAND.preparedBy}<br />{BRAND.developerLine} · Tarımsal Ürün Gelir Modülü</div>
      </div>
    </div>
  );
}
