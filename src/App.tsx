import { useEffect, useMemo, useState } from 'react';
import type { ProjectInput } from './engine';
import { analyze } from './engine';
import { VILLA_DEFAULT_CLASS, YAPI_SINIFLARI } from './data/yapiSiniflari';
import { Step1, Step2, Step3, Step4, Step5, Step6, Step7, Step8, Step9, type Upd, type SetTop } from './ui/Steps';
import { Result } from './ui/Result';

/** Sürüm damgası — güncelleme canlıya çıktı mı, tek bakışta anlaşılır. */
const VERSION = 'v1.1.0 · 2026.07.21';
const DRAFT_KEY = 'arsa-analiz-taslak-v2';

const DEFAULT_INPUT: ProjectInput = {
  assetType: 'konut',
  housingType: 'villa',
  parcel: { il: 'İstanbul', ilce: '', mahalle: '', ada: '', parsel: '', area: 0, netArea: 0, width: 0, depth: 0 },
  zoning: {
    mode: 'taks-kaks', lejant: '', taks: null, kaks: null, hmax: null, floors: null,
    directTotalArea: 0, directFootprint: 0,
    setbackFront: 5, setbackRear: 3, setbackSideLeft: 3, setbackSideRight: 3, planNotes: '',
  },
  emsal: {
    hasBasement: true, basementInEmsal: false, basementPerUnit: 0,
    hasAttic: false, atticInEmsal: false, atticPerUnit: 0,
  },
  villa: { villaType: 'mustakil', grossPerVilla: 0, netPerVilla: null, floorsPerVilla: 2, layoutEfficiency: 0.65 },
  cost: {
    buildingClass: VILLA_DEFAULT_CLASS,
    unitCost: YAPI_SINIFLARI.find((s) => s.code === VILLA_DEFAULT_CLASS)!.unitCost,
    inflationRate: 0, basementCostFactor: 0.6, atticCostFactor: 0.5, extrasRate: 0.12,
  },
  site: { landscapeArea: 0, landscapeUnitCost: 1200, infrastructureCost: 0, gardenPricePerM2: 0 },
  sales: { unitPrice: 0 },
  residual: { profitRate: 0.25, useFinance: false, financeRate: 0.35, months: 24, utilization: 0.4 },
  share: { ownerShare: 0.45 },
};

const STEPS = [
  { title: 'Değerleme Konusu ve Taşınmaz', desc: 'Ne değerleniyor, hangi parsel?' },
  { title: 'Konut Tipi', desc: 'Parselde geliştirilecek konut ürünü.' },
  { title: 'İmar Bilgileri', desc: 'Yapılaşma hakları, çekme mesafeleri, bodrum ve çatı arası.' },
  { title: 'Villa Özellikleri', desc: 'Villa tipi, büyüklüğü ve yerleşim düzeni.' },
  { title: 'Yapım Maliyeti', desc: '2026 Bakanlık birim maliyetleri üzerinden.' },
  { title: 'Çevre Düzenlemesi', desc: 'Peyzaj, altyapı ve bahçe değeri.' },
  { title: 'Satış Bilgileri', desc: 'Satış birim değeri ve hasılat.' },
  { title: 'Kâr ve Finansman', desc: 'Müteahhit kârı ve finansman varsayımları.' },
  { title: 'Kat Karşılığı', desc: 'Paylaşım oranı ve karşılaştırma.' },
];
const TOTAL = STEPS.length;

function loadDraft(): ProjectInput {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return DEFAULT_INPUT;
    const d = JSON.parse(raw) as Partial<ProjectInput>;
    return {
      ...DEFAULT_INPUT, ...d,
      parcel: { ...DEFAULT_INPUT.parcel, ...(d.parcel ?? {}) },
      zoning: { ...DEFAULT_INPUT.zoning, ...(d.zoning ?? {}) },
      emsal: { ...DEFAULT_INPUT.emsal, ...(d.emsal ?? {}) },
      villa: { ...DEFAULT_INPUT.villa, ...(d.villa ?? {}) },
      cost: { ...DEFAULT_INPUT.cost, ...(d.cost ?? {}) },
      site: { ...DEFAULT_INPUT.site, ...(d.site ?? {}) },
      sales: { ...DEFAULT_INPUT.sales, ...(d.sales ?? {}) },
      residual: { ...DEFAULT_INPUT.residual, ...(d.residual ?? {}) },
      share: { ...DEFAULT_INPUT.share, ...(d.share ?? {}) },
    };
  } catch {
    return DEFAULT_INPUT;
  }
}

