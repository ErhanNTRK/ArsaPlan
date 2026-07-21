import { useEffect, useMemo, useState } from 'react';
import type { ProjectInput } from './engine';
import { analyze } from './engine';
import { VILLA_DEFAULT_CLASS, YAPI_SINIFLARI } from './data/yapiSiniflari';
import { Step1, Step2, Step3, Step4, Step5, type Upd, type SetTop } from './ui/Steps';
import { Result } from './ui/Result';
import { BRAND } from './brand/brand';

const VERSION = BRAND.version;
const DRAFT_KEY = 'arsaplan-taslak-v5';

const DEFAULT_INPUT: ProjectInput = {
  assetType: 'konut',
  housingType: 'villa',
  parcel: { il: 'İstanbul', ilce: '', mahalle: '', ada: '', parsel: '', area: 0, netArea: 0 },
  zoning: {
    mode: 'taks-kaks', lejant: '', taks: null, kaks: null, hmax: null,
    directFootprint: 0, directEmsalArea: 0, planNotes: '',
  },
  emsal: {
    hasExtra: false, extraMode: 'oran', extraRate: 0.10, extraArea: 0,
    hasAttic: false, atticMode: 'oran', atticRate: 0.50, atticArea: 0, atticInEmsal: false,
    hasBasement: false, basementMode: 'oran', basementRate: 1.0, basementArea: 0, basementInEmsal: false,
  },
  villa: { villaType: 'mustakil', unitCount: 0, floorsAboveGround: 2 },
  cost: {
    buildingClass: VILLA_DEFAULT_CLASS,
    unitCost: YAPI_SINIFLARI.find((s) => s.code === VILLA_DEFAULT_CLASS)!.unitCost,
    inflationRate: 0, extrasRate: 0.12,
  },
  site: { landscapeArea: 0, landscapeUnitCost: 1200, gardenPricePerM2: 0 },
  sales: { unitPrice: 0 },
  residual: { profitRate: 0.25, financeRateOfCost: 0 },
  share: { enabled: true, ownerShare: 0.45 },
};

const STEPS = [
  { title: 'Değerleme Konusu', desc: 'Ne değerleniyor?' },
  { title: 'Proje Tipi ve Taşınmaz', desc: 'Konut ürünü ve parsel bilgileri.' },
  { title: 'İmar ve Alan Üretimi', desc: 'Yapılaşma hakları, emsal dışı alanlar, çatı ve bodrum.' },
  { title: 'Maliyet ve Satış', desc: 'Yapım maliyeti, peyzaj ve satış değeri.' },
  { title: 'Değerleme', desc: 'Kâr, finansman ve kat karşılığı.' },
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
    if (step === 2) {
      if (!input.parcel.area) return 'Parsel alanı giriniz.';
      if (!input.parcel.netArea) return 'Net parsel alanı giriniz.';
    }
    if (step === 3) {
      const z = input.zoning;
      if (z.mode === 'taks-kaks' && z.kaks == null) return 'KAKS (emsal) değerini giriniz.';
      if (z.mode === 'dogrudan' && !z.directEmsalArea) return 'Emsale dahil alanı giriniz.';
    }
    if (step === 4) {
      if (!input.cost.unitCost) return 'Birim maliyet giriniz.';
      if (!input.sales.unitPrice) return 'Satış birim değeri giriniz.';
    }
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
        <div className="topbar-inner">
          <div>
            <h1>{BRAND.appName}</h1>
            <p>{BRAND.tagline}</p>
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
        {isResult && <Result input={input} result={result} version={VERSION} />}

        {stop && !isResult && (
          <div className="card blocker">{stop}</div>
        )}
        {!isResult && (
          <div className="stamp">
            {BRAND.preparedBy}<br />{BRAND.authorLine} · {BRAND.appName} {VERSION}
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
