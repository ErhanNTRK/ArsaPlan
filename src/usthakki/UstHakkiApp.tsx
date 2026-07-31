/**
 * ÜST HAKKI DEĞERLEME MODÜLÜ — tek ekran.
 *
 * Sadece oteller değil, üst hakkına konu olabilecek tüm gelir getirici
 * taşınmazlar için. Ana yöntem: kalan süreye özel Gelir İndirgeme (DCF) —
 * dönem sayısı SABİT DEĞİL, tamamen kalan süreye göre otomatik oluşur.
 * Az veri ilkesi: yıl yıl elle doldurma yok — başlangıç geliri + büyüme oranı
 * girilir, tablo kendisi türetilir (Otel modülüyle aynı dil).
 * Referans/Maliyet/Emsal yaklaşımları yan yana karşılaştırma için gösterilir;
 * nihai değeri sistem hiçbir zaman dayatmaz, kullanıcı seçer.
 */
import { useEffect, useMemo, useState } from 'react';
import { computeUstHakki, suggestRemainingYears, type UstHakkiInput } from './engine';
import { BRAND } from '../brand/brand';
import { downloadUstHakkiPdf } from './pdf';
import { downloadUstHakkiExcel } from './excel';

const DRAFT = 'arsaplan-usthakki-draft-v1';
const TL = (v: number) => Math.round(v).toLocaleString('tr-TR') + ' ₺';
const R2 = (v: number) => Math.round(v * 100) / 100;

const DEFAULT: UstHakkiInput & { startDate: string; sureUnit: 'yil' | 'ay' } = {
  referenceValue: 0, ilkSureYil: 49, kalanSureYil: 31, startDate: '', sureUnit: 'yil',
  baseIncome: 0, incomeGrowthPct: 2,
  paymentEnabled: false, basePayment: 0, paymentGrowthPct: 2,
  ecrimisilEnabled: false, baseEcrimisil: 0, ecrimisilGrowthPct: 0,
  riskFreeRatePct: 7.5, riskPremiumPct: 3.5,
  hasTerminalValue: false, terminalValue: 0,
  costApproachValue: null, marketApproachValue: null, manualValue: null,
  finalMethod: 'dcf',
};
type S = typeof DEFAULT;

