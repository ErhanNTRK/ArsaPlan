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

/* ═══════════ ADIM 2 — İMAR VE PROJE ═══════════ */
const HOUSING: Array<{ v: HousingType; label: string; desc: string; ready: boolean }> = [
  { v: 'villa', label: 'Villa', desc: 'Müstakil / ikiz / sıralı', ready: true },
  { v: 'apartman-3-6', label: '3-6 Kat Apartman', desc: 'Az katlı', ready: false },
  { v: 'blok-7-18', label: '7-18 Kat Blok', desc: 'Yüksek yoğunluk', ready: false },
  { v: 'site', label: 'Site', desc: 'Çok bloklu', ready: false },
];

export function Step2({ input, upd, setTop }: P) {
  const z = input.zoning;
  const e = input.emsal;
  const p = input.parcel;
  const v = input.villa;
  const env = computeEnvelope(p, z);
  const c = computeVillaCapacity(p, z, v, e);
  const taksKaks = z.mode === 'taks-kaks';
  const lejantOther = z.lejant === ' ' || (z.lejant !== '' && !LEJANTLAR.includes(z.lejant));

  return (
    <div className="cols">
      <div className="card">
        <div className="card-title">İmar Durumu</div>
        <Field label="Plan Lejantı">
          <Sel value={lejantOther ? 'Diğer (elle yazınız)' : z.lejant}
               onChange={(val) => upd('zoning', { lejant: val === 'Diğer (elle yazınız)' ? ' ' : val })}
               options={[{ value: '', label: 'Seçiniz…' }, ...LEJANTLAR.map((l) => ({ value: l, label: l }))]} />
        </Field>
        {lejantOther && (
          <Field label="Lejant (elle)">
            <Txt value={z.lejant.trim()} onChange={(val) => upd('zoning', { lejant: val || ' ' })} placeholder="Plandaki fonksiyon adı" />
          </Field>
        )}
        <Field label="Hesap Yöntemi">
          <Seg value={z.mode} onChange={(m) => upd('zoning', { mode: m })}
               options={[{ value: 'taks-kaks', label: 'TAKS / KAKS' }, { value: 'dogrudan', label: 'Doğrudan alan' }]} />
        </Field>
        {taksKaks ? (
          <div className="grid-3">
            <Field label="TAKS"><Num value={z.taks ?? 0} onChange={(val) => upd('zoning', { taks: val || null })} step="0.01" /></Field>
            <Field label="KAKS"><Num value={z.kaks ?? 0} onChange={(val) => upd('zoning', { kaks: val || null })} step="0.01" /></Field>
            <Field label="Hmax"><Num value={z.hmax ?? 0} onChange={(val) => upd('zoning', { hmax: val || null })} suffix="m" /></Field>
          </div>
        ) : (
          <div className="grid-2">
            <Field label="Toplam Taban Oturumu"><Num value={z.directFootprint} onChange={(val) => upd('zoning', { directFootprint: val })} suffix="m²" /></Field>
            <Field label="Toplam İnşaat Alanı"><Num value={z.directTotalArea} onChange={(val) => upd('zoning', { directTotalArea: val })} suffix="m²" /></Field>
          </div>
        )}
        <Field label="Çekme mesafeleri hesaba katılsın mı?" hint="Kapalıyken kapasite yalnızca imar haklarından bulunur.">
          <Seg value={z.useSetbacks} onChange={(b) => upd('zoning', { useSetbacks: b })}
               options={[{ value: false, label: 'Hayır' }, { value: true, label: 'Evet' }]} />
        </Field>
        {z.useSetbacks && (
          <>
            <div className="grid-2">
              <Field label="Parsel Eni"><Num value={p.width} onChange={(val) => upd('parcel', { width: val })} suffix="m" /></Field>
              <Field label="Parsel Boyu"><Num value={p.depth} onChange={(val) => upd('parcel', { depth: val })} suffix="m" /></Field>
            </div>
            <div className="grid-2">
              <Field label="Ön / Arka Bahçe">
                <div className="grid-2">
                  <Num value={z.setbackFront} onChange={(val) => upd('zoning', { setbackFront: val })} suffix="m" />
                  <Num value={z.setbackRear} onChange={(val) => upd('zoning', { setbackRear: val })} suffix="m" />
                </div>
              </Field>
              <Field label="Yan Bahçe (sol / sağ)">
                <div className="grid-2">
                  <Num value={z.setbackSideLeft} onChange={(val) => upd('zoning', { setbackSideLeft: val })} suffix="m" />
                  <Num value={z.setbackSideRight} onChange={(val) => upd('zoning', { setbackSideRight: val })} suffix="m" />
                </div>
              </Field>
            </div>
            {env.hasGeometry && (
              <div className="note-box">
                Yapılaşma zarfı: <b>{fmtNum(env.buildableWidth, 1)} × {fmtNum(env.buildableDepth, 1)} m = {fmtM2(env.envelopeArea)}</b>
              </div>
            )}
            <Field label="Yerleşim Verimliliği" hint="Zarfın bina tabanına dönüşen kısmı">
              <Pct value={v.layoutEfficiency} onChange={(n) => upd('villa', { layoutEfficiency: n })} />
            </Field>
          </>
        )}
      </div>

      <div className="card">
        <div className="card-title">Emsal Dışı Alanlar</div>
        <p className="hint" style={{ marginTop: -6, marginBottom: 10 }}>
          Bir alan emsale dahil olmayabilir ama yine de satılabilir olabilir. İki soruyu ayrı ayrı yanıtlayın.
        </p>

        <Field label="Bodrum kat">
          <Seg value={e.hasBasement} onChange={(b) => upd('emsal', { hasBasement: b })}
               options={[{ value: true, label: 'Var' }, { value: false, label: 'Yok' }]} />
        </Field>
        {e.hasBasement && (
          <>
            <div className="grid-2">
              <Field label="Emsale dahil mi?">
                <Seg value={e.basementInEmsal} onChange={(b) => upd('emsal', { basementInEmsal: b })}
                     options={[{ value: false, label: 'Hayır' }, { value: true, label: 'Evet' }]} />
              </Field>
              <Field label="Satılabilir mi?">
                <Seg value={e.basementSaleable} onChange={(b) => upd('emsal', { basementSaleable: b })}
                     options={[{ value: false, label: 'Hayır' }, { value: true, label: 'Evet' }]} />
              </Field>
            </div>
            <Field label="Villa Başına Bodrum" hint="Boşsa taban alanı kadar">
              <Num value={e.basementPerUnit} onChange={(val) => upd('emsal', { basementPerUnit: val })} suffix="m²" />
            </Field>
          </>
        )}

        <Field label="Çatı arası piyesi">
          <Seg value={e.hasAttic} onChange={(b) => upd('emsal', { hasAttic: b })}
               options={[{ value: true, label: 'Var' }, { value: false, label: 'Yok' }]} />
        </Field>
        {e.hasAttic && (
          <>
            <div className="grid-2">
              <Field label="Emsale dahil mi?">
                <Seg value={e.atticInEmsal} onChange={(b) => upd('emsal', { atticInEmsal: b })}
                     options={[{ value: false, label: 'Hayır' }, { value: true, label: 'Evet' }]} />
              </Field>
              <Field label="Satılabilir mi?">
                <Seg value={e.atticSaleable} onChange={(b) => upd('emsal', { atticSaleable: b })}
                     options={[{ value: false, label: 'Hayır' }, { value: true, label: 'Evet' }]} />
              </Field>
            </div>
            <Field label="Villa Başına Çatı Arası" hint="Boşsa tabanın %40'ı">
              <Num value={e.atticPerUnit} onChange={(val) => upd('emsal', { atticPerUnit: val })} suffix="m²" />
            </Field>
          </>
        )}

        <Field label="Diğer Emsal Dışı Satılabilir KAPALI Alan"
               hint="Villa başına m². Kapalı balkon, eklenti gibi emsale girmeyen ama satılan KAPALI alanlar. Bahçe buraya yazılmaz.">
          <Num value={e.extraSaleablePerUnit} onChange={(val) => upd('emsal', { extraSaleablePerUnit: val })} suffix="m²" />
        </Field>
      </div>

      <div className="card">
        <div className="card-title">Konut Tipi ve Villa Kurgusu</div>
        <div className="choice-grid two">
          {HOUSING.map((h) => (
            <Choice key={h.v} on={input.housingType === h.v}
                    name={h.ready ? h.label : `${h.label} — yakında`} desc={h.desc}
                    onClick={() => h.ready && setTop('housingType', h.v)} />
          ))}
        </div>
        <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '14px 0' }} />
        <Field label="Hesaplama yönü">
          <Seg value={v.mode} onChange={(m) => upd('villa', { mode: m })}
               options={[
                 { value: 'alan', label: 'Büyüklükten adede' },
                 { value: 'adet', label: 'Adetten büyüklüğe' },
               ]} />
        </Field>
        <div className="grid-2">
          {v.mode === 'alan' ? (
            <Field label="Villa Alanı" hint="Zemin üstü katların toplam kapalı alanı">
              <Num value={v.grossPerVilla} onChange={(n) => upd('villa', { grossPerVilla: n })} suffix="m²" />
            </Field>
          ) : (
            <Field label="Villa Adedi" hint="Kapasite bu adede bölünür">
              <Num value={v.unitCountManual} onChange={(n) => upd('villa', { unitCountManual: n })} suffix="adet" />
            </Field>
          )}
          <Field label="Villa Kat Adedi" hint={input.emsal.hasBasement ? 'Bodrum DAHİL · çatı arası hariç' : 'Zemin dahil · çatı arası hariç'}>
            <Num value={v.floorsPerVilla} onChange={(n) => upd('villa', { floorsPerVilla: n })} />
          </Field>
        </div>
        <Field label="Villa Tipi">
          <Sel value={v.villaType} onChange={(t) => upd('villa', { villaType: t })}
               options={[
                 { value: 'mustakil', label: 'Müstakil' },
                 { value: 'ikiz', label: 'İkiz' },
                 { value: 'sirali', label: 'Sıralı' },
               ]} />
        </Field>
        <div className="note-box">
          {input.emsal.hasBasement
            ? <>Bodrum var: <b>{v.floorsPerVilla} kat</b> = 1 bodrum + {Math.max(1, v.floorsPerVilla - 1)} zemin üstü kat
                {v.floorsPerVilla >= 3 && <> (zemin + {v.floorsPerVilla - 2} normal kat)</>}.</>
            : <>Bodrum yok: <b>{v.floorsPerVilla} kat</b> = zemin{v.floorsPerVilla > 1 && <> + {v.floorsPerVilla - 1} normal kat</>}.</>}
          {input.emsal.hasAttic && <> Çatı arası kat sayısına girmez, alan hesabına girer.</>}
        </div>
      </div>

      {c.unitCount > 0 && (
        <div className="card result-preview">
          <div className="card-title">Kapasite Önizleme</div>
          <div className="mini-kpi three">
            <div><span>Villa adedi</span><b>{c.unitCount}</b></div>
            <div><span>Villa brüt</span><b>{fmtM2(c.grossPerVilla)}</b></div>
            <div><span>Satılabilir kapalı</span><b>{fmtM2(c.saleableArea)}</b></div>
          </div>
          <div className="breakdown">
            <div>Villa başına: <b>{fmtM2(c.grossPerVilla)}</b> zemin üstü
              {c.basementArea > 0 && <> + <b>{fmtM2(c.basementArea / c.unitCount)}</b> bodrum</>}
              {c.atticArea > 0 && <> + <b>{fmtM2(c.atticArea / c.unitCount)}</b> çatı arası</>}
              {c.extraSaleableArea > 0 && <> + <b>{fmtM2(c.extraSaleableArea / c.unitCount)}</b> diğer</>}
              {' '}= <b>{fmtM2(c.grossPerUnit)}</b> brüt
            </div>
            <div>Satılabilir kapalı alan: <b>{fmtM2(c.saleableWithinEmsal)}</b> emsale konu
              {c.saleableOutsideEmsal > 0 && <> + <b>{fmtM2(c.saleableOutsideEmsal)}</b> emsal dışı</>}
              {' '}= <b>{fmtM2(c.saleableArea)}</b>
            </div>
            <div>Emsale konu inşaat: <b>{fmtM2(c.emsalArea)}</b>
              {c.emsalUsage != null && <> · hak kullanımı <b>%{(c.emsalUsage * 100).toFixed(0)}</b></>}
              {' '}· bağlayıcı kısıt: <b>{c.binding}</b>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title">Plan Notları (opsiyonel)</div>
        <textarea value={z.planNotes} onChange={(ev) => upd('zoning', { planNotes: ev.target.value })}
                  placeholder="Emsal istisnaları, çıkma ve balkon kuralları — raporda aynen görünür." />
      </div>
    </div>
  );
}

