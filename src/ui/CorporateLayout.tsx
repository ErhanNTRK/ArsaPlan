import type { ReactNode } from 'react';
import { BRAND } from '../brand/brand';

export const METHODS = [
  { key: 'arsa', title: 'Arsa Gelir Projeksiyon Yöntemi', subtitle: 'Konut · Ticari · Karma kullanım', description: 'Gelir projeksiyonu ve kat karşılığı değerlerini aynı analizde değerlendirin.' },
  { key: 'otel', title: 'Otel Gelir Hesabı', subtitle: 'Otel ve konaklama tesisleri', description: 'Oda, yardımcı işletme ve ticari kira gelirleri üzerinden değer hesabı.' },
  { key: 'akaryakit', title: 'Akaryakıt Gelir Hesabı', subtitle: 'Akaryakıt istasyonları', description: 'Litre ve ciro bazlı gelirler, ilave gelirler ve maliyet yaklaşımı.' },
  { key: 'maliyet', title: 'Maliyet Yaklaşımı', subtitle: 'Arsa · Yapılar · Değer düzeltmeleri', description: 'Arsa ve yapı değerlerini, yıpranma ve ilave maliyetlerle birlikte hesaplayın.' },
  { key: 'tarimsal', title: 'Tarımsal Ürün Gelir Hesabı', subtitle: 'Ekili · Dikili · Karma ürün deseni', description: 'Ürün verimleri, giderler ve amorti yılı üzerinden tarımsal değer hesabı.' },
  { key: 'usthakki-secim', title: 'Üst Hakkı Değerleme', subtitle: 'Değer ve gelir esaslı yöntemler', description: 'Toplam değer, arsa değeri veya gelir üzerinden üst hakkını değerlendirin.' },
] as const;
export type MethodKey = typeof METHODS[number]['key'];

function ModuleIcon({ index }: { index: number }) {
  const paths = [
    <><path d="m3 17 3-11 14-3-3 15-14 3Z" /><path d="m8 15 1-6 6-1-1 6Z" /></>,
    <><path d="M5 21V3h14v18M3 21h18M9 21v-5h6v5M9 7h1m4 0h1M9 11h1m4 0h1" /></>,
    <><path d="M4 21V4h10v17M3 21h12M7 7h4v5H7zM14 12h2a2 2 0 0 1 2 2v3a2 2 0 0 0 4 0V9l-4-4M20 7v4h2" /></>,
    <><path d="M4 21V8h9v13M13 21V3h7v18M2 21h20M7 12h3m-3 4h3M16 7h1m-1 4h1m-1 4h1" /></>,
    <><path d="M12 21v-9M12 15C4 15 3 9 3 5c7 0 9 4 9 10ZM12 11c0-6 4-8 9-8 0 5-2 9-9 9M5 21h14" /></>,
    <><path d="M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h5" /></>,
  ];
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[index]}</svg>;
}

export function CorporateShell({ mode, onHome, controls, children }: {
  mode: string; onHome: () => void; controls: ReactNode; children: ReactNode;
}) {
  const active = METHODS.find(m => mode === m.key || (m.key === 'usthakki-secim' && mode.startsWith('usthakki')));
  return (
    <div className={`corporate-shell ${mode === 'landing' ? 'corporate-home' : ''}`}>
      <a className="corp-skip" href="#corporate-content">İçeriğe geç</a>
      <aside className="corp-sidebar no-print">
        <div className="corp-sidebar-brand"><span className="corp-monogram">AP</span><div>ArsaPlan<small>DEĞERLEME ÇALIŞMA ALANI</small></div></div>
        <nav className="corp-navigation" aria-label="Çalışma alanı">
          <div className="corp-nav-caption">ÇALIŞMA ALANI</div>
          <button type="button" className={`corp-nav-item ${!active ? 'is-active' : ''}`} onClick={onHome} aria-current={!active ? 'page' : undefined}>
            <span className="corp-nav-symbol" aria-hidden="true">▦</span><span>Yöntemler</span>
          </button>
          {active && <div className="corp-nav-item is-active corp-current" aria-current="page"><ModuleIcon index={METHODS.indexOf(active)} /><span>{active.title}</span></div>}
        </nav>
        <div className="corp-sidebar-footer"><span>Dora Gayrimenkul<br />Değerleme A.Ş.</span><div className="corp-author"><span>EÖ</span><div>Erhan Öntürk<small>ArsaPlan</small></div></div></div>
        <div className="corp-tools">{controls}</div>
      </aside>
      <div className="corporate-main" id="corporate-content">{children}</div>
    </div>
  );
}

export function MethodLanding({ onSelect }: { onSelect: (method: MethodKey) => void }) {
  return (
    <div className="app corporate-landing">
      <header className="topbar"><div className="topbar-inner"><div><h1>{BRAND.appName}</h1><p>{BRAND.tagline}</p></div><img className="brand-logo brand-logo--hero" src={`${import.meta.env.BASE_URL}dora-logo.png`} alt={BRAND.company} /></div></header>
      <main className="step">
        <div className="corp-landing-heading"><div className="step-eyebrow">Yöntemler</div><h2>Ne hesaplamak istiyorsunuz?</h2><p>Bir değerleme yöntemi seçerek analize başlayın.</p></div>
        <div className="corp-method-list">
          {METHODS.map((method, i) => (
            <button key={method.key} type="button" className="corp-method" onClick={() => onSelect(method.key)}>
              <span className="corp-method-icon"><ModuleIcon index={i} /></span>
              <span className="corp-method-copy"><span className="corp-method-subtitle">{method.subtitle}</span><span className="corp-method-title">{method.title}</span><span className="corp-method-description">{method.description}</span></span>
              <span className="corp-method-open" aria-hidden="true">Analize başla <span>→</span></span>
            </button>
          ))}
        </div>
        <footer className="corp-landing-footer"><span>{BRAND.company}</span><span>6 ana yöntem · {BRAND.version}</span></footer>
      </main>
    </div>
  );
}

export function StepNavigation({ steps, current, canAdvance, onChange }: {
  steps: { title: string }[]; current: number; canAdvance: boolean; onChange: (step: number) => void;
}) {
  return <nav className="corp-stepnav no-print" aria-label="Analiz adımları">
    {steps.map((step, i) => {
      const n = i + 1;
      const disabled = n > current && (n !== current + 1 || !canAdvance);
      return <button key={n} type="button" className={current === n ? 'is-active' : current > n ? 'is-done' : ''} disabled={disabled} aria-current={current === n ? 'step' : undefined} onClick={() => onChange(n)}><span>{current > n ? '✓' : n}</span><b>{step.title}</b></button>;
    })}
    <button type="button" className={current > steps.length ? 'is-active' : ''} disabled={current < steps.length || !canAdvance} aria-current={current > steps.length ? 'step' : undefined} onClick={() => onChange(steps.length + 1)}><span>↗</span><b>Sonuç</b></button>
  </nav>;
}
