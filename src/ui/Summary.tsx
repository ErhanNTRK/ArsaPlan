/** Sonuç ekranındaki "Özet" sekmesi — Özet PDF ile aynı veri (export/summary.ts). */
import type { Summary } from '../export/summary';
import { Row } from './fields';

export function SummaryView({ summary }: { summary: Summary }) {
  return (
    <>
      <div className="card">
        <div className="card-title">Taşınmaz</div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{summary.place}</div>
        <div className="hint" style={{ marginTop: 2 }}>{summary.ident} · {summary.type}</div>
      </div>

      <div className="kpi-grid">
        <div className="kpi hero">
          <div className="kpi-label">{summary.headline.label}</div>
          <div className="kpi-value">{summary.headline.value}</div>
          <div className="kpi-sub">Arsa birim değeri: <b>{summary.headline.unit}</b></div>
        </div>
      </div>

      <div className="cols">
        {summary.sections.map((sec) => (
          <div className="card" key={sec.title}>
            <div className="card-title">{sec.title}</div>
            {sec.rows.map((r) => (
              <Row key={r.label} label={r.label} value={r.value}
                   tone={r.band ? 'total' : r.tone} />
            ))}
          </div>
        ))}
      </div>
      <div className="hint no-print" style={{ margin: '4px 0 12px' }}>
        Bu özet, rapora tek sayfa olarak eklenebilir: yukarıdaki “Özet PDF” düğmesiyle indirin.
      </div>
    </>
  );
}