/* ═══════════ ADIM 3 — MALİYET VE SATIŞ ═══════════ */
export function Step3({ input, upd }: P) {
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
          Güncel birim maliyet <b>{fmtTLm2(c.unitCost * (1 + c.inflationRate))}</b> ·
          Toplam inşaat <b>{fmtM2(cap.grossArea)}</b><br />
          Kaynak: {TEBLIG_KAYNAK}. KDV hariçtir.
        </div>
      </div>

      <div className="card">
        <div className="card-title">Peyzaj ve Bahçe</div>
        <Field label="Peyzaj / Bahçe Alanı" hint="Otomatik: net parsel − toplam zemin oturumu (TAKS taban alanı)">
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
            Satılabilir <b>kapalı</b> alan <b>{fmtM2(cap.saleableArea)}</b> × birim fiyat =
            {' '}<b>{(cap.saleableArea * input.sales.unitPrice).toLocaleString('tr-TR')} ₺</b><br />
            Bahçe bu tutara dahil değildir; ayrıca fiyatlandıysa hasılata eklenir.
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════ ADIM 4 — DEĞERLEME ═══════════ */
export function Step4({ input, upd }: P) {
  const r = input.residual;
  return (
    <div className="cols">
      <div className="card">
        <div className="card-title">Kâr ve Finansman</div>
        <Field label="Müteahhit Kâr Oranı" hint="Hasılat üzerinden; piyasa uygulaması %15-30">
          <Pct value={r.profitRate} onChange={(n) => upd('residual', { profitRate: n })} />
        </Field>
        <Field label="Finansman Gideri" hint="Toplam maliyetin yüzdesi. Kredi yoksa %0 bırakın.">
          <Pct value={r.financeRateOfCost} onChange={(n) => upd('residual', { financeRateOfCost: n })} />
        </Field>
      </div>

      <div className="card">
        <div className="card-title">Kat Karşılığı Analizi</div>
        <Field label="Rapora eklensin mi?"
               hint="Kat karşılığı yöntemi artık değer yönteminden farklı sonuç verebilir.">
          <Seg value={input.share.enabled} onChange={(b) => upd('share', { enabled: b })}
               options={[{ value: true, label: 'Evet' }, { value: false, label: 'Hayır' }]} />
        </Field>
        {input.share.enabled && (
          <>
            <Field label="Arsa Sahibi Payı">
              <Pct value={input.share.ownerShare} onChange={(n) => upd('share', { ownerShare: n })} />
            </Field>
            <div className="note-box">
              Müteahhit payı: <b>%{((1 - input.share.ownerShare) * 100).toFixed(1).replace('.', ',')}</b>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
