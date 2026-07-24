/**
 * OTEL GELİRİ (GELİR İNDİRGEME YAKLAŞIMI) — ANA UYGULAMA
 *
 * ArsaPlan'ın mevcut tasarım dilini (topbar, card, Field, Choice, Seg, fmtTL vb.)
 * birebir kullanır; mevcut App.tsx / engine / ui dosyalarının hiçbirini değiştirmez.
 * Kendi state'ini, kendi localStorage taslağını ve kendi adım akışını yönetir.
 */
import { useEffect, useMemo, useState } from 'react';
import { BRAND } from '../brand/brand';
import { Field, Txt, Num, Pct, Sel, Seg, fmtTL } from '../ui/fields';
import {
  analyzeHotel, createDefaultHotelInput, newId,
} from './engine';
import {
  ODA_TIPLERI, YARDIMCI_GELIR_KATALOGU, TICARI_KIRA_KATALOGU,
} from './types';
import type {
  HotelIncomeInput, RoomRevenueRow, AncillaryIncomeRow, CommercialLeaseRow,
} from './types';
import { downloadHotelPdf } from './pdf';

const DRAFT_KEY = 'arsaplan-otel-taslak-v1';

function loadDraft(): HotelIncomeInput {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return createDefaultHotelInput();
    const d = JSON.parse(raw);
    const D = createDefaultHotelInput();
    return {
      general: { ...D.general, ...(d.general ?? {}) },
      rooms: Array.isArray(d.rooms) ? d.rooms : [],
      ancillary: Array.isArray(d.ancillary) ? d.ancillary : [],
      leases: Array.isArray(d.leases) ? d.leases : [],
      opex: { ...D.opex, ...(d.opex ?? {}) },
      projection: { ...D.projection, ...(d.projection ?? {}) },
    };
  } catch {
    return createDefaultHotelInput();
  }
}

const STEPS = [
  { title: 'Genel Bilgiler', desc: 'Tesis ve taşınmaz kimliği.' },
  { title: 'Oda Gelirleri', desc: 'Oda tipi, sayısı, ücret ve doluluk.' },
  { title: 'Yardımcı Gelirler', desc: 'Restoran, SPA, otopark ve benzeri işletme gelirleri.' },
  { title: 'Ticari Kiralar', desc: 'Üçüncü kişilere kiralanan bağımsız alanlar.' },
  { title: 'İşletme Gideri', desc: 'Toplam gelir üzerinden gider oranı.' },
  { title: 'Projeksiyon', desc: 'Yıllara göre gelir/gider artışı ve kapitalizasyon.' },
];
const TOTAL = STEPS.length;

