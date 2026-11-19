/**
 * "Projeden Arsa Değeri (Artık Değer)" girdi kartı — otel/dükkân projesi tamamlandığında
 * oluşacak değerden yapı maliyeti, diğer maliyetler, şerefiye ve girişimci kârı düşülür;
 * gelir proje bitiminde oluşacağı için süre ve oranla bugüne indirgenir.
 */
import { Ico } from '../ui/icons';
import { Field, Num, Pct, Sel, Txt } from '../ui/fields';
import { RTable, RRow, RCell } from '../ui/RTable';
import { BUILDING_TYPES } from '../usthakki/detailedEngine';
import { defaultLandProject } from './landFromProject';
import { newId } from './engine';
import type { HotelIncomeInput, HotelIncomeResult, HotelLandProjectInput } from './types';

export function LandProjectCard({ input, setInput, result, fmt, sym, suggestCost }: {
  input: HotelIncomeInput;
  setInput: (fn: (p: HotelIncomeInput) => HotelIncomeInput) => void;
  result: HotelIncomeResult;
  fmt: (v: number) => string;
  sym: string;
  suggestCost: (type: string) => number | null;
}) {
  const lp = input.landProject;
  const on = !!lp?.enabled;
  const patch = (u: Partial<HotelLandProjectInput>) =>
    setInput((p) => ({ ...p, landProject: { ...(p.landProject ?? defaultLandProject()), ...u } }));
  const l = result.landFromProject;
  const blds = lp?.buildings ?? [];
  const setB = (i: number, u: Partial<HotelLandProjectInput['buildings'][number]>) =>
    patch({ buildings: blds.map((x, j) => (j === i ? { ...x, ...u } : x)) });
  const hasCostApproachBuildings = (input.costBuildings ?? []).length > 0;

  return (
    <div className="card card-optional card-wide">
      <label className="chk-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={on}
               onChange={(e) => setInput((p) => ({ ...p, landProject: { ...(p.landProject ?? defaultLandProject()), enabled: e.target.checked } }))} />
        <span className="card-title" style={{ margin: 0 }}>Projeden Arsa Değeri (Artık Değer) <span className="optional-badge">OPSİYONEL</span></span>
      </label>
      <div className="hint" style={{ marginTop: 6 }}>
        Proje tamamlandığında oluşacak değerden yapı maliyeti, diğer maliyetler, şerefiye ve girişimci kârı düşülür;
        gelir proje bitiminde oluşacağı için süre ve oranla bugüne indirgenir. Mevcut yapının değeri hesaba katılmaz.
      </div>

      {on && lp && (
        <>
          <div className="grid-2" style={{ marginTop: 10 }}>
            <Field label="Tamamlanmış Proje Değeri — Esas Yöntem"
                   hint="Yeni otelde İNA, oturma (ramp-up) dönemini zaten içerir; Direkt Kapitalizasyon seçilirse oturma indirgemesi uygulanmış değer kullanılır">
              <select value={lp.basis} onChange={(e) => patch({ basis: e.target.value as 'ina' | 'direkt' })}>
                <option value="ina" disabled={!result.ina}>İNA (NBD){result.ina ? '' : ' — İNA hesaplanmadı'}</option>
                <option value="direkt">Direkt Kapitalizasyon</option>
              </select>
            </Field>
            <Field label="Girişimci Kârı" hint="Yapı + diğer maliyetler üzerinden; müteahhit kârı ile birlikte düşmeyin (çift sayım olur)">
              <Pct value={lp.profitRate} onChange={(n) => patch({ profitRate: n })} />
            </Field>
          </div>

          <div className="card-title" style={{ marginTop: 14, fontSize: 13 }}>Yapı Maliyeti (güçlendirme / yapım — alan girin, maliyet hesaplanır)</div>
          {blds.length > 0 && (
            <RTable headers={['Yapı Türü', 'Alan m²', 'Birim Maliyet', 'Maliyete Esas Oran %', 'Maliyet', '']}>
              {blds.map((b, i) => (
                <RRow key={b.id}>
                  <RCell label="Yapı Türü">
                    <Sel value={BUILDING_TYPES.includes(b.type) ? b.type : 'Diğer'}
                         onChange={(v) => {
                           const sg = suggestCost(v);
                           setB(i, sg != null ? { type: v, unitCost: sg } : { type: v });
                         }}
                         options={BUILDING_TYPES.map((t) => ({ value: t, label: t }))} />
                    {(!BUILDING_TYPES.includes(b.type) || b.type === 'Diğer') && (
                      <Txt value={BUILDING_TYPES.includes(b.type) ? '' : b.type} placeholder="Yapı adını yazın"
                           onChange={(v) => setB(i, { type: v || 'Diğer' })} />
                    )}
                  </RCell>
                  <RCell label="Alan m²"><Num value={b.area} suffix="m²" onChange={(n) => setB(i, { area: n })} /></RCell>
                  <RCell label="Birim Maliyet"><Num value={b.unitCost} suffix="₺/m²" onChange={(n) => setB(i, { unitCost: n })} /></RCell>
                  <RCell label="Maliyete Esas Oran %"><Num value={b.ratePct} suffix="%" onChange={(n) => setB(i, { ratePct: n })} /></RCell>
                  <RCell label="Maliyet"><b>{fmt(Math.max(0, b.area) * Math.max(0, b.unitCost) * (b.ratePct > 0 ? Math.min(100, b.ratePct) : 100) / 100)}</b></RCell>
                  <RCell label="">
                    <button type="button" className="b-del" title="Satırı sil" onClick={() => patch({ buildings: blds.filter((_, j) => j !== i) })}>✕</button>
                  </RCell>
                </RRow>
              ))}
            </RTable>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn-ghost btn-sm" onClick={() => {
              const t0 = BUILDING_TYPES[0];
              patch({ buildings: [...blds, { id: newId(), type: t0, area: 0, unitCost: suggestCost(t0) ?? 0, ratePct: 100 }] });
            }}><Ico n="plus" />Yapı Ekle</button>
            {hasCostApproachBuildings && (
              <button type="button" className="btn-ghost btn-sm"
                      title="Maliyet Yaklaşımı'nda girdiğiniz yapı satırlarını (tür, alan, birim maliyet) buraya kopyalar"
                      onClick={() => patch({ buildings: [...blds, ...(input.costBuildings ?? []).map((b) => ({ id: newId(), type: b.type, area: b.area, unitCost: b.unitCost, ratePct: 100 }))] })}>
                Maliyet Yaklaşımı'ndaki yapıları al
              </button>
            )}
          </div>
          <div className="hint" style={{ marginTop: 4 }}>
            Birim maliyet tür seçilince tebliğden önerilir, değiştirebilirsiniz. Güçlendirme/tadilat yeni yapım kadar pahalı değilse
            "Maliyete Esas Oran %" ile yapım maliyetinin yalnız ilgili kısmını (örn. %40) esas alabilirsiniz.
          </div>

          <div className="card-title" style={{ marginTop: 14, fontSize: 13 }}>Diğer Yatırım Maliyetleri</div>
          <RTable headers={['Kalem', 'Tutar', '']}>
            {lp.costs.map((c, i) => (
              <RRow key={c.id}>
                <RCell label="Kalem">
                  <Txt value={c.name} placeholder="Kalem adı"
                       onChange={(v) => patch({ costs: lp.costs.map((x, j) => j === i ? { ...x, name: v } : x) })} />
                </RCell>
                <RCell label="Tutar">
                  <Num value={c.amount} suffix={sym}
                       onChange={(n) => patch({ costs: lp.costs.map((x, j) => j === i ? { ...x, amount: n } : x) })} />
                </RCell>
                <RCell label="">
                  <button type="button" className="b-del" title="Satırı sil"
                          onClick={() => patch({ costs: lp.costs.filter((_, j) => j !== i) })}>✕</button>
                </RCell>
              </RRow>
            ))}
          </RTable>
          <button type="button" className="btn-ghost btn-sm"
                  onClick={() => patch({ costs: [...lp.costs, { id: newId(), name: '', amount: 0 }] })}>
            <Ico n="plus" />Kalem Ekle
          </button>

          <div className="grid-2" style={{ marginTop: 14 }}>
            <Field label="Şerefiye / Düzeltme Bedeli (opsiyonel)" hint="Tamamlanmış proje değerinden düşülür">
              <Num value={lp.goodwill ?? 0} suffix={sym} onChange={(n) => patch({ goodwill: n > 0 ? n : 0 })} />
            </Field>
          </div>

          <div className="card-title" style={{ marginTop: 14, fontSize: 13 }}>Zaman İndirgemesi</div>
          <div className="hint" style={{ marginBottom: 6 }}>
            Proje geliri güçlendirme, ruhsat ve açılış sonrasında oluşacağı için bugüne indirgenir.
            Süre ve oranın ikisi de girilmezse indirgeme uygulanmaz.
          </div>
          <div className="grid-2">
            <Field label="Güçlendirme + Ruhsat + Açılışa Kadar Süre" hint="Ay cinsinden">
              <Num value={lp.months} suffix="ay" onChange={(n) => patch({ months: Math.max(0, Math.round(n)) })} />
            </Field>
            <Field label="Yıllık Reel İndirgeme Oranı" hint="Arsa modülündeki indirgeme ile aynı mantık">
              <Pct value={lp.discountRate ?? 0} onChange={(n) => patch({ discountRate: n > 0 ? n : null })} />
            </Field>
          </div>
          {!(lp.months > 0 && (lp.discountRate ?? 0) > 0) && (
            <div className="warn-line">İndirgeme uygulanmıyor — süre ve oran girilirse arsa değeri bugüne indirgenir.</div>
          )}

          {l && (
            <div className="note-box" style={{ marginTop: 10 }}>
              {l.basisName} {fmt(l.completedValue)} − Yapı {fmt(l.buildingCost)} − Diğer {fmt(l.otherCosts)}
              {l.goodwill > 0 ? ` − Şerefiye ${fmt(l.goodwill)}` : ''} − Girişimci Kârı {fmt(l.profit)}
              {' = '}<b>{fmt(l.landBeforeDiscountRounded)}</b> (indirgemesiz)
              {l.discountOn && <div style={{ marginTop: 4 }}><b>İndirgemeli Arsa Değeri ({l.months} ay): {fmt(l.landValueRounded)}</b></div>}
              {l.appraisedLandValue != null && (
                <div style={{ marginTop: 4 }}>Maliyet Yaklaşımı'ndaki takdir edilen arsa değeri: {fmt(l.appraisedLandValue)}</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
