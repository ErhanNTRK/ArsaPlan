/**
 * 3-8 KATLI BİNA — ADIM BİLEŞENLERİ
 *
 * Kat tablosu davranışı (Salih'in kilitlediği kurallar):
 *  · TAKS/KAKS: değerler gizli havuzdan otomatik türetilir; her hücre elle
 *    değiştirilebilir. Elle girilen SABİT kalır, "otomatik" bağlantısıyla geri döner.
 *  · Doğrudan Alan: 1. Normal Kat'a girilen değer diğer normal katlara kopyalanır;
 *    her satır tek tek düzenlenebilir.
 */
import type { ProjectInput, ApartmentInput, AptFloor } from '../engine';
import { computeApartment, floorsFromHmax } from '../engine';
import { LEJANTLAR } from '../data/yapiSiniflari';
import { Field, Txt, Num, Pct, Sel, Seg, fmtM2, fmtTL } from './fields';
import type { Upd, SetTop } from './Steps';
import { LOC } from '../i18n';
import { inwardOffset, polygonArea } from '../geo/kml';

interface P { input: ProjectInput; upd: Upd; setTop: SetTop; karma?: boolean; }

/* Kat satırı → ApartmentInput içindeki override yuvası */
function patchFloor(
  apt: ApartmentInput, f: AptFloor, col: 'area' | 'saleable', value: number | null,
): Partial<ApartmentInput> {
  if (f.kind === 'bodrum') {
    const basements = apt.basements.map((b, i) =>
      i === f.index - 1 ? { ...b, [col]: value } : b);
    return { basements };
  }
  if (f.kind === 'zemin') {
    return col === 'area' ? { zeminArea: value } : { zeminSaleable: value };
  }
  if (f.kind === 'asma') {
    const key = col === 'area' ? 'asmaAreas' : 'asmaSaleables';
    const arr = [...apt[key]];
    arr[f.index - 1] = value;
    return { [key]: arr };
  }
  if (f.kind === 'normal') {
    const key = col === 'area' ? 'normalAreas' : 'normalSaleables';
    const arr = [...apt[key]];
    arr[f.index - 1] = value;
    return { [key]: arr };
  }
  return col === 'area' ? { piyesArea: value } : { piyesSaleable: value };
}

/** Otomatik değere dönüş bağlantısı gösterilsin mi? */
function canReset(mode: 'taks-kaks' | 'dogrudan', f: AptFloor, auto: boolean): boolean {
  if (auto) return false;
  if (mode === 'taks-kaks') return true;
  /* doğrudan modda: kopyalanan normal satırlar + öneriden türeyen asma satırları */
  return (f.kind === 'normal' && f.index > 1) || f.kind === 'asma';
}

