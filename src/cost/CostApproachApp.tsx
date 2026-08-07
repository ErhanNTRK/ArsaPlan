import { useMemo, useState } from 'react';
import { analyzeCostApproach, createDefaultCostInput, type CostApproachInput, type AdjustmentType } from './engine';
import { PROPERTY_CATEGORIES, DIGER_KATEGORI } from './categories';
import { YAPI_SINIFLARI } from '../data/yapiSiniflari';
import { BUILDING_TYPES as OTEL_BUILDING_TYPES } from '../usthakki/detailedEngine';
import { BRAND } from '../brand/brand';
import { parseKml } from '../geo/kml';
import { readDataSheet } from '../export/excelImport';
import { downloadCostApproachPdf } from './pdf';
import { downloadCostApproachExcel } from './excel';
import { RTable, RRow, RCell } from '../ui/RTable';

const DRAFT_KEY = 'arsaplan-cost-draft-v1';
function newId() { return Math.random().toString(36).slice(2, 10); }

function loadDraft(): CostApproachInput {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return createDefaultCostInput();
    return { ...createDefaultCostInput(), ...JSON.parse(raw) };
  } catch { return createDefaultCostInput(); }
}

export function CostApproachApp({ onBack }: { onBack: () => void }) {
  const [input, setInput] = useState<CostApproachInput>(createDefaultCostInput);
  const [hasSavedDraft] = useState(() => { try { return !!localStorage.getItem(DRAFT_KEY); } catch { return false; } });
  const [busy, setBusy] = useState<null | 'pdf' | 'excel' | 'jpeg'>(null);
  const result = useMemo(() => analyzeCostApproach(input), [input]);

  useMemo(() => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(input)); } catch { /* kota */ } }, [input]);

  const fmt = (v: number) => Math.round(v).toLocaleString('tr-TR') + ' ₺';
  const cat = PROPERTY_CATEGORIES.find((c) => c.name === input.category);
  const buildingSuggestions = input.category === 'Otel' ? OTEL_BUILDING_TYPES.filter((t) => t !== 'Diğer' && t !== 'Tüm Yapılar') : (cat?.buildingSuggestions ?? []);

  const patchBuilding = (id: string, p: Partial<CostApproachInput['buildings'][number]>) =>
    setInput((s) => ({ ...s, buildings: s.buildings.map((b) => (b.id === id ? { ...b, ...p } : b)) }));

  async function onKml(f: File) {
    try {
      const parsed = parseKml(await f.text());
      if (!parsed) { window.alert('KML okunamadı.'); return; }
      const area = parsed.deedArea || parsed.polygonArea || 0;
      setInput((s) => ({
        ...s, fromKml: true, parcelArea: area || s.parcelArea, netParcelArea: area || s.netParcelArea,
        general: { ...s.general, ada: parsed.ada || s.general.ada, parsel: parsed.parsel || s.general.parsel,
                   il: parsed.il || s.general.il, ilce: parsed.ilce || s.general.ilce, mahalle: parsed.mahalle || s.general.mahalle },
      }));
    } catch { window.alert('KML okunamadı.'); }
  }

  const showResults = input.category.trim().length > 0;

  return (
    <div className="app">
      <div className="topbar">
        <div className="topbar-inner">
          <div>
            <h1>{BRAND.appName} — Maliyet Yaklaşımı</h1>
            <p>Arsa + Yapılar + Şerefiye/Düzeltme/Çevre Düzenlemesi ile taşınmaz değeri</p>
          </div>
          <div className="topbar-actions no-print">
            <button type="button" className="link-btn topbar-link" onClick={onBack}>← Başlangıca dön</button>
            {hasSavedDraft && (
              <button type="button" className="link-btn topbar-link" title="Daha önce girdiğiniz, kaydedilmiş verileri geri yükler"
                      onClick={() => setInput(loadDraft())}>↺ Eski verileri geri getir</button>
            )}
            <label className="link-btn topbar-link">
              📂 Excel Yükle
              <input type="file" accept=".xlsx" style={{ display: 'none' }}
                     onChange={async (e) => {
                       const f = e.target.files?.[0]; e.currentTarget.value = ''; if (!f) return;
                       const data = await readDataSheet<CostApproachInput>(f);
                       if (data) setInput(data); else window.alert('Bu Excel dosyasında ArsaPlan verisi bulunamadı.');
                     }} />
            </label>
          </div>
          <img className="brand-logo" src={`${import.meta.env.BASE_URL}dora-logo.png`} alt={BRAND.company} />
        </div>
      </div>

      {showResults && (
        <div className="hotel-summary-sticky no-print">
          <div className="hotel-summary-inner">
            <div><span>Arsa Değeri</span><b>{fmt(result.landValue)}</b></div>
            <div><span>Yapılar</span><b>{fmt(result.buildingsValue)}</b></div>
            <div><span>Toplam Değer</span><b>{fmt(result.totalValueRounded)}</b></div>
          </div>
        </div>
      )}

      <div className="step">
        <div className="card card-wide">
          <div className="card-title">Ne Değerleniyor?</div>
          <select value={input.category}
                  onChange={(e) => setInput((s) => ({ ...s, category: e.target.value }))}>
            <option value="">Kategori seçiniz…</option>
            {PROPERTY_CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            <option value={DIGER_KATEGORI}>{DIGER_KATEGORI}</option>
          </select>
          {(input.category === DIGER_KATEGORI) && (
            <input style={{ marginTop: 10 }} placeholder="Kategori adını yazın"
                   onChange={(e) => setInput((s) => ({ ...s, category: e.target.value || DIGER_KATEGORI }))} />
          )}
        </div>

        {showResults && (<>
          <div className="card card-wide">
            <div className="card-title">Arsa</div>
            <div className="hint" style={{ marginBottom: 10 }}>
              İsterseniz KML yükleyip Arsa Alanı ve Ada/Parsel bilgilerini otomatik doldurun, isterseniz elle girin.
            </div>
            <label className="btn-ghost btn-sm" style={{ display: 'inline-block', marginBottom: 10 }}>
              📐 KML Yükle
              <input type="file" accept=".kml" style={{ display: 'none' }}
                     onChange={(e) => { const f = e.target.files?.[0]; e.currentTarget.value = ''; if (f) onKml(f); }} />
            </label>
            <div className="hrow-labeled">
              <label className="pfield pfield--s"><span>İl</span>
                <input value={input.general.il} onChange={(e) => setInput((s) => ({ ...s, general: { ...s.general, il: e.target.value } }))} /></label>
              <label className="pfield pfield--s"><span>İlçe</span>
                <input value={input.general.ilce} onChange={(e) => setInput((s) => ({ ...s, general: { ...s.general, ilce: e.target.value } }))} /></label>
              <label className="pfield pfield--s"><span>Ada</span>
                <input value={input.general.ada} onChange={(e) => setInput((s) => ({ ...s, general: { ...s.general, ada: e.target.value } }))} /></label>
              <label className="pfield pfield--s"><span>Parsel</span>
                <input value={input.general.parsel} onChange={(e) => setInput((s) => ({ ...s, general: { ...s.general, parsel: e.target.value } }))} /></label>
            </div>
            <div className="hrow-labeled" style={{ marginTop: 10 }}>
              <label className="pfield"><span>Arsa Alanı (Tapu) m²</span>
                <input type="number" value={input.parcelArea ?? ''}
                       onChange={(e) => setInput((s) => ({ ...s, parcelArea: Number(e.target.value) || null, fromKml: false }))} /></label>
              <label className="pfield"><span>Net Arsa Alanı m²</span>
                <input type="number" value={input.netParcelArea ?? ''}
                       onChange={(e) => setInput((s) => ({ ...s, netParcelArea: Number(e.target.value) || null }))} /></label>
              <label className="pfield"><span>Arsa m² Birim Değeri (₺)</span>
                <input type="number" value={input.landUnitValue || ''}
                       onChange={(e) => setInput((s) => ({ ...s, landUnitValue: Number(e.target.value) || 0 }))} /></label>
            </div>
            <div className="hint" style={{ marginTop: 8 }}>Hesaba <b>Net Arsa Alanı</b> girer.</div>
          </div>

          <div className="card card-wide">
            <div className="card-title">Yapılar</div>
            {input.buildings.length > 0 && (
              <RTable headers={['Yapı Türü', 'Yapı Sınıfı', 'Alan m²', 'Birim Maliyet', 'Amortisman %', 'Değer', '']}>
                {result.buildingRows.map((b) => (
                  <RRow key={b.id}>
                    <RCell label="Yapı Türü">
                      <select value={buildingSuggestions.includes(b.type) ? b.type : DIGER_KATEGORI}
                              onChange={(e) => patchBuilding(b.id, { type: e.target.value === DIGER_KATEGORI ? '' : e.target.value })}>
                        {buildingSuggestions.map((t) => <option key={t} value={t}>{t}</option>)}
                        <option value={DIGER_KATEGORI}>Diğer (elle yaz)</option>
                      </select>
                      {!buildingSuggestions.includes(b.type) && (
                        <input style={{ marginTop: 4 }} placeholder="Yapı adını yazın" value={b.type}
                               onChange={(e) => patchBuilding(b.id, { type: e.target.value })} />
                      )}
                    </RCell>
                    <RCell label="Yapı Sınıfı">
                      <select value={b.buildingClassCode ?? ''} onChange={(e) => patchBuilding(b.id, { buildingClassCode: e.target.value || null, unitCostOverride: null })}>
                        <option value="">— elle gireceğim —</option>
                        {YAPI_SINIFLARI.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                      </select>
                    </RCell>
                    <RCell label="Alan m²">
                      <input type="number" value={b.area || ''} onChange={(e) => patchBuilding(b.id, { area: Number(e.target.value) || 0 })} />
                    </RCell>
                    <RCell label="Birim Maliyet">
                      <span className="floor-cell">
                        <input type="number" value={b.effectiveUnitCost || ''}
                               onChange={(e) => patchBuilding(b.id, { unitCostOverride: Number(e.target.value) || 0 })} />
                        {b.overridden && (
                          <button type="button" className="cell-reset" title="Tebliğ değerine dön"
                                  onClick={() => patchBuilding(b.id, { unitCostOverride: null })}>↺</button>
                        )}
                      </span>
                    </RCell>
                    <RCell label="Amortisman %">
                      <input type="number" value={b.depreciationPct || ''} onChange={(e) => patchBuilding(b.id, { depreciationPct: Number(e.target.value) || 0 })} />
                    </RCell>
                    <RCell label="Değer"><b>{fmt(b.buildingValue)}</b></RCell>
                    <RCell label="">
                      <button type="button" className="b-del" title="Satırı sil"
                              onClick={() => setInput((s) => ({ ...s, buildings: s.buildings.filter((x) => x.id !== b.id) }))}>✕</button>
                    </RCell>
                  </RRow>
                ))}
              </RTable>
            )}
            <button type="button" className="btn-ghost btn-sm" style={{ marginTop: 10 }}
                    onClick={() => setInput((s) => ({ ...s, buildings: [...s.buildings, { id: newId(), type: buildingSuggestions[0] ?? '', buildingClassCode: null, area: 0, unitCostOverride: 0, depreciationPct: 100 }] }))}>
              ➕ Yapı Ekle
            </button>
          </div>

          <div className="card card-wide">
            <div className="card-title">Şerefiye / Düzeltme / Çevre Düzenlemesi (opsiyonel)</div>
            <div className="hrow-labeled">
              <label className="pfield"><span>Tip</span>
                <select value={input.adjustmentType} onChange={(e) => setInput((s) => ({ ...s, adjustmentType: e.target.value as AdjustmentType }))}>
                  <option value="none">Yok</option>
                  <option value="serefiye">Şerefiye</option>
                  <option value="duzeltme">Düzeltme</option>
                  <option value="peyzaj">Çevre Düzenlemesi</option>
                </select>
              </label>
              {input.adjustmentType !== 'none' && (
                <label className="pfield"><span>Tutar (₺)</span>
                  <input type="number" value={input.adjustmentAmount || ''}
                         onChange={(e) => setInput((s) => ({ ...s, adjustmentAmount: Number(e.target.value) || 0 }))} /></label>
              )}
            </div>
          </div>

          <div className="card card-wide result-preview">
            <div className="card-title">Sonuç</div>
            <div className="mini-kpi">
              <div><span>Arsa Değeri</span><b>{fmt(result.landValue)}</b></div>
              <div><span>Yapılar Değeri</span><b>{fmt(result.buildingsValue)}</b></div>
              {result.adjustmentValue > 0 && <div><span>Şerefiye/Düzeltme/Peyzaj</span><b>{fmt(result.adjustmentValue)}</b></div>}
            </div>
            <div className="result-hero" style={{ marginTop: 12 }}>
              <span>MALİYET YAKLAŞIMI DEĞERİ</span>
              <b>{fmt(result.totalValueRounded)}</b>
            </div>
            {result.warnings.map((w, i) => <div className="hint" key={i} style={{ marginTop: 6 }}>{w}</div>)}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
              <button type="button" className="btn btn-primary btn-sm" disabled={busy !== null}
                      onClick={async () => { setBusy('pdf'); try { await downloadCostApproachPdf(input, result); } finally { setBusy(null); } }}>
                {busy === 'pdf' ? 'Hazırlanıyor…' : '📄 PDF Raporu İndir'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy !== null}
                      onClick={async () => { setBusy('excel'); try { await downloadCostApproachExcel(input, result); } finally { setBusy(null); } }}>
                📊 Excel Raporu İndir
              </button>
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy !== null}
                      onClick={async () => {
                        setBusy('jpeg');
                        try {
                          const { downloadCostApproachJpeg } = await import('./jpeg');
                          await downloadCostApproachJpeg(input, result);
                        } finally { setBusy(null); }
                      }}>
                🖼️ Özet JPEG
              </button>
            </div>
          </div>
        </>)}
      </div>
    </div>
  );
}
