/**
 * "Projeden Arsa Değeri (Artık Değer)" girdi kartı — otel/dükkân projesi tamamlandığında
 * oluşacak değerden, yatırım maliyetleri ve girişimci kârı düşülerek arsaya dönülür.
 */
import { Ico } from '../ui/icons';
import { Field, Num, Pct, Txt } from '../ui/fields';
import { RTable, RRow, RCell } from '../ui/RTable';
import { defaultLandProject } from './landFromProject';
import { newId } from './engine';
import type { HotelIncomeInput, HotelIncomeResult, HotelLandProjectInput } from './types';

export function LandProjectCard({ input, setInput, result, fmt, sym }: {
  input: HotelIncomeInput;
  setInput: (fn: (p: HotelIncomeInput) => HotelIncomeInput) => void;
  result: HotelIncomeResult;
  fmt: (v: number) => string;
  sym: string;
}) {
  const lp = input.landProject;
  const on = !!lp?.enabled;
  const patch = (u: Partial<HotelLandProjectInput>) =>
    setInput((p) => ({ ...p, landProject: { ...(p.landProject ?? defaultLandProject()), ...u } }));
  const l = result.landFromProject;

  return (
    <div className="card card-optional card-wide">
      <label className="chk-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={on}
               onChange={(e) => setInput((p) => ({ ...p, landProject: { ...(p.landProject ?? defaultLandProject()), enabled: e.target.checked } }))} />
        <span className="card-title" style={{ margin: 0 }}>Projeden Arsa Değeri (Artık Değer) <span className="optional-badge">OPSİYONEL</span></span>
      </label>
      <div className="hint" style={{ marginTop: 6 }}>
        Güçlendirme/tadilat sonrası işletmeye alınacak projenin tamamlanmış değerinden yatırım maliyetleri ve girişimci kârı
        düşülerek arsa değerine dönülür. Mevcut yapının değeri hesaba katılmaz; bu varsayım raporda belirtilmelidir.
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
            <Field label="Girişimci Kârı" hint="Toplam yatırım maliyeti üzerinden; müteahhit kârı ile birlikte düşmeyin (çift sayım olur)">
              <Pct value={lp.profitRate} onChange={(n) => patch({ profitRate: n })} />
            </Field>
          </div>

          <div className="card-title" style={{ marginTop: 12, fontSize: 13 }}>Yatırım Maliyetleri (arsa ve mevcut bina hariç)</div>
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

          <div className="grid-2" style={{ marginTop: 12 }}>
            <Field label="Güçlendirme + Ruhsat + Açılışa Kadar Süre" hint="Boş/0 ise zaman indirgemesi yapılmaz">
              <Num value={lp.months} suffix="ay" onChange={(n) => patch({ months: Math.max(0, Math.round(n)) })} />
            </Field>
            <Field label="Yıllık Reel İndirgeme Oranı" hint="Arsa modülündeki indirgeme ile aynı mantık">
              <Pct value={lp.discountRate ?? 0} onChange={(n) => patch({ discountRate: n > 0 ? n : null })} />
            </Field>
          </div>

          {l && (
            <div className="note-box" style={{ marginTop: 10 }}>
              {l.basisName}: {fmt(l.completedValue)} − Maliyetler {fmt(l.investment)} − Girişimci Kârı {fmt(l.profit)}
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
