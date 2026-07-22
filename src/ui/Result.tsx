import { useState } from 'react';
import type { ProjectInput, AnalysisResult } from '../engine';
import { fmtTL, fmtTLm2, fmtM2, fmtPct, fmtNum, Row } from './fields';
import { TEBLIG_KAYNAK } from '../data/yapiSiniflari';
import { BRAND } from '../brand/brand';

const VERDICT_TEXT: Record<string, string> = {
  'yakin': 'İki yöntem birbirine yakın',
  'kat-karsiligi-yuksek': 'Kat karşılığı değeri daha yüksek',
  'gelir-yontemi-yuksek': 'Gelir yöntemi değeri daha yüksek',
};

export function Result({ input, result, version }: {
  input: ProjectInput; result: AnalysisResult; version: string;
}) {
  const { capacity: c, financial: f, share: s, advice, apartment: apt } = result;
  const p = input.parcel;
  const neg = f.residualLandValue < 0;
  const [busy, setBusy] = useState<null | 'pdf' | 'excel'>(null);
  const [err, setErr] = useState<string | null>(null);

  /** Dışa aktarma modülleri yalnızca tıklandığında yüklenir (dinamik import). */
  async function run(kind: 'pdf' | 'excel') {
    setBusy(kind); setErr(null);
    try {
      if (kind === 'pdf') {
        const { downloadPdf } = await import('../export/pdf');
        await downloadPdf(input, result, version);
      } else {
        const { downloadExcel } = await import('../export/excel');
        await downloadExcel(input, result, version);
      }
    } catch (e) {
      setErr('Dosya oluşturulamadı: ' + (e instanceof Error ? e.message : 'bilinmeyen hata'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="card no-print">
        <div className="card-title">Raporu İndir</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-sm" style={{ flex: 1 }} disabled={busy !== null}
                  onClick={() => run('pdf')}>
            {busy === 'pdf' ? 'Hazırlanıyor…' : 'PDF İndir'}
          </button>
          <button className="btn btn-accent btn-sm" style={{ flex: 1 }} disabled={busy !== null}
                  onClick={() => run('excel')}>
            {busy === 'excel' ? 'Hazırlanıyor…' : 'Excel İndir'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>Yazdır</button>
        </div>
        {err && <div className="hint" style={{ color: 'var(--red)', marginTop: 8 }}>{err}</div>}
      </div>

      <div className="card">
        <div className="card-title">Taşınmaz</div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>
          {p.il} / {p.ilce}{p.mahalle ? ` · ${p.mahalle} Mah.` : ''}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>
          Ada {p.ada || '—'} · Parsel {p.parsel || '—'} · {fmtM2(p.area)} · {input.zoning.lejant || 'Lejant girilmedi'}
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi hero">
          <div className="kpi-label">Artık Arsa Değeri (Residual Land Value)</div>
          <div className="kpi-value" style={neg ? { color: '#ff9c94' } : undefined}>{fmtTL(f.residualLandValue)}</div>
          <div className="kpi-sub">Arsa birim değeri: <b>{fmtTLm2(f.landUnitValue)}</b> (tapu alanı üzerinden)</div>
        </div>
        {apt ? (
          <div className="kpi"><div className="kpi-label">Kat Adedi</div>
            <div className="kpi-value">{apt.floors.length}</div></div>
        ) : (
          <div className="kpi"><div className="kpi-label">Villa Adedi</div>
            <div className="kpi-value">{c.unitCount > 0 ? c.unitCount : '—'}</div></div>
        )}
        <div className="kpi"><div className="kpi-label">Toplam İnşaat Alanı</div><div className="kpi-value">{fmtM2(c.totalArea)}</div></div>
        {apt ? (
          <div className="kpi"><div className="kpi-label">Satılabilir Alan</div><div className="kpi-value">{fmtM2(apt.saleableTotal)}</div></div>
        ) : (
          <div className="kpi"><div className="kpi-label">Emsale Dahil Alan</div><div className="kpi-value">{fmtM2(c.emsalArea)}</div></div>
        )}
        <div className="kpi"><div className="kpi-label">Bahçe Alanı</div><div className="kpi-value">{fmtM2(c.gardenArea)}</div></div>
      </div>

      {apt ? (
      <div className="card">
        <div className="card-title">Kapasite ve Kat Tablosu</div>
        <Row label="Parsel Alanı (tapu)" value={fmtM2(p.area)} />
        <Row label="Net Parsel Alanı" value={fmtM2(p.netArea)} />
        <Row label="Hesap Yöntemi" value={apt.mode === 'taks-kaks' ? 'TAKS / KAKS' : 'Doğrudan Alan'} />
        {apt.mode === 'taks-kaks' && (
          <>
            <Row label="TAKS / KAKS" value={`${input.zoning.taks != null ? fmtNum(input.zoning.taks) : '—'} / ${input.zoning.kaks != null ? fmtNum(input.zoning.kaks) : '—'}`} />
            {input.zoning.hmax != null && <Row label="Hmax" value={`${input.zoning.hmax} m`} />}
            <Row label="Taban Oturumu Limiti" value={fmtM2(apt.footprintArea)} />
            {apt.extraSaleableArea > 0 && <Row label="İlave Satılabilir Alan (emsal dışı)" value={fmtM2(apt.extraSaleableArea)} />}
          </>
        )}
        <div className="floor-table floor-result" style={{ marginTop: 12 }}>
          <div className="floor-head">
            <span>Kat Bilgisi</span><span>Kat Alanı</span><span>Satılabilir Alan</span>
          </div>
          {apt.floors.map((fl) => (
            <div className="floor-row" key={`${fl.kind}-${fl.index}`}>
              <span className="floor-label">{fl.label}</span>
              <span className="floor-cell">{fmtM2(fl.area)}</span>
              <span className="floor-cell">{fl.kind === 'bodrum' && input.apartment.basements[fl.index - 1]?.use === 'ortak' ? 'ortak mahal' : fmtM2(fl.saleable)}</span>
            </div>
          ))}
          <div className="floor-row floor-total">
            <span className="floor-label">TOPLAM</span>
            <span className="floor-cell"><b>{fmtM2(apt.totalArea)}</b></span>
            <span className="floor-cell"><b>{fmtM2(apt.saleableTotal)}</b></span>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <Row label="Bahçe / Açık Alan" value={fmtM2(apt.gardenArea)} />
        </div>
      </div>
      ) : (
      <div className="card">
        <div className="card-title">Kapasite ve İmar</div>
        <Row label="Parsel Alanı (tapu)" value={fmtM2(p.area)} />
        <Row label="Net Parsel Alanı" value={fmtM2(p.netArea)} />
        <Row label="TAKS / KAKS" value={`${input.zoning.taks != null ? fmtNum(input.zoning.taks) : '—'} / ${input.zoning.kaks != null ? fmtNum(input.zoning.kaks) : '—'}`} />
        <Row label="Taban Oturumu" value={fmtM2(c.footprintArea)} />
        <Row label="Emsale Dahil Alan" value={fmtM2(c.emsalArea)} />
        {c.extraArea > 0 && <Row label="Emsal Dışı Satılabilir Alan" value={fmtM2(c.extraArea)} />}
        {c.atticArea > 0 && (
          <Row label={`Çatı Katı (${input.emsal.atticInEmsal ? 'emsale dahil' : 'emsal dışı'})`} value={fmtM2(c.atticArea)} />
        )}
        {c.basementArea > 0 && (
          <Row label={`Bodrum Kat (${input.emsal.basementInEmsal ? 'emsale dahil' : 'emsal dışı'})`} value={fmtM2(c.basementArea)} />
        )}
        {c.emsalConsumedByExtras > 0 && (
          <Row label="Emsalden Kullanılan (çatı/bodrum)" value={fmtM2(c.emsalConsumedByExtras)} tone="neg" />
        )}
        <Row label="Zemin Üstü Katlara Kalan" value={fmtM2(c.aboveGroundArea)} />
        <Row label="TOPLAM İNŞAAT ALANI" value={fmtM2(c.totalArea)} tone="total" />
        <Row label="Bahçe / Açık Alan" value={fmtM2(c.gardenArea)} />
        {c.unitCount > 0 && <Row label="Villa Adedi" value={`${c.unitCount} adet`} />}
        {c.unitCount > 0 && <Row label="Villa Başına Toplam Alan" value={fmtM2(c.areaPerUnit)} />}
        <Row label="Zemin Üstü Kat Adedi" value={`${c.floorsAboveGround} (kat başına ${fmtM2(c.areaPerFloor)})`} />
      </div>
      )}

      <div className="card">
        <div className="card-title">Fizibilite</div>
        <Row label="Yapı Sınıfı" value={input.cost.buildingClass} />
        <Row label="Birim Maliyet (güncel)" value={fmtTLm2(f.effectiveUnitCost)} />
        <Row label="İnşaat Maliyeti" value={fmtTL(f.constructionCost)} />
        {f.landscapeCost > 0 && <Row label="Peyzaj ve Bahçe Düzenlemesi" value={fmtTL(f.landscapeCost)} />}
        {f.extrasCost > 0 && <Row label="Proje, Ruhsat, Harç, Müşavirlik" value={fmtTL(f.extrasCost)} />}
        {f.financeCost > 0 && <Row label="Finansman Gideri" value={fmtTL(f.financeCost)} />}
        <Row label="Toplam Yapım Maliyeti" value={fmtTL(f.totalCost)} tone="neg" />
        {apt ? (
          <>
            {apt.saleableByKind.bodrum > 0 && (
              <Row label="Bodrum Satış Birim Değeri" value={fmtTLm2(input.sales.apt.bodrum)} />
            )}
            <Row label="Zemin Kat Satış Birim Değeri" value={fmtTLm2(input.sales.apt.zemin)} />
            <Row label="Normal Kat Satış Birim Değeri" value={fmtTLm2(input.sales.apt.normal)} />
            {apt.saleableByKind.piyes > 0 && (
              <Row label="Piyes Satış Birim Değeri" value={fmtTLm2(input.sales.apt.piyes)} />
            )}
          </>
        ) : (
          <Row label="Satış Birim Değeri" value={fmtTLm2(input.sales.unitPrice)} />
        )}
        <Row label="Yapı Satış Hasılatı" value={fmtTL(f.buildingRevenue)} />
        {f.gardenRevenue > 0 && <Row label="Bahçe Satış Hasılatı" value={fmtTL(f.gardenRevenue)} />}
        <Row label="Toplam Satış Hasılatı" value={fmtTL(f.revenue)} tone="pos" />
        <Row label={`Müteahhit Kârı (${fmtPct(input.residual.profitRate, 0)})`} value={fmtTL(f.developerProfit)} tone="neg" />
        <Row label="ARTIK ARSA DEĞERİ" value={fmtTL(f.residualLandValue)} tone="total" />
        <Row label="Arsa m² Birim Değeri" value={fmtTLm2(f.landUnitValue)} />
        <Row label="Arsa Değeri / Hasılat" value={fmtPct(f.landToRevenue)} />
      </div>

      {input.share.enabled && (
      <div className="card">
        <div className="card-title">Arsa Değeri — Yöntem Karşılaştırması</div>
        <Row label={`Arsa Sahibi Payı (%${(s.ownerShare * 100).toFixed(0)})`}
             value={`${s.ownerUnits > 0 ? fmtNum(s.ownerUnits, 1) + ' villa · ' : ''}${fmtM2(s.ownerArea)}`} />
        <Row label={`Müteahhit Payı (%${(s.contractorShare * 100).toFixed(0)})`}
             value={`${s.contractorUnits > 0 ? fmtNum(s.contractorUnits, 1) + ' villa · ' : ''}${fmtM2(s.contractorArea)}`} />
        <Row label="Kat Karşılığı Yöntemine Göre Arsa Değeri" value={fmtTL(s.shareLandValue)} />
        <Row label="Gelir Yöntemine Göre Arsa Değeri" value={fmtTL(f.residualLandValue)} />
        <Row label="İki Yöntem Arasındaki Fark"
             value={`${fmtTL(Math.abs(s.difference))} (${fmtPct(Math.abs(s.differenceRate))})`} tone="total" />
        <Row label="Gelir Yöntemine Denk Gelen Arsa Payı" value={fmtPct(s.balancedShare)} />
        <div style={{ marginTop: 10 }}>
          <span className={`badge ${s.verdict === 'yakin' ? 'badge-green' : 'badge-navy'}`}>
            {VERDICT_TEXT[s.verdict]}
          </span>
        </div>
        <div className="hint" style={{ marginTop: 8 }}>
          İki yöntem farklı varsayımlardan hareket ettiği için sonuçları ayrışabilir; bu bölüm karşılaştırma amaçlıdır.
        </div>
      </div>
      )}

      <div className="card">
        <div className="card-title">Uzman Değerlendirmesi</div>
        {advice.map((a, i) => (
          <div key={i} className={`advice ${a.level}`}>
            <div className="advice-title">{a.title}</div>
            <div className="advice-body">{a.body}</div>
          </div>
        ))}
      </div>

      {input.zoning.planNotes.trim() && (
        <div className="card">
          <div className="card-title">Plan Notları</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>{input.zoning.planNotes}</div>
        </div>
      )}

      <div className="card">
        <div className="card-title">Yöntem ve Kaynak</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6 }}>
          Değerleme yaklaşımı: <b>Artık Değer (Residual Land Value)</b> — Hasılat − Toplam Maliyet − Müteahhit Kârı.
          Tüm tutarlar KDV hariçtir. Birim maliyet kaynağı: {TEBLIG_KAYNAK}.
          {apt ? (
            <> Kat tablosu, imar hakları ve girilen kayıp/ortak mahal oranları üzerinden üretilmiş bir <b>tahmindir</b>;
            kesin kat kurgusu mimari avan projeyle belirlenir.</>
          ) : (
            <> Villa adedi, yapılaşma zarfı ve yerleşim verimliliği üzerinden üretilmiş bir <b>tahmindir</b>;
            kesin adet mimari avan projeyle belirlenir.</>
          )}
          {' '}Satış fiyatı, kâr ve finansman varsayımları kullanıcıya aittir.
        </div>
      </div>

      <div className="brand-footer">
        <img src={`${import.meta.env.BASE_URL}dora-logo.png`} alt={BRAND.company} />
        <div>
          <b>{BRAND.preparedBy}</b><br />
          {BRAND.authorLine} · {BRAND.appName} {version}
        </div>
      </div>
    </>
  );
}
