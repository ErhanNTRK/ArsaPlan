/**
 * "Nihai arsa değeri hangi yöntemle belirlensin?" — birden fazla yöntem varsa kullanıcıya sorulur.
 * Seçim ekran ana kutusunu, Özet'i, PDF'i ve Excel'i belirler (engine/finalValue.ts).
 */
import { useMemo } from 'react';
import type { ProjectInput } from '../engine';
import { analyze } from '../engine';
import { computedMethodCount, finalOptions, resolveFinal, type FinalMethod } from '../engine/finalValue';
import { Choice, Field, Num, fmtTL } from './fields';

export function FinalMethodPicker({ input, setTop }: {
  input: ProjectInput;
  setTop: <K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) => void;
}) {
  const r = useMemo(() => analyze(input), [input]);
  const many = computedMethodCount(input, r) >= 2;
  if (!many) return null;
  const opts = finalOptions(input, r);
  const cur = resolveFinal(input, r);
  return (
    <div className="card card-wide">
      <div className="card-title">Nihai Arsa Değeri</div>
      <div className="hint" style={{ marginBottom: 10 }}>
        Birden fazla yöntemle değer hesaplandı. Raporda <b>ana değer</b> olarak hangisinin kullanılacağını seçin
        veya değeri kendiniz girin. Seçim ana kutuyu, Özet tabloyu ve PDF/Excel çıktısını belirler.
      </div>
      <div className="choice-grid">
        {opts.map((o) => (
          <Choice key={o.value}
                  on={input.finalMethod === 'manuel' ? o.value === 'manuel' : cur.method === o.value}
                  name={o.name}
                  desc={o.value === 'manuel' ? 'Değeri kendiniz belirleyin' : fmtTL(o.amount ?? 0)}
                  onClick={() => setTop('finalMethod', o.value as FinalMethod)} />
        ))}
      </div>
      {input.finalMethod === 'manuel' && (
        <div style={{ marginTop: 12, maxWidth: 320 }}>
          <Field label="Elle girilen arsa değeri (₺)">
            <Num value={input.finalManualValue ?? 0} suffix="₺"
                 onChange={(v) => setTop('finalManualValue', v > 0 ? v : null)} />
          </Field>
          {cur.manualMissing && <div className="hint hint--warn" style={{ marginTop: 6 }}>Değer girilmedi; geçici olarak {cur.name} kullanılıyor.</div>}
        </div>
      )}
    </div>
  );
}
