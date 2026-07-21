import type { ProjectInput, AssetType } from '../engine';
import { computeCapacity } from '../engine';
import { YAPI_SINIFLARI, TEBLIG_KAYNAK, ILLER, LEJANTLAR } from '../data/yapiSiniflari';
import { Field, Txt, Num, Pct, Sel, Choice, Seg, fmtM2, fmtTLm2 } from './fields';

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

/* ═══════════ ADIM 2 — İMAR VE ALAN ÜRETİMİ ═══════════ */
export function Step2({ input, upd }: P) {
  const z = input.zoning;
  const e = input.emsal;
  const v = input.villa;
  const c = computeCapacity(input.parcel, z, e, v);
  const taksKaks = z.mode === 'taks-kaks';
  const lejantOther = z.lejant === ' ' || (z.lejant !== '' && !LEJANTLAR.includes(z.lejant));

  return (
    <div className="cols">
      <div className="card">
        <div className="card-title">1 · İmar Durumu</div>
        <Field label="Plan Lejantı">
          <Sel value={lejantOther ? 'Diğer (elle yazınız)' : z.lejant}
               onChange={(val) => upd('zoning', { lejant: val === 'Diğer (elle yazınız)' ? ' ' : val })}
               options={[{ value: '', label: 'Seçiniz…' }, ...LEJANTLAR.map((l) => ({ value: l, label: l }))]} />
        </Field>
        {lejantOther && (
          <Field label="Lejant (elle)">
            <Txt value={z.lejant.trim()} onChange={(val) => upd('zoning', { lejant: val || ' ' })} />
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
            <Field label="Taban Oturumu"><Num value={z.directFootprint} onChange={(val) => upd('zoning', { directFootprint: val })} suffix="m²" /></Field>
            <Field label="Emsale Dahil Alan"><Num value={z.directEmsalArea} onChange={(val) => upd('zoning', { directEmsalArea: val })} suffix="m²" /></Field>
          </div>
        )}
        <div className="mini-kpi">
          <div><span>Taban oturumu</span><b>{fmtM2(c.footprintArea)}</b></div>
          <div><span>Emsale dahil alan</span><b>{fmtM2(c.emsalArea)}</b></div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">2 · Emsal Dışı Satılabilir Alan</div>
        <Field label="Emsal dışı satılabilir alan var mı?">
          <Seg value={e.hasExtra} onChange={(b) => upd('emsal', { hasExtra: b })}
               options={[{ value: false, label: 'Yok' }, { value: true, label: 'Var' }]} />
        </Field>
        {e.hasExtra && (
          <>
            <Field label="Nasıl hesaplansın?">
              <Seg value={e.extraMode} onChange={(m) => upd('emsal', { extraMode: m })}
                   options={[{ value: 'oran', label: 'Emsalin yüzdesi' }, { value: 'manuel', label: 'Elle giriş' }]} />
            </Field>
            {e.extraMode === 'oran' ? (
              <Field label="Oran" hint={`Emsale dahil alanın yüzdesi · ${fmtM2(c.emsalArea)} üzerinden`}>
                <Pct value={e.extraRate} onChange={(n) => upd('emsal', { extraRate: n })} />
              </Field>
            ) : (
              <Field label="Alan"><Num value={e.extraArea} onChange={(n) => upd('emsal', { extraArea: n })} suffix="m²" /></Field>
            )}
            <div className="note-box">Emsal dışı satılabilir alan: <b>{fmtM2(c.extraArea)}</b></div>
          </>
        )}
      </div>

      <div className="card">
        <div className="card-title">3 · Çatı Katı</div>
        <Field label="Çatı katı var mı?">
          <Seg value={e.hasAttic} onChange={(b) => upd('emsal', { hasAttic: b })}
               options={[{ value: false, label: 'Yok' }, { value: true, label: 'Var' }]} />
        </Field>
        {e.hasAttic && (
          <>
            <Field label="Nasıl hesaplansın?">
              <Seg value={e.atticMode} onChange={(m) => upd('emsal', { atticMode: m })}
                   options={[{ value: 'oran', label: 'Tabanın yüzdesi' }, { value: 'manuel', label: 'Elle giriş' }]} />
            </Field>
            {e.atticMode === 'oran' ? (
              <Field label="Oran" hint={`Taban oturumunun yüzdesi · ${fmtM2(c.footprintArea)} üzerinden`}>
                <Pct value={e.atticRate} onChange={(n) => upd('emsal', { atticRate: n })} />
              </Field>
            ) : (
              <Field label="Alan"><Num value={e.atticArea} onChange={(n) => upd('emsal', { atticArea: n })} suffix="m²" /></Field>
            )}
            <Field label="Emsale dahil mi?" hint="Dahilse emsalin içinden yer alır, toplam inşaat alanını artırmaz.">
              <Seg value={e.atticInEmsal} onChange={(b) => upd('emsal', { atticInEmsal: b })}
                   options={[{ value: false, label: 'Hayır' }, { value: true, label: 'Evet' }]} />
            </Field>
            <div className="note-box">Çatı katı alanı: <b>{fmtM2(c.atticArea)}</b></div>
          </>
        )}
      </div>

      <div className="card">
        <div className="card-title">4 · Bodrum Kat</div>
        <Field label="Bodrum kat var mı?" hint="Bodrum alanı taban oturumu kadar kabul edilir.">
          <Seg value={e.hasBasement} onChange={(b) => upd('emsal', { hasBasement: b })}
               options={[{ value: false, label: 'Yok' }, { value: true, label: 'Var' }]} />
        </Field>
        {e.hasBasement && (
          <>
            <Field label="Emsale dahil mi?" hint="Dahilse emsalin içinden yer alır, toplam inşaat alanını artırmaz.">
              <Seg value={e.basementInEmsal} onChange={(b) => upd('emsal', { basementInEmsal: b })}
                   options={[{ value: false, label: 'Hayır' }, { value: true, label: 'Evet' }]} />
            </Field>
            <div className="note-box">Bodrum kat alanı: <b>{fmtM2(c.basementArea)}</b></div>
          </>
        )}
      </div>

      <div className="card result-preview">
        <div className="card-title">Toplam İnşaat Alanı</div>
        <div className="breakdown">
          <div>Emsale dahil alan: <b>{fmtM2(c.emsalArea)}</b></div>
          {c.extraArea > 0 && <div>+ Emsal dışı satılabilir alan: <b>{fmtM2(c.extraArea)}</b></div>}
          {e.hasAttic && !e.atticInEmsal && <div>+ Çatı katı (emsal dışı): <b>{fmtM2(c.atticArea)}</b></div>}
          {e.hasBasement && !e.basementInEmsal && <div>+ Bodrum kat (emsal dışı): <b>{fmtM2(c.basementArea)}</b></div>}
          {c.emsalConsumedByExtras > 0 && (
            <div className="leftover">
              Emsale dahil edilen {fmtM2(c.emsalConsumedByExtras)} (çatı/bodrum) toplamı artırmaz;
              emsalin içinden yer alır. Zemin üstü katlara kalan: <b>{fmtM2(c.aboveGroundArea)}</b>
            </div>
          )}
        </div>
        <div className="mini-kpi" style={{ marginTop: 12 }}>
          <div><span>Toplam inşaat alanı</span><b>{fmtM2(c.totalArea)}</b></div>
          <div><span>Bahçe / açık alan</span><b>{fmtM2(c.gardenArea)}</b></div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">5 · Villa Dağılımı (opsiyonel)</div>
        <div className="grid-2">
          <Field label="Villa Adedi" hint="Boş bırakılabilir">
            <Num value={v.unitCount} onChange={(n) => upd('villa', { unitCount: n })} suffix="adet" />
          </Field>
          <Field label="Zemin Üstü Kat Adedi" hint="Bodrum ve çatı katı hariç">
            <Num value={v.floorsAboveGround} onChange={(n) => upd('villa', { floorsAboveGround: n })} />
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
        {c.unitCount > 0 && (
          <div className="mini-kpi three" style={{ marginTop: 4 }}>
            <div><span>Villa adedi</span><b>{c.unitCount}</b></div>
            <div><span>Villa başına alan</span><b>{fmtM2(c.areaPerUnit)}</b></div>
            <div><span>Villa başına arsa</span><b>{fmtM2(input.parcel.area / c.unitCount)}</b></div>
          </div>
        )}
        <div className={c.floorFits ? 'note-box' : 'leftover'} style={{ marginTop: 10 }}>
          Zemin üstü {fmtM2(c.aboveGroundArea)} alan {c.floorsAboveGround} kata bölündüğünde
          kat başına <b>{fmtM2(c.areaPerFloor)}</b> düşüyor; taban oturumu <b>{fmtM2(c.footprintArea)}</b>.
          {!c.floorFits && <> Bu yerleşim için en az <b>{c.minFloorsNeeded} kat</b> gerekir.</>}
        </div>
      </div>

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
  const cap = computeCapacity(input.parcel, input.zoning, input.emsal, input.villa);
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
          Toplam inşaat <b>{fmtM2(cap.totalArea)}</b><br />
          Kaynak: {TEBLIG_KAYNAK}. KDV hariçtir.
        </div>
      </div>

      <div className="card">
        <div className="card-title">Peyzaj ve Bahçe</div>
        <Field label="Peyzaj / Bahçe Alanı" hint="Otomatik: net parsel − taban oturumu">
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
          <Field label="Bahçe Satış Değeri" hint="0 → fiyata dahil">
            <Num value={s.gardenPricePerM2} onChange={(n) => upd('site', { gardenPricePerM2: n })} suffix="₺/m²" />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Satış</div>
        <Field label="Satış Birim Değeri" hint="TOPLAM İNŞAAT ALANI m² başına, KDV hariç. Bodrum, zemin ve çatı ayrımı yapılmaz.">
          <Num value={input.sales.unitPrice} onChange={(n) => upd('sales', { unitPrice: n })} suffix="₺/m²" />
        </Field>
        {cap.totalArea > 0 && input.sales.unitPrice > 0 && (
          <div className="note-box">
            Toplam inşaat <b>{fmtM2(cap.totalArea)}</b> × birim fiyat =
            {' '}<b>{(cap.totalArea * input.sales.unitPrice).toLocaleString('tr-TR')} ₺</b>
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