export default function App() {
  const [step, setStep] = useState(1);
  const [input, setInput] = useState<ProjectInput>(loadDraft);

  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(input)); } catch { /* kota */ }
  }, [input]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [step]);

  const upd: Upd = (key, patch) =>
    setInput((prev) => ({ ...prev, [key]: { ...(prev[key] as object), ...(patch as object) } }));
  const setTop: SetTop = (key, value) => setInput((prev) => ({ ...prev, [key]: value }));

  const result = useMemo(() => analyze(input), [input]);
  const isResult = step > TOTAL;
  const meta = STEPS[Math.min(step, TOTAL) - 1];

  const blocker = (): string | null => {
    if (step === 1) {
      if (!input.parcel.area) return 'Parsel alanı giriniz.';
      if (!input.parcel.netArea) return 'Net parsel alanı giriniz.';
    }
    if (step === 3) {
      const z = input.zoning;
      if (z.mode === 'taks-kaks' && z.taks == null && z.kaks == null && !input.parcel.width) {
        return 'TAKS, KAKS veya parsel en/boy bilgilerinden en az biri gereklidir.';
      }
      if (z.mode === 'dogrudan' && !z.directFootprint && !z.directTotalArea && !input.parcel.width) {
        return 'Taban oturumu veya toplam inşaat alanı giriniz.';
      }
    }
    if (step === 4 && !input.villa.grossPerVilla) return 'Villa brüt alanı giriniz.';
    if (step === 5 && !input.cost.unitCost) return 'Birim maliyet giriniz.';
    if (step === 7 && !input.sales.unitPrice) return 'Satış birim değeri giriniz.';
    return null;
  };
  const stop = blocker();

  const reset = () => {
    if (!window.confirm('Tüm girdiler silinip yeni analiz başlatılacak. Emin misiniz?')) return;
    localStorage.removeItem(DRAFT_KEY);
    setInput(DEFAULT_INPUT);
    setStep(1);
  };

  const P = { input, upd, setTop };

  return (
    <div className="app">
      <div className="topbar">
        <h1>Arsa Değer Analizi</h1>
        <p>Proje Geliştirme · Artık Değer (Residual) Yöntemi</p>
        <div className="progress-row">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${Math.min(step, TOTAL + 1) / (TOTAL + 1) * 100}%` }} />
          </div>
          <div className="progress-label">{isResult ? 'SONUÇ' : `Adım ${step} / ${TOTAL}`}</div>
        </div>
      </div>

      <div className="step" key={step}>
        {!isResult && (
          <div className="step-head">
            <div className="step-eyebrow">Adım {step}</div>
            <div className="step-title">{meta.title}</div>
            <div className="step-desc">{meta.desc}</div>
          </div>
        )}

        {step === 1 && <Step1 {...P} />}
        {step === 2 && <Step2 {...P} />}
        {step === 3 && <Step3 {...P} />}
        {step === 4 && <Step4 {...P} />}
        {step === 5 && <Step5 {...P} />}
        {step === 6 && <Step6 {...P} />}
        {step === 7 && <Step7 {...P} />}
        {step === 8 && <Step8 {...P} />}
        {step === 9 && <Step9 {...P} />}
        {isResult && <Result input={input} result={result} version={VERSION} />}

        {stop && !isResult && (
          <div className="card" style={{ background: 'var(--red-dim)', borderColor: '#f3c6c2' }}>
            <div style={{ fontSize: 13, color: 'var(--red)', fontWeight: 600 }}>{stop}</div>
          </div>
        )}
        {!isResult && <div className="stamp">{VERSION}</div>}
      </div>

      <div className="navbar no-print">
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
  );
}
