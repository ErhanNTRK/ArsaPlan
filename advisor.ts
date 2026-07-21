import type { ProjectInput, AssetType, HousingType } from '../engine';
import { computeEnvelope, computeVillaCapacity } from '../engine';
import { YAPI_SINIFLARI, TEBLIG_KAYNAK, ILLER, LEJANTLAR } from '../data/yapiSiniflari';
import { Field, Txt, Num, Pct, Sel, Choice, Seg, fmtM2, fmtTLm2, fmtNum } from './fields';

export type Upd = <K extends keyof ProjectInput>(key: K, patch: Partial<ProjectInput[K]>) => void;
export type SetTop = <K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) => void;
interface P { input: ProjectInput; upd: Upd; setTop: SetTop; }

/* ═══════════ ADIM 1 — TAŞINMAZ ═══════════ */
const ASSETS: Array<{ v: AssetType; label: string; desc: string; ready: boolean }> = [
  { v: 'konut', label: 'Konut', desc: 'Villa, apartman, blok veya site', ready: true },
  { v: 'ticari', label: 'Ticari', desc: 'Dükkan, ofis, iş merkezi', ready: false },
  { v: 'karma', label: 'Karma Kullanım', desc: 'Konut + ticari birlikte', ready: false },
];

export function Step1({ input, upd, setTop }: P) {
  const p = input.parcel;
  return (
    <div className="cols">
      <div className="card">
        <div className="card-title">Ne Değerleniyor?</div>
        <div className="choice-grid">
          {ASSETS.map((a) => (
            <Choice key={a.v} on={input.assetType === a.v}
                    name={a.ready ? a.label : `${a.label} — yakında`} desc={a.desc}
                    onClick={() => a.ready && setTop('assetType', a.v)} />
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Taşınmaz Bilgileri</div>
        <Field label="İl">
          <Sel value={p.il} onChange={(v) => upd('parcel', { il: v })}
               options={ILLER.map((i) => ({ value: i, label: i }))} />
        </Field>
        <div className="grid-2">
          <Field label="İlçe"><Txt value={p.ilce} onChange={(v) => upd('parcel', { ilce: v })} /></Field>
          <Field label="Mahalle"><Txt value={p.mahalle} onChange={(v) => upd('parcel', { mahalle: v })} /></Field>
        </div>
        <div className="grid-2">
          <Field label="Ada"><Txt value={p.ada} onChange={(v) => upd('parcel', { ada: v })} /></Field>
          <Field label="Parsel"><Txt value={p.parsel} onChange={(v) => upd('parcel', { parsel: v })} /></Field>
        </div>
        <div className="grid-2">
          <Field label="Parsel Alanı (tapu)"><Num value={p.area} onChange={(v) => upd('parcel', { area: v })} suffix="m²" /></Field>
          <Field label="Net Parsel Alanı" hint="Terk / DOP sonrası">
            <Num value={p.netArea} onChange={(v) => upd('parcel', { netArea: v })} suffix="m²" />
          </Field>
        </div>
        {p.area > 0 && p.netArea > 0 && (
          <div className="note-box">
            Terk oranı <b>%{(((p.area - p.netArea) / p.area) * 100).toFixed(1).replace('.', ',')}</b> ·
            İmar hakları net parsel, arsa birim değeri tapu alanı üzerinden hesaplanır.
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════ ADIM 2 — İMAR DURUMU ═══════════ */
export function Step2({ input, upd }: P) {
  const z = input.zoning;
  const e = input.emsal;
  const p = input.parcel;
  const env = computeEnvelope(p, z);
  const taksKaks = z.mode === 'taks-kaks';
  const lejantOther = !LEJANTLAR.includes(z.lejant) && z.lejant !== '';

  return (
    <div className="cols">
      <div className="card">
        <div className="card-title">İmar Durumu</div>
        <Field label="Plan Lejantı">
          <Sel value={lejantOther ? 'Diğer (elle yazınız)' : z.lejant}
               onChange={(v) => upd('zoning', { lejant: v === 'Diğer (elle yazınız)' ? ' ' : v })}
               options={[{ value: '', label: 'Seçiniz…' }, ...LEJANTLAR.map((l) => ({ value: l, label: l }))]} />
        </Field>
        {(lejantOther || z.lejant === ' ') && (
          <Field label="Lejant (elle)">
            <Txt value={z.lejant.trim()} onChange={(v) => upd('zoning', { lejant: v || ' ' })} placeholder="Plandaki fonksiyon adı" />
          </Field>
        )}
        <Field label="Hesap Yöntemi">
          <Seg value={z.mode} onChange={(m) => upd('zoning', { mode: m })}
               options={[{ value: 'taks-kaks', label: 'TAKS / KAKS' }, { value: 'dogrudan', label: 'Doğrudan alan' }]} />
        </Field>

        {taksKaks ? (
          <>
            <div className="grid-3">
              <Field label="TAKS"><Num value={z.taks ?? 0} onChange={(v) => upd('zoning', { taks: v || null })} step="0.01" /></Field>
              <Field label="KAKS"><Num value={z.kaks ?? 0} onChange={(v) => upd('zoning', { kaks: v || null })} step="0.01" /></Field>
              <Field label="Hmax"><Num value={z.hmax ?? 0} onChange={(v) => upd('zoning', { hmax: v || null })} suffix="m" /></Field>
            </div>
            {p.netArea > 0 && (z.taks || z.kaks) && (
              <div className="note-box">
                {z.taks ? <>Taban alanı hakkı: <b>{fmtM2(p.netArea * z.taks)}</b><br /></> : null}
                {z.kaks ? <>Toplam inşaat hakkı: <b>{fmtM2(p.netArea * z.kaks)}</b></> : null}
              </div>
            )}
          </>
        ) : (
          <div className="grid-2">
            <Field label="Toplam Taban Oturumu"><Num value={z.directFootprint} onChange={(v) => upd('zoning', { directFootprint: v })} suffix="m²" /></Field>
            <Field label="Toplam İnşaat Alanı"><Num value={z.directTotalArea} onChange={(v) => upd('zoning', { directTotalArea: v })} suffix="m²" /></Field>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">Çekme Mesafeleri (opsiyonel)</div>
        <Field label="Çekme mesafeleri hesaba katılsın mı?"
               hint="Kapatılırsa kapasite yalnızca TAKS/KAKS üzerinden bulunur — çoğu ön değerlendirme için yeterlidir.">
          <Seg value={z.useSetbacks} onChange={(b) => upd('zoning', { useSetbacks: b })}
               options={[{ value: false, label: 'Hayır' }, { value: true, label: 'Evet' }]} />
        </Field>
        {z.useSetbacks && (
          <>
            <div className="grid-2">
              <Field label="Parsel Eni (yol cephesi)"><Num value={p.width} onChange={(v) => upd('parcel', { width: v })} suffix="m" /></Field>
              <Field label="Parsel Boyu (derinlik)"><Num value={p.depth} onChange={(v) => upd('parcel', { depth: v })} suffix="m" /></Field>
            </div>
            <div className="grid-2">
              <Field label="Ön Bahçe"><Num value={z.setbackFront} onChange={(v) => upd('zoning', { setbackFront: v })} suffix="m" /></Field>
              <Field label="Arka Bahçe"><Num value={z.setbackRear} onChange={(v) => upd('zoning', { setbackRear: v })} suffix="m" /></Field>
            </div>
            <div className="grid-2">
              <Field label="Yan Bahçe (sol)"><Num value={z.setbackSideLeft} onChange={(v) => upd('zoning', { setbackSideLeft: v })} suffix="m" /></Field>
              <Field label="Yan Bahçe (sağ)"><Num value={z.setbackSideRight} onChange={(v) => upd('zoning', { setbackSideRight: v })} suffix="m" /></Field>
            </div>
            {env.hasGeometry && (
              <div className="note-box">
                Yapılaşma zarfı: <b>{fmtNum(env.buildableWidth, 1)} × {fmtNum(env.buildableDepth, 1)} m = {fmtM2(env.envelopeArea)}</b>
              </div>
            )}
          </>
        )}
      </div>

      <div className="card">
        <div className="card-title">Emsal İstisnaları</div>
        <Field label="Bodrum kat olacak mı?">
          <Seg value={e.hasBasement} onChange={(b) => upd('emsal', { hasBasement: b })}
               options={[{ value: true, label: 'Evet' }, { value: false, label: 'Hayır' }]} />
        </Field>
        {e.hasBasement && (
          <div className="grid-2">
            <Field label="Emsale dahil mi?">
              <Seg value={e.basementInEmsal} onChange={(b) => upd('emsal', { basementInEmsal: b })}
                   options={[{ value: false, label: 'Hayır' }, { value: true, label: 'Evet' }]} />
            </Field>
            <Field label="Villa Başına Bodrum" hint="Boşsa taban alanı kadar">
              <Num value={e.basementPerUnit} onChange={(v) => upd('emsal', { basementPerUnit: v })} suffix="m²" />
            </Field>
          </div>
        )}
        <Field label="Çatı arası piyesi olacak mı?">
          <Seg value={e.hasAttic} onChange={(b) => upd('emsal', { hasAttic: b })}
               options={[{ value: true, label: 'Evet' }, { value: false, label: 'Hayır' }]} />
        </Field>
        {e.hasAttic && (
          <div className="grid-2">
            <Field label="Emsale dahil mi?">
              <Seg value={e.atticInEmsal} onChange={(b) => upd('emsal', { atticInEmsal: b })}
                   options={[{ value: false, label: 'Hayır' }, { value: true, label: 'Evet' }]} />
            </Field>
            <Field label="Villa Başına Çatı Arası" hint="Boşsa tabanın %40'ı">
              <Num value={e.atticPerUnit} onChange={(v) => upd('emsal', { atticPerUnit: v })} suffix="m²" />
            </Field>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">Plan Notları (opsiyonel)</div>
        <Field label="Özel hükümler" hint="Emsal istisnaları, çıkma ve balkon kuralları — raporda aynen görünür.">
          <textarea value={z.planNotes} onChange={(ev) => upd('zoning', { planNotes: ev.target.value })} />
        </Field>
      </div>
    </div>
  );
}

/* ═══════════ ADIM 3 — PROJE ═══════════ */
const HOUSING: Array<{ v: HousingType; label: string; desc: string; ready: boolean }> = [
  { v: 'villa', label: 'Villa', desc: 'Müstakil / ikiz / sıralı, bahçeli', ready: true },
  { v: 'apartman-3-6', label: '3-6 Katlı Apartman', desc: 'Az katlı çok birimli', ready: false },
  { v: 'blok-7-18', label: '7-18 Katlı Blok', desc: 'Yüksek yoğunluk', ready: false },
  { v: 'site', label: 'Site (Çok Bloklu)', desc: 'Birden fazla blok', ready: false },
];

export function Step3({ input, upd, setTop }: P) {
  const v = input.villa;
  const c = computeVillaCapacity(input.parcel, input.zoning, input.villa, input.emsal);
  const tabanHakki = c.effectiveFootprint;
  const insaatHakki = c.kaksLimit;

  return (
    <div className="cols">
      <div className="card">
        <div className="card-title">İmar Haklarına Göre Kapasite</div>
        <div className="mini-kpi">
          <div><span>Taban alanı</span><b>{tabanHakki > 0 ? fmtM2(tabanHakki) : '—'}</b></div>
          <div><span>Toplam inşaat alanı</span><b>{insaatHakki != null ? fmtM2(insaatHakki) : '—'}</b></div>
        </div>
        <div className="note-box">
          Aşağıda ya villa büyüklüğünü girip <b>adedi hesaplatırsınız</b>, ya da villa adedini girip
          <b> büyüklüğü hesaplatırsınız</b>.
        </div>
      </div>

      <div className="card">
        <div className="card-title">Konut Tipi</div>
        <div className="choice-grid">
          {HOUSING.map((h) => (
            <Choice key={h.v} on={input.housingType === h.v}
                    name={h.ready ? h.label : `${h.label} — yakında`} desc={h.desc}
                    onClick={() => h.ready && setTop('housingType', h.v)} />
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Villa Kurgusu</div>
        <Field label="Hesaplama yönü">
          <Seg value={v.mode} onChange={(m) => upd('villa', { mode: m })}
               options={[
                 { value: 'alan', label: 'Büyüklükten adede' },
                 { value: 'adet', label: 'Adetten büyüklüğe' },
               ]} />
        </Field>

        {v.mode === 'alan' ? (
          <Field label="Villa Brüt Alanı" hint="Zemin üstü; bodrum ve çatı arası hariç">
            <Num value={v.grossPerVilla} onChange={(n) => upd('villa', { grossPerVilla: n })} suffix="m²" />
          </Field>
        ) : (
          <Field label="Villa Adedi" hint="Kapasite bu adede bölünerek villa büyüklüğü bulunur">
            <Num value={v.unitCountManual} onChange={(n) => upd('villa', { unitCountManual: n })} suffix="adet" />
          </Field>
        )}

        <div className="grid-2">
          <Field label="Villa Kat Adedi" hint="Bodrum ve çatı arası hariç">
            <Num value={v.floorsPerVilla} onChange={(n) => upd('villa', { floorsPerVilla: n })} />
          </Field>
          <Field label="Villa Tipi">
            <Sel value={v.villaType} onChange={(t) => upd('villa', { villaType: t })}
                 options={[
                   { value: 'mustakil', label: 'Müstakil' },
                   { value: 'ikiz', label: 'İkiz' },
                   { value: 'sirali', label: 'Sıralı' },
                 ]} />
          </Field>
        </div>
        <Field label="Villa Net Alanı (opsiyonel)" hint="Boşsa brüt alan satılabilir kabul edilir">
          <Num value={v.netPerVilla ?? 0} onChange={(n) => upd('villa', { netPerVilla: n || null })} suffix="m²" />
        </Field>
        {input.zoning.useSetbacks && (
          <Field label="Yerleşim Verimliliği" hint="Zarfın bina tabanına dönüşen kısmı (iç yol, bahçe payı düşülmüş)">
            <Pct value={v.layoutEfficiency} onChange={(n) => upd('villa', { layoutEfficiency: n })} />
          </Field>
        )}
      </div>

      {c.unitCount > 0 && (
        <div className="card result-preview">
          <div className="card-title">Sonuç Önizleme</div>
          <div className="mini-kpi three">
            <div><span>Villa adedi</span><b>{c.unitCount}</b></div>
            <div><span>Villa brüt alanı</span><b>{fmtM2(c.grossPerVilla)}</b></div>
            <div><span>Villa taban alanı</span><b>{fmtM2(c.footprintPerUnit)}</b></div>
          </div>
          <div className="breakdown">
            <div>Villa başına: <b>{fmtM2(c.grossPerVilla)}</b> zemin üstü
              {c.basementArea > 0 && <> + <b>{fmtM2(c.basementArea / c.unitCount)}</b> bodrum</>}
              {c.atticArea > 0 && <> + <b>{fmtM2(c.atticArea / c.unitCount)}</b> çatı arası</>}
              {' '}= <b>{fmtM2(c.grossPerUnit)}</b> brüt
            </div>
            <div>Toplam: <b>{fmtM2(c.grossArea)}</b> brüt inşaat · <b>{fmtM2(c.saleableArea)}</b> satılabilir ·
              {' '}emsal kullanımı <b>{c.emsalUsage != null ? '%' + (c.emsalUsage * 100).toFixed(0) : '—'}</b></div>
            <div>Bağlayıcı kısıt: <b>{c.binding}</b></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════ ADIM 4 — MALİYET VE SATIŞ ═══════════ */
export function Step4({ input, upd }: P) {
  const c = input.cost;
  const s = input.site;
  const cap = computeVillaCapacity(input.parcel, input.zoning, input.villa, input.emsal);
  const sinif = YAPI_SINIFLARI.find((x) => x.code === c.buildingClass);
  return (
    <div className="cols">
      <div className="card">
        <div className="card-title">Yapım Maliyeti</div>
        <Field label="Yapı Sınıfı (2026 Bakanlık Tebliği)">
          <Sel value={c.buildingClass}
               onChange={(code) => {
                 const x = YAPI_SINIFLARI.find((y) => y.code === code);
                 upd('cost', { buildingClass: code, unitCost: x ? x.unitCost : c.unitCost });
               }}
               options={YAPI_SINIFLARI.map((x) => ({ value: x.code, label: `${x.label} — ${fmtTLm2(x.unitCost)}` }))} />
        </Field>
        {sinif && <div className="hint" style={{ marginTop: -6, marginBottom: 10 }}>{sinif.examples}</div>}
        <div className="grid-2">
          <Field label="Birim Maliyet" hint="Elle değiştirebilirsiniz">
            <Num value={c.unitCost} onChange={(n) => upd('cost', { unitCost: n })} suffix="₺/m²" />
          </Field>
          <Field label="Güncelleme Oranı" hint="Enflasyon / piyasa farkı">
            <Pct value={c.inflationRate} onChange={(n) => upd('cost', { inflationRate: n })} />
          </Field>
        </div>
        <Field label="Proje, Ruhsat, Harç ve Müşavirlik" hint="İnşaat maliyeti üzerinden oran">
          <Pct value={c.extrasRate} onChange={(n) => upd('cost', { extrasRate: n })} />
        </Field>
        <div className="note-box">
          Güncel birim maliyet: <b>{fmtTLm2(c.unitCost * (1 + c.inflationRate))}</b> ·
          {' '}Toplam inşaat: <b>{fmtM2(cap.grossArea)}</b><br />
          Kaynak: {TEBLIG_KAYNAK}. KDV hariçtir.
        </div>
      </div>

      <div className="card">
        <div className="card-title">Peyzaj ve Bahçe</div>
        <Field label="Peyzaj / Bahçe Alanı" hint="Otomatik: net parsel − bina oturumu. İsterseniz değiştirin.">
          <Num value={s.landscapeArea > 0 ? s.landscapeArea : Math.round(cap.gardenArea)}
               onChange={(n) => upd('site', { landscapeArea: n })} suffix="m²" />
        </Field>
        {s.landscapeArea > 0 && (
          <button type="button" className="link-btn" onClick={() => upd('site', { landscapeArea: 0 })}>
            Otomatik hesaba dön ({fmtM2(cap.gardenArea)})
          </button>
        )}
        <div className="grid-2" style={{ marginTop: 10 }}>
          <Field label="Peyzaj Birim Maliyeti" hint="Tipik 800-2.500 ₺/m²">
            <Num value={s.landscapeUnitCost} onChange={(n) => upd('site', { landscapeUnitCost: n })} suffix="₺/m²" />
          </Field>
          <Field label="Bahçe Satış Değeri" hint="0 → villa fiyatına dahil">
            <Num value={s.gardenPricePerM2} onChange={(n) => upd('site', { gardenPricePerM2: n })} suffix="₺/m²" />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Satış</div>
        <Field label="Villa Satış Birim Değeri" hint="Satılabilir m² başına, KDV hariç">
          <Num value={input.sales.unitPrice} onChange={(n) => upd('sales', { unitPrice: n })} suffix="₺/m²" />
        </Field>
        {cap.saleableArea > 0 && input.sales.unitPrice > 0 && (
          <div className="note-box">
            Satılabilir alan <b>{fmtM2(cap.saleableArea)}</b> ×  birim fiyat =
            {' '}<b>{(cap.saleableArea * input.sales.unitPrice).toLocaleString('tr-TR')} ₺</b> villa hasılatı
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════ ADIM 5 — DEĞERLEME ═══════════ */
export function Step5({ input, upd }: P) {
  const r = input.residual;
  return (
    <div className="cols">
      <div className="card">
        <div className="card-title">Kâr ve Finansman</div>
        <Field label="Müteahhit Kâr Oranı" hint="Hasılat üzerinden; piyasa uygulaması %15-30">
          <Pct value={r.profitRate} onChange={(n) => upd('residual', { profitRate: n })} />
        </Field>
        <Field label="Finansman Gideri" hint="Toplam maliyetin yüzdesi. Kredi kullanılmayacaksa %0 bırakın.">
          <Pct value={r.financeRateOfCost} onChange={(n) => upd('residual', { financeRateOfCost: n })} />
        </Field>
      </div>

      <div className="card">
        <div className="card-title">Kat Karşılığı Analizi</div>
        <Field label="Rapora eklensin mi?"
               hint="Kat karşılığı yöntemi, artık değer yönteminden farklı sonuç verebilir. İstemezseniz kapatın.">
          <Seg value={input.share.enabled} onChange={(b) => upd('share', { enabled: b })}
               options={[{ value: true, label: 'Evet' }, { value: false, label: 'Hayır' }]} />
        </Field>
        {input.share.enabled && (
          <>
            <Field label="Arsa Sahibi Payı">
              <Pct value={input.share.ownerShare} onChange={(n) => upd('share', { ownerShare: n })} />
            </Field>
            <div className="note-box">
              Müteahhit payı: <b>%{((1 - input.share.ownerShare) * 100).toFixed(1).replace('.', ',')}</b> ·
              Sonuçta bu oran, artık değere denk gelen teorik payla karşılaştırılır.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
