/**
 * AYRINTILI ÜST HAKKI DEĞER ANALİZİ — tek ekran.
 * Standart Hesap'tan tamamen ayrı, otel-tarzı gelir/gider zincirli DCF.
 * Dönem sayısı kalan süreye göre otomatik; oda geliri satırlardan türetilir,
 * diğer kalemler toplam gelirin yüzdesi olarak girilir.
 */
import { useEffect, useMemo, useState } from 'react';
import { computeDetailedUstHakki, type DetailedUstHakkiInput, type DetailedRoomRow } from './detailedEngine';
import { BRAND } from '../brand/brand';
import { parseKml } from '../geo/kml';
import { downloadDetailedUstHakkiPdf } from './detailedPdf';
import { downloadDetailedUstHakkiExcel } from './detailedExcel';
import { useRef } from 'react';

const DRAFT = 'arsaplan-usthakki-detailed-draft-v1';
const uid = () => Math.random().toString(36).slice(2, 9);
const TL = (v: number) => Math.round(v).toLocaleString('tr-TR') + ' ₺';
const R2 = (v: number) => Math.round(v * 100) / 100;

const DEFAULT_ROOM: DetailedRoomRow = { id: uid(), name: 'Standart Oda', count: 0, price: 0, occupancyPct: 60, days: 365 };

const DEFAULT: DetailedUstHakkiInput & { sureUnit: 'yil' | 'ay' } = {
  hotelName: '', ada: '', parsel: '', parcelArea: 0, fromKml: false,
  sureUnit: 'yil', kalanSureYil: 31, toplamSureYil: 49,
  currency: 'TL', fxRate: 1,
  rooms: [DEFAULT_ROOM], roomGrowthPct: 3,
  foodPct: 4, otherPct: 4, meetingPct: 2, shopPct: 1,
  roomExpensePct: 30, foodExpensePct: 45, otherExpensePct: 30, generalMgmtPct: 7, energyPct: 5, repairPct: 2,
  totalCost: 0, operatorPremiumPct: 5, propertyTaxPct: 0.4, insurancePct: 0.2,
  renewalFundBase: 0, renewalFundGrowthPct: 2,
  ecrimisilBase: 0, ecrimisilGrowthPct: 0,
  ustHakkiOdemeBase: 0, ustHakkiOdemeGrowthPct: 2,
  bayilikBase: 0, bayilikGrowthPct: 0,
  riskFreeRatePct: 7.5, riskPremiumPct: 3.5,
  donemSonuIndirgemePct: 0,
};
type S = typeof DEFAULT;

