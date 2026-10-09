import { useState } from 'react';
import { Card } from './ui/index.js';

/** Titled chart container with a "view as table" alternative so no value is colour- or hover-only. */
export default function ChartCard({ title, subtitle, table, className, children }) {
  const [asTable, setAsTable] = useState(false);
  return (
    <Card className={className}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div><h3 className="font-display text-2xl font-semibold leading-tight">{title}</h3>{subtitle && <p className="text-sm text-ink-500">{subtitle}</p>}</div>
        {table && <button type="button" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable} className="shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-info-600 hover:bg-info-50">{asTable ? 'View chart' : 'View table'}</button>}
      </div>
      {asTable && table ? (
        <div className="max-h-72 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-white"><tr>{table.columns.map((c) => <th key={c.key} scope="col" className="border-b border-ink-200 py-2 pr-3 font-semibold">{c.header}</th>)}</tr></thead>
            <tbody>{table.rows.map((r, i) => <tr key={i} className="border-b border-ink-100">{table.columns.map((c) => <td key={c.key} className="py-1.5 pr-3">{c.render ? c.render(r) : r[c.key]}</td>)}</tr>)}</tbody>
          </table>
        </div>
      ) : children}
    </Card>
  );
}
