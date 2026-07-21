import { useState } from 'react';
import type { ProjectInput, AnalysisResult } from '../engine';
import { fmtTL, fmtTLm2, fmtM2, fmtPct, fmtNum, Row } from './fields';
import { TEBLIG_KAYNAK } from '../data/yapiSiniflari';

const BINDING_TEXT: Record<string, string> = {
  'TAKS': 'Taban alanı katsayısı (TAKS)',
  'KAKS': 'Emsal (KAKS)',
  'ÇEKME MESAFESİ': 'Çekme mesafeleri / yerleşim zarfı',
  'DOĞRUDAN TABAN': 'Doğrudan girilen taban oturumu',
  'DOĞRUDAN İNŞAAT ALANI': 'Doğrudan girilen inşaat alanı',
  'YOK': 'Belirlenemedi',
};

export function Result({ input, result, version }: {
  input: ProjectInput; result: AnalysisResult; version: string;
}) {
  const { capacity: c, financial: f, share: s, advice } = result;
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
        <div className="kpi"><div className="kpi-label">Villa Adedi</div>
          <div className="kpi-value">{c.unitCount}
            {c.unitCountRange[0] !== c.unitCountRange[1] && (
              <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}> ({c.unitCountRange[0]}–{c.unitCountRange[1]})</span>
            )}
          </div>
        </div>
        <div className="kpi"><div className="kpi-label">Toplam İnşaat Alanı</div><div className="kpi-value">{fmtM2(c.grossArea)}</div></div>
        <div className="kpi"><div className="kpi-label">Satılabilir Alan</div><div className="kpi-value">{fmtM2(c.saleableArea)}</div></div>
        <div className="kpi"><div className="kpi-label">Emsal Kullanımı</div>
          <div className="kpi-value">{c.emsalUsage != null ? fmtPct(c.emsalUsage, 0) : '–'}</div></div>
      </div>

      <div className="card">
        <div className="card-title">Kapasite ve İmar</div>
        <Row label="Parsel Alanı (tapu)" value={fmtM2(p.area)} />
        <Row label="Net Parsel Alanı" value={fmtM2(p.netArea)} />
        <Row label="TAKS / KAKS" value={`${input.zoning.taks != null ? fmtNum(input.zoning.taks) : '—'} / ${input.zoning.kaks != null ? fmtNum(input.zoning.kaks) : '—'}`} />
        {c.envelope.hasGeometry && (
          <Row label="Yapılaşma Zarfı" value={`${fmtNum(c.envelope.buildableWidth, 1)} × ${fmtNum(c.envelope.buildableDepth, 1)} m = ${fmtM2(c.envelope.envelopeArea)}`} />
        )}
        {c.taksLimit != null && <Row label="TAKS'a Göre Taban Alanı" value={fmtM2(c.taksLimit)} />}
        {c.envelope.hasGeometry && <Row label="Yerleşim Sonrası Kullanılabilir Taban" value={fmtM2(c.layoutFootprint)} />}
        <Row label="Fiili Taban Alanı" value={fmtM2(c.effectiveFootprint)} />
        <Row label="Villa Başına Taban" value={fmtM2(c.footprintPerUnit)} />
        {c.kaksLimit != null && <Row label="KAKS'a Göre Emsal Hakkı" value={fmtM2(c.kaksLimit)} />}
        <Row label="Emsale Konu Alan" value={fmtM2(c.emsalArea)} />
        <Row label="Villa Başına Zemin Üstü Brüt" value={fmtM2(c.grossPerVilla)} />
        {c.basementArea > 0 && (
          <Row label={`Bodrum — ${c.unitCount} × ${fmtM2(c.basementArea / Math.max(1, c.unitCount))} (${input.emsal.basementInEmsal ? 'emsale dahil' : 'emsal dışı'})`}
               value={fmtM2(c.basementArea)} />
        )}
        {c.atticArea > 0 && (
          <Row label={`Çatı Arası — ${c.unitCount} × ${fmtM2(c.atticArea / Math.max(1, c.unitCount))} (${input.emsal.atticInEmsal ? 'emsale dahil' : 'emsal dışı'})`}
               value={fmtM2(c.atticArea)} />
        )}
        <Row label="Toplam İnşaat Alanı (brüt)" value={fmtM2(c.grossArea)} />
        <Row label="Satılabilir Alan" value={fmtM2(c.saleableArea)} />
        <Row label="Bahçe / Açık Alan" value={fmtM2(c.gardenArea)} />
        <Row label="Ortalama Villa Alanı (brüt)" value={fmtM2(input.villa.grossPerVilla)} />
        <Row label="Satılabilir m² Başına Maliyet" value={fmtTLm2(f.costPerSaleableM2)} />
        <Row label="Bağlayıcı Kısıt" value={BINDING_TEXT[c.binding] ?? c.binding} tone="total" />
      </div>

      <div className="card">
        <div className="card-title">Fizibilite</div>
        <Row label="Yapı Sınıfı" value={input.cost.buildingClass} />
        <Row label="Birim Maliyet (güncel)" value={fmtTLm2(f.effectiveUnitCost)} />
        <Row label="Zemin Üstü İnşaat" value={fmtTL(f.aboveGroundCost)} />
        {f.basementCost > 0 && <Row label="Bodrum İnşaatı" value={fmtTL(f.basementCost)} />}
        {f.atticCost > 0 && <Row label="Çatı Arası" value={fmtTL(f.atticCost)} />}
        {f.landscapeCost > 0 && <Row label="Peyzaj ve Bahçe Düzenlemesi" value={fmtTL(f.landscapeCost)} />}
        {f.extrasCost > 0 && <Row label="Proje, Ruhsat, Harç, Müşavirlik" value={fmtTL(f.extrasCost)} />}
        {f.financeCost > 0 && <Row label="Finansman Gideri" value={fmtTL(f.financeCost)} />}
        <Row label="Toplam Yapım Maliyeti" value={fmtTL(f.totalCost)} tone="neg" />
        <Row label="Satış Birim Değeri" value={fmtTLm2(input.sales.unitPrice)} />
        <Row label="Villa Satış Hasılatı" value={fmtTL(f.buildingRevenue)} />
        {f.gardenRevenue > 0 && <Row label="Bahçe Satış Hasılatı" value={fmtTL(f.gardenRevenue)} />}
        <Row label="Toplam Satış Hasılatı" value={fmtTL(f.revenue)} tone="pos" />
        <Row label={`Müteahhit Kârı (${fmtPct(input.residual.profitRate, 0)})`} value={fmtTL(f.developerProfit)} tone="neg" />
        <Row label="ARTIK ARSA DEĞERİ" value={fmtTL(f.residualLandValue)} tone="total" />
        <Row label="Arsa m² Birim Değeri" value={fmtTLm2(f.landUnitValue)} />
        <Row label="Arsa Değeri / Hasılat" value={fmtPct(f.landToRevenue)} />
        <Row label="Fiyat Düşüşüne Dayanım" value={fmtPct(f.safetyMargin)} />
      </div>

      {input.share.enabled && (
      <div className="card">
        <div className="card-title">Kat Karşılığı Karşılaştırması</div>
        <Row label={`Arsa Sahibi Payı (%${(s.ownerShare * 100).toFixed(0)})`} value={`${fmtNum(s.ownerUnits, 1)} villa · ${fmtM2(s.ownerArea)}`} />
        <Row label="Arsa Sahibine Kalan Değer" value={fmtTL(s.ownerValue)} />
        <Row label={`Müteahhit Payı (%${(s.contractorShare * 100).toFixed(0)})`} value={`${fmtNum(s.contractorUnits, 1)} villa · ${fmtM2(s.contractorArea)}`} />
        <Row label="Müteahhide Kalan Değer" value={fmtTL(s.contractorValue)} />
        <Row label="Müteahhit Net Sonucu (maliyet sonrası)" value={fmtTL(s.contractorNet)} tone={s.contractorNet < 0 ? 'neg' : undefined} />
        <Row label="Artık Değer Yöntemine Göre Dengeli Pay" value={fmtPct(s.balancedShare)} />
        <Row label="Kat Karşılığı − Artık Değer Farkı" value={fmtTL(s.difference)} tone={s.difference < 0 ? 'neg' : 'pos'} />
        <div style={{ marginTop: 10 }}>
          <span className={`badge ${s.verdict === 'dengeli' ? 'badge-green' : 'badge-amber'}`}>
            {s.verdict === 'dengeli' ? 'Dengeli paylaşım'
              : s.verdict === 'arsa-sahibi-lehine' ? 'Arsa sahibi lehine' : 'Müteahhit lehine'}
          </span>
        </div>
        <div className="hint" style={{ marginTop: 8 }}>
          Kat karşılığı yöntemi ile artık değer yöntemi farklı sonuç verebilir; bu bölüm karşılaştırma amaçlıdır.
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
          Villa adedi, yapılaşma zarfı ve yerleşim verimliliği üzerinden üretilmiş bir <b>tahmindir</b>;
          kesin adet mimari avan projeyle belirlenir. Satış fiyatı, kâr ve finansman varsayımları kullanıcıya aittir.
        </div>
      </div>

      <div className="stamp">ArsaPlan · {version}</div>
    </>
  );
}
