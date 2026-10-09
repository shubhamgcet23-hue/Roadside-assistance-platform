import { forwardRef, useId } from 'react';
import { cn } from '../../utils/cn.js';

const base = 'block w-full rounded-xl border bg-white px-3.5 text-[15px] text-ink-900 placeholder:text-ink-400 transition-colors focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-400/60 disabled:bg-ink-50 disabled:text-ink-500';

function Field({ id, label, error, hint, className, children }) {
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-800">{label}</label>}
      {children}
      {error ? <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm text-stop-600">{error}</p>
        : hint && <p id={`${id}-hint`} className="mt-1.5 text-sm text-ink-500">{hint}</p>}
    </div>
  );
}

export const Input = forwardRef(function Input({ label, error, hint, icon: Icon, className, id, ...props }, ref) {
  const auto = useId();
  const inputId = id || auto;
  return (
    <Field id={inputId} label={label} error={error} hint={hint} className={className}>
      <div className="relative">
        {Icon && <Icon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" aria-hidden />}
        <input
          ref={ref} id={inputId} aria-invalid={error ? true : undefined} aria-describedby={error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined}
          className={cn(base, 'h-12', Icon && 'pl-10', error ? 'border-stop-500' : 'border-ink-200')} {...props}
        />
      </div>
    </Field>
  );
});

export const Select = forwardRef(function Select({ label, error, hint, className, id, options = [], placeholder, children, ...props }, ref) {
  const auto = useId();
  const selectId = id || auto;
  return (
    <Field id={selectId} label={label} error={error} hint={hint} className={className}>
      <select ref={ref} id={selectId} aria-invalid={error ? true : undefined} className={cn(base, 'h-12 appearance-none bg-[length:16px] pr-9', error ? 'border-stop-500' : 'border-ink-200')} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        {children}
      </select>
    </Field>
  );
});

export const Textarea = forwardRef(function Textarea({ label, error, hint, className, id, rows = 3, ...props }, ref) {
  const auto = useId();
  const areaId = id || auto;
  return (
    <Field id={areaId} label={label} error={error} hint={hint} className={className}>
      <textarea ref={ref} id={areaId} rows={rows} aria-invalid={error ? true : undefined} className={cn(base, 'py-3', error ? 'border-stop-500' : 'border-ink-200')} {...props} />
    </Field>
  );
});
