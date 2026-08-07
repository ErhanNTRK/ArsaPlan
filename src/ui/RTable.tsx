import type { ReactNode } from 'react';

/**
 * TEK HÜKÜM TABLOSU — tüm modüllerin paylaştığı hibrit tablo/kart bileşeni.
 * Masaüstünde gerçek <table>, dar ekranda (≤700px) otomatik etiketli kart
 * görünümüne döner — tek DOM yapısı, yalnız CSS ile (bkz. .rtable kuralları).
 *
 * Kullanım:
 *   <RTable headers={['Ürün', 'Verim', 'Fiyat']}>
 *     {rows.map(r => (
 *       <RRow key={r.id}>
 *         <RCell label="Ürün">...</RCell>
 *         <RCell label="Verim">...</RCell>
 *         <RCell label="Fiyat">...</RCell>
 *       </RRow>
 *     ))}
 *   </RTable>
 */
export function RTable({ headers, footer, children }: { headers: string[]; footer?: ReactNode; children: ReactNode }) {
  return (
    <table className="rtable">
      <thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{children}</tbody>
      {footer && <tfoot><tr className="rtable-total">{footer}</tr></tfoot>}
    </table>
  );
}

export function RRow({ children }: { children: ReactNode }) {
  return <tr>{children}</tr>;
}

export function RCell({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return <td data-label={label} className={className}>{children}</td>;
}