export function Step3Apartment({ input, upd, karma = false }: P) {
  const z = input.zoning;
  const a = input.apartment;
  const c = computeApartment(input.parcel, z, a, karma ? 'karma' : 'konut');
  const taksKaks = z.mode === 'taks-kaks';
  const lejantOther = z.lejant === ' ' || (z.lejant !== '' && !LEJANTLAR.includes(z.lejant));
  const derived = floorsFromHmax(z.hmax);
  const setApt = (patch: Partial<ApartmentInput>) => upd('apartment', patch);

  return (
    <div className="cols">
      {/* ── 1 · İMAR DURUMU ── */}
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
               options={[{ value: 'taks-kaks', label: 'TAKS / KAKS' }, { value: 'dogrudan', label: 'Doğrudan Alan' }]} />
        </Field>
        {taksKaks ? (
          <>
            <div className="grid-3">
              <Field label="TAKS"><Num value={z.taks ?? 0} onChange={(val) => upd('zoning', { taks: val || null })} step="0.01" /></Field>
              <Field label="KAKS" error={z.kaks == null ? 'Zorunlu: emsal değerini giriniz.' : null}><Num value={z.kaks ?? 0} onChange={(val) => upd('zoning', { kaks: val || null })} step="0.01" /></Field>
            {(() => {
              const k = input.parcel.kml;
              if (!k || k.setback <= 0 || z.mode !== 'taks-kaks' || !z.taks) return null;
              const inner = inwardOffset(k.points, k.setback);
              if (!inner) return null;
              const base = (input.parcel.netArea || input.parcel.area);
              const taksFoot = base * z.taks;
              const setFoot = polygonArea(inner);
              if (setFoot >= taksFoot) return (
                <div className="note-box" style={{ marginTop: 10 }}>
                  Çekme kontrolü: çekme sonrası oturum <b>{setFoot.toLocaleString(LOC(), { maximumFractionDigits: 0 })} m²</b> ≥
                  TAKS oturumu <b>{taksFoot.toLocaleString(LOC(), { maximumFractionDigits: 0 })} m²</b> — belirleyici olan TAKS'tır.
                </div>
              );
              return (
                <div className="warn-box" style={{ marginTop: 10 }}>
                  ⚠ Çekme kontrolü: çekme sonrası oturabilir alan <b>{setFoot.toLocaleString(LOC(), { maximumFractionDigits: 0 })} m²</b>,
                  TAKS oturumundan (<b>{taksFoot.toLocaleString(LOC(), { maximumFractionDigits: 0 })} m²</b>) küçük.
                  Fiili taban oturumu çekme mesafeleriyle sınırlı olabilir; kat alanlarını buna göre gözden geçirin.
                  (Bilgi amaçlıdır; hesap motoru TAKS değerini kullanır.)
                </div>
              );
            })()}
              <Field label="Hmax"><Num value={z.hmax ?? 0} onChange={(val) => upd('zoning', { hmax: val || null })} suffix="m" /></Field>
            </div>
            <div className="mini-kpi">
              <div><span>Taban oturumu limiti</span><b>{fmtM2(c.footprintArea)}</b></div>
              <div><span>Emsale dahil alan</span><b>{fmtM2(c.emsalArea)}</b></div>
            </div>
            {derived != null && (
              <div className="note-box" style={{ marginTop: 8 }}>
                Hmax {z.hmax} m → zemin dahil <b>{derived} kat</b> (zemin + {derived - 1} normal kat).
                Bodrum katlar ve çatı arası piyesi bu sayıya dahil değildir.
              </div>
            )}
          </>
        ) : (
          <div className="note-box">
            Doğrudan Alan yönteminde kat alanları ve satılabilir alanlar aşağıdaki
            kat tablosuna elle girilir; imar katsayısı kullanılmaz.
          </div>
        )}
      </div>

      {/* ── 2 · İLAVE SATILABİLİR ALAN (yalnızca TAKS/KAKS) ── */}
      {taksKaks && (
        <div className="card">
          <div className="card-title">2 · İlave Satılabilir Alan</div>
          <Field label="Emsale dahil olmayan satılabilir alan var mı?"
                 hint="Tip İmar Yönetmeliği gereği emsal dışı kalan ancak satılabilen alanlar">
            <Seg value={a.hasExtraSaleable} onChange={(b) => setApt({ hasExtraSaleable: b })}
                 options={[{ value: false, label: 'Yok' }, { value: true, label: 'Var' }]} />
          </Field>
          {a.hasExtraSaleable && (
            <>
              <Field label="Nasıl hesaplansın?">
                <Seg value={a.extraMode} onChange={(m) => setApt({ extraMode: m })}
                     options={[{ value: 'oran', label: 'Emsalin yüzdesi' }, { value: 'manuel', label: 'Elle giriş' }]} />
              </Field>
              {a.extraMode === 'oran' ? (
                <Field label="Oran" hint={`Emsale dahil alanın yüzdesi · ${fmtM2(c.emsalArea)} üzerinden`}>
                  <Pct value={a.extraRate} onChange={(n) => setApt({ extraRate: n })} />
                </Field>
              ) : (
                <Field label="Alan"><Num value={a.extraArea} onChange={(n) => setApt({ extraArea: n })} suffix="m²" /></Field>
              )}
              <div className="note-box">İlave satılabilir alan: <b>{fmtM2(c.extraSaleableArea)}</b></div>
            </>
          )}
        </div>
      )}

      {/* ── 3 · KAT KURGUSU ── */}
      <div className="card">
        <div className="card-title">{taksKaks ? '3' : '2'} · Kat Kurgusu</div>

        <Field label="Bodrum Kat Sayısı">
          <Seg value={String(Math.min(4, Math.max(0, a.basementCount))) as '0' | '1' | '2' | '3' | '4'}
               onChange={(v) => setApt({ basementCount: Number(v) })}
               options={[
                 { value: '0', label: 'Yok' }, { value: '1', label: '1' }, { value: '2', label: '2' },
                 { value: '3', label: '3' }, { value: '4', label: '4' },
               ]} />
        </Field>
        {Array.from({ length: Math.min(4, Math.max(0, a.basementCount)) }, (_, i) => (
          <div className="grid-2" key={i}>
            <Field label={`${i + 1}. Bodrum — Kullanım`}>
              <Sel value={a.basements[i].use}
                   onChange={(u) => setApt({
                     basements: a.basements.map((b, k) => k === i ? { ...b, use: u } : b),
                   })}
                   options={karma ? [
                     { value: 'ortak', label: 'Ortak mahal (otopark vb.)' },
                     { value: 'ticari', label: 'Ticari (satılabilir)' },
                     { value: 'konut', label: 'Konut (satılabilir)' },
                   ] : [
                     { value: 'konut', label: 'Konut (satılabilir)' },
                     { value: 'ortak', label: 'Ortak mahal (otopark vb.)' },
                   ]} />
            </Field>
            {taksKaks && a.basements[i].use !== 'ortak' ? (
              <Field label="Alan Kaybı" hint="Satılabilir = alan × (1 − oran)">
                <Pct value={a.basements[i].lossRate}
                     onChange={(n) => setApt({
                       basements: a.basements.map((b, k) => k === i ? { ...b, lossRate: n } : b),
                     })} />
              </Field>
            ) : <div />}
          </div>
        ))}

        {taksKaks && (
          <div className="grid-2">
            <Field label={'Zemin Kat Alan Kaybı \u24D8'}
                   hint={(() => {
                     const zf = c.floors.find((f) => f.kind === 'zemin');
                     const base = 'Bina girişi, kapıcı dairesi, sığınak koridoru gibi satılamayan kısımların payı (genelde %10-20).';
                     if (!zf || zf.area <= 0) return base;
                     return `${base} Bu katta: ${fmtM2(zf.area)} kat alanının %${(a.zeminLossRate * 100).toFixed(0)}'ı düşer → satılabilir ${fmtM2(zf.saleable)}.`;
                   })()}>
              <Pct value={a.zeminLossRate} onChange={(n) => setApt({ zeminLossRate: n })} />
            </Field>
            <Field label={'Normal Kat Ortak Mahal Payı \u24D8'}
                   hint={(() => {
                     const nf = c.floors.find((f) => f.kind === 'normal');
                     const base = 'Merdiven, asansör ve kat holü payı (genelde %15-25); satılabilir daire alanının üstüne eklenir.';
                     if (!nf || nf.saleable <= 0) return base;
                     return `${base} Bu projede: ${fmtM2(nf.saleable)} satılabilir alana %${(a.normalCommonRate * 100).toFixed(0)} eklenir → kat alanı ${fmtM2(nf.area)}.`;
                   })()}>
              <Pct value={a.normalCommonRate} onChange={(n) => setApt({ normalCommonRate: n })} />
            </Field>
          </div>
        )}

        <Field label="Normal Kat Sayısı"
               hint={taksKaks && derived != null
                 ? `Hmax'tan otomatik: ${derived - 1} normal kat · elle değiştirilebilir, üst sınır yoktur`
                 : 'Üst sınır yoktur'}>
          <Num value={c.normalFloorCount}
               onChange={(v) => setApt({ normalCount: v > 0 ? Math.round(v) : null })} suffix="kat" />
        </Field>
        {taksKaks && a.normalCount != null && derived != null && a.normalCount !== derived - 1 && (
          <button type="button" className="link-btn" onClick={() => setApt({ normalCount: null })}>
            Hmax türetimine dön ({derived - 1} normal kat)
          </button>
        )}

        {karma && (
          <>
            <Field label="Asma Kat var mı?"
                   hint="Zemin katın ticari uzantısı · genelde 1 adet olur">
              <Seg value={a.asmaCount > 0} onChange={(b) => setApt({ asmaCount: b ? 1 : 0 })}
                   options={[{ value: false, label: 'Yok' }, { value: true, label: 'Var' }]} />
            </Field>
            {a.asmaCount > 0 && (
              <div className="grid-2">
                <Field label="Asma Kat Sayısı">
                  <Num value={a.asmaCount}
                       onChange={(n) => setApt({ asmaCount: Math.max(1, Math.round(n)) })} suffix="adet" />
                </Field>
                {taksKaks ? (
                  <Field label="Emsale dahil mi?"
                         hint="Dahilse satılabilir alan hakkından düşülür; değilse üstüne eklenir.">
                    <Seg value={a.asmaInEmsal} onChange={(b) => setApt({ asmaInEmsal: b })}
                         options={[{ value: true, label: 'Evet' }, { value: false, label: 'Hayır' }]} />
                  </Field>
                ) : <div />}
              </div>
            )}
            {a.asmaCount > 0 && (
              <div className="note-box" style={{ marginBottom: 10 }}>
                Asma kat alanı zemin katın <b>%{(a.asmaRate * 100).toFixed(0)}</b>'ı olarak önerilir;
                kat tablosundan elle değiştirilebilir. Ortak mahal ve kayıp uygulanmaz:
                satılabilir alan = kat alanı.
              </div>
            )}
          </>
        )}
        <Field label="Çatı Arası Piyesi var mı?">
          <Seg value={a.hasPiyes} onChange={(b) => setApt({ hasPiyes: b })}
               options={[{ value: false, label: 'Yok' }, { value: true, label: 'Var' }]} />
        </Field>
        {a.hasPiyes && taksKaks && (
          <div className="grid-2">
            <Field label="Emsale dahil mi?"
                   hint="Dahilse satılabilir alan hakkından pay alır; değilse toplamın üstüne eklenir.">
              <Seg value={a.piyesInEmsal} onChange={(b) => setApt({ piyesInEmsal: b })}
                   options={[{ value: true, label: 'Evet' }, { value: false, label: 'Hayır' }]} />
            </Field>
            <Field label="Piyes Oranı" hint="Normal kat satılabilir alanının yüzdesi">
              <Pct value={a.piyesRate} onChange={(n) => setApt({ piyesRate: n })} />
            </Field>
          </div>
        )}
      </div>

      {/* ── KAT TABLOSU ── */}
      <div className="card">
        <div className="card-title">{taksKaks ? '4' : '3'} · Kat Tablosu</div>
        {taksKaks ? (
          <div className="hint" style={{ marginBottom: 10 }}>
            Değerler imar haklarından otomatik türetilmiştir; her hücre elle değiştirilebilir.
            Elle girilenler sabit kalır, kalan alan otomatik satırlara dağıtılır.
          </div>
        ) : (
          <div className="hint" style={{ marginBottom: 10 }}>
            1. Normal Kat'a girilen değerler diğer normal katlara kopyalanır; her satır tek tek düzenlenebilir.
          </div>
        )}
        <div className="floor-table">
          <div className="floor-head">
            <span>Kat Bilgisi</span><span>Kat Alanı</span><span>Satılabilir Alan</span>
          </div>
          {c.floors.map((f) => {
            const ortak = f.kind === 'bodrum' && a.basements[f.index - 1]?.use === 'ortak';
            return (
              <div className="floor-row" key={`${f.kind}-${f.index}`}>
                <span className="floor-label">{f.label}</span>
                <span className="floor-cell">
                  <Num value={f.area}
                       onChange={(n) => setApt(patchFloor(a, f, 'area', n))} suffix="m²" />
                  {canReset(z.mode, f, f.autoArea) && (
                    <button type="button" className="cell-reset" title="Otomatik değere dön"
                            onClick={() => setApt(patchFloor(a, f, 'area', null))}>↺</button>
                  )}
                </span>
                <span className="floor-cell">
                  {ortak ? (
                    <span className="floor-fixed">0 m² · ortak mahal</span>
                  ) : (
                    <>
                      <Num value={f.saleable}
                           onChange={(n) => setApt(patchFloor(a, f, 'saleable', n))} suffix="m²" />
                      {canReset(z.mode, f, f.autoSaleable) && (
                        <button type="button" className="cell-reset" title="Otomatik değere dön"
                                onClick={() => setApt(patchFloor(a, f, 'saleable', null))}>↺</button>
                      )}
                    </>
                  )}
                </span>
              </div>
            );
          })}
          <div className="floor-row floor-total">
            <span className="floor-label">TOPLAM</span>
            <span className="floor-cell"><b>{fmtM2(c.totalArea)}</b></span>
            <span className="floor-cell"><b>{fmtM2(c.saleableTotal)}</b></span>
          </div>
        </div>
        {c.warnings.map((w, i) => (
          <div className="leftover" style={{ marginTop: 8 }} key={i}>{w}</div>
        ))}
        {taksKaks && c.poolRemainder > 0.5 && (
          <div className="leftover" style={{ marginTop: 8 }}>
            Elle girişler nedeniyle <b>{fmtM2(c.poolRemainder)}</b> satılabilir alan hakkı dağıtılmadı.
          </div>
        )}
      </div>

      {/* ── ÖZET ── */}
      <div className="card result-preview">
        <div className="card-title">Alan Özeti</div>
        <div className="mini-kpi">
          <div><span>Toplam inşaat alanı</span><b>{fmtM2(c.totalArea)}</b></div>
          <div><span>Toplam satılabilir alan</span><b>{fmtM2(c.saleableTotal)}</b></div>
        </div>
        <div className="mini-kpi" style={{ marginTop: 8 }}>
          <div><span>Bahçe / açık alan</span><b>{fmtM2(c.gardenArea)}</b></div>
          <div><span>Kat adedi</span><b>{c.floors.length}</b></div>
        </div>
        {c.totalArea > 0 && (c.areaByKind.bodrum + c.areaByKind.piyes) / c.totalArea > 0.35 && (
          <div className="leftover" style={{ marginTop: 10 }}>
            Toplam alanın <b>%{(((c.areaByKind.bodrum + c.areaByKind.piyes) / c.totalArea) * 100).toFixed(0)}</b>'i
            bodrum ve çatı arası piyesidir. Bu katlar normal katlarla aynı m² değerinde satılmaz;
            birim satış fiyatlarını belirlerken bu kompozisyonu dikkate alınız. <i>(Bu not rapora yazılmaz.)</i>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">Plan Notları (opsiyonel)</div>
        <textarea value={z.planNotes} onChange={(ev) => upd('zoning', { planNotes: ev.target.value })}
                  placeholder="Emsal istisnaları, çıkma ve piyes kuralları — raporda aynen görünür." />
      </div>
    </div>
  );
}

/** Adım 4 — Satış kartı (kat tipine göre birim değerler) */
export function ApartmentSalesCard({ input, upd, karma = false }: P) {
  const s = input.sales.apt;
  const c = computeApartment(input.parcel, input.zoning, input.apartment, karma ? 'karma' : 'konut');
  const setApt = (patch: Partial<typeof s>) => upd('sales', { apt: { ...s, ...patch } });
  const bodrumGelir = karma
    ? c.bodrumSaleableByUse.konut * s.bodrum + c.bodrumSaleableByUse.ticari * s.bodrumTicari
    : c.saleableByKind.bodrum * s.bodrum;
  const gelir =
    bodrumGelir + c.saleableByKind.zemin * s.zemin + c.saleableByKind.asma * s.asma +
    c.saleableByKind.normal * s.normal + c.saleableByKind.piyes * s.piyes;

  return (
    <div className="card">
      <div className="card-title">Satış — Kat Tipine Göre Birim Değerler</div>
      <div className="hint" style={{ marginBottom: 10 }}>
        Satılabilir m² başına, KDV hariç. Normal katlar için tek ortalama değer girilir.
      </div>
      {karma ? (
        <>
          {c.bodrumSaleableByUse.ticari > 0 && (
            <Field label="Bodrum Kat (ticari)" hint={`Satılabilir ${fmtM2(c.bodrumSaleableByUse.ticari)}`}>
              <Num value={s.bodrumTicari} onChange={(n) => setApt({ bodrumTicari: n })} suffix="₺/m²" />
            </Field>
          )}
          {c.bodrumSaleableByUse.konut > 0 && (
            <Field label="Bodrum Kat (konut)" hint={`Satılabilir ${fmtM2(c.bodrumSaleableByUse.konut)}`}>
              <Num value={s.bodrum} onChange={(n) => setApt({ bodrum: n })} suffix="₺/m²" />
            </Field>
          )}
        </>
      ) : c.saleableByKind.bodrum > 0 && (
        <Field label="Bodrum Kat" hint={`Satılabilir ${fmtM2(c.saleableByKind.bodrum)}`}>
          <Num value={s.bodrum} onChange={(n) => setApt({ bodrum: n })} suffix="₺/m²" />
        </Field>
      )}
      <Field label={karma ? 'Zemin Kat (ticari)' : 'Zemin Kat'} hint={`Satılabilir ${fmtM2(c.saleableByKind.zemin)}`}>
        <Num value={s.zemin} onChange={(n) => setApt({ zemin: n })} suffix="₺/m²" />
      </Field>
      {karma && c.saleableByKind.asma > 0 && (
        <Field label="Asma Kat (ticari)" hint={`Satılabilir ${fmtM2(c.saleableByKind.asma)}`}>
          <Num value={s.asma} onChange={(n) => setApt({ asma: n })} suffix="₺/m²" />
        </Field>
      )}
      <Field label="Normal Kat (ortalama)" hint={`Satılabilir ${fmtM2(c.saleableByKind.normal)}`}>
        <Num value={s.normal} onChange={(n) => setApt({ normal: n })} suffix="₺/m²" />
      </Field>
      {input.apartment.hasPiyes && (
        <Field label="Çatı Arası Piyesi"
               hint={`Satılabilir ${fmtM2(c.saleableByKind.piyes)} · manzaraya göre normal kattan yüksek veya düşük olabilir`}>
          <Num value={s.piyes} onChange={(n) => setApt({ piyes: n })} suffix="₺/m²" />
        </Field>
      )}
      {gelir > 0 && (
        <div className="note-box">Yapı satış hasılatı: <b>{fmtTL(gelir)}</b></div>
      )}
    </div>
  );
}