export function DetailedUstHakkiApp({ onBack }: { onBack: () => void }) {
  const [state, setState] = useState<S>(() => {
    try { const s = localStorage.getItem(DRAFT); if (s) return JSON.parse(s); } catch { /* yok */ }
    return DEFAULT;
  });
  useEffect(() => { try { localStorage.setItem(DRAFT, JSON.stringify(state)); } catch { /* dolu */ } }, [state]);

  const fileRef = useRef<HTMLInputElement>(null);
  const r = useMemo(() => computeDetailedUstHakki(state), [state]);
  const patch = (p: Partial<S>) => setState((s) => ({ ...s, ...p }));
  const patchRoom = (id: string, p: Partial<DetailedRoomRow>) =>
    patch({ rooms: state.rooms.map((x) => (x.id === id ? { ...x, ...p } : x)) });

  const otherPctSum = state.foodPct + state.otherPct + state.meetingPct + state.shopPct;
  const roomPct = R2(100 - otherPctSum);

  async function onKml(f: File) {
    try {
      const parsed = parseKml(await f.text());
      if (!parsed) { alert('KML okunamadı.'); return; }
      const area = parsed.deedArea || parsed.polygonArea || 0;
      patch({
        parcelArea: area > 0 ? Math.round(area) : state.parcelArea,
        ada: parsed.ada || state.ada, parsel: parsed.parsel || state.parsel, fromKml: true,
      });
    } catch { alert('KML okunamadı.'); }
  }

  const sureField = (label: string, key: 'kalanSureYil' | 'toplamSureYil') => (
    <label className="pfield pfield--s"><span>{label} ({state.sureUnit === 'ay' ? 'ay' : 'yıl'})</span>
      <input type="number" value={state.sureUnit === 'ay' ? Math.round(state[key] * 12) || '' : state[key] || ''}
             onChange={(e) => {
               const v = Number(e.target.value) || 0;
               patch({ [key]: state.sureUnit === 'ay' ? R2(v / 12) : v } as Partial<S>);
             }} /></label>
  );

  const busyRef = useRef(false);
  async function onPdf() { if (busyRef.current) return; busyRef.current = true; try { await downloadDetailedUstHakkiPdf(state, r); } finally { busyRef.current = false; } }
  async function onExcel() { if (busyRef.current) return; busyRef.current = true; try { await downloadDetailedUstHakkiExcel(state, r); } finally { busyRef.current = false; } }

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
          <div className="step-eyebrow">Üst Hakkı Değerleme · Ayrıntılı Analiz</div>
          <div className="step-title">Ayrıntılı Üst Hakkı Değer Analizi</div>
          <div className="step-desc">
            Otel tarzı gelir/gider zinciriyle kalan süre kadar dönemsel DCF. 1. dönem indirgenmez.
            Tüm oranlar yönlendiricidir, serbestçe değiştirilir.
          </div>
        </div>

        <div className="card">
          <div className="card-title">Kimlik <em style={{ fontWeight: 400, fontSize: 12, opacity: .7 }}>(hiçbiri zorunlu değil)</em></div>
          <div className="hrow-labeled">
            <label className="pfield"><span>Otel Adı</span>
              <input value={state.hotelName} placeholder="—" onChange={(e) => patch({ hotelName: e.target.value })} /></label>
            <label className="pfield pfield--s"><span>Ada</span>
              <input value={state.ada} placeholder="—" onChange={(e) => patch({ ada: e.target.value })} /></label>
            <label className="pfield pfield--s"><span>Parsel</span>
              <input value={state.parsel} placeholder="—" onChange={(e) => patch({ parsel: e.target.value })} /></label>
            <label className="pfield"><span>Parsel Alanı m² {state.fromKml && <em>(KML)</em>}</span>
              <input type="number" value={state.parcelArea || ''} onChange={(e) => patch({ parcelArea: Number(e.target.value) || 0, fromKml: false })} /></label>
            <label className="pfield"><span>KML (TKGM)</span>
              <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()}>Dosya Yükle</button>
              <input ref={fileRef} type="file" accept=".kml" hidden
                     onChange={(e) => { const f = e.target.files?.[0]; if (f) onKml(f); e.currentTarget.value = ''; }} />
            </label>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Üst Hakkı Süresi</div>
          <div className="hrow-labeled">
            <label className="pfield pfield--s"><span>Süre Birimi</span>
              <select value={state.sureUnit} onChange={(e) => patch({ sureUnit: e.target.value as 'yil' | 'ay' })}>
                <option value="yil">Yıl</option><option value="ay">Ay</option>
              </select></label>
            {sureField('Kalan Süre', 'kalanSureYil')}
            {sureField('Toplam Süre', 'toplamSureYil')}
            <label className="pfield pfield--s"><span>Para Birimi</span>
              <select value={state.currency} onChange={(e) => patch({ currency: e.target.value as S['currency'] })}>
                <option value="TL">TL</option><option value="USD">USD</option><option value="EUR">EUR</option>
              </select></label>
            {state.currency !== 'TL' && (
              <label className="pfield pfield--s"><span>Kur (₺)</span>
                <input type="number" value={state.fxRate || ''} onChange={(e) => patch({ fxRate: Number(e.target.value) || 0 })} /></label>
            )}
          </div>
          <div className="hint">DCF tablosu tam <b>{Math.max(0, Math.round(state.kalanSureYil))} dönem</b> içerir.</div>
        </div>

        <div className="card">
          <div className="card-title">Oda Gelirleri <em style={{ fontWeight: 400, fontSize: 12, opacity: .7 }}>(Otel modülüyle aynı hesap: Adet × Fiyat × Doluluk × Gün)</em></div>
          {state.rooms.map((rm) => (
            <div className="prop-card" key={rm.id}>
              <div className="prop-card__top">
                <label className="pfield"><span>Oda Tipi</span>
                  <input value={rm.name} onChange={(e) => patchRoom(rm.id, { name: e.target.value })} /></label>
                <label className="pfield pfield--s"><span>Oda Sayısı</span>
                  <input type="number" value={rm.count || ''} onChange={(e) => patchRoom(rm.id, { count: Number(e.target.value) || 0 })} /></label>
                <label className="pfield pfield--s"><span>Günlük Ort. Fiyat</span>
                  <input type="number" value={rm.price || ''} onChange={(e) => patchRoom(rm.id, { price: Number(e.target.value) || 0 })} /></label>
                <label className="pfield pfield--s"><span>Doluluk %</span>
                  <input type="number" value={rm.occupancyPct || ''} onChange={(e) => patchRoom(rm.id, { occupancyPct: Number(e.target.value) || 0 })} /></label>
                <label className="pfield pfield--s"><span>Faaliyet Gün</span>
                  <input type="number" value={rm.days || ''} onChange={(e) => patchRoom(rm.id, { days: Number(e.target.value) || 0 })} /></label>
                {state.rooms.length > 1 && (
                  <button type="button" className="b-del" onClick={() => patch({ rooms: state.rooms.filter((x) => x.id !== rm.id) })}>✕</button>
                )}
              </div>
            </div>
          ))}
          <button type="button" className="btn-ghost" onClick={() => patch({ rooms: [...state.rooms, { ...DEFAULT_ROOM, id: uid(), name: '' }] })}>➕ Oda Tipi Ekle</button>
          <div className="pfield pfield--ro" style={{ marginTop: 10 }}><span>1. Yıl Oda Geliri</span><b>{TL(r.baseRoomIncome)}</b></div>
        </div>

        <div className="card">
          <div className="card-title">Gelirler Tablosu <em style={{ fontWeight: 400, fontSize: 12, opacity: .7 }}>(oranlar toplam gelirin %'sidir)</em></div>
          <div className="hrow-labeled">
            <label className="pfield pfield--s"><span>Yiyecek/İçecek %</span>
              <input type="number" step="0.5" value={state.foodPct || ''} onChange={(e) => patch({ foodPct: Number(e.target.value) || 0 })} /></label>
            <label className="pfield pfield--s"><span>Diğer Gelirler %</span>
              <input type="number" step="0.5" value={state.otherPct || ''} onChange={(e) => patch({ otherPct: Number(e.target.value) || 0 })} /></label>
            <label className="pfield pfield--s"><span>Toplantı/Salon %</span>
              <input type="number" step="0.5" value={state.meetingPct || ''} onChange={(e) => patch({ meetingPct: Number(e.target.value) || 0 })} /></label>
            <label className="pfield pfield--s"><span>Dükkan Kira %</span>
              <input type="number" step="0.5" value={state.shopPct || ''} onChange={(e) => patch({ shopPct: Number(e.target.value) || 0 })} /></label>
            <div className="pfield pfield--ro"><span>Oda Payı (100 − diğerleri)</span><b className={roomPct <= 0 ? 'warn-text' : ''}>%{roomPct.toFixed(1)}</b></div>
            <label className="pfield pfield--s"><span>Oda Fiyat Artış Oranı %</span>
              <input type="number" step="0.5" value={state.roomGrowthPct || ''} onChange={(e) => patch({ roomGrowthPct: Number(e.target.value) || 0 })} /></label>
          </div>
          {roomPct <= 0 && <div className="warn-line">Diğer gelir oranlarının toplamı %100'ü aşıyor.</div>}
        </div>

        <div className="card">
          <div className="card-title">İşletme Giderleri</div>
          <div className="hrow-labeled">
            <label className="pfield pfield--s"><span>Oda Gideri %</span>
              <input type="number" step="0.5" value={state.roomExpensePct || ''} onChange={(e) => patch({ roomExpensePct: Number(e.target.value) || 0 })} /></label>
            <label className="pfield pfield--s"><span>Yiyecek Gideri %</span>
              <input type="number" step="0.5" value={state.foodExpensePct || ''} onChange={(e) => patch({ foodExpensePct: Number(e.target.value) || 0 })} /></label>
            <label className="pfield pfield--s"><span>Diğer Gider %</span>
              <input type="number" step="0.5" value={state.otherExpensePct || ''} onChange={(e) => patch({ otherExpensePct: Number(e.target.value) || 0 })} /></label>
            <label className="pfield pfield--s"><span>Genel Yönetim %</span>
              <input type="number" step="0.5" value={state.generalMgmtPct || ''} onChange={(e) => patch({ generalMgmtPct: Number(e.target.value) || 0 })} /></label>
            <label className="pfield pfield--s"><span>Enerji %</span>
              <input type="number" step="0.5" value={state.energyPct || ''} onChange={(e) => patch({ energyPct: Number(e.target.value) || 0 })} /></label>
            <label className="pfield pfield--s"><span>Basit Tamirat %</span>
              <input type="number" step="0.5" value={state.repairPct || ''} onChange={(e) => patch({ repairPct: Number(e.target.value) || 0 })} /></label>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Sabit Giderler</div>
          <div className="hrow-labeled">
            <label className="pfield"><span>Toplam Maliyet ₺ <em title="Emlak Vergisi ve Bina Sigortası bu referans üzerinden hesaplanır">(referans)</em></span>
              <input type="number" value={state.totalCost || ''} onChange={(e) => patch({ totalCost: Number(e.target.value) || 0 })} /></label>
            <label className="pfield pfield--s"><span>İşletmeci Prim % <em title="Brüt İşletme Kârı üzerinden">(brüt kâr)</em></span>
              <input type="number" step="0.5" value={state.operatorPremiumPct || ''} onChange={(e) => patch({ operatorPremiumPct: Number(e.target.value) || 0 })} /></label>
            <label className="pfield pfield--s"><span>Emlak Vergisi %</span>
              <input type="number" step="0.1" value={state.propertyTaxPct || ''} onChange={(e) => patch({ propertyTaxPct: Number(e.target.value) || 0 })} /></label>
            <label className="pfield pfield--s"><span>Bina Sigortası %</span>
              <input type="number" step="0.1" value={state.insurancePct || ''} onChange={(e) => patch({ insurancePct: Number(e.target.value) || 0 })} /></label>
          </div>
          <div className="hrow-labeled" style={{ marginTop: 10 }}>
            <label className="pfield pfield--s"><span>Yenileme Fonu ₺ (1. yıl)</span>
              <input type="number" value={state.renewalFundBase || ''} onChange={(e) => patch({ renewalFundBase: Number(e.target.value) || 0 })} /></label>
            <label className="pfield pfield--s"><span>Ecrimisil ₺ (1. yıl)</span>
              <input type="number" value={state.ecrimisilBase || ''} onChange={(e) => patch({ ecrimisilBase: Number(e.target.value) || 0 })} /></label>
            <label className="pfield pfield--s"><span>Üst Hakkı Ödemesi ₺ (1. yıl)</span>
              <input type="number" value={state.ustHakkiOdemeBase || ''} onChange={(e) => patch({ ustHakkiOdemeBase: Number(e.target.value) || 0 })} /></label>
            <label className="pfield pfield--s"><span>Bayilik Ödemesi ₺ (1. yıl)</span>
              <input type="number" value={state.bayilikBase || ''} onChange={(e) => patch({ bayilikBase: Number(e.target.value) || 0 })} /></label>
          </div>
          <div className="hint">Yenileme Fonu / Ecrimisil / Üst Hakkı / Bayilik elle girilir; her biri kendi yıllık artış oranıyla büyütülebilir (varsayılan %0-2, ↓ kartlarda ayarlanır).</div>
        </div>

        <div className="card">
          <div className="card-title">İskonto ve Dönem Sonu</div>
          <div className="hrow-labeled">
            <label className="pfield pfield--s"><span>Risksiz Oran %</span>
              <input type="number" step="0.5" value={state.riskFreeRatePct || ''} onChange={(e) => patch({ riskFreeRatePct: Number(e.target.value) || 0 })} /></label>
            <label className="pfield pfield--s"><span>Risk Primi %</span>
              <input type="number" step="0.5" value={state.riskPremiumPct || ''} onChange={(e) => patch({ riskPremiumPct: Number(e.target.value) || 0 })} /></label>
            <div className="pfield pfield--ro"><span>İskonto Oranı</span><b>%{(r.discountRate * 100).toFixed(1)}</b></div>
            <label className="pfield pfield--s"><span>Dönem Sonu Değer İndirgeme %</span>
              <input type="number" step="0.5" value={state.donemSonuIndirgemePct || ''} onChange={(e) => patch({ donemSonuIndirgemePct: Number(e.target.value) || 0 })} /></label>
          </div>
          <div className="hint">1. dönem indirgenmez; 2. dönemden itibaren iskonto oranıyla bugüne çekilir.</div>
        </div>

        <div className="card">
          <div className="card-title">Dönemsel Tablo <em style={{ fontWeight: 400, fontSize: 12, opacity: .7 }}>(önizleme — tam liste PDF/Excel'de)</em></div>
          <div className="dcf-table no-print">
            <div className="dcf-head">
              <span>Yıl</span><span>Toplam Gelir</span><span>Toplam Gider</span><span>Net Kâr</span><span>Bugünkü Değer</span>
            </div>
            {r.years.slice(0, 6).map((yr) => (
              <div className="dcf-row" key={yr.year}>
                <span>{yr.year}</span><span>{TL(yr.totalRevenue)}</span><span>{TL(yr.totalExpense)}</span>
                <span>{TL(yr.netOperatingProfit)}</span><span>{TL(yr.presentValue)}</span>
              </div>
            ))}
            {r.years.length > 6 && <div className="dcf-row dcf-more">… {r.years.length - 6} dönem daha (PDF/Excel'de tam liste) …</div>}
          </div>
        </div>

        <div className="card result-card">
          <div className="card-title">Sonuç</div>
          <div className="hrow-labeled">
            <div className="pfield pfield--ro"><span>Nakit Akış BD Toplamı</span><b>{TL(r.sumPresentValue)}</b></div>
            <div className="pfield pfield--ro pfield--big"><span>TAŞINMAZ DEĞERİ</span>
              <b>{Math.round(r.propertyValueRounded).toLocaleString('tr-TR')} {state.currency === 'TL' ? '₺' : state.currency}</b></div>
            {state.currency !== 'TL' && (
              <div className="pfield pfield--ro"><span>TL Karşılığı</span><b>{TL(r.propertyValueTl)}</b></div>
            )}
          </div>
          {r.warnings.map((w, i) => <div className="warn-line" key={i}>{w}</div>)}
          <div className="export-row no-print">
            <button type="button" className="btn-ghost" onClick={onPdf}>📄 PDF İndir</button>
            <button type="button" className="btn-ghost" onClick={onExcel}>📊 Excel İndir</button>
          </div>
        </div>

        <div className="stamp">{BRAND.preparedBy}<br />{BRAND.developerLine} · Ayrıntılı Üst Hakkı Değer Analizi</div>
      </div>
    </div>
  );
}
