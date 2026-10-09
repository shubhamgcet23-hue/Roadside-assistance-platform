import { cn } from '../../utils/cn.js';

/** Pill-style filter / tab group. options: [{ value, label }] */
export default function Segmented({ options, value, onChange, label = 'Filter' }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-ink-100 p-1">
      {options.map((o) => (
        <button
          key={o.value} type="button" role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={cn('whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors', value === o.value ? 'bg-ink-900 text-white shadow-sm' : 'text-ink-600 hover:text-ink-900')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
