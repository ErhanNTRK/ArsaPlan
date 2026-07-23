/**
 * TİCARİ İŞLETME — ADIM BİLEŞENLERİ
 * Ekle-mantığı: kullanıcı katalogdan yapı seçer, satır olarak eklenir;
 * her satırda alan, yıpranma ve birim maliyet (tebliğden otomatik, elle değişir).
 */
import type { ProjectInput, IsletmeBuilding, IsletmeInput } from '../engine';
import { computeIsletme, ISLETME_KATALOG } from '../engine';
import { YAPI_SINIFLARI } from '../data/yapiSiniflari';
import { Field, Txt, Num, Pct, Sel, fmtM2, fmtTL, fmtTLm2 } from './fields';
import type { Upd, SetTop } from './Steps';

interface P { input: ProjectInput; upd: Upd; setTop: SetTop; }

const TYPE_OPTIONS = ISLETME_KATALOG.flatMap((k) =>
  k.types.map((t) => ({ value: t.label, label: `${k.category} — ${t.label}`, cls: t.buildingClass })));

export function Step3Isletme({ input, upd }: P) {
  const inp = input.isletme;
  const r = computeIsletme(input.parcel, inp);
  const set = (patch: Partial<IsletmeInput>) => upd('isletme', patch);
  const setB = (i: number, patch: Partial<IsletmeBuilding>) =>
    set({ buildings: inp.buildings.map((b, k) => (k === i ? { ...b, ...patch } : b)) });

  const addBuilding = (typeLabel: string) => {
    const opt = TYPE_OPTIONS.find((o) => o.value === typeLabel);
    if (!opt) return;
    set({
      buildings: [...inp.buildings, {
        type: opt.value, buildingClass: opt.cls, area: 0,
        depreciation: 0, unitCostOverride: null,
      }],
    });
  };

  return (
    <div className="cols">
      <div className="card">
        <div className="card-title">1 · Yapılar</div>
        <Field label="Yapı Ekle" hint="Katalogdan seçin; satır olarak eklenir. Aynı türden birden fazla eklenebilir.">
          <Sel value="" onChange={(v) => v && addBuilding(v)}
               options={[{ value: '', label: 'Yapı türü seçiniz…' }, ...TYPE_OPTIONS.map(({ value, label }) => ({ value, label }))]} />
        </Field>
        <Field label="Güncelleme Oranı" hint="Tebliğ birim maliyetlerine uygulanır · tüm satırlara ortak">
          <Pct value={inp.inflationRate} onChange={(n) => set({ inflationRate: n })} />
        </Field>

        {inp.buildings.map((b, i) => {
          const row = r.rows[i];
          const sinif = YAPI_SINIFLARI.find((x) => x.code === b.buildingClass);
          return (
            <div className="isletme-row" key={i}>
              <div className="isletme-row-head">
                <b>{b.type}</b>
                <button type="button" className="link-btn" onClick={() =>
                  set({ buildings: inp.buildings.filter((_, k) => k !== i) })}>Satırı sil</button>
              </div>
              <Field label="Yapı Sınıfı (2026 Tebliği)">
                <Sel value={b.buildingClass}
                     onChange={(code) => setB(i, { buildingClass: code, unitCostOverride: null })}
                     options={YAPI_SINIFLARI.map((x) => ({ value: x.code, label: `${x.label} — ${fmtTLm2(x.unitCost)}` }))} />
              </Field>
              {sinif && <div className="hint" style={{ marginTop: -6, marginBottom: 8 }}>{sinif.examples}</div>}
              <div className="grid-3">
                <Field label="Alan">
                  <Num value={b.area} onChange={(n) => setB(i, { area: n })} suffix="m²" />
                </Field>
                <Field label="Yıpranma" hint="Mevcut yapıysa">
                  <Pct value={b.depreciation} onChange={(n) => setB(i, { depreciation: n, unitCostOverride: null })} />
                </Field>
                <Field label="Birim Maliyet" hint={row.overridden ? 'Elle sabitlendi' : 'Otomatik'}>
                  <Num value={row.effectiveUnitCost}
                       onChange={(n) => setB(i, { unitCostOverride: n })} suffix="₺/m²" />
                </Field>
              </div>
              {row.overridden && (
                <button type="button" className="link-btn" onClick={() => setB(i, { unitCostOverride: null })}>
                  Otomatik hesaba dön ({fmtTLm2(row.baseUnitCost * (1 + inp.inflationRate) * (1 - row.depreciation))})
                </button>
              )}
              <div className="note-box" style={{ marginTop: 8 }}>
                {fmtM2(row.area)} × {fmtTLm2(row.effectiveUnitCost)} = <b>{fmtTL(row.cost)}</b>
              </div>
            </div>
          );
        })}
        {inp.buildings.length > 0 && (
          <div className="mini-kpi" style={{ marginTop: 10 }}>
            <div><span>Toplam yapı alanı</span><b>{fmtM2(r.totalBuildingArea)}</b></div>
            <div><span>Yapı maliyetleri</span><b>{fmtTL(r.buildingsCost)}</b></div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">2 · İlave Maliyetler (tercihe bağlı)</div>
        <div className="hint" style={{ marginBottom: 10 }}>
          Parsel alanı ({fmtM2(input.parcel.area)}) üzerinden hesaplanır; 0 bırakılan kalem hesaba girmez.
        </div>
        <div className="grid-3">
          <Field label="Çevre Duvarı"><Num value={inp.wallUnitCost} onChange={(n) => set({ wallUnitCost: n })} suffix="₺/m²" /></Field>
          <Field label="Peyzaj / Çevre Düz."><Num value={inp.landscapeUnitCost} onChange={(n) => set({ landscapeUnitCost: n })} suffix="₺/m²" /></Field>
          <Field label="Altyapı"><Num value={inp.infraUnitCost} onChange={(n) => set({ infraUnitCost: n })} suffix="₺/m²" /></Field>
        </div>
        {inp.otherCosts.map((oc, i) => (
          <div className="grid-2" key={i}>
            <Field label={`Diğer Kalem ${i + 1}`}>
              <Txt value={oc.name} placeholder="Örn. trafo, arıtma, tabela"
                   onChange={(v) => set({ otherCosts: inp.otherCosts.map((x, k) => k === i ? { ...x, name: v } : x) })} />
            </Field>
            <Field label="Tutar">
              <Num value={oc.amount} suffix="₺"
                   onChange={(n) => set({ otherCosts: inp.otherCosts.map((x, k) => k === i ? { ...x, amount: n } : x) })} />
            </Field>
          </div>
        ))}
        <button type="button" className="link-btn"
                onClick={() => set({ otherCosts: [...inp.otherCosts, { name: '', amount: 0 }] })}>
          + Serbest kalem ekle
        </button>
        {inp.otherCosts.length > 0 && (
          <button type="button" className="link-btn" style={{ marginLeft: 12 }}
                  onClick={() => set({ otherCosts: inp.otherCosts.slice(0, -1) })}>
            Son kalemi sil
          </button>
        )}
        {r.extrasTotal > 0 && (
          <div className="note-box" style={{ marginTop: 10 }}>İlave maliyetler toplamı: <b>{fmtTL(r.extrasTotal)}</b></div>
        )}
      </div>

      <div className="card result-preview">
        <div className="card-title">Maliyet Özeti</div>
        <div className="mini-kpi">
          <div><span>Yapı maliyetleri</span><b>{fmtTL(r.buildingsCost)}</b></div>
          <div><span>İlave maliyetler</span><b>{fmtTL(r.extrasTotal)}</b></div>
        </div>
        <div className="mini-kpi" style={{ marginTop: 8 }}>
          <div><span>TOPLAM MALİYET</span><b>{fmtTL(r.totalCost)}</b></div>
          <div><span>Yapı satırı</span><b>{r.rows.length} adet</b></div>
        </div>
      </div>
    </div>
  );
}

export function Step4Isletme({ input, upd }: P) {
  const inp = input.isletme;
  const r = computeIsletme(input.parcel, inp);
  return (
    <div className="cols">
      <div className="card">
        <div className="card-title">Öngörülen Satış Değeri</div>
        <Field label="Taşınmazın Toplam Satış Değeri" hint="Tek toplam tutar, KDV hariç">
          <Num value={inp.salesTotal} onChange={(n) => upd('isletme', { salesTotal: n })} suffix="₺" />
        </Field>
        {inp.salesTotal > 0 && (
          <div className="note-box">
            Satış {fmtTL(r.salesTotal)} − maliyet {fmtTL(r.totalCost)} =
            {' '}<b>{fmtTL(r.landValue)}</b> arsa değeri
            {input.parcel.area > 0 && <> · {fmtTLm2(r.landUnitValue)}</>}
          </div>
        )}
        <div className="hint" style={{ marginTop: 8 }}>
          Bu senaryoda proje mülk sahibince yapılır; müteahhit kârı kesilmez ve
          kat karşılığı karşılaştırması uygulanmaz.
        </div>
      </div>

      <div className="card">
        <div className="card-title">Döviz Karşılığı (opsiyonel)</div>
        <div className="hint" style={{ marginBottom: 10 }}>
          Kur girilirse raporlarda arsa değeri döviz cinsinden de yazılır; boş bırakılırsa hiçbir şey değişmez.
        </div>
        <div className="grid-2">
          <Field label="1 USD kaç ₺" hint="Örn. 47,20">
            <Num value={input.fx?.usd ?? 0} step="0.0001"
                 onChange={(v) => upd('fx', { usd: v > 0 ? v : null })} suffix="₺" />
          </Field>
          <Field label="1 EUR kaç ₺" hint="Örn. 51,10">
            <Num value={input.fx?.eur ?? 0} step="0.0001"
                 onChange={(v) => upd('fx', { eur: v > 0 ? v : null })} suffix="₺" />
          </Field>
        </div>
      </div>
    </div>
  );
}
