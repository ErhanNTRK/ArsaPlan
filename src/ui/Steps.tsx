import type { ProjectInput, AssetType, HousingType } from '../engine';
import { computeEnvelope } from '../engine';
import { YAPI_SINIFLARI, TEBLIG_KAYNAK, ILLER } from '../data/yapiSiniflari';
import { Field, Txt, Num, Pct, Sel, Choice, Seg, fmtM2, fmtTLm2, fmtNum } from './fields';

export type Upd = <K extends keyof ProjectInput>(key: K, patch: Partial<ProjectInput[K]>) => void;
export type SetTop = <K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) => void;
interface P { input: ProjectInput; upd: Upd; setTop: SetTop; }

/* ═══ ADIM 1 — Değerleme konusu + taşınmaz ═══ */
const ASSETS: Array<{ v: AssetType; label: string; desc: string; ready: boolean }> = [
  { v: 'konut', label: 'Konut', desc: 'Villa, apartman, blok veya site — ticari birim yok', ready: true },
  { v: 'ticari', label: 'Ticari', desc: 'Dükkan, ofis, iş merkezi, depo', ready: false },
  { v: 'karma', label: 'Karma Kullanım', desc: 'Konut + ticari birlikte', ready: false },
];

export function Step1({ input, upd, setTop }: P) {
  const p = input.parcel;
  return (
    <>
      <div className="card">
        <div className="card-title">Ne Değerleniyor?</div>
        <div className="choice-grid">
          {ASSETS.map((a) => (
            <Choice key={a.v} on={input.assetType === a.v}
                    name={a.ready ? a.label : `${a.label} — yakında`}
                    desc={a.desc}
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
            Terk oranı <b>%{(((p.area - p.netArea) / p.area) * 100).toFixed(1)}</b> ·
            İmar hakları net parsel, arsa birim değeri tapu alanı üzerinden hesaplanır.
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">Parsel Geometrisi (çekme mesafesi hesabı için)</div>
        <div className="grid-2">
          <Field label="Yol Cephesi (en)"><Num value={p.width} onChange={(v) => upd('parcel', { width: v })} suffix="m" /></Field>
          <Field label="Derinlik (boy)"><Num value={p.depth} onChange={(v) => upd('parcel', { depth: v })} suffix="m" /></Field>
        </div>
        <div className="note-box">
          Parsel dikdörtgen değilse yaklaşık en/boy giriniz; sonuç yaklaşık kabul edilir.
          Boş bırakırsanız kapasite yalnızca imar hakları üzerinden hesaplanır.
        </div>
      </div>
    </>
  );
}

/* ═══ ADIM 2 — Konut tipi ═══ */
const HOUSING: Array<{ v: HousingType; label: string; desc: string; ready: boolean }> = [
  { v: 'villa', label: 'Villa', desc: 'Müstakil / ikiz / sıralı, bahçeli düşük yoğunluk', ready: true },
  { v: 'apartman-3-6', label: '3-6 Katlı Apartman', desc: 'Az katlı, tek blok çok birimli konut', ready: false },
  { v: 'blok-7-18', label: '7-18 Katlı Blok', desc: 'Yüksek yoğunluklu tek blok', ready: false },
  { v: 'site', label: 'Site (Çok Bloklu)', desc: 'Parsel içinde birden fazla blok ve ortak sosyal alan', ready: false },
];

export function Step2({ input, setTop }: P) {
  return (
    <div className="card">
      <div className="card-title">Konut Tipi</div>
      <div className="choice-grid">
        {HOUSING.map((h) => (
          <Choice key={h.v} on={input.housingType === h.v}
                  name={h.ready ? h.label : `${h.label} — yakında`}
                  desc={h.desc}
                  onClick={() => h.ready && setTop('housingType', h.v)} />
        ))}
      </div>
      <div className="note-box" style={{ marginTop: 12 }}>
        Bu sürümde <b>Villa</b> senaryosu hesaplanmaktadır. Diğer tipler aynı motor altyapısı
        üzerine sırayla eklenecektir.
      </div>
    </div>
  );
}

/* ═══ ADIM 3 — İmar bilgileri ═══ */
export function Step3({ input, upd }: P) {
  const z = input.zoning;
  const e = input.emsal;
  const env = computeEnvelope(input.parcel, z);
  const taksKaks = z.mode === 'taks-kaks';
  return (
    <>
      <div className="card">
        <div className="card-title">Hesap Yöntemi</div>
        <Seg value={z.mode} onChange={(m) => upd('zoning', { mode: m })}
             options={[
               { value: 'taks-kaks', label: 'TAKS / KAKS / Hmax' },
               { value: 'dogrudan', label: 'Doğrudan alan girişi' },
             ]} />
        <div className="note-box" style={{ marginTop: 10 }}>
          {taksKaks
            ? 'Villalarda olağan yöntem budur. Plan notu emsal vermiyorsa ya da elinizde avan proje varsa diğer seçeneğe geçebilirsiniz.'
            : 'Toplam inşaat alanı ve taban oturumunu doğrudan girersiniz. Çekme mesafeleri yine fiziksel üst sınır olarak devrede kalır.'}
        </div>
      </div>

      <div className="card">
        <div className="card-title">{taksKaks ? 'İmar Hakları' : 'Doğrudan Alanlar'}</div>
        <Field label="Lejant / Plan Fonksiyonu">
          <Txt value={z.lejant} onChange={(v) => upd('zoning', { lejant: v })} placeholder="Ayrık nizam konut, villa…" />
        </Field>
        {taksKaks ? (
          <>
            <div className="grid-2">
              <Field label="TAKS" hint="Tanımsızsa boş bırakın">
                <Num value={z.taks ?? 0} onChange={(v) => upd('zoning', { taks: v || null })} step="0.01" />
              </Field>
              <Field label="KAKS / Emsal" hint="Tanımsızsa boş bırakın">
                <Num value={z.kaks ?? 0} onChange={(v) => upd('zoning', { kaks: v || null })} step="0.01" />
              </Field>
            </div>
            <div className="grid-2">
              <Field label="Hmax"><Num value={z.hmax ?? 0} onChange={(v) => upd('zoning', { hmax: v || null })} suffix="m" /></Field>
              <Field label="Kat Adedi"><Num value={z.floors ?? 0} onChange={(v) => upd('zoning', { floors: v || null })} /></Field>
            </div>
            {input.parcel.netArea > 0 && (z.taks || z.kaks) && (
              <div className="note-box">
                {z.taks ? <>Taban alanı hakkı: <b>{fmtM2(input.parcel.netArea * z.taks)}</b><br /></> : null}
                {z.kaks ? <>Toplam inşaat hakkı: <b>{fmtM2(input.parcel.netArea * z.kaks)}</b></> : null}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="grid-2">
              <Field label="Toplam Taban Oturumu" hint="Tüm binaların zemindeki toplam oturumu">
                <Num value={z.directFootprint} onChange={(v) => upd('zoning', { directFootprint: v })} suffix="m²" />
              </Field>
              <Field label="Toplam İnşaat Alanı" hint="Emsale konu toplam alan">
                <Num value={z.directTotalArea} onChange={(v) => upd('zoning', { directTotalArea: v })} suffix="m²" />
              </Field>
            </div>
            <div className="grid-2">
              <Field label="Hmax"><Num value={z.hmax ?? 0} onChange={(v) => upd('zoning', { hmax: v || null })} suffix="m" /></Field>
              <Field label="Kat Adedi"><Num value={z.floors ?? 0} onChange={(v) => upd('zoning', { floors: v || null })} /></Field>
            </div>
          </>
        )}
      </div>

      <div className="card">
        <div className="card-title">Çekme Mesafeleri</div>
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
            Yapılaşma zarfı: <b>{fmtNum(env.buildableWidth, 1)} m × {fmtNum(env.buildableDepth, 1)} m = {fmtM2(env.envelopeArea)}</b>
            {' '}(parselin %{(env.envelopeRatio * 100).toFixed(0)}'i)
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">Bodrum Kat</div>
        <Field label="Bodrum kat olacak mı?">
          <Seg value={e.hasBasement} onChange={(b) => upd('emsal', { hasBasement: b })}
               options={[{ value: true, label: 'Evet' }, { value: false, label: 'Hayır' }]} />
        </Field>
        {e.hasBasement && (
          <>
            <Field label="Emsale dahil mi?" hint="Plan notundan teyit ediniz; karar kapasiteyi doğrudan değiştirir.">
              <Seg value={e.basementInEmsal} onChange={(b) => upd('emsal', { basementInEmsal: b })}
                   options={[{ value: false, label: 'Emsal dışı' }, { value: true, label: 'Emsale dahil' }]} />
            </Field>
            <Field label="Villa Başına Bodrum Alanı" hint="Boş bırakılırsa villa taban alanı kadar kabul edilir.">
              <Num value={e.basementPerUnit} onChange={(v) => upd('emsal', { basementPerUnit: v })} suffix="m²" />
            </Field>
          </>
        )}
      </div>

      <div className="card">
        <div className="card-title">Çatı Arası Piyesi</div>
        <Field label="Çatı arası piyesi olacak mı?">
          <Seg value={e.hasAttic} onChange={(b) => upd('emsal', { hasAttic: b })}
               options={[{ value: true, label: 'Evet' }, { value: false, label: 'Hayır' }]} />
        </Field>
        {e.hasAttic && (
          <>
            <Field label="Emsale dahil mi?" hint="Son katla irtibatlı, bağımsız bölüm oluşturmayan piyesler çoğu planda emsal dışıdır.">
              <Seg value={e.atticInEmsal} onChange={(b) => upd('emsal', { atticInEmsal: b })}
                   options={[{ value: false, label: 'Emsal dışı' }, { value: true, label: 'Emsale dahil' }]} />
            </Field>
            <Field label="Villa Başına Çatı Arası Alanı" hint="Boş bırakılırsa taban alanının %40'ı kabul edilir.">
              <Num value={e.atticPerUnit} onChange={(v) => upd('emsal', { atticPerUnit: v })} suffix="m²" />
            </Field>
          </>
        )}
      </div>

      <div className="card">
        <div className="card-title">Plan Notları</div>
        <Field label="Özel hükümler" hint="Emsal istisnaları, çıkma ve balkon kuralları — raporda aynen görünür.">
          <textarea value={z.planNotes} onChange={(ev) => upd('zoning', { planNotes: ev.target.value })} />
        </Field>
      </div>
    </>
  );
}

/* ═══ ADIM 4 — Villa özellikleri ═══ */
export function Step4({ input, upd }: P) {
  const v = input.villa;
  return (
    <div className="card">
      <div className="card-title">Villa Özellikleri</div>
      <Field label="Villa Tipi">
        <Sel value={v.villaType} onChange={(t) => upd('villa', { villaType: t })}
             options={[
               { value: 'mustakil', label: 'Müstakil' },
               { value: 'ikiz', label: 'İkiz' },
               { value: 'sirali', label: 'Sıralı (townhouse)' },
             ]} />
      </Field>
      <div className="grid-2">
        <Field label="Villa Brüt Alanı" hint="Zemin üstü; bodrum ve çatı arası hariç">
          <Num value={v.grossPerVilla} onChange={(n) => upd('villa', { grossPerVilla: n })} suffix="m²" />
        </Field>
        <Field label="Villa Net Alanı" hint="Boşsa brüt kullanılır">
          <Num value={v.netPerVilla ?? 0} onChange={(n) => upd('villa', { netPerVilla: n || null })} suffix="m²" />
        </Field>
      </div>
      <div className="grid-2">
        <Field label="Villa Kat Adedi" hint="Bodrum ve çatı arası hariç">
          <Num value={v.floorsPerVilla} onChange={(n) => upd('villa', { floorsPerVilla: n })} />
        </Field>
        <Field label="Yerleşim Verimliliği" hint="Zarfın bina tabanına dönüşen kısmı">
          <Pct value={v.layoutEfficiency} onChange={(n) => upd('villa', { layoutEfficiency: n })} />
        </Field>
      </div>
      {v.grossPerVilla > 0 && v.floorsPerVilla > 0 && (
        <div className="note-box">
          Villa taban alanı: <b>{fmtM2(v.grossPerVilla / v.floorsPerVilla)}</b> ·
          Yerleşim verimliliği iç yol, otopark, bahçe ve villalar arası mesafe payını temsil eder;
          müstakil villada tipik <b>%55-70</b>, sıralı düzende <b>%70-80</b>.
        </div>
      )}
    </div>
  );
}

/* ═══ ADIM 5 — Yapım maliyeti ═══ */
export function Step5({ input, upd }: P) {
  const c = input.cost;
  const sinif = YAPI_SINIFLARI.find((s) => s.code === c.buildingClass);
  return (
    <>
      <div className="card">
        <div className="card-title">Yapı Sınıfı — 2026 Bakanlık Tebliği</div>
        <Field label="Yapı Sınıfı">
          <Sel value={c.buildingClass}
               onChange={(code) => {
                 const s = YAPI_SINIFLARI.find((x) => x.code === code);
                 upd('cost', { buildingClass: code, unitCost: s ? s.unitCost : c.unitCost });
               }}
               options={YAPI_SINIFLARI.map((s) => ({ value: s.code, label: `${s.label} — ${fmtTLm2(s.unitCost)}` }))} />
        </Field>
        {sinif && <div className="note-box">{sinif.examples}</div>}
      </div>

      <div className="card">
        <div className="card-title">Birim Maliyet</div>
        <Field label="Yapı Birim Maliyeti" hint="Tebliğ değeri otomatik gelir; piyasa koşuluna göre elle değiştirebilirsiniz.">
          <Num value={c.unitCost} onChange={(n) => upd('cost', { unitCost: n })} suffix="₺/m²" />
        </Field>
        <Field label="Enflasyon / Güncelleme Oranı" hint="Tebliğ rakamı resmî işlemler içindir; piyasa maliyeti genellikle daha yüksektir.">
          <Pct value={c.inflationRate} onChange={(n) => upd('cost', { inflationRate: n })} />
        </Field>
        <div className="note-box">
          Güncel birim maliyet: <b>{fmtTLm2(c.unitCost * (1 + c.inflationRate))}</b><br />
          Kaynak: {TEBLIG_KAYNAK}. KDV hariçtir; arsa bedeli ve altyapı dahil değildir.
        </div>
      </div>

      <div className="card">
        <div className="card-title">Alan Bazlı Maliyet Katsayıları</div>
        <div className="grid-2">
          <Field label="Bodrum Katsayısı" hint="Kaba yapı ağırlıklı">
            <Pct value={c.basementCostFactor} onChange={(n) => upd('cost', { basementCostFactor: n })} />
          </Field>
          <Field label="Çatı Arası Katsayısı" hint="Kısmi ince yapı">
            <Pct value={c.atticCostFactor} onChange={(n) => upd('cost', { atticCostFactor: n })} />
          </Field>
        </div>
        <Field label="Proje, Ruhsat, Harç ve Müşavirlik" hint="İnşaat maliyeti üzerinden oran">
          <Pct value={c.extrasRate} onChange={(n) => upd('cost', { extrasRate: n })} />
        </Field>
      </div>
    </>
  );
}

/* ═══ ADIM 6 — Çevre düzenlemesi ═══ */
export function Step6({ input, upd }: P) {
  const s = input.site;
  return (
    <>
      <div className="card">
        <div className="card-title">Peyzaj ve Çevre Düzenlemesi</div>
        <Field label="Peyzaj Alanı" hint="Boş bırakılırsa net parselden bina oturumu düşülerek otomatik hesaplanır.">
          <Num value={s.landscapeArea} onChange={(n) => upd('site', { landscapeArea: n })} suffix="m²" />
        </Field>
        <Field label="Peyzaj Birim Maliyeti" hint="Bahçe düzenlemesi, bitkilendirme, sulama — tipik 800-2.500 ₺/m²">
          <Num value={s.landscapeUnitCost} onChange={(n) => upd('site', { landscapeUnitCost: n })} suffix="₺/m²" />
        </Field>
        <Field label="Altyapı ve Çevre İşleri" hint="İç yol, otopark, çevre duvarı, altyapı bağlantıları — toplam tutar">
          <Num value={s.infrastructureCost} onChange={(n) => upd('site', { infrastructureCost: n })} suffix="₺" />
        </Field>
      </div>

      <div className="card">
        <div className="card-title">Bahçe Satış Değeri</div>
        <Field label="Bahçe m² Satış Değeri" hint="0 bırakırsanız bahçe villa m² fiyatına dahil kabul edilir.">
          <Num value={s.gardenPricePerM2} onChange={(n) => upd('site', { gardenPricePerM2: n })} suffix="₺/m²" />
        </Field>
        <div className="note-box">
          Geniş bahçeli villa projelerinde bahçeyi ayrı fiyatlamak hasılatı daha gerçekçi gösterir.
          Ayrı fiyatlamazsanız bahçenin değeri villa birim fiyatının içinde varsayılır.
        </div>
      </div>
    </>
  );
}

/* ═══ ADIM 7 — Satış ═══ */
export function Step7({ input, upd }: P) {
  return (
    <div className="card">
      <div className="card-title">Satış Bilgileri</div>
      <Field label="Villa Satış Birim Değeri" hint="Satılabilir m² başına, KDV hariç. Emsal satış araştırmasına dayanmalıdır.">
        <Num value={input.sales.unitPrice} onChange={(n) => upd('sales', { unitPrice: n })} suffix="₺/m²" />
      </Field>
      <div className="note-box">
        Satılabilir alan; villa net alanı (girilmemişse brüt) ve varsa çatı arası piyesinden oluşur.
        Toplam hasılat sonuç ekranında otomatik hesaplanır.
      </div>
    </div>
  );
}

/* ═══ ADIM 8 — Kâr ve finansman ═══ */
export function Step8({ input, upd }: P) {
  const r = input.residual;
  return (
    <>
      <div className="card">
        <div className="card-title">Müteahhit Kârı</div>
        <Field label="Kâr Oranı (hasılat üzerinden)" hint="Piyasa uygulaması %15-30 bandındadır.">
          <Pct value={r.profitRate} onChange={(n) => upd('residual', { profitRate: n })} />
        </Field>
      </div>
      <div className="card">
        <div className="card-title">Finansman</div>
        <Field label="Finansman gideri hesaba katılsın mı?">
          <Seg value={r.useFinance} onChange={(b) => upd('residual', { useFinance: b })}
               options={[{ value: false, label: 'Hayır (öz kaynak)' }, { value: true, label: 'Evet' }]} />
        </Field>
        {r.useFinance && (
          <>
            <div className="grid-2">
              <Field label="Yıllık Oran"><Pct value={r.financeRate} onChange={(n) => upd('residual', { financeRate: n })} /></Field>
              <Field label="Proje Süresi"><Num value={r.months} onChange={(n) => upd('residual', { months: n })} suffix="ay" /></Field>
            </div>
            <Field label="Ortalama Sermaye Kullanımı" hint="Maliyet zamana yayıldığı ve ön satış geliri girdiği için tipik %30-50.">
              <Pct value={r.utilization} onChange={(n) => upd('residual', { utilization: n })} />
            </Field>
          </>
        )}
      </div>
    </>
  );
}

/* ═══ ADIM 9 — Kat karşılığı ═══ */
export function Step9({ input, upd }: P) {
  return (
    <div className="card">
      <div className="card-title">Kat Karşılığı Paylaşımı</div>
      <Field label="Arsa Sahibi Payı" hint="Müteahhit payı otomatik tamamlanır.">
        <Pct value={input.share.ownerShare} onChange={(n) => upd('share', { ownerShare: n })} />
      </Field>
      <div className="note-box">
        Müteahhit payı: <b>%{((1 - input.share.ownerShare) * 100).toFixed(1)}</b><br />
        Sonuç ekranında bu oran, artık değer yöntemiyle bulunan teorik denge payıyla karşılaştırılır.
      </div>
    </div>
  );
}
