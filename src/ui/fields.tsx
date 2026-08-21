import { useEffect, useState, type ReactNode } from 'react';
import { LOC } from '../i18n';

/**
 * Türkçe (1.234,56) ve uluslararası (1,234.56 / 1234.56) sayı yazımlarını
 * güvenilir şekilde ayrıştırır. Eski kod yalnızca `raw.replace(',', '.')`
 * yapıyordu — "1.234,56" gibi hem binlik nokta hem ondalık virgül içeren bir
 * girişte bu, "1.234.56" oluşturup parseFloat'ın yalnızca "1.234" kısmını
 * (yani 1,234'ü) okumasına, değerin ~1000 kat küçük hesaba girmesine yol
 * açıyordu. Bu fonksiyon, virgül ve nokta ikisi de varsa SONUNCUSUNU ondalık
 * ayracı kabul eder, diğerini binlik ayracı olarak siler.
 */
export function parseLocaleNumber(input: string): number {
  let s = (input ?? '').trim();
  if (!s) return 0;
  const negative = s.startsWith('-');
  if (negative) s = s.slice(1);
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      // "1.234,56" — nokta binlik, virgül ondalık (TR)
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // "1,234.56" — virgül binlik, nokta ondalık (US/uluslararası)
      s = s.replace(/,/g, '');
    }
  } else if (lastComma !== -1) {
    // Yalnız virgül var — TR alışkanlığı: ondalık ayracı kabul ediyoruz.
    // Birden fazla virgül varsa (örn. "1,234,56") sonuncusu ondalık sayılır.
    const parts = s.split(',');
    const decimalPart = parts.pop();
    s = parts.join('') + '.' + decimalPart;
  } else if (lastDot !== -1) {
    // Yalnız nokta var — belirsiz bir durum: "21.050" hem "21,05" (basit
    // ondalık) hem "21.050" (TR binlik, yani 21050) olabilir. Klasik TR
    // binlik gruplama deseniyse (her nokta sonrası TAM 3 hane, örn.
    // "21.050", "1.234.567") noktaları binlik ayracı sayıp siliyoruz;
    // aksi halde ("21.05", "0.5", "1234.56") normal ondalık nokta kalır.
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
      s = s.replace(/\./g, '');
    }
  }
  // Yalnız nokta varsa (ya da hiçbiri yoksa) zaten geçerli ondalık biçim — dokunmuyoruz.
  const n = parseFloat(s);
  if (!isFinite(n)) return 0;
  return negative ? -n : n;
}

export const fmtTL = (v: number) =>
  isFinite(v) ? Math.round(v).toLocaleString(LOC()) + ' ₺' : '–';
export const fmtTLm2 = (v: number) =>
  isFinite(v) ? Math.round(v).toLocaleString(LOC()) + ' ₺/m²' : '–';
export const fmtM2 = (v: number) =>
  isFinite(v) ? Math.round(v).toLocaleString(LOC()) + ' m²' : '–';
/** Parsel/Tapu alanı gibi tapu kaydından gelen KESİN rakamlar için — 2 ondalık korunur, yuvarlanmaz. */
export const fmtM2Precise = (v: number) =>
  isFinite(v) ? v.toLocaleString(LOC(), { maximumFractionDigits: 2 }) + ' m²' : '–';
export const fmtPct = (v: number, d = 1) =>
  isFinite(v) ? '%' + (v * 100).toFixed(d).replace('.', ',') : '–';
export const fmtNum = (v: number, d = 2) =>
  isFinite(v) ? v.toLocaleString(LOC(), { maximumFractionDigits: d }) : '–';

export function Field({ label, hint, error, children }:
  { label: string; hint?: string; error?: string | null; children: ReactNode }) {
  return (
    <div className={error ? 'field field-error' : 'field'}>
      <label className="label">{label}</label>
      {children}
      {error ? <div className="field-error-msg">⚠ {error}</div>
             : hint && <div className="hint">{hint}</div>}
    </div>
  );
}

export function Txt({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return <input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

/** Sayısal alan — boş bırakılabilir, 0 silinebilir (Dora dersi). */
export function Num({ value, onChange, suffix, step, placeholder, plain }: {
  value: number; onChange: (v: number) => void; suffix?: string; step?: string; placeholder?: string; plain?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState('');
  useEffect(() => { if (!focused) setRaw(value === 0 ? '' : String(value)); }, [value, focused]);

  const display = focused ? raw : (value === 0 ? '' : plain ? String(value) : value.toLocaleString(LOC(), { maximumFractionDigits: 2 }));

  return (
    <div className="suffix-wrap">
      <input
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        title={step ? `Adım: ${step}` : undefined}
        value={display}
        onFocus={() => { setFocused(true); setRaw(value === 0 ? '' : String(value)); }}
        onChange={(e) => setRaw(e.target.value.replace(/[^\d.,-]/g, ''))}
        onBlur={() => {
          setFocused(false);
          const n = parseLocaleNumber(raw);
          onChange(n);
        }}
      />
      {suffix && <span className="suffix">{suffix}</span>}
    </div>
  );
}

/** Yüzde alanı: kullanıcı 25 yazar, motor 0.25 alır. */
export function Pct({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="suffix-wrap">
      <input
        type="number"
        inputMode="decimal"
        step="0.5"
        value={String(Math.round(value * 1000) / 10)}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value) / 100)}
      />
      <span className="suffix">%</span>
    </div>
  );
}

export function Sel<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: Array<{ value: T; label: string }>;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Choice({ on, name, desc, onClick }: {
  on: boolean; name: string; desc?: string; onClick: () => void;
}) {
  return (
    <button type="button" className={`choice ${on ? 'on' : ''}`} onClick={onClick}>
      <span className="choice-dot" />
      <span>
        <span className="choice-name">{name}</span>
        {desc && <span className="choice-desc" style={{ display: 'block' }}>{desc}</span>}
      </span>
    </button>
  );
}

export function Seg<T extends string | boolean>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: Array<{ value: T; label: string }>;
}) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className={value === o.value ? 'on' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Row({ label, value, tone }: { label: string; value: string; tone?: 'neg' | 'pos' | 'total' }) {
  return (
    <div className={`row ${tone === 'total' ? 'total' : ''}`}>
      <span className="row-label">{label}</span>
      <span className={`row-value ${tone === 'neg' ? 'neg' : tone === 'pos' ? 'pos' : ''}`}>{value}</span>
    </div>
  );
}