export function UstHakkiApp({ onBack }: { onBack: () => void }) {
  const [state, setState] = useState<S>(() => {
    try { const s = localStorage.getItem(DRAFT); if (s) return JSON.parse(s); } catch { /* yok */ }
    return DEFAULT;
  });
  useEffect(() => { try { localStorage.setItem(DRAFT, JSON.stringify(state)); } catch { /* dolu */ } }, [state]);

  const r = useMemo(() => computeUstHakki(state), [state]);
  const patch = (p: Partial<S>) => setState((s) => ({ ...s, ...p }));

  const suggested = state.startDate ? suggestRemainingYears(state.startDate, state.ilkSureYil) : null;

  return (
    <div className="app usthakki-app">
      <div className="topbar no-print"><div className="topbar-inner">
        <img src={`${import.meta.env.BASE_URL}dora-logo.png`} alt={BRAND.company} className="topbar-logo" />
        <button type="button" className="btn-ghost" onClick={onBack}>← Ana Sayfaya Dön</button>
        <button type="button" className="btn-ghost" title="Tüm alanları temizler"
                onClick={() => { if (window.confirm('Sayfa sıfırlansın mı? Tüm girdiler silinecek.')) { localStorage.removeItem(DRAFT); setState(DEFAULT); } }}>
          ↺ Sayfayı Sıfırla
        </button>
      </div></div>

      <div className="step">
        <div className="step-head">
          <div className="step-eyebrow">Üst Hakkı Değerleme</div>
          <div className="step-title">Kalan Süre DCF ve Karşılaştırmalı Yöntemler</div>
          <div className="step-desc">
            Dönem sayısı kalan süre kadardır (sabit değildir). Terminal değer, sözleşmede
            aksi belirtilmedikçe hesaplanmaz. Tüm oranlar yönlendiricidir, serbestçe değiştirilir.
          </div>
        </div>

        <div className="card">
          <div className="card-title">Süre</div>
          <div className="hrow-labeled">
            <label className="pfield"><span>Üst Hakkı / İlk Tesis Tarihi <em>(opsiyonel)</em></span>
              <input type="date" value={state.startDate} onChange={(e) => patch({ startDate: e.target.value })} /></label>
            <label className="pfield pfield--s"><span>Süre Birimi</span>
              <select value={state.sureUnit} onChange={(e) => patch({ sureUnit: e.target.value as 'yil' | 'ay' })}>
                <option value="yil">Yıl</option>
                <option value="ay">Ay</option>
              </select></label>
            <label className="pfield pfield--s"><span>İlk Süre ({state.sureUnit === 'ay' ? 'ay' : 'yıl'})</span>
              <input type="number" value={state.sureUnit === 'ay' ? Math.round(state.ilkSureYil * 12) || '' : state.ilkSureYil || ''}
                     onChange={(e) => {
                       const v = Number(e.target.value) || 0;
                       patch({ ilkSureYil: state.sureUnit === 'ay' ? R2(v / 12) : v });
                     }} /></label>
            <label className="pfield pfield--s"><span>Kalan Süre ({state.sureUnit === 'ay' ? 'ay' : 'yıl'})</span>
              <input type="number" value={state.sureUnit === 'ay' ? Math.round(state.kalanSureYil * 12) || '' : state.kalanSureYil || ''}
                     onChange={(e) => {
                       const v = Number(e.target.value) || 0;
                       patch({ kalanSureYil: state.sureUnit === 'ay' ? R2(v / 12) : v });
                     }} /></label>
            {state.sureUnit === 'ay' && (
              <div className="pfield pfield--ro"><span>Yıl Karşılığı</span><b>{state.kalanSureYil.toFixed(2)} yıl</b></div>
            )}
            {suggested != null && Math.abs(suggested - state.kalanSureYil) > 0.05 && (
              <button type="button" className="linklike" onClick={() => patch({ kalanSureYil: suggested })}>
                ↺ Tarihten öner: {suggested} yıl
              </button>
            )}
          </div>
          <div className="hint">DCF tablosu tam <b>{Math.max(0, Math.round(state.kalanSureYil))} dönem</b> içerecek — kalan süre değişince otomatik güncellenir.</div>
        </div>

        <div className="card">
          <div className="card-title">Gelir İndirgeme (DCF) — Ana Yöntem</div>
          <div className="hrow-labeled">
            <label className="pfield"><span>1. Yıl Net İşletme Geliri ₺</span>
              <input type="number" value={state.baseIncome || ''} onChange={(e) => patch({ baseIncome: Number(e.target.value) || 0 })} /></label>
            <label className="pfield pfield--s"><span>Yıllık Büyüme %</span>
              <input type="number" step="0.5" value={state.incomeGrowthPct || ''} onChange={(e) => patch({ incomeGrowthPct: Number(e.target.value) || 0 })} /></label>
            <label className="pfield pfield--s"><span>Risksiz Oran %</span>
              <input type="number" step="0.5" value={state.riskFreeRatePct || ''} onChange={(e) => patch({ riskFreeRatePct: Number(e.target.value) || 0 })} /></label>
            <label className="pfield pfield--s"><span>Risk Primi %</span>
              <input type="number" step="0.5" value={state.riskPremiumPct || ''} title="Üst hakkı tam mülkiyetten daha risklidir (süre sonu belirsizliği)"
                     onChange={(e) => patch({ riskPremiumPct: Number(e.target.value) || 0 })} /></label>
            <div className="pfield pfield--ro"><span>İskonto Oranı</span><b>%{(r.discountRate * 100).toFixed(1)}</b></div>
          </div>

          <div className="hrow-labeled" style={{ marginTop: 10 }}>
            <label className="pfield"><span>Üst Hakkı / İrtifak Ödemesi</span>
              <select value={state.paymentEnabled ? '1' : '0'} onChange={(e) => patch({ paymentEnabled: e.target.value === '1' })}>
                <option value="0">Yok / hesap dışı</option><option value="1">Var — DCF'ten düşülsün</option>
              </select></label>
            {state.paymentEnabled && (<>
              <label className="pfield pfield--s"><span>1. Yıl Ödeme ₺</span>
                <input type="number" value={state.basePayment || ''} onChange={(e) => patch({ basePayment: Number(e.target.value) || 0 })} /></label>
              <label className="pfield pfield--s"><span>Yıllık Artış %</span>
                <input type="number" step="0.5" value={state.paymentGrowthPct || ''} onChange={(e) => patch({ paymentGrowthPct: Number(e.target.value) || 0 })} /></label>
            </>)}
          </div>

          <div className="hrow-labeled" style={{ marginTop: 10 }}>
            <label className="pfield"><span>Ecrimisil <em title="Bazı üst hakkı dosyalarında ayrı, opsiyonel bir yıllık kalem olarak yer alır">(opsiyonel, ayrı kalem)</em></span>
              <select value={state.ecrimisilEnabled ? '1' : '0'} onChange={(e) => patch({ ecrimisilEnabled: e.target.value === '1' })}>
                <option value="0">Yok / hesap dışı</option><option value="1">Var — DCF'ten düşülsün</option>
              </select></label>
            {state.ecrimisilEnabled && (<>
              <label className="pfield pfield--s"><span>1. Yıl Tutar ₺</span>
                <input type="number" value={state.baseEcrimisil || ''} onChange={(e) => patch({ baseEcrimisil: Number(e.target.value) || 0 })} /></label>
              <label className="pfield pfield--s"><span>Yıllık Artış %</span>
                <input type="number" step="0.5" value={state.ecrimisilGrowthPct || ''} onChange={(e) => patch({ ecrimisilGrowthPct: Number(e.target.value) || 0 })} /></label>
            </>)}
          </div>

          <div className="hrow-labeled" style={{ marginTop: 10 }}>
            <label className="pfield"><span>Devir Sonu Bedeli <em title="Sözleşmede aksi belirtilmediği sürece süre sonunda bina bedelsiz devroluyorsa Yok bırakın">(sözleşmede yoksa Yok)</em></span>
              <select value={state.hasTerminalValue ? '1' : '0'} onChange={(e) => patch({ hasTerminalValue: e.target.value === '1' })}>
                <option value="0">Yok (varsayılan)</option><option value="1">Var</option>
              </select></label>
            {state.hasTerminalValue && (
              <label className="pfield"><span>Devir Sonu Bedeli ₺</span>
                <input type="number" value={state.terminalValue || ''} onChange={(e) => patch({ terminalValue: Number(e.target.value) || 0 })} /></label>
            )}
          </div>

          <div className="dcf-table no-print">
            <div className="dcf-head">
              <span>Yıl</span><span>Gelir</span><span>Ödeme/Ecrimisil</span><span>Net Nakit Akış</span><span>Bugünkü Değer</span>
            </div>
            {r.years.slice(0, 6).map((y) => (
              <div className="dcf-row" key={y.year}>
                <span>{y.year}</span><span>{TL(y.income)}</span>
                <span>{y.payment + y.ecrimisil > 0 ? '−' + TL(y.payment + y.ecrimisil) : '—'}</span>
                <span>{TL(y.netCashFlow)}</span><span>{TL(y.presentValue)}</span>
              </div>
            ))}
            {r.years.length > 6 && (
              <div className="dcf-row dcf-more">… {r.years.length - 6} dönem daha (PDF/Excel'de tam liste) …</div>
            )}
          </div>
          <div className="pfield pfield--ro pfield--big" style={{ marginTop: 10 }}>
            <span>DCF Değeri ({r.years.length} dönem)</span><b>{TL(r.dcfValue)}</b>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Referans Üst Hakkı Hesabı <em style={{ fontWeight: 400, fontSize: 12, opacity: .7 }}>(pratik çapraz kontrol — ana yöntem değildir)</em></div>
          <div className="hrow-labeled">
            <label className="pfield"><span>Referans Değer ₺ <em title="Gelir/Maliyet/Emsal modülünden yapıştırın veya elle yazın">(başka modülden yapıştırılabilir)</em></span>
              <input type="number" value={state.referenceValue || ''} onChange={(e) => patch({ referenceValue: Number(e.target.value) || 0 })} /></label>
            <div className="pfield pfield--ro"><span>Süre Katsayısı (K)</span><b>{r.referenceFactor.toFixed(3)}</b></div>
            <div className="pfield pfield--ro"><span>Referans Üst Hakkı Değeri</span><b>{TL(r.referenceValue)}</b></div>
          </div>
          <div className="hint">K = Kalan Süre Anüite Faktörü ÷ İlk Süre Anüite Faktörü (aynı iskonto oranıyla).</div>
        </div>

        <div className="card">
          <div className="card-title">Maliyet ve Emsal Yaklaşımları <em style={{ fontWeight: 400, fontSize: 12, opacity: .7 }}>(opsiyonel referans)</em></div>
          <div className="hrow-labeled">
            <label className="pfield"><span>Maliyet Yaklaşımı Sonucu ₺</span>
              <input type="number" placeholder="—" value={state.costApproachValue ?? ''}
                     onChange={(e) => patch({ costApproachValue: e.target.value === '' ? null : Number(e.target.value) })} /></label>
            <label className="pfield"><span>Emsal Yaklaşımı Sonucu ₺</span>
              <input type="number" placeholder="—" value={state.marketApproachValue ?? ''}
                     onChange={(e) => patch({ marketApproachValue: e.target.value === '' ? null : Number(e.target.value) })} /></label>
          </div>
        </div>

        <div className="card result-card">
          <div className="card-title">Nihai Değer</div>
          <div className="dual-values">
            <div className={`dual-box ${state.finalMethod === 'dcf' ? 'dual-box--chosen' : ''}`}>
              <span>DCF</span><b>{TL(r.dcfValue)}</b>
            </div>
            <div className={`dual-box ${state.finalMethod === 'reference' ? 'dual-box--chosen' : ''}`}>
              <span>REFERANS</span><b>{TL(r.referenceValue)}</b>
            </div>
            {state.costApproachValue != null && (
              <div className={`dual-box ${state.finalMethod === 'cost' ? 'dual-box--chosen' : ''}`}>
                <span>MALİYET</span><b>{TL(state.costApproachValue)}</b>
              </div>
            )}
            {state.marketApproachValue != null && (
              <div className={`dual-box ${state.finalMethod === 'market' ? 'dual-box--chosen' : ''}`}>
                <span>EMSAL</span><b>{TL(state.marketApproachValue)}</b>
              </div>
            )}
          </div>
          <div className="hrow-labeled" style={{ marginTop: 12 }}>
            <label className="pfield"><span>Nihai Değer Olarak Seçin</span>
              <select value={state.finalMethod} onChange={(e) => patch({ finalMethod: e.target.value as S['finalMethod'] })}>
                <option value="dcf">DCF Sonucu</option>
                <option value="reference">Referans Üst Hakkı Hesabı</option>
                {state.costApproachValue != null && <option value="cost">Maliyet Yaklaşımı</option>}
                {state.marketApproachValue != null && <option value="market">Emsal Yaklaşımı</option>}
                <option value="manual">Elle Gir</option>
              </select></label>
            {state.finalMethod === 'manual' && (
              <label className="pfield"><span>Elle Girilen Nihai Değer ₺</span>
                <input type="number" value={state.manualValue ?? ''} onChange={(e) => patch({ manualValue: Number(e.target.value) || 0 })} /></label>
            )}
            <div className="pfield pfield--ro pfield--big"><span>NİHAİ ÜST HAKKI DEĞERİ</span><b>{TL(r.finalValue)}</b></div>
          </div>
          {r.warnings.map((w, i) => <div className="warn-line" key={i}>{w}</div>)}
          <div className="export-row no-print">
            <button type="button" className="btn-ghost" onClick={() => downloadUstHakkiPdf(state, r)}>📄 PDF İndir</button>
            <button type="button" className="btn-ghost" onClick={() => downloadUstHakkiExcel(state, r)}>📊 Excel İndir</button>
          </div>
        </div>

        <div className="stamp">{BRAND.preparedBy}<br />{BRAND.developerLine} · Üst Hakkı Değerleme Modülü</div>
      </div>
    </div>
  );
}