export default function HotelApp({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [input, setInput] = useState<HotelIncomeInput>(loadDraft);

  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(input)); } catch { /* kota */ }
  }, [input]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [step]);

  const result = useMemo(() => analyzeHotel(input), [input]);
  const isResult = step > TOTAL;
  const meta = STEPS[Math.min(step, TOTAL) - 1];

  const reset = () => {
    if (!window.confirm('Tüm otel geliri girdileri silinip yeni analiz başlatılacak. Emin misiniz?')) return;
    localStorage.removeItem(DRAFT_KEY);
    setInput(createDefaultHotelInput());
    setStep(1);
  };

  const setGeneral = (patch: Partial<HotelIncomeInput['general']>) =>
    setInput((p) => ({ ...p, general: { ...p.general, ...patch } }));
  const setRooms = (rooms: RoomRevenueRow[]) => setInput((p) => ({ ...p, rooms }));
  const setAncillary = (ancillary: AncillaryIncomeRow[]) => setInput((p) => ({ ...p, ancillary }));
  const setLeases = (leases: CommercialLeaseRow[]) => setInput((p) => ({ ...p, leases }));
  const setOpex = (patch: Partial<HotelIncomeInput['opex']>) =>
    setInput((p) => ({ ...p, opex: { ...p.opex, ...patch } }));
  const setProjection = (patch: Partial<HotelIncomeInput['projection']>) =>
    setInput((p) => ({ ...p, projection: { ...p.projection, ...patch } }));

  const blocker = (): string | null => {
    if (step === 1 && !input.general.facilityName.trim()) return 'Tesis adını giriniz.';
    if (step === 6 && input.projection.capRate <= 0) return 'Kapitalizasyon oranını giriniz (sıfır olamaz).';
    return null;
  };
  const stop = blocker();

  return (
    <div className="app" id="arsaplan-otel-root">
      <div className="topbar">
        <div className="topbar-inner">
          <div>
            <h1>{BRAND.appName} — Otel Gelir Hesabı</h1>
            <p>Gelir İndirgeme Yaklaşımı · Konaklama Tesisleri</p>
          </div>
          <div className="topbar-actions no-print">
            <button type="button" className="link-btn topbar-link" onClick={onBack}>← Başlangıca dön</button>
          </div>
          <img className="brand-logo" src={`${import.meta.env.BASE_URL}dora-logo.png`} alt={BRAND.company} />
        </div>
        <div className="progress-row">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${Math.min(step, TOTAL + 1) / (TOTAL + 1) * 100}%` }} />
          </div>
          <div className="progress-label">{isResult ? 'SONUÇ' : `Adım ${step} / ${TOTAL}`}</div>
        </div>
      </div>

      {!isResult && <HotelSummaryBar result={result} />}

      <div className="step" key={step}>
        {!isResult && (
          <div className="step-head">
            <div className="step-eyebrow">Adım {step}</div>
            <div className="step-title">{meta.title}</div>
            <div className="step-desc">{meta.desc}</div>
          </div>
        )}

        {step === 1 && <StepGeneral general={input.general} setGeneral={setGeneral} />}
        {step === 2 && <StepRooms rooms={input.rooms} setRooms={setRooms} result={result} />}
        {step === 3 && <StepAncillary ancillary={input.ancillary} setAncillary={setAncillary} result={result} />}
        {step === 4 && <StepLeases leases={input.leases} setLeases={setLeases} result={result} />}
        {step === 5 && <StepOpex opex={input.opex} setOpex={setOpex} result={result} />}
        {step === 6 && <StepProjection projection={input.projection} setProjection={setProjection} result={result} />}
        {isResult && <HotelResult input={input} result={result} />}

        {stop && !isResult && <div className="card blocker">{stop}</div>}
        {!isResult && (
          <div className="stamp">
            {BRAND.preparedBy}<br />{BRAND.developerLine} · Otel Gelir Hesabı Modülü
          </div>
        )}
      </div>

      <div className="navbar no-print">
        <div className="navbar-inner">
          {isResult ? (
            <>
              <button className="btn btn-ghost" onClick={() => setStep(TOTAL)}>Geri</button>
              <button className="btn btn-primary" onClick={reset}>Yeni Analiz</button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>Geri</button>
              <button className="btn btn-primary" disabled={!!stop} onClick={() => setStep((s) => s + 1)}>
                {step === TOTAL ? 'Sonucu Gör' : 'Devam'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Sabit Özet Paneli ─────────────────── */
function HotelSummaryBar({ result }: { result: ReturnType<typeof analyzeHotel> }) {
  return (
    <div className="hotel-summary-sticky no-print">
      <div className="hotel-summary-inner">
        <div><span>Toplam Gelir</span><b>{fmtTL(result.totalGrossRevenue)}</b></div>
        <div><span>Gider</span><b>{fmtTL(result.totalExpense)}</b></div>
        <div><span>NOI</span><b>{fmtTL(result.noi)}</b></div>
        <div><span>Kapitalizasyon Değeri</span><b>{fmtTL(result.capitalizedValue)}</b></div>
      </div>
    </div>
  );
}

/* ─────────────────── Adım 1 — Genel Bilgiler ─────────────────── */
function StepGeneral({ general, setGeneral }: {
  general: HotelIncomeInput['general']; setGeneral: (p: Partial<HotelIncomeInput['general']>) => void;
}) {
  return (
    <div className="cols step-cols">
      <div className="card">
        <div className="card-title">Tesis Bilgileri</div>
        <Field label="Tesis Adı"><Txt value={general.facilityName} onChange={(v) => setGeneral({ facilityName: v })} placeholder="Örn. Örnek Resort & Spa" /></Field>
        <Field label="Adres"><Txt value={general.address} onChange={(v) => setGeneral({ address: v })} placeholder="Açık adres" /></Field>
      </div>
      <div className="card">
        <div className="card-title">Taşınmaz Kimliği</div>
        <div className="grid-2">
          <Field label="İl"><Txt value={general.il} onChange={(v) => setGeneral({ il: v })} /></Field>
          <Field label="İlçe"><Txt value={general.ilce} onChange={(v) => setGeneral({ ilce: v })} /></Field>
        </div>
        <Field label="Mahalle"><Txt value={general.mahalle} onChange={(v) => setGeneral({ mahalle: v })} /></Field>
        <div className="grid-2">
          <Field label="Ada"><Txt value={general.ada} onChange={(v) => setGeneral({ ada: v })} /></Field>
          <Field label="Parsel"><Txt value={general.parsel} onChange={(v) => setGeneral({ parsel: v })} /></Field>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Adım 2 — Oda Gelirleri ─────────────────── */
function StepRooms({ rooms, setRooms, result }: {
  rooms: RoomRevenueRow[]; setRooms: (r: RoomRevenueRow[]) => void; result: ReturnType<typeof analyzeHotel>;
}) {
  const add = () => setRooms([...rooms, {
    id: newId(), roomType: ODA_TIPLERI[0], roomCount: 0, adr: 0, occupancy: 0, operatingDays: 365,
  }]);
  const upd = (i: number, patch: Partial<RoomRevenueRow>) =>
    setRooms(rooms.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  const del = (i: number) => setRooms(rooms.filter((_, k) => k !== i));

  return (
    <div className="cols">
      <div className="card card-wide">
        <div className="card-title">Oda Tipleri</div>
        <div className="hint" style={{ marginBottom: 10 }}>
          Her satır için Yıllık Gelir = Oda Sayısı × Günlük Ortalama Fiyat × Doluluk Oranı × Faaliyet Günü olarak anlık hesaplanır.
        </div>
        {rooms.map((r, i) => {
          const calc = result.roomRows[i];
          return (
            <div className="h-row" key={r.id}>
              <div className="b-cell">
                <Sel value={ODA_TIPLERI.includes(r.roomType) ? r.roomType : 'Diğer'}
                     onChange={(v) => upd(i, { roomType: v })}
                     options={ODA_TIPLERI.map((t) => ({ value: t, label: t }))} />
              </div>
              <div className="b-cell"><Num value={r.roomCount} onChange={(n) => upd(i, { roomCount: n })} suffix="oda" /></div>
              <div className="b-cell"><Num value={r.adr} onChange={(n) => upd(i, { adr: n })} suffix="₺" /></div>
              <div className="b-cell"><Pct value={r.occupancy} onChange={(n) => upd(i, { occupancy: n })} /></div>
              <div className="b-cell"><Num value={r.operatingDays} onChange={(n) => upd(i, { operatingDays: n })} suffix="gün" /></div>
              <div className="b-cell b-cost">{calc ? fmtTL(calc.annualRevenue) : '—'}</div>
              <button type="button" className="b-del" title="Satırı sil" onClick={() => del(i)}>✕</button>
            </div>
          );
        })}
        {rooms.length > 0 && (
          <div className="hint" style={{ margin: '4px 0 8px' }}>
            Kolonlar: Oda Tipi · Oda Sayısı · Günlük Ortalama Fiyat · Doluluk · Faaliyet Günü · Yıllık Gelir
          </div>
        )}
        <button type="button" className="btn add-btn" onClick={add}>+ Oda Tipi Ekle</button>

        {rooms.length > 0 && (
          <div className="mini-kpi" style={{ marginTop: 14 }}>
            <div><span>Toplam Oda Sayısı</span><b>{result.performance.totalRoomCount}</b></div>
            <div><span>Toplam Oda Geliri</span><b>{fmtTL(result.totalRoomRevenue)}</b></div>
          </div>
        )}
      </div>

      {rooms.length > 0 && (
        <div className="card result-preview">
          <div className="card-title">Otomatik Performans Göstergeleri</div>
          <div className="mini-kpi three">
            <div><span>ADR</span><b>{fmtTL(result.performance.blendedAdr)}</b></div>
            <div><span>Doluluk</span><b>%{Math.round(result.performance.blendedOccupancy * 100)}</b></div>
            <div><span>RevPAR</span><b>{fmtTL(result.performance.revPar)}</b></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────── Adım 3 — Yardımcı Gelirler ─────────────────── */
function StepAncillary({ ancillary, setAncillary, result }: {
  ancillary: AncillaryIncomeRow[]; setAncillary: (a: AncillaryIncomeRow[]) => void; result: ReturnType<typeof analyzeHotel>;
}) {
  const add = () => setAncillary([...ancillary, { id: newId(), name: YARDIMCI_GELIR_KATALOGU[0], annualIncome: 0, note: '' }]);
  useEffect(() => {
    if (ancillary.length === 0) add();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const upd = (i: number, patch: Partial<AncillaryIncomeRow>) =>
    setAncillary(ancillary.map((a, k) => (k === i ? { ...a, ...patch } : a)));
  const del = (i: number) => setAncillary(ancillary.filter((_, k) => k !== i));

  return (
    <div className="cols">
      <div className="card card-wide">
        <div className="card-title">Yardımcı İşletme Gelirleri</div>
        <div className="hint" style={{ marginBottom: 10 }}>
          Yalnızca otel tarafından işletilen, üçüncü kişiye kiraya verilmemiş gelir kalemlerini buraya ekleyin.
          Kiraya verilmiş alanlar için "Ticari Kiralar" adımını kullanın (çifte hesaplamayı önler).
        </div>
        {ancillary.map((a, i) => (
          <div className="h-row h-row-anc" key={a.id}>
            <div className="b-cell">
              <Sel value={YARDIMCI_GELIR_KATALOGU.includes(a.name) ? a.name : 'Diğer'}
                   onChange={(v) => upd(i, { name: v })}
                   options={YARDIMCI_GELIR_KATALOGU.map((t) => ({ value: t, label: t }))} />
            </div>
            <div className="b-cell">
              <Seg value={a.mode ?? 'tutar'} onChange={(v) => upd(i, { mode: v })}
                   options={[{ value: 'tutar', label: '₺' }, { value: 'oran', label: '% oda' }]} />
            </div>
            <div className="b-cell">
              {(a.mode ?? 'tutar') === 'oran'
                ? <Pct value={a.rate ?? 0} onChange={(n) => upd(i, { rate: n })} />
                : <Num value={a.annualIncome} onChange={(n) => upd(i, { annualIncome: n })} suffix="₺" />}
            </div>
            <div className="b-cell b-cost">
              {(() => { const c = result.ancillaryRows?.[i]; return c ? fmtTL(c.effectiveIncome) : fmtTL(a.annualIncome); })()}
            </div>
            <button type="button" className="b-del" title="Satırı sil" onClick={() => del(i)}>✕</button>
          </div>
        ))}
        {ancillary.length > 0 && (
          <div className="hint" style={{ margin: '4px 0 8px' }}>
            Kolonlar: Gelir Adı · Giriş Türü (₺ tutar / oda gelirinin %'si) · Değer · Yıllık Gelir
          </div>
        )}
        <button type="button" className="btn add-btn" onClick={add}>+ Yardımcı Gelir Ekle</button>

        {ancillary.length > 0 && (
          <div className="mini-kpi" style={{ marginTop: 14 }}>
            <div><span>Kalem Sayısı</span><b>{ancillary.length}</b></div>
            <div><span>Toplam Yardımcı Gelir</span><b>{fmtTL(result.totalAncillaryRevenue)}</b></div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────── Adım 4 — Ticari Kiralar ─────────────────── */
function StepLeases({ leases, setLeases, result }: {
  leases: CommercialLeaseRow[]; setLeases: (l: CommercialLeaseRow[]) => void; result: ReturnType<typeof analyzeHotel>;
}) {
  const add = () => setLeases([...leases, {
    id: newId(), areaName: '', areaType: TICARI_KIRA_KATALOGU[0], tenant: '', inputMode: 'aylik', amount: 0, note: '',
  }]);
  const upd = (i: number, patch: Partial<CommercialLeaseRow>) =>
    setLeases(leases.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  const del = (i: number) => setLeases(leases.filter((_, k) => k !== i));

  return (
    <div className="cols">
      <div className="card card-wide">
        <div className="card-title">Ticari Alan Kira Gelirleri</div>
        <div className="hint" style={{ marginBottom: 10 }}>
          Bu bölüm yalnızca üçüncü kişilere kiralanan bağımsız alanlar içindir (otel işletmesinin kendi işlettiği alanlar için "Yardımcı Gelirler" adımını kullanın).
        </div>
        {leases.map((l, i) => {
          const calc = result.leaseRows[i];
          return (
            <div className="isletme-row" key={l.id}>
              <div className="isletme-row-head">
                <b>{l.areaName || `Kira Alanı ${i + 1}`}</b>
                <button type="button" className="link-btn" onClick={() => del(i)}>Satırı sil</button>
              </div>
              <div className="grid-2">
                <Field label="Alan Adı"><Txt value={l.areaName} onChange={(v) => upd(i, { areaName: v })} placeholder="Örn. Zemin Kat Market" /></Field>
                <Field label="Alan Türü">
                  <Sel value={l.areaType} onChange={(v) => upd(i, { areaType: v })}
                       options={TICARI_KIRA_KATALOGU.map((t) => ({ value: t, label: t }))} />
                </Field>
              </div>
              <Field label="Kiracı"><Txt value={l.tenant} onChange={(v) => upd(i, { tenant: v })} /></Field>
              <Field label="Kira Girişi">
                <Seg value={l.inputMode} onChange={(v) => upd(i, { inputMode: v })}
                     options={[{ value: 'aylik', label: 'Aylık' }, { value: 'yillik', label: 'Yıllık' }]} />
              </Field>
              <Field label={l.inputMode === 'aylik' ? 'Aylık Kira' : 'Yıllık Kira'}>
                <Num value={l.amount} onChange={(n) => upd(i, { amount: n })} suffix="₺" />
              </Field>
              {calc && (
                <div className="note-box" style={{ marginTop: 8 }}>
                  Aylık {fmtTL(calc.monthlyAmount)} · Yıllık <b>{fmtTL(calc.annualAmount)}</b>
                </div>
              )}
            </div>
          );
        })}
        <button type="button" className="btn add-btn" onClick={add}>+ Kira Alanı Ekle</button>

        {leases.length > 0 && (
          <div className="mini-kpi" style={{ marginTop: 14 }}>
            <div><span>Alan Sayısı</span><b>{leases.length}</b></div>
            <div><span>Toplam Kira Geliri</span><b>{fmtTL(result.totalLeaseRevenue)}</b></div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────── Adım 5 — İşletme Gideri ─────────────────── */
function StepOpex({ opex, setOpex, result }: {
  opex: HotelIncomeInput['opex']; setOpex: (p: Partial<HotelIncomeInput['opex']>) => void; result: ReturnType<typeof analyzeHotel>;
}) {
  return (
    <div className="cols">
      <div className="card">
        <div className="card-title">İşletme Gideri</div>
        <div className="hint" style={{ marginBottom: 10 }}>
          İlk sürümde işletme gideri, Toplam Brüt Gelir üzerinden tek bir oranla hesaplanır.
          Personel, enerji, bakım gibi detaylı gider kalemleri ileride eklenebilecek şekilde altyapı hazır tutulmuştur.
        </div>
        <Field label="İşletme Gider Oranı" hint="Toplam gelirin yüzdesi olarak">
          <Pct value={opex.expenseRate} onChange={(n) => setOpex({ expenseRate: n })} />
        </Field>
        <div className="note-box" style={{ marginTop: 8 }}>
          {fmtTL(result.totalGrossRevenue)} × %{Math.round(opex.expenseRate * 100)} = {fmtTL(result.totalExpense)} gider
        </div>
        <div className="mini-kpi" style={{ marginTop: 14 }}>
          <div><span>Toplam Brüt Gelir (yıllık)</span><b>{fmtTL(result.totalGrossRevenue)}</b></div>
          <div><span>Net İşletme Geliri (NOI)</span><b>{fmtTL(result.noi)}</b></div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Adım 6 — Projeksiyon ─────────────────── */

function StepProjection({ projection, setProjection, result }: {
  projection: HotelIncomeInput['projection']; setProjection: (p: Partial<HotelIncomeInput['projection']>) => void;
  result: ReturnType<typeof analyzeHotel>;
}) {
  return (
    <div className="cols">
      <div className="card">
        <div className="card-title">Projeksiyon Parametreleri</div>
        <div className="grid-2">
          <Field label="Başlangıç Yılı"><Num value={projection.startYear} onChange={(n) => setProjection({ startYear: n })} /></Field>
          <Field label="Projeksiyon Süresi" hint="3-25 yıl arası">
            <Num value={projection.years}
                 onChange={(n) => setProjection({ years: Math.max(3, Math.min(25, Math.round(n || 10))) })} suffix="yıl" />
          </Field>
        </div>
        <div className="grid-2">
          <Field label="Gelir Artış Oranı" hint="Yıllık"><Pct value={projection.incomeGrowthRate} onChange={(n) => setProjection({ incomeGrowthRate: n })} /></Field>
          <Field label="Gider Artış Oranı" hint="Yıllık"><Pct value={projection.expenseGrowthRate} onChange={(n) => setProjection({ expenseGrowthRate: n })} /></Field>
        </div>
        <Field label="Kapitalizasyon Oranı" hint="Direkt Kapitalizasyon Yöntemi: NOI ÷ Kapitalizasyon Oranı">
          <Pct value={projection.capRate} onChange={(n) => setProjection({ capRate: n })} />
        </Field>
      </div>

      <div className="card">
        <div className="card-title">Yıllık Projeksiyon Tablosu</div>
        <div className="proj-table-wrap">
          <table className="proj-table">
            <thead>
              <tr><th>Yıl</th><th>Toplam Gelir</th><th>İşletme Gideri</th><th>NOI</th><th>Kapitalizasyon Değeri</th></tr>
            </thead>
            <tbody>
              {result.projectionTable.map((row) => (
                <tr key={row.year}>
                  <td>{row.year}</td>
                  <td>{fmtTL(row.totalRevenue)}</td>
                  <td>{fmtTL(row.totalExpense)}</td>
                  <td>{fmtTL(row.noi)}</td>
                  <td>{fmtTL(row.capitalizedValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Sonuç Ekranı ─────────────────── */
function HotelResult({ input, result }: { input: HotelIncomeInput; result: ReturnType<typeof analyzeHotel> }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="cols">
      <div className="card result-preview">
        <div className="kpi-grid">
          <div className="kpi hero">
            <div className="kpi-label">Gelir Yaklaşımına Göre Piyasa Değeri</div>
            <div className="kpi-value">{fmtTL(result.capitalizedValue)}</div>
            <div className="kpi-sub">Kapitalizasyon oranı %{(input.projection.capRate * 100).toFixed(1).replace('.', ',')}</div>
          </div>
          <div className="kpi"><div className="kpi-label">Toplam Brüt Gelir (yıllık)</div><div className="kpi-value">{fmtTL(result.totalGrossRevenue)}</div></div>
          <div className="kpi"><div className="kpi-label">Toplam İşletme Gideri</div><div className="kpi-value">{fmtTL(result.totalExpense)}</div></div>
          <div className="kpi"><div className="kpi-label">Net İşletme Geliri</div><div className="kpi-value">{fmtTL(result.noi)}</div></div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Gelir Kırılımı</div>
        <div className="row"><span className="row-label">Toplam Oda Geliri</span><span className="row-value">{fmtTL(result.totalRoomRevenue)}</span></div>
        <div className="row"><span className="row-label">Toplam Yardımcı Gelir</span><span className="row-value">{fmtTL(result.totalAncillaryRevenue)}</span></div>
        <div className="row"><span className="row-label">Toplam Ticari Kira Geliri</span><span className="row-value">{fmtTL(result.totalLeaseRevenue)}</span></div>
        <div className="row total"><span className="row-label">TOPLAM BRÜT GELİR</span><span className="row-value">{fmtTL(result.totalGrossRevenue)}</span></div>
      </div>

      {result.warnings.length > 0 && (
        <div className="card">
          <div className="card-title">Uyarılar</div>
          {result.warnings.map((w, i) => (
            <div key={i} className={w.level === 'uyari' ? 'note-box note-warn' : 'note-box'} style={{ marginBottom: 6 }}>
              ⚠ {w.message}
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-title">Değerlendirme Özeti</div>
        <p className="hint" style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{result.summaryText}</p>
      </div>

      <div className="card no-print">
        <div className="card-title">Rapor</div>
        <button type="button" className="btn btn-primary btn-sm" disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try { await downloadHotelPdf(input, result); }
                  finally { setBusy(false); }
                }}>
          {busy ? 'Hazırlanıyor…' : '📄 PDF Raporu İndir'}
        </button>
      </div>
    </div>
  );
}
