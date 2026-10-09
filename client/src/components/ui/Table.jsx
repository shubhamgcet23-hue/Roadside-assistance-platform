import { cn } from '../../utils/cn.js';
import { Skeleton } from './States.jsx';
import Button from './Button.jsx';

/** columns: [{ key, header, render?(row), className? }] */
export default function Table({ columns, rows, rowKey = (r) => r._id, onRowClick, loading, empty, className }) {
  if (loading) return <div className="space-y-2"><Skeleton className="h-11" /><Skeleton className="h-14" /><Skeleton className="h-14" /><Skeleton className="h-14" /></div>;
  if (!rows?.length) return empty || null;
  return (
    <div className={cn('overflow-x-auto rounded-2xl border border-ink-100 bg-white shadow-card', className)}>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-ink-50 text-ink-600">
          <tr>{columns.map((c) => <th key={c.key} scope="col" className={cn('px-4 py-3 font-semibold', c.className)}>{c.header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {rows.map((row) => (
            <tr key={rowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined} className={cn(onRowClick && 'cursor-pointer hover:bg-brand-50/60')}>
              {columns.map((c) => <td key={c.key} className={cn('px-4 py-3 align-middle', c.className)}>{c.render ? c.render(row) : row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</Button>
      <span className="text-sm text-ink-600">Page {page} of {pages}</span>
      <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</Button>
    </div>
  );
}
